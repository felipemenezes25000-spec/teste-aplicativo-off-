import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ERROR_MESSAGES = {
  NOT_CONFIGURED: "Service unavailable",
  UNAUTHORIZED: "Unauthorized",
  INTERNAL_ERROR: "Internal error",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: This function should only be called by service role or cron
    const authHeader = req.headers.get("Authorization");
    const detectSecret = Deno.env.get("DETECT_ANOMALIES_SECRET");
    
    if (detectSecret && (!authHeader || !authHeader.includes(detectSecret))) {
      console.error("[detect-anomalies] Unauthorized access attempt");
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const anomalies: Array<{
      type: string;
      severity: string;
      user_id?: string;
      ip_address?: string;
      device_id?: string;
      details: Record<string, unknown>;
    }> = [];

    // 1. Detect many payments started but not completed (>5 in 1h)
    const { data: incompletePayments } = await supabase
      .from("payments")
      .select("user_id, ip_address, device_id, created_at")
      .in("status", ["pending", "failed"])
      .gte("created_at", oneHourAgo)
      .order("user_id");

    if (incompletePayments) {
      const userCounts = new Map<string, number>();
      incompletePayments.forEach((p: any) => {
        const count = userCounts.get(p.user_id) || 0;
        userCounts.set(p.user_id, count + 1);
      });

      userCounts.forEach((count, userId) => {
        if (count > 5) {
          anomalies.push({
            type: "multiple_payments_not_completed",
            severity: "high",
            user_id: userId,
            details: { count, time_window: "1 hour" },
          });
        }
      });
    }

    // 2. Detect multiple accounts on same device/IP (>3 in 24h)
    const { data: rateLimits } = await supabase
      .from("rate_limits")
      .select("user_id, ip_address, device_id")
      .gte("window_start", oneDayAgo);

    if (rateLimits) {
      const deviceUsers = new Map<string, Set<string>>();
      const ipUsers = new Map<string, Set<string>>();

      rateLimits.forEach((r: any) => {
        if (r.device_id && r.user_id) {
          if (!deviceUsers.has(r.device_id)) {
            deviceUsers.set(r.device_id, new Set());
          }
          deviceUsers.get(r.device_id)!.add(r.user_id);
        }
        if (r.ip_address && r.user_id) {
          if (!ipUsers.has(r.ip_address)) {
            ipUsers.set(r.ip_address, new Set());
          }
          ipUsers.get(r.ip_address)!.add(r.user_id);
        }
      });

      deviceUsers.forEach((users, deviceId) => {
        if (users.size > 3) {
          anomalies.push({
            type: "multiple_accounts_same_device",
            severity: "medium",
            device_id: deviceId,
            details: { user_count: users.size, users: Array.from(users) },
          });
        }
      });

      ipUsers.forEach((users, ipAddress) => {
        if (users.size > 3) {
          anomalies.push({
            type: "multiple_accounts_same_ip",
            severity: "medium",
            ip_address: ipAddress,
            details: { user_count: users.size, users: Array.from(users) },
          });
        }
      });
    }

    // 3. Detect excessive uploads (>20 files/hour) - would need storage logs
    // This is a placeholder - would need to track uploads in a separate table

    // Insert detected anomalies
    if (anomalies.length > 0) {
      const { error: insertError } = await supabase
        .from("anomaly_events")
        .insert(anomalies.map(a => ({
          anomaly_type: a.type,
          severity: a.severity,
          user_id: a.user_id || null,
          ip_address: a.ip_address || null,
          device_id: a.device_id || null,
          details: a.details,
        })));

      if (insertError) {
        console.error("[detect-anomalies] Error inserting anomalies:", insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomalies_detected: anomalies.length,
        anomalies: anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[detect-anomalies] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
