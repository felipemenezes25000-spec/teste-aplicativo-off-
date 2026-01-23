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
  NOT_CONFIGURED: "Serviço temporariamente indisponível.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente ou contate o suporte.",
};

// Zod schemas for input validation
// SECURITY: price is NOT accepted from frontend - it's calculated in the backend
const prescriptionRequestSchema = z.object({
  request_type: z.literal("prescription"),
  prescription_type: z.enum(["simple", "controlled", "blue"]),
  image_url: z.string().url().optional(),
  medications: z.array(z.any()).optional(),
  patient_notes: z.string().max(1000).optional(),
});

const examRequestSchema = z.object({
  request_type: z.literal("exam"),
  exam_type: z.enum(["laboratory", "imaging"]),
  image_url: z.string().url().optional(),
  exams: z.array(z.any()).optional(),
  patient_notes: z.string().max(1000).optional(),
});

const consultationRequestSchema = z.object({
  request_type: z.literal("consultation"),
  specialty: z.string().min(1).max(100),
  duration_minutes: z.number().int().min(15).max(120),
  patient_notes: z.string().max(1000).optional(),
  scheduled_at: z.string().datetime().optional(),
});

const requestSchema = z.discriminatedUnion("request_type", [
  prescriptionRequestSchema,
  examRequestSchema,
  consultationRequestSchema,
]);

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
        console.log(`[create-request] Rate limit exceeded for user ${userId}: ${userLimit.attempts}/${maxAttempts}`);
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
        console.log(`[create-request] Rate limit exceeded for IP ${ipAddress}: ${ipLimit.attempts}/${maxAttempts * 2}`);
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
      console.error("[create-request] Claims error:", claimsError?.message);
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

    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-request] Validation failed:", parseResult.error.errors);
      }
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const requestData = parseResult.data;
    logStructured("info", "create-request", correlationId, "Creating request", {
      user_id: userId,
      request_type: requestData.request_type,
    });

    // Rate limiting: max 10 requests per hour by user, 20 by IP
    const isAllowed = await checkAdvancedRateLimit(
      supabase, 
      userId, 
      ipAddress, 
      deviceId, 
      "create-request", 
      10, 
      60
    );
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.RATE_LIMITED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // SECURITY: Calculate price in backend (never trust frontend)
    let priceCents: number;
    let serviceSubtype: string;
    let tableName: string;
    let insertData: Record<string, unknown>;

    if (requestData.request_type === "prescription") {
      tableName = "prescription_requests";
      serviceSubtype = requestData.prescription_type;
      
      const { data: price, error: priceError } = await supabase
        .rpc("get_service_price", {
          p_service_type: "prescription",
          p_service_subtype: serviceSubtype
        });

      if (priceError || price === null || price === undefined) {
        console.error("[create-request] Price lookup failed:", priceError);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      priceCents = price;
      insertData = {
        patient_id: userId,
        prescription_type: requestData.prescription_type,
        price: priceCents / 100, // Convert cents to reais
        image_url: requestData.image_url,
        medications: requestData.medications || [],
        patient_notes: requestData.patient_notes,
        status: "pending",
      };
    } else if (requestData.request_type === "exam") {
      tableName = "exam_requests";
      serviceSubtype = requestData.exam_type;
      
      const { data: price, error: priceError } = await supabase
        .rpc("get_service_price", {
          p_service_type: "exam",
          p_service_subtype: serviceSubtype
        });

      if (priceError || price === null || price === undefined) {
        console.error("[create-request] Price lookup failed:", priceError);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      priceCents = price;
      insertData = {
        patient_id: userId,
        exam_type: requestData.exam_type,
        price: priceCents / 100, // Convert cents to reais
        image_url: requestData.image_url,
        exams: requestData.exams || [],
        patient_notes: requestData.patient_notes,
        status: "pending",
      };
    } else if (requestData.request_type === "consultation") {
      tableName = "consultation_requests";
      
      // Determine service subtype based on specialty
      const specialty = (requestData.specialty || "").toLowerCase();
      if (specialty.includes("psicolog")) {
        serviceSubtype = "psychologist";
      } else if (specialty.includes("clinic") || specialty.includes("clínico")) {
        serviceSubtype = "clinician";
      } else {
        serviceSubtype = "default";
      }
      
      // Get price per minute from pricing table
      const { data: pricePerMinuteCents, error: priceError } = await supabase
        .rpc("get_service_price", {
          p_service_type: "consultation",
          p_service_subtype: serviceSubtype
        });
      
      if (priceError || !pricePerMinuteCents) {
        console.error("[create-request] Consultation price lookup failed:", priceError);
        // Fallback to default
        const { data: defaultResult } = await supabase
          .rpc("get_service_price", {
            p_service_type: "consultation",
            p_service_subtype: "default"
          });
        priceCents = (defaultResult || 250) * requestData.duration_minutes;
      } else {
        priceCents = pricePerMinuteCents * requestData.duration_minutes;
      }
      
      insertData = {
        patient_id: userId,
        specialty: requestData.specialty,
        duration_minutes: requestData.duration_minutes,
        price_per_minute: pricePerMinuteCents / 100,
        total_price: priceCents / 100,
        patient_notes: requestData.patient_notes,
        scheduled_at: requestData.scheduled_at,
        status: "pending",
      };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStructured("info", "create-request", correlationId, "Price calculated", {
      price_cents: priceCents,
      request_type: requestData.request_type,
      service_subtype: serviceSubtype,
    });

    // Create request in database
    const { data: newRequest, error: insertError } = await supabase
      .from(tableName)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("[create-request] Database error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log audit event
    try {
      await supabase.rpc('log_request_event', {
        p_actor_id: userId,
        p_actor_role: 'patient',
        p_entity: tableName,
        p_entity_id: newRequest.id,
        p_action: 'request_created',
        p_metadata: {
          request_type: requestData.request_type,
          price_cents: priceCents,
          created_at: new Date().toISOString()
        }
      });
    } catch (auditError) {
      // Log error but don't fail the request
      console.error("[create-request] Audit logging error:", auditError);
    }

    logStructured("info", "create-request", correlationId, "Request created successfully", {
      request_id: newRequest.id,
      request_type: requestData.request_type,
    });

    return new Response(
      JSON.stringify({
        success: true,
        request: {
          id: newRequest.id,
          status: newRequest.status,
          price: newRequest.price,
          created_at: newRequest.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Always log unexpected errors with structured logging
    logStructured("error", "create-request", correlationId, "Unexpected error", {
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
