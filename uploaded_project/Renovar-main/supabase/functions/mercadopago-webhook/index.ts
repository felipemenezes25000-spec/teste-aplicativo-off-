import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

// Generic error messages - never expose internal details to external services
const ERROR_MESSAGES = {
  NOT_CONFIGURED: "Service unavailable",
  INVALID_SIGNATURE: "Unauthorized",
  INTERNAL_ERROR: "Internal error",
};

// Validate Mercado Pago webhook signature
async function validateSignature(
  requestBody: string,
  xSignature: string | null,
  xRequestId: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!xSignature || !xRequestId) {
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Missing signature headers");
    }
    return false;
  }

  // Parse x-signature header (format: ts=<timestamp>,v1=<hash>)
  const parts = xSignature.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Invalid signature format");
    }
    return false;
  }

  // Build the signed template
  let signedTemplate = "";
  
  try {
    const body = JSON.parse(requestBody);
    if (body.data?.id) {
      signedTemplate += `id:${body.data.id};`;
    }
  } catch {
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Could not parse body for signature validation");
    }
  }
  
  signedTemplate += `request-id:${xRequestId};ts:${ts};`;

  // Generate HMAC-SHA256 hash
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedTemplate)
  );

  // Convert to hex
  const hashHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = hashHex === v1;
  
  if (!isValid && Deno.env.get('ENVIRONMENT') === 'development') {
    console.log("[mercadopago-webhook] Signature mismatch");
  }
  
  return isValid;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const MERCADO_PAGO_WEBHOOK_SECRET = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error("[mercadopago-webhook] MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // SECURITY: Webhook secret is now MANDATORY
    if (!MERCADO_PAGO_WEBHOOK_SECRET) {
      console.error("[mercadopago-webhook] MERCADO_PAGO_WEBHOOK_SECRET not configured - rejecting request");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature validation
    const rawBody = await req.text();
    
    // SECURITY: Always validate webhook signature (mandatory)
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    
    const isValid = await validateSignature(
      rawBody,
      xSignature,
      xRequestId,
      MERCADO_PAGO_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("[mercadopago-webhook] Invalid webhook signature - rejecting request");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_SIGNATURE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Webhook signature validated successfully");
    }

    // Parse the webhook notification
    const body = JSON.parse(rawBody);
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Webhook received, type:", body.type);
    }

    // Mercado Pago sends different notification types
    const { type, data, action } = body;

    // We're interested in payment notifications
    if (type !== "payment" || !data?.id) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[mercadopago-webhook] Ignoring notification type:", type);
      }
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentId = String(data.id);
    const externalEventId = paymentId; // Use payment ID as external event ID
    
    // Declare webhookEventId in outer scope for error handling
    let webhookEventId: string | undefined;
    
    // SECURITY: Check if webhook event was already processed (idempotency)
    const { data: existingEvent, error: checkEventError } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("provider", "mercadopago")
      .eq("external_event_id", externalEventId)
      .maybeSingle();

    if (existingEvent && existingEvent.status === "processed") {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[mercadopago-webhook] Event already processed, skipping:", externalEventId);
      }
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Insert or update webhook event record (idempotency)
    let webhookEventId: string;
    if (existingEvent) {
      // Update existing event to retry
      const { data: updatedEvent, error: updateError } = await supabase
        .from("webhook_events")
        .update({
          status: "pending",
          retry_count: existingEvent.retry_count + 1,
          received_at: new Date().toISOString(),
          payload_raw: body,
        })
        .eq("id", existingEvent.id)
        .select()
        .single();
      
      if (updateError) {
        console.error("[mercadopago-webhook] Error updating webhook event:", updateError);
      } else {
        webhookEventId = updatedEvent.id;
      }
    } else {
      // Insert new event
      const { data: newEvent, error: insertError } = await supabase
        .from("webhook_events")
        .insert({
          provider: "mercadopago",
          external_event_id: externalEventId,
          event_type: type,
          payload_raw: body,
          status: "pending",
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("[mercadopago-webhook] Error inserting webhook event:", insertError);
        // Continue processing even if logging fails
      } else {
        webhookEventId = newEvent.id;
      }
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Processing payment notification:", paymentId);
    }

    // Fetch payment details from Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error("[mercadopago-webhook] Failed to fetch payment from Mercado Pago:", mpResponse.status);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const mpPayment = await mpResponse.json();
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Mercado Pago payment status:", mpPayment.status);
    }

    // Map Mercado Pago status to our status
    const statusMap: Record<string, string> = {
      approved: "completed",
      pending: "pending",
      in_process: "processing",
      rejected: "failed",
      cancelled: "failed",
      refunded: "refunded",
      charged_back: "refunded",
    };

    const newStatus = statusMap[mpPayment.status] || "pending";
    const paidAt = mpPayment.status === "approved" ? new Date().toISOString() : null;

    // Find the payment in our database by mercadopago_payment_id
    let payment = null;
    
    const { data: existingPayment, error: findError } = await supabase
      .from("payments")
      .select("id, request_id, request_type, status")
      .eq("mercadopago_payment_id", paymentId)
      .single();

    if (findError || !existingPayment) {
      // Try finding by external_reference (request_id) for preference payments
      if (mpPayment.external_reference) {
        const { data: prefPayment, error: prefError } = await supabase
          .from("payments")
          .select("id, request_id, request_type, status")
          .eq("request_id", mpPayment.external_reference)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (prefError || !prefPayment) {
          console.error("[mercadopago-webhook] Payment not found");
          return new Response(JSON.stringify({ received: true, found: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Update the payment with the mercadopago_payment_id if not set
        await supabase
          .from("payments")
          .update({ mercadopago_payment_id: paymentId })
          .eq("id", prefPayment.id);

        payment = prefPayment;
      } else {
        console.error("[mercadopago-webhook] Payment not found");
        return new Response(JSON.stringify({ received: true, found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      payment = existingPayment;
    }

    // Don't process if already completed
    if (payment.status === "completed" && newStatus !== "refunded") {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[mercadopago-webhook] Payment already completed, skipping");
      }
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update payment status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    if (paidAt) {
      updateData.paid_at = paidAt;
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update(updateData)
      .eq("id", payment.id);

    if (updateError) {
      console.error("[mercadopago-webhook] Failed to update payment");
      
      // Mark webhook event as failed
      if (webhookEventId) {
        await supabase
          .from("webhook_events")
          .update({
            status: "failed",
            error_message: `Failed to update payment: ${updateError.message}`,
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookEventId);
      }
      
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[mercadopago-webhook] Payment updated:", payment.id, "New status:", newStatus);
    }

    // If payment is completed, update the corresponding request status
    if (newStatus === "completed") {
      const tableName = `${payment.request_type}_requests`;
      
      const { error: requestError } = await supabase
        .from(tableName)
        .update({ 
          status: "analyzing",
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.request_id);

      if (requestError && Deno.env.get('ENVIRONMENT') === 'development') {
        console.error("[mercadopago-webhook] Failed to update request:", requestError.message);
      } else if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log("[mercadopago-webhook] Request updated to analyzing:", payment.request_id);
      }

      // Create notification for user
      const { data: paymentWithUser } = await supabase
        .from("payments")
        .select("user_id")
        .eq("id", payment.id)
        .single();

      if (paymentWithUser) {
        await supabase.from("notifications").insert({
          user_id: paymentWithUser.user_id,
          title: "Pagamento confirmado!",
          message: "Seu pagamento foi confirmado. Sua solicitação está em análise.",
          type: "success",
        });
      }
    }

    // Mark webhook event as processed successfully
    if (webhookEventId) {
      await supabase
        .from("webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookEventId);
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, status: newStatus }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[mercadopago-webhook] Unexpected error:", error);
    
    // Mark webhook event as failed if we have the ID
    if (typeof webhookEventId !== 'undefined') {
      try {
        await supabase
          .from("webhook_events")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : String(error),
            processed_at: new Date().toISOString(),
          })
          .eq("id", webhookEventId);
      } catch (updateError) {
        console.error("[mercadopago-webhook] Error updating webhook event status:", updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
