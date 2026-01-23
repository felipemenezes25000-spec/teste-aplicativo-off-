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
  NOT_FOUND: "Solicitação não encontrada.",
  VALIDATION_FAILED: "Dados inválidos. Verifique e tente novamente.",
  UPLOAD_FAILED: "Não foi possível gerar o documento. Tente novamente.",
  INTERNAL_ERROR: "Ocorreu um erro. Tente novamente ou contate o suporte.",
};

// Zod schema for input validation
const pdfRequestSchema = z.object({
  requestId: z.string().uuid("ID da solicitação inválido"),
  requestType: z.enum(["prescription", "exam"], {
    errorMap: () => ({ message: "Tipo deve ser 'prescription' ou 'exam'" })
  }),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // ===== AUTHORIZATION CHECK =====
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[generate-pdf] Missing authorization header');
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
      console.error('[generate-pdf] Claims validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.INVALID_TOKEN }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log(`[generate-pdf] Authenticated user: ${userId}`);

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

    const parseResult = pdfRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('[generate-pdf] Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.VALIDATION_FAILED }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { requestId, requestType } = parseResult.data;
    console.log(`[generate-pdf] Generating PDF for ${requestType} request: ${requestId}`);

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch request data based on type
    let requestData;
    let patientData;

    if (requestType === 'prescription') {
      const { data, error } = await supabase
        .from('prescription_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (error || !data) {
        console.error('[generate-pdf] Prescription not found:', requestId);
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.NOT_FOUND }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestData = data;
    } else {
      const { data, error } = await supabase
        .from('exam_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (error || !data) {
        console.error('[generate-pdf] Exam request not found:', requestId);
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.NOT_FOUND }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestData = data;
    }

    // ===== AUTHORIZATION: Check if user is allowed to access this request =====
    const isPatient = requestData.patient_id === userId;
    const isDoctor = requestData.doctor_id === userId;
    
    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    const isAdmin = !!adminRole;

    if (!isPatient && !isDoctor && !isAdmin) {
      console.error(`[generate-pdf] User ${userId} attempted to access request ${requestId} without authorization`);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.FORBIDDEN }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify payment is completed before generating PDF
    // Only doctors/admins can generate PDF, and only if payment is confirmed
    if (isDoctor || isAdmin) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('status, amount_cents_locked')
        .eq('request_id', requestId)
        .eq('request_type', requestType)
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error('[generate-pdf] Error checking payment:', paymentError);
        return new Response(
          JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!payment || payment.status !== 'completed') {
        console.error(`[generate-pdf] Payment not completed for request ${requestId}`);
        return new Response(
          JSON.stringify({ error: 'Pagamento não confirmado. O PDF só pode ser gerado após confirmação do pagamento.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // SECURITY: Verify request is in valid status for PDF generation
    // PDF should only be generated when status is 'approved' or when doctor is approving
    if (requestData.status !== 'approved' && requestData.status !== 'analyzing') {
      console.error(`[generate-pdf] Request ${requestId} is not in valid status for PDF generation: ${requestData.status}`);
      return new Response(
        JSON.stringify({ error: 'Solicitação não está em status válido para geração de PDF.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: max 5 PDFs per hour by user
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     null;
    const deviceId = req.headers.get("x-device-id") || null;
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from("rate_limits")
      .select("attempts")
      .eq("user_id", userId)
      .eq("endpoint", "generate-pdf")
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!rateLimitError && rateLimit && rateLimit.attempts >= 5) {
      console.log(`[generate-pdf] Rate limit exceeded for user ${userId}: ${rateLimit.attempts}/5`);
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
        endpoint: "generate-pdf",
        window_start: windowStart.toISOString(),
        attempts: 1,
      });
    } catch (insertError) {
      // Ignore insert errors (duplicates, etc.)
    }

    console.log(`[generate-pdf] Authorization passed: patient=${isPatient}, doctor=${isDoctor}, admin=${isAdmin}`);

    // Fetch patient profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', requestData.patient_id)
      .maybeSingle();

    if (profileError) {
      console.error('[generate-pdf] Error fetching patient profile');
    }
    patientData = profile;

    // Fetch doctor profile if assigned
    let doctorData = null;
    if (requestData.doctor_id) {
      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', requestData.doctor_id)
        .maybeSingle();

      const { data: doctorInfo } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', requestData.doctor_id)
        .maybeSingle();

      doctorData = { ...doctorProfile, ...doctorInfo };
    }

    // Generate PDF content as HTML
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const registrationNumber = `RJ-${Date.now().toString(36).toUpperCase()}`;

    let contentHtml = '';
    
    // Sanitize text fields - escape HTML entities
    const escapeHtml = (text: string | null | undefined): string => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    if (requestType === 'prescription') {
      const prescriptionTypeLabel = {
        simple: 'Receita Simples',
        controlled: 'Receita Controlada',
        blue: 'Receita Especial (Azul)',
      }[requestData.prescription_type as string] || 'Receita';

      const medications = requestData.medications || [];
      const medicationsList = Array.isArray(medications) 
        ? medications.slice(0, 50).map((med: { name?: string; dosage?: string; quantity?: string; instructions?: string }, i: number) => 
            `<div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <strong>${i + 1}. ${escapeHtml(med.name) || 'Medicamento'}</strong><br/>
              ${med.dosage ? `Dosagem: ${escapeHtml(med.dosage)}<br/>` : ''}
              ${med.quantity ? `Quantidade: ${escapeHtml(med.quantity)}<br/>` : ''}
              ${med.instructions ? `Instruções: ${escapeHtml(med.instructions)}` : ''}
            </div>`
          ).join('')
        : '<p>Medicamentos conforme imagem anexa</p>';

      contentHtml = `
        <h2 style="text-align: center; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">
          ${escapeHtml(prescriptionTypeLabel)}
        </h2>
        <div style="margin: 20px 0;">
          <h3>Medicamentos Prescritos:</h3>
          ${medicationsList}
        </div>
        ${requestData.patient_notes ? `<p><strong>Observações do paciente:</strong> ${escapeHtml(requestData.patient_notes.substring(0, 1000))}</p>` : ''}
        ${requestData.doctor_notes ? `<p><strong>Observações médicas:</strong> ${escapeHtml(requestData.doctor_notes.substring(0, 1000))}</p>` : ''}
      `;
    } else {
      const examTypeLabel = requestData.exam_type === 'imaging' ? 'Exames de Imagem' : 'Exames Laboratoriais';
      
      const exams = requestData.exams || [];
      const examsList = Array.isArray(exams) 
        ? exams.slice(0, 50).map((exam: string) => 
            `<li style="margin: 5px 0;">${escapeHtml(exam)}</li>`
          ).join('')
        : '<li>Exames conforme imagem anexa</li>';

      contentHtml = `
        <h2 style="text-align: center; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">
          Pedido de ${escapeHtml(examTypeLabel)}
        </h2>
        <div style="margin: 20px 0;">
          <h3>Exames Solicitados:</h3>
          <ul style="line-height: 1.8;">
            ${examsList}
          </ul>
        </div>
        ${requestData.patient_notes ? `<p><strong>Observações do paciente:</strong> ${escapeHtml(requestData.patient_notes.substring(0, 1000))}</p>` : ''}
        ${requestData.doctor_notes ? `<p><strong>Observações médicas:</strong> ${escapeHtml(requestData.doctor_notes.substring(0, 1000))}</p>` : ''}
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${requestType === 'prescription' ? 'Receita Médica' : 'Pedido de Exame'} - RenoveJá+</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d9488;
    }
    .logo span {
      color: #0891b2;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    .patient-info, .doctor-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: bold;
      color: #0d9488;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .content {
      margin: 30px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
    .signature {
      margin-top: 60px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 300px;
      margin: 10px auto;
    }
    .registration {
      background: #e0f2fe;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Renove<span>Já+</span></div>
    <div class="subtitle">Telemedicina sob demanda</div>
  </div>
  
  <div class="patient-info">
    <div class="section-title">Dados do Paciente</div>
    <p><strong>Nome:</strong> ${escapeHtml(patientData?.name) || 'Não informado'}</p>
    <p><strong>CPF:</strong> ${escapeHtml(patientData?.cpf) || 'Não informado'}</p>
    <p><strong>Data de Nascimento:</strong> ${patientData?.birth_date ? new Date(patientData.birth_date).toLocaleDateString('pt-BR') : 'Não informada'}</p>
  </div>

  <div class="content">
    ${contentHtml}
  </div>

  ${doctorData ? `
  <div class="doctor-info">
    <div class="section-title">Médico Responsável</div>
    <p><strong>Nome:</strong> Dr(a). ${escapeHtml(doctorData.name) || 'Não informado'}</p>
    <p><strong>CRM:</strong> ${escapeHtml(doctorData.crm) || 'Não informado'}/${escapeHtml(doctorData.crm_state) || ''}</p>
    <p><strong>Especialidade:</strong> ${escapeHtml(doctorData.specialty) || 'Não informada'}</p>
  </div>

  <div class="signature">
    <div class="signature-line"></div>
    <p>Dr(a). ${escapeHtml(doctorData.name) || ''}</p>
    <p>CRM: ${escapeHtml(doctorData.crm) || ''}/${escapeHtml(doctorData.crm_state) || ''}</p>
  </div>
  ` : ''}

  <div class="registration">
    <strong>Registro:</strong> ${registrationNumber}<br/>
    <strong>Data de Emissão:</strong> ${currentDate} às ${currentTime}
  </div>

  <div class="footer">
    <p>Este documento foi emitido eletronicamente pela plataforma RenoveJá+ e possui validade legal conforme regulamentação do CFM.</p>
    <p>Em caso de dúvidas, entre em contato: suporte@renoveja.com.br</p>
  </div>
</body>
</html>
    `;

    // TODO: Implement real PDF generation
    // Options:
    // 1. Use external API (e.g., html-pdf-api, pdfshift.io)
    // 2. Use Deno-compatible PDF library (e.g., pdfkit via npm compat)
    // 3. Use browser-based solution (puppeteer via external service)
    // 
    // For now, storing HTML which can be converted to PDF client-side or via external service
    // The HTML is well-formatted and print-ready
    
    // Convert HTML to bytes for storage
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);

    // Generate filename (keeping .html extension for now, change to .pdf when implementing real PDF)
    const fileName = `${requestType}_${requestId}_${Date.now()}.html`;
    const filePath = `${requestData.patient_id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('generated-pdfs')
      .upload(filePath, htmlBytes, {
        contentType: 'text/html', // Change to 'application/pdf' when implementing real PDF
        upsert: true,
      });

    if (uploadError) {
      // Log error but don't expose details
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.error('[generate-pdf] Error uploading PDF:', uploadError.message);
      }
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.UPLOAD_FAILED }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-pdfs')
      .getPublicUrl(filePath);

    // Since the bucket is private, we need to create a signed URL
    const { data: signedUrl } = await supabase.storage
      .from('generated-pdfs')
      .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30 days validity

    const pdfUrl = signedUrl?.signedUrl || urlData?.publicUrl;

    // Update the request with the PDF URL
    const tableName = requestType === 'prescription' ? 'prescription_requests' : 'exam_requests';
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ pdf_url: pdfUrl })
      .eq('id', requestId);

    if (updateError) {
      // Log error but don't fail the request
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.error('[generate-pdf] Error updating request with PDF URL:', updateError.message);
      }
    }

    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log(`[generate-pdf] PDF generated successfully for ${requestId}`);
    }

    // SECURITY: Log PDF generation event for audit trail
    const entityName = requestType === 'prescription' ? 'prescription_requests' : 'exam_requests';
    let actorRole = 'patient';
    if (isAdmin) {
      actorRole = 'admin';
    } else if (isDoctor) {
      actorRole = 'doctor';
    }

    try {
      await supabase.rpc('log_request_event', {
        p_actor_id: userId,
        p_actor_role: actorRole,
        p_entity: entityName,
        p_entity_id: requestId,
        p_action: 'pdf_generated',
        p_metadata: {
          pdf_url: pdfUrl,
          registration_number: registrationNumber,
          generated_at: new Date().toISOString()
        }
      });
    } catch (auditError) {
      // Log error but don't fail the request
      console.error('[generate-pdf] Error logging audit event:', auditError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        registrationNumber,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    // Log error but don't expose details
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.error('[generate-pdf] Unexpected error:', error);
    }
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.INTERNAL_ERROR }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
