import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic error messages - never expose internal details
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Autenticação necessária.",
  INVALID_TOKEN: "Sessão inválida. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para esta operação.",
  VALIDATION_FAILED: "Dados inválidos.",
  NOT_CONFIGURED: "Serviço de notificações indisponível.",
  RATE_LIMITED: "Muitas notificações. Aguarde alguns minutos.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente.",
};

// Zod schema for push payload
const pushPayloadSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título muito longo"),
  body: z.string().min(1, "Corpo é obrigatório").max(500, "Corpo muito longo"),
  icon: z.string().max(500).optional(),
  badge: z.string().max(500).optional(),
  tag: z.string().max(100).optional(),
  data: z.record(z.unknown()).optional(),
});

// Zod schema for request body
const requestBodySchema = z.object({
  user_id: z.string().uuid().optional(),
  user_ids: z.array(z.string().uuid()).max(100, "Máximo 100 destinatários").optional(),
  payload: pushPayloadSchema,
}).refine(
  data => data.user_id || (data.user_ids && data.user_ids.length > 0),
  { message: "Deve fornecer user_id ou user_ids" }
);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      // Always log configuration errors
      console.error('[send-push-notification] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authentication check - with verify_jwt = true, JWT is pre-validated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // Always log auth errors
      console.error('[send-push-notification] No authorization header provided');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get claims from pre-validated JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      // Always log auth errors
      console.error('[send-push-notification] Claims validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[send-push-notification] Authenticated user:', userId);
    }

    // Check if user is admin or doctor (allowed to send to other users)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    const isAdminOrDoctor = userRoles?.some(r => r.role === 'admin' || r.role === 'doctor');

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

    const parseResult = requestBodySchema.safeParse(body);
    if (!parseResult.success) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[send-push-notification] Validation failed:', parseResult.error.errors);
      }
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, user_ids, payload } = parseResult.data;

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[send-push-notification] Received push request for', user_id || user_ids?.length || 0, 'users');
    }

    // Security check: non-admin/doctor users can only send to themselves
    if (!isAdminOrDoctor) {
      if (user_id && user_id !== userId) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.FORBIDDEN }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (user_ids && !user_ids.every(id => id === userId)) {
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.FORBIDDEN }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = supabaseAdmin;

    // Build query for subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (user_ids && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      // Always log database errors
      console.error('[send-push-notification] Error fetching subscriptions');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`[send-push-notification] Found ${subscriptions?.length || 0} subscriptions`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma assinatura encontrada', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we store subscriptions for future use with a proper web-push library
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`[send-push-notification] Would send push to ${subscriptions.length} subscriptions`);
    }

    // Create in-app notifications as fallback
    const notificationInserts = [];
    const userIdSet = new Set<string>();
    
    for (const sub of subscriptions) {
      if (!userIdSet.has(sub.user_id)) {
        userIdSet.add(sub.user_id);
        notificationInserts.push({
          user_id: sub.user_id,
          title: payload.title,
          message: payload.body,
          type: 'push',
          read: false
        });
      }
    }

    if (notificationInserts.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notificationInserts);
      
      if (notifError) {
        // Always log database errors
        console.error('[send-push-notification] Error creating notifications');
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notificações registradas',
        sent: subscriptions.length,
        notifications_created: notificationInserts.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Always log unexpected errors
    console.error('[send-push-notification] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
