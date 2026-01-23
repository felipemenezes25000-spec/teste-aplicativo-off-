/**
 * Script para atualizar CORS em todas as Edge Functions
 * Execute: deno run --allow-read --allow-write scripts/fix-cors.ts
 */

const CORS_HELPER = `// SECURITY: CORS allowlist - apenas origens permitidas
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
}`;

const CORS_OLD_PATTERN = /const corsHeaders = \{[^}]+\};/s;
const CORS_REPLACEMENT = CORS_HELPER;

const SERVE_PATTERN = /serve\(async \(req\) => \{[\s\S]*?if \(req\.method === ["']OPTIONS["']\) \{[\s\S]*?return new Response\(null, \{ headers: corsHeaders \}\);[\s\S]*?\}/;

async function updateFile(filePath: string) {
  const content = await Deno.readTextFile(filePath);
  
  // Skip if already updated
  if (content.includes("ALLOWED_ORIGINS")) {
    console.log(`✓ ${filePath} already updated`);
    return;
  }

  let updated = content.replace(CORS_OLD_PATTERN, CORS_REPLACEMENT);
  
  // Update serve function to use getCorsHeaders
  updated = updated.replace(
    /serve\(async \(req\) => \{[\s\S]*?(if \(req\.method === ["']OPTIONS["']\))/,
    `serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  $1`
  );

  // Add origin check after OPTIONS
  if (!updated.includes("Origin not allowed")) {
    updated = updated.replace(
      /(if \(req\.method === ["']OPTIONS["']\) \{[\s\S]*?return new Response\(null, \{ headers: corsHeaders \}\);[\s\S]*?\})/,
      `$1

  // SECURITY: Reject requests from non-allowed origins
  if (origin && !ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.startsWith(allowed))) {
    return new Response(
      JSON.stringify({ success: false, error: "Origin not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
    );
  }`
    );
  }

  await Deno.writeTextFile(filePath, updated);
  console.log(`✓ Updated ${filePath}`);
}

async function main() {
  const functions = [
    "supabase/functions/update-request-status/index.ts",
    "supabase/functions/update-prescription/index.ts",
    "supabase/functions/validate-image/index.ts",
    "supabase/functions/detect-anomalies/index.ts",
    "supabase/functions/reconcile-payments/index.ts",
    "supabase/functions/generate-pdf/index.ts",
    "supabase/functions/send-push-notification/index.ts",
    "supabase/functions/validate-crm/index.ts",
  ];

  for (const func of functions) {
    try {
      await updateFile(func);
    } catch (error) {
      console.error(`✗ Error updating ${func}:`, error);
    }
  }
}

main();
