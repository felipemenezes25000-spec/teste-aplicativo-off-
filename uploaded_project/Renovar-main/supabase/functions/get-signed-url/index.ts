import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  FORBIDDEN: "Você não tem permissão para acessar este arquivo.",
  NOT_FOUND: "Arquivo não encontrado.",
  VALIDATION_FAILED: "Dados inválidos.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente.",
};

// Zod schema for input validation
const signedUrlRequestSchema = z.object({
  requestId: z.string().uuid("ID da solicitação inválido"),
  requestType: z.enum(["prescription", "exam"], {
    errorMap: () => ({ message: "Tipo deve ser 'prescription' ou 'exam'" })
  }),
  bucket: z.enum(["prescription-images", "exam-images"]).optional(),
});

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Reject requests from non-allowed origins
  if (origin && !ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ===== AUTHORIZATION CHECK =====
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[get-signed-url] Missing authorization header');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      console.error('[get-signed-url] Claims validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log(`[get-signed-url] Authenticated user: ${userId}`);

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = signedUrlRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('[get-signed-url] Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { requestId, requestType, bucket } = parseResult.data;
    const targetBucket = bucket || (requestType === 'prescription' ? 'prescription-images' : 'exam-images');

    console.log(`[get-signed-url] Getting signed URL for ${requestType} request: ${requestId}`);

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: max 30 URLs per hour by user
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     null;
    const deviceId = req.headers.get("x-device-id") || null;
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from("rate_limits")
      .select("attempts")
      .eq("user_id", userId)
      .eq("endpoint", "get-signed-url")
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!rateLimitError && rateLimit && rateLimit.attempts >= 30) {
      console.log(`[get-signed-url] Rate limit exceeded for user ${userId}: ${rateLimit.attempts}/30`);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Record this attempt
    try {
      await supabase.from("rate_limits").insert({
        user_id: userId,
        ip_address: ipAddress,
        device_id: deviceId,
        endpoint: "get-signed-url",
        window_start: windowStart.toISOString(),
        attempts: 1,
      });
    } catch (insertError) {
      // Ignore insert errors (duplicates, etc.)
    }

    // Fetch request data based on type
    const tableName = requestType === 'prescription' ? 'prescription_requests' : 'exam_requests';

    const { data, error } = await supabase
      .from(tableName)
      .select('patient_id, doctor_id, status, image_url')
      .eq('id', requestId)
      .maybeSingle();

    if (error || !data) {
      console.error('[get-signed-url] Request not found:', requestId);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_FOUND }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const requestData = data;

    // ===== AUTHORIZATION: Check if user is allowed to access this request =====
    const isPatient = requestData.patient_id === userId;
    const isAssignedDoctor = requestData.doctor_id === userId;
    
    // Check if user has doctor role (for pending/analyzing requests)
    const { data: doctorRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'doctor')
      .maybeSingle();
    
    const isDoctor = !!doctorRole;
    const isPendingOrAnalyzing = ['pending', 'analyzing'].includes(requestData.status);
    
    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    const isAdmin = !!adminRole;

    // Authorization rules:
    // 1. Patient can access their own request images
    // 2. Assigned doctor can access request images
    // 3. Any doctor can access pending/analyzing requests (for review queue)
    // 4. Admin can access all
    const canAccess = isPatient || 
                      isAssignedDoctor || 
                      (isDoctor && isPendingOrAnalyzing) ||
                      isAdmin;

    if (!canAccess) {
      console.error(`[get-signed-url] User ${userId} attempted to access request ${requestId} without authorization`);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.FORBIDDEN }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-signed-url] Authorization passed: patient=${isPatient}, assignedDoctor=${isAssignedDoctor}, doctor=${isDoctor}, admin=${isAdmin}`);

    // Extract the file path from the full URL if needed
    let filePath = requestData.image_url;
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_FOUND }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If it's a full URL, extract the path
    if (filePath.includes('/storage/v1/object/')) {
      const parts = filePath.split('/storage/v1/object/public/');
      if (parts.length > 1) {
        const bucketAndPath = parts[1];
        const slashIndex = bucketAndPath.indexOf('/');
        if (slashIndex > -1) {
          filePath = bucketAndPath.substring(slashIndex + 1);
        }
      }
      // Also handle signed URL format
      const signedParts = filePath.split('/storage/v1/object/sign/');
      if (signedParts.length > 1) {
        const bucketAndPath = signedParts[1].split('?')[0]; // Remove query params
        const slashIndex = bucketAndPath.indexOf('/');
        if (slashIndex > -1) {
          filePath = bucketAndPath.substring(slashIndex + 1);
        }
      }
    }

    // Generate a short-lived signed URL (2 minutes for security)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from(targetBucket)
      .createSignedUrl(filePath, 120); // 2 minutes (reduced from 1 hour for security)

    if (signError) {
      console.error('[get-signed-url] Error creating signed URL');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-signed-url] Signed URL generated successfully for request: ${requestId}`);

    // SECURITY: Log document view event for audit trail
    const entityName = requestType === 'prescription' ? 'prescription_requests' : 'exam_requests';
    let actorRole = 'patient';
    if (isAdmin) {
      actorRole = 'admin';
    } else if (isDoctor || isAssignedDoctor) {
      actorRole = 'doctor';
    }

    try {
      await supabase.rpc('log_request_event', {
        p_actor_id: userId,
        p_actor_role: actorRole,
        p_entity: entityName,
        p_entity_id: requestId,
        p_action: 'document_viewed',
        p_metadata: {
          bucket: targetBucket,
          file_path: filePath,
          viewed_at: new Date().toISOString()
        }
      });
    } catch (auditError) {
      // Log error but don't fail the request
      console.error('[get-signed-url] Error logging audit event:', auditError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        signedUrl: signedUrl.signedUrl,
        expiresIn: 120, // 2 minutes
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[get-signed-url] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
