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
  VALIDATION_FAILED: "Dados inválidos. Verifique CRM, UF e nome.",
  NOT_CONFIGURED: "Serviço de validação indisponível.",
  RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos.",
  CRM_NOT_FOUND: "CRM não encontrado ou inativo.",
  NAME_MISMATCH: "Dados não correspondem ao registro.",
  INTERNAL_ERROR: "Erro ao validar CRM. Tente novamente.",
};

// Brazilian states
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

// Zod schema for input validation
const crmValidationSchema = z.object({
  crm: z.string()
    .min(1, "CRM é obrigatório")
    .max(20, "CRM inválido")
    .regex(/^\d+$/, "CRM deve conter apenas números"),
  uf: z.string()
    .length(2, "UF deve ter 2 caracteres")
    .refine(val => BRAZILIAN_STATES.includes(val.toUpperCase()), "UF inválida"),
  name: z.string()
    .min(3, "Nome muito curto")
    .max(200, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome contém caracteres inválidos"),
});

interface InfosimplesResponse {
  code: number;
  code_message: string;
  data: Array<{
    nome: string;
    situacao: string;
    inscricao: string;
    uf: string;
    especialidade_lista?: string[];
    inscricao_tipo?: string;
  }>;
}

// Rate limiting check using database
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  // Simple in-memory approach using a separate tracking mechanism
  // For now, we'll allow the request but could be enhanced with a rate_limits table
  // This is a basic implementation - production should use Redis or a dedicated table
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    console.log(`[validate-crm] Rate limit check for user: ${userId}`);
  }
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: With verify_jwt = true, JWT is pre-validated by Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] No authorization header provided');
      }
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.UNAUTHORIZED }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const authToken = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authToken);
    
    if (claimsError || !claimsData?.claims?.sub) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] Claims validation failed:', claimsError?.message);
      }
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.INVALID_TOKEN }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[validate-crm] CRM validation request from user:', userId);
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parseResult = crmValidationSchema.safeParse(body);
    if (!parseResult.success) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] Validation failed:', parseResult.error.errors);
      }
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { crm, uf, name } = parseResult.data;

    const apiToken = Deno.env.get('INFOSIMPLES_API_TOKEN');
    if (!apiToken) {
      // Always log configuration errors
      console.error('[validate-crm] INFOSIMPLES_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.NOT_CONFIGURED }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`[validate-crm] Validating CRM ${crm}/${uf.toUpperCase()}`);
    }

    // Call Infosimples API
    const apiUrl = `https://api.infosimples.com/api/v2/consultas/cfm/cadastro?token=${apiToken}&inscricao=${encodeURIComponent(crm)}&uf=${encodeURIComponent(uf.toUpperCase())}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[validate-crm] Infosimples API error:', response.status);
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: InfosimplesResponse = await response.json();
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[validate-crm] API response code:', data.code);
    }

    // Check API response code
    if (data.code !== 200) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] CRM not found or error:', data.code);
      }
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.CRM_NOT_FOUND }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if we have data
    if (!data.data || data.data.length === 0) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] No data returned for CRM');
      }
      return new Response(
        JSON.stringify({ valid: false, error: ERROR_MESSAGES.CRM_NOT_FOUND }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const doctorData = data.data[0];

    // Check if CRM is active
    const situacao = doctorData.situacao?.toLowerCase() || '';
    if (!situacao.includes('ativo') && !situacao.includes('regular')) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] CRM not active:', doctorData.situacao);
      }
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: ERROR_MESSAGES.CRM_NOT_FOUND,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate name match (normalize and compare)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z\s]/g, '') // Remove non-letters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    const providedName = normalizeString(name);
    const registeredName = normalizeString(doctorData.nome || '');

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[validate-crm] Comparing names');
    }

    // Check if the provided name matches (at least first and last name)
    const providedParts = providedName.split(' ').filter(p => p.length > 2);
    const registeredParts = registeredName.split(' ').filter(p => p.length > 2);

    // At least the first name and one other name part should match
    let matchCount = 0;
    for (const part of providedParts) {
      if (registeredParts.includes(part)) {
        matchCount++;
      }
    }

    const nameMatches = matchCount >= 2 || (providedParts.length === 1 && matchCount === 1);

    if (!nameMatches) {
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('[validate-crm] Name mismatch');
      }
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: ERROR_MESSAGES.NAME_MISMATCH,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All validations passed
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('[validate-crm] CRM validation successful');
    }
    return new Response(
      JSON.stringify({ 
        valid: true,
        doctorName: doctorData.nome,
        situation: doctorData.situacao,
        specialties: doctorData.especialidade_lista || [],
        registrationType: doctorData.inscricao_tipo
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Always log errors for debugging
    console.error('[validate-crm] Unexpected error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
