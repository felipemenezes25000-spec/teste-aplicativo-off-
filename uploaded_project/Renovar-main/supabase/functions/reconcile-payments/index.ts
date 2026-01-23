import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generic error messages
const ERROR_MESSAGES = {
  NOT_CONFIGURED: "Service unavailable",
  UNAUTHORIZED: "Unauthorized",
  INTERNAL_ERROR: "Internal error",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: This function should only be called by service role or cron
    // Check for authorization header (can be service key or a secret token)
    const authHeader = req.headers.get("Authorization");
    const reconcileSecret = Deno.env.get("RECONCILE_PAYMENTS_SECRET");
    
    // If secret is configured, require it
    if (reconcileSecret) {
      if (!authHeader || !authHeader.includes(reconcileSecret)) {
        console.error("[reconcile-payments] Unauthorized access attempt");
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
    }

    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error("[reconcile-payments] MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending payments older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", fifteenMinutesAgo)
      .limit(100); // Process in batches

    if (fetchError) {
      console.error("[reconcile-payments] Error fetching pending payments:", fetchError);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No pending payments to reconcile",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results = {
      processed: 0,
      updated: 0,
      errors: 0,
      details: [] as Array<{ payment_id: string; action: string; status?: string }>,
    };

    // Process each payment
    for (const payment of pendingPayments) {
      try {
        let mpPayment = null;
        let paymentIdToCheck = null;

        // Determine which ID to use for MercadoPago lookup
        if (payment.mercadopago_payment_id) {
          paymentIdToCheck = payment.mercadopago_payment_id;
        } else if (payment.mercadopago_preference_id) {
          // For preferences, we need to check the payment that was created from it
          // This is more complex, so we'll skip preferences without payment_id for now
          results.details.push({
            payment_id: payment.id,
            action: "skipped",
          });
          continue;
        } else {
          // No MercadoPago ID available, skip
          results.details.push({
            payment_id: payment.id,
            action: "skipped_no_id",
          });
          continue;
        }

        // Fetch payment status from MercadoPago
        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentIdToCheck}`,
          {
            headers: {
              Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
            },
          }
        );

        if (!mpResponse.ok) {
          console.error(
            `[reconcile-payments] Failed to fetch payment ${paymentIdToCheck} from MercadoPago:`,
            mpResponse.status
          );
          results.errors++;
          results.details.push({
            payment_id: payment.id,
            action: "error_fetch",
          });
          continue;
        }

        mpPayment = await mpResponse.json();

        // Map MercadoPago status to our status
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

        // Check if status has changed
        if (payment.status !== newStatus) {
          const updateData: Record<string, unknown> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };

          if (paidAt) {
            updateData.paid_at = paidAt;
          }

          // Update payment in database
          const { error: updateError } = await supabase
            .from("payments")
            .update(updateData)
            .eq("id", payment.id);

          if (updateError) {
            console.error(`[reconcile-payments] Failed to update payment ${payment.id}:`, updateError);
            results.errors++;
            results.details.push({
              payment_id: payment.id,
              action: "error_update",
            });
          } else {
            results.updated++;
            results.details.push({
              payment_id: payment.id,
              action: "updated",
              status: newStatus,
            });

            // If payment is now completed, update the corresponding request
            if (newStatus === "completed") {
              const tableName = `${payment.request_type}_requests`;
              await supabase
                .from(tableName)
                .update({
                  status: "analyzing",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", payment.request_id);

              // Create notification for user
              await supabase.from("notifications").insert({
                user_id: payment.user_id,
                title: "Pagamento confirmado!",
                message: "Seu pagamento foi confirmado. Sua solicitação está em análise.",
                type: "success",
              });
            }
          }
        } else {
          results.details.push({
            payment_id: payment.id,
            action: "no_change",
            status: payment.status,
          });
        }

        results.processed++;
      } catch (error) {
        console.error(`[reconcile-payments] Error processing payment ${payment.id}:`, error);
        results.errors++;
        results.details.push({
          payment_id: payment.id,
          action: "error",
        });
      }
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log("[reconcile-payments] Reconciliation complete:", results);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[reconcile-payments] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
