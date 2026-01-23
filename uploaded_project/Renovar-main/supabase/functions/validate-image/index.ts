import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Autenticação necessária.",
  INVALID_TOKEN: "Sessão inválida.",
  VALIDATION_FAILED: "Imagem inválida.",
  FILE_TOO_LARGE: "Arquivo muito grande.",
  INVALID_FORMAT: "Formato de arquivo não suportado.",
  NOT_AN_IMAGE: "Arquivo não é uma imagem válida.",
  INTERNAL_ERROR: "Erro ao validar imagem.",
};

const imageSchema = z.object({
  file_path: z.string().min(1),
  bucket: z.enum(["prescription-images", "exam-images"]),
});

// Validate image file by reading first bytes and checking magic numbers
async function validateImageFile(fileData: Uint8Array): Promise<boolean> {
  // Check file signature (magic numbers)
  const signatures: Record<string, number[][]> = {
    jpeg: [[0xff, 0xd8, 0xff]],
    png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    webp: [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  };

  for (const [format, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (fileData.length >= sig.length) {
        const matches = sig.every((byte, i) => fileData[i] === byte);
        if (matches) {
          return true;
        }
      }
    }
  }

  return false;
}

// Calculate SHA-256 hash of file
async function calculateFileHash(fileData: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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

    const parseResult = imageSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { file_path, bucket } = parseResult.data;

    // SECURITY: Verify file path belongs to user
    if (!file_path.startsWith(`${userId}/`)) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_AN_IMAGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Read file as bytes
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check file size (max 10MB)
    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.FILE_TOO_LARGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate it's actually an image/PDF
    const isValidImage = await validateImageFile(bytes);
    if (!isValidImage) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.NOT_AN_IMAGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Calculate hash for integrity verification
    const fileHash = await calculateFileHash(bytes);

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        file_size: bytes.length,
        file_hash: fileHash,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[validate-image] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
