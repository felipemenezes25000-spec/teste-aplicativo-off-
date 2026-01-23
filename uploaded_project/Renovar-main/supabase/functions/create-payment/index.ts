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
  PAYMENT_FAILED: "Não foi possível processar o pagamento. Tente novamente.",
  NOT_CONFIGURED: "Serviço temporariamente indisponível.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente ou contate o suporte.",
};

// Zod schema for input validation
// SECURITY: amount is NOT accepted from frontend - it's calculated in the backend
const paymentSchema = z.object({
  request_id: z.string().uuid("ID da solicitação inválido"),
  request_type: z.enum(["prescription", "exam", "consultation"], {
    errorMap: () => ({ message: "Tipo de solicitação inválido" })
  }),
  method: z.enum(["pix", "credit_card"], {
    errorMap: () => ({ message: "Método de pagamento inválido" })
  }),
  description: z.string().max(200, "Descrição muito longa").optional(),
});

// Generate idempotency key hash
async function generateIdempotencyKey(
  requestId: string,
  userId: string,
  serviceType: string,
  serviceSubtype: string
): Promise<string> {
  const keyString = `${requestId}:${userId}:${serviceType}:${serviceSubtype}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Advanced rate limiting check using rate_limits table
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
        console.log(`[create-payment] Rate limit exceeded for user ${userId}: ${userLimit.attempts}/${maxAttempts}`);
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
    
    if (!ipError && ipLimit && ipLimit.attempts >= maxAttempts * 2) { // IP limit is 2x user limit
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log(`[create-payment] Rate limit exceeded for IP ${ipAddress}: ${ipLimit.attempts}/${maxAttempts * 2}`);
      }
      return false;
    }
  }
  
  // Check rate limit by device_id
  if (deviceId) {
    const { data: deviceLimit, error: deviceError } = await supabase
      .from("rate_limits")
      .select("attempts")
      .eq("device_id", deviceId)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!deviceError && deviceLimit && deviceLimit.attempts >= Math.floor(maxAttempts * 1.5)) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log(`[create-payment] Rate limit exceeded for device ${deviceId}: ${deviceLimit.attempts}/${Math.floor(maxAttempts * 1.5)}`);
      }
      return false;
    }
  }
  
  // SECURITY: Record this attempt using atomic upsert to prevent race conditions
  // This ensures accurate counting even under concurrent requests
  try {
    if (userId) {
      // Use upsert with increment for atomic counter
      const { error: upsertError } = await supabase
        .from("rate_limits")
        .upsert({
          user_id: userId,
          ip_address: ipAddress,
          device_id: deviceId,
          endpoint: endpoint,
          window_start: windowStart.toISOString(),
          attempts: 1,
        }, {
          onConflict: 'user_id,endpoint,window_start',
          ignoreDuplicates: false,
        });

      // If upsert fails, use RPC function for atomic increment
      if (upsertError) {
        await supabase.rpc('increment_rate_limit', {
          p_user_id: userId,
          p_endpoint: endpoint,
          p_window_start: windowStart.toISOString(),
          p_ip_address: ipAddress,
          p_device_id: deviceId,
        }).catch(() => {
          // If RPC fails, silently ignore - rate limiting already checked above
        });
      } else {
        // If insert succeeded, try to increment in case record already existed
        // This handles race conditions where two requests check simultaneously
        await supabase.rpc('increment_rate_limit', {
          p_user_id: userId,
          p_endpoint: endpoint,
          p_window_start: windowStart.toISOString(),
          p_ip_address: ipAddress,
          p_device_id: deviceId,
        }).catch(() => {});
      }
    }
  } catch (error) {
    // Ignore errors - rate limiting already checked above
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`[create-payment] Rate limit recording error (non-critical):`, error);
    }
  }
  
  return true;
}

// Legacy rate limiting check (kept for backward compatibility)
async function checkRateLimit(
  supabase: any,
  userId: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  return checkAdvancedRateLimit(supabase, userId, null, null, "create-payment", maxAttempts, windowMinutes);
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
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      // Always log configuration errors
      console.error("[create-payment] MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header - with verify_jwt = true, JWT is pre-validated
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
      // Always log auth errors
      console.error("[create-payment] Claims error:", claimsError?.message);
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

    // Parse and validate input with zod
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const parseResult = paymentSchema.safeParse(body);
    if (!parseResult.success) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-payment] Validation failed:", parseResult.error.errors);
      }
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { request_id, request_type, method, description } = parseResult.data;
    logStructured("info", "create-payment", correlationId, "Creating payment", {
      user_id: userId,
      request_id,
      request_type,
      method,
    });

    // Advanced rate limiting: max 10 payment attempts per hour by user, 20 by IP, 15 by device
    const isAllowed = await checkAdvancedRateLimit(
      supabase, 
      userId, 
      ipAddress, 
      deviceId, 
      "create-payment", 
      10, 
      60
    );
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.RATE_LIMITED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // SECURITY: Fetch request and calculate price from backend (never trust frontend)
    const tableName = `${request_type}_requests`;
    const { data: request, error: requestError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", request_id)
      .eq("patient_id", userId) // Ensure user owns the request
      .single();

    if (requestError || !request) {
      console.error("[create-payment] Request not found or access denied:", requestError);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Calculate price from pricing table
    let serviceSubtype: string;
    let amount: number;

    if (request_type === "prescription") {
      serviceSubtype = request.prescription_type; // simple, controlled, blue
    } else if (request_type === "exam") {
      serviceSubtype = request.exam_type; // laboratory, imaging
    } else if (request_type === "consultation") {
      // For consultations, we need to calculate based on duration and price per minute
      // First, try to get specialty-specific pricing, fallback to default
      const specialty = (request.specialty || "").toLowerCase();
      let pricePerMinuteCents: number;
      
      // Determine service subtype based on specialty
      let consultationSubtype = "default";
      if (specialty.includes("psicolog")) {
        consultationSubtype = "psychologist";
      } else if (specialty.includes("clinic") || specialty.includes("clínico")) {
        consultationSubtype = "clinician";
      }
      
      // Get price per minute from pricing table
      const { data: pricingResult, error: priceError } = await supabase
        .rpc("get_service_price", {
          p_service_type: "consultation",
          p_service_subtype: consultationSubtype
        });
      
      if (priceError || !pricingResult) {
        console.error("[create-payment] Consultation price lookup failed:", priceError);
        // Fallback to default
        const { data: defaultResult } = await supabase
          .rpc("get_service_price", {
            p_service_type: "consultation",
            p_service_subtype: "default"
          });
        pricePerMinuteCents = defaultResult || 250; // R$ 2.50 default
      } else {
        pricePerMinuteCents = pricingResult;
      }
      
      // Calculate total: duration_minutes * price_per_minute
      const durationMinutes = request.duration_minutes || 15;
      amount = (pricePerMinuteCents * durationMinutes) / 100; // Convert cents to reais
      serviceSubtype = consultationSubtype;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get price from pricing table for prescription and exam
    if (request_type !== "consultation") {
      const { data: priceCents, error: priceError } = await supabase
        .rpc("get_service_price", {
          p_service_type: request_type,
          p_service_subtype: serviceSubtype
        });

      if (priceError || priceCents === null || priceCents === undefined) {
        console.error("[create-payment] Price lookup failed:", priceError);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Convert cents to reais
      amount = priceCents / 100;
    }

    logStructured("info", "create-payment", correlationId, "Price calculated", {
      amount,
      request_type,
      service_subtype: serviceSubtype,
    });

    // Get user profile for payer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("user_id", userId)
      .single();
    
    // Get user email from claims as fallback
    const userEmail = claimsData.claims.email as string || profile?.email || "cliente@renoveja.com";

    const typeLabels: Record<string, string> = {
      prescription: "Receita Médica",
      exam: "Pedido de Exame",
      consultation: "Consulta",
    };

    const itemDescription = description || `RenoveJá+ - ${typeLabels[request_type]}`;

    let paymentData: Record<string, unknown> = {};
    let paymentResponse: Response;

    if (method === "pix") {
      // Create PIX payment directly
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-payment] Creating PIX payment...");
      }
      
      const pixPayload = {
        transaction_amount: amount,
        description: itemDescription,
        payment_method_id: "pix",
        payer: {
          email: userEmail,
          first_name: profile?.name?.split(" ")[0] || "Cliente",
          last_name: profile?.name?.split(" ").slice(1).join(" ") || "RenoveJá",
        },
      };

      paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
          "X-Idempotency-Key": `${request_id}-${Date.now()}`,
        },
        body: JSON.stringify(pixPayload),
      });

      if (!paymentResponse.ok) {
        // Always log payment errors
        console.error("[create-payment] Mercado Pago PIX error:", paymentResponse.status);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.PAYMENT_FAILED }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const mpPayment = await paymentResponse.json();
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-payment] PIX payment created:", mpPayment.id);
      }

      paymentData = {
        mercadopago_payment_id: String(mpPayment.id),
        qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
        expires_at: mpPayment.date_of_expiration,
        status: "pending",
      };
    } else {
      // Create Checkout Pro preference for card payments
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-payment] Creating Checkout Pro preference...");
      }
      
      const preferencePayload = {
        items: [
          {
            id: request_id,
            title: itemDescription,
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: userEmail,
          name: profile?.name || "Cliente",
        },
        back_urls: {
          success: `${Deno.env.get("FRONTEND_URL") || supabaseUrl.replace('/functions/v1', '')}/${request_type}s/confirmation`,
          failure: `${Deno.env.get("FRONTEND_URL") || supabaseUrl.replace('/functions/v1', '')}/${request_type}s/payment`,
          pending: `${Deno.env.get("FRONTEND_URL") || supabaseUrl.replace('/functions/v1', '')}/${request_type}s/status`,
        },
        auto_return: "approved",
        external_reference: request_id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      };

      paymentResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preferencePayload),
      });

      if (!paymentResponse.ok) {
        // Always log payment errors
        console.error("[create-payment] Mercado Pago preference error:", paymentResponse.status);
        return new Response(
          JSON.stringify({ success: false, error: ERROR_MESSAGES.PAYMENT_FAILED }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const preference = await paymentResponse.json();
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[create-payment] Preference created:", preference.id);
      }

      paymentData = {
        mercadopago_preference_id: preference.id,
        checkout_url: preference.init_point,
        status: "pending",
      };
    }

    // Calculate amount in cents for storage (locked value)
    const amountCentsLocked = Math.round(amount * 100);

    // SECURITY: Generate idempotency key to prevent duplicate payments
    const idempotencyKey = await generateIdempotencyKey(
      request_id,
      userId,
      request_type,
      serviceSubtype
    );

    // Check for existing payment with same idempotency key
    const { data: existingByIdempotency, error: checkIdempotencyError } = await supabase
      .from("payments")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .limit(1)
      .maybeSingle();

    // Also check for existing payment with same request_id and active status
    const { data: existingByRequest, error: checkRequestError } = await supabase
      .from("payments")
      .select("*")
      .eq("request_id", request_id)
      .eq("request_type", request_type)
      .in("status", ["pending", "processing", "completed"])
      .limit(1)
      .maybeSingle();

    const existingPayment = existingByIdempotency || existingByRequest;
    const checkError = checkIdempotencyError || checkRequestError;

    if (checkError) {
      console.error("[create-payment] Error checking existing payment:", checkError);
      // Continue to create new payment if check fails
    }

    // If existing payment found, return it (idempotency)
    if (existingPayment) {
    logStructured("info", "create-payment", correlationId, "Existing payment found (idempotency)", {
      payment_id: existingPayment.id,
      idempotency_key: idempotencyKey,
    });
      return new Response(
        JSON.stringify({
          success: true,
          payment: {
            id: existingPayment.id,
            status: existingPayment.status,
            method: existingPayment.method,
            checkout_url: existingPayment.checkout_url,
            qr_code: existingPayment.qr_code,
            qr_code_base64: existingPayment.qr_code_base64,
            pix_code: existingPayment.pix_code,
            expires_at: existingPayment.expires_at,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get pricing version ID for audit trail
    const { data: pricingRecord } = await supabase
      .from("pricing")
      .select("id")
      .eq("service_type", request_type)
      .eq("service_subtype", serviceSubtype)
      .eq("active", true)
      .order("valid_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Create payment record in database
    // SECURITY: amount_cents_locked stores the calculated value from backend
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        request_id,
        request_type,
        amount,
        method,
        idempotency_key: idempotencyKey,
        amount_cents_locked: amountCentsLocked, // Store locked value
        pricing_version_id: pricingRecord?.id || null,
        ...paymentData,
      })
      .select()
      .single();

    if (paymentError) {
      // Always log database errors
      console.error("[create-payment] Database error:", paymentError);
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    logStructured("info", "create-payment", correlationId, "Payment created successfully", {
      payment_id: payment.id,
      request_id,
      amount_cents_locked: amountCentsLocked,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          method: payment.method,
          checkout_url: payment.checkout_url,
          qr_code: payment.qr_code,
          qr_code_base64: payment.qr_code_base64,
          pix_code: payment.pix_code,
          expires_at: payment.expires_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Always log unexpected errors with structured logging
    logStructured("error", "create-payment", correlationId, "Unexpected error", {
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
