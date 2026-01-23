import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// SECURITY: CORS allowlist - apenas origens permitidas
const ALLOWED_ORIGINS = [
  Deno.env.get("FRONTEND_URL") || "https://renoveja.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "capacitor://localhost",
  "ionic://localhost",
];

// Helper function to get CORS headers based on origin
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.startsWith(allowed)
  ) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Autenticação necessária.",
  INVALID_TOKEN: "Sessão inválida.",
  VALIDATION_FAILED: "Dados inválidos.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Receita não encontrada.",
  INVALID_STATUS_TRANSITION: "Transição de status inválida.",
  INTERNAL_ERROR: "Erro ao atualizar receita.",
};

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["analyzing", "approved", "rejected", "correction_needed", "completed"]).optional(),
  doctor_notes: z.string().max(2000).optional(),
  rejection_reason: z.string().max(1000).optional(),
  medications: z.array(z.object({
    name: z.string().min(1).max(200),
    dosage: z.string().max(100).optional(),
    quantity: z.string().max(100).optional(),
    instructions: z.string().max(500).optional(),
  })).max(50).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_TOKEN }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const userId = claimsData.claims.sub as string;

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const parseResult = updateSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { id, ...updates } = parseResult.data;

    // SECURITY: Fetch prescription and verify authorization
    const { data: prescription, error: fetchError } = await supabase
      .from("prescription_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !prescription) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_FOUND }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;

    // SECURITY: Verify authorization based on action
    if (updates.status) {
      // Status changes require doctor assignment or admin
      if (prescription.status === "pending" && updates.status === "analyzing") {
        // Doctor picking up request - verify doctor role
        const { data: doctorRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "doctor")
          .maybeSingle();

        if (!doctorRole && !isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: ERROR_MESSAGES.FORBIDDEN }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
      } else if (["approved", "rejected", "correction_needed"].includes(updates.status)) {
        // Only assigned doctor or admin can approve/reject
        if (prescription.doctor_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: ERROR_MESSAGES.FORBIDDEN }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === "analyzing" && !prescription.doctor_id) {
        updateData.doctor_id = userId; // Assign doctor when picking up
      }
      if (updates.status === "approved") {
        updateData.validated_at = new Date().toISOString();
      }
    }

    if (updates.doctor_notes !== undefined) {
      updateData.doctor_notes = updates.doctor_notes;
    }

    if (updates.rejection_reason !== undefined) {
      updateData.rejection_reason = updates.rejection_reason;
    }

    if (updates.medications !== undefined) {
      updateData.medications = updates.medications;
    }

    // Update prescription
    const { data: updated, error: updateError } = await supabase
      .from("prescription_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[update-prescription] Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message || ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log audit event
    try {
      await supabase.rpc("log_request_event", {
        p_actor_id: userId,
        p_actor_role: isAdmin ? "admin" : "doctor",
        p_entity: "prescription_requests",
        p_entity_id: id,
        p_action: updates.status ? "status_change" : "request_updated",
        p_metadata: {
          old_status: prescription.status,
          new_status: updates.status || prescription.status,
          updated_fields: Object.keys(updates),
        },
      });
    } catch (auditError) {
      console.error("[update-prescription] Audit log error:", auditError);
      // Don't fail the request if audit fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        prescription: updated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[update-prescription] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
