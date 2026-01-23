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

// Generic error messages - never expose internal details
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Autenticação necessária.",
  INVALID_TOKEN: "Sessão inválida. Faça login novamente.",
  VALIDATION_FAILED: "Dados inválidos. Verifique e tente novamente.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "Solicitação não encontrada.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente ou contate o suporte.",
};

// Zod schema for input validation
const updateStatusSchema = z.object({
  request_id: z.string().uuid("ID da solicitação inválido"),
  request_type: z.enum(["prescription", "exam", "consultation"], {
    errorMap: () => ({ message: "Tipo de solicitação inválido" })
  }),
  status: z.enum([
    "pending",
    "payment_pending",
    "analyzing",
    "in_review",
    "approved",
    "rejected",
    "correction_needed",
    "completed",
    "expired"
  ], {
    errorMap: () => ({ message: "Status inválido" })
  }),
  doctor_id: z.string().uuid().optional(), // Para atribuir médico quando mudando para analyzing
  doctor_notes: z.string().max(2000).optional(),
  rejection_reason: z.string().max(500).optional(),
  medications: z.array(z.any()).optional(), // Para prescription
  pdf_url: z.string().url().optional(), // Para quando status = approved
});

// Advanced rate limiting check
async function checkAdvancedRateLimit(
  supabase: any,
  userId: string,
  ipAddress: string | null,
  deviceId: string | null,
  endpoint: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  // Check rate limit by user_id
  if (userId) {
    const { data: userLimit, error: userError } = await supabase
      .from("rate_limits")
      .select("attempts")
      .eq("user_id", userId)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!userError && userLimit && userLimit.attempts >= maxAttempts) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log(`[update-request-status] Rate limit exceeded for user ${userId}: ${userLimit.attempts}/${maxAttempts}`);
      }
      return false;
    }
  }
  
  // Check rate limit by IP address
  if (ipAddress) {
    const { data: ipLimit, error: ipError } = await supabase
      .from("rate_limits")
      .select("attempts")
      .eq("ip_address", ipAddress)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!ipError && ipLimit && ipLimit.attempts >= maxAttempts * 2) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log(`[update-request-status] Rate limit exceeded for IP ${ipAddress}: ${ipLimit.attempts}/${maxAttempts * 2}`);
      }
      return false;
    }
  }
  
  // Record this attempt
  try {
    if (userId) {
      await supabase.from("rate_limits").insert({
        user_id: userId,
        ip_address: ipAddress,
        device_id: deviceId,
        endpoint: endpoint,
        window_start: windowStart.toISOString(),
        attempts: 1,
      });
    }
  } catch (insertError) {
    // Ignore insert errors (duplicates, etc.)
  }
  
  return true;
}

// Helper function for structured logging
function logStructured(
  level: string,
  functionName: string,
  correlationId: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: functionName,
    correlation_id: correlationId,
    message,
    ...metadata,
  };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Reject requests from non-allowed origins
  if (origin && !ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    return new Response(
      JSON.stringify({ success: false, error: "Origin not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
    );
  }

  // Generate correlation ID for this request
  const correlationId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[update-request-status] Claims error:", claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INVALID_TOKEN }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const userId = claimsData.claims.sub as string;
    
    // Extract IP address and device ID for rate limiting
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     null;
    const deviceId = req.headers.get("x-device-id") || null;

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const parseResult = updateStatusSchema.safeParse(body);
    if (!parseResult.success) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[update-request-status] Validation failed:", parseResult.error.errors);
      }
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { request_id, request_type, status, doctor_id, doctor_notes, rejection_reason, medications, pdf_url } = parseResult.data;
    
    logStructured("info", "update-request-status", correlationId, "Updating request status", {
      user_id: userId,
      request_id,
      request_type,
      new_status: status,
    });

    // Rate limiting: max 20 updates per hour by user, 40 by IP
    const isAllowed = await checkAdvancedRateLimit(
      supabase, 
      userId, 
      ipAddress, 
      deviceId, 
      "update-request-status", 
      20, 
      60
    );
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.RATE_LIMITED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // SECURITY: Fetch request and verify authorization
    const tableName = `${request_type}_requests`;
    const { data: request, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchError || !request) {
      console.error("[update-request-status] Request not found:", fetchError);
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
    if (status === "analyzing") {
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
    } else if (["approved", "rejected", "correction_needed", "in_review"].includes(status)) {
      // Only assigned doctor or admin can approve/reject
      if (request.doctor_id !== userId && !isAdmin) {
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.FORBIDDEN }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    } else if (status === "pending" && request.patient_id !== userId && !isAdmin) {
      // Only patient or admin can reset to pending
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.FORBIDDEN }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Build update data (additional fields beyond status)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // If changing to analyzing and doctor_id provided, assign doctor
    if (status === "analyzing" && doctor_id) {
      updateData.doctor_id = doctor_id;
    }

    // If approved, set validated_at
    if (status === "approved") {
      updateData.validated_at = new Date().toISOString();
      if (pdf_url) {
        updateData.pdf_url = pdf_url;
      }
      if (medications && request_type === "prescription") {
        updateData.medications = medications;
      }
    }

    // If rejected, set rejection_reason
    if (status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    // Set doctor_notes if provided
    if (doctor_notes !== undefined) {
      updateData.doctor_notes = doctor_notes;
    }

    // Use transition_request_status function to change status (this is the ONLY way)
    // First update other fields if needed
    if (Object.keys(updateData).length > 1) { // More than just updated_at
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", request_id);

      if (updateError) {
        console.error("[update-request-status] Update error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    // Now transition status using the secure function
    const { data: transitionResult, error: transitionError } = await supabase
      .rpc("transition_request_status", {
        p_table_name: tableName,
        p_request_id: request_id,
        p_new_status: status,
        p_actor_id: userId,
        p_metadata: {
          doctor_notes: doctor_notes,
          rejection_reason: rejection_reason,
          changed_by: userId,
        }
      });

    if (transitionError) {
      console.error("[update-request-status] Status transition error:", transitionError);
      return new Response(
        JSON.stringify({ success: false, error: transitionError.message || ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch updated request
    const { data: updatedRequest, error: fetchUpdatedError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchUpdatedError) {
      console.error("[update-request-status] Fetch updated error:", fetchUpdatedError);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStructured("info", "update-request-status", correlationId, "Request status updated successfully", {
      request_id,
      old_status: request.status,
      new_status: status,
    });

    return new Response(
      JSON.stringify({
        success: true,
        request: updatedRequest,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Always log unexpected errors with structured logging
    logStructured("error", "update-request-status", correlationId, "Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
