import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, FileText, Stethoscope, ArrowLeft, Eye, EyeOff, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const specialties = [
  'Clínico Geral',
  'Cardiologista',
  'Dermatologista',
  'Endocrinologista',
  'Gastroenterologista',
  'Ginecologista',
  'Neurologista',
  'Oftalmologista',
  'Ortopedista',
  'Pediatra',
  'Psiquiatra',
  'Urologista',
];

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface CrmValidationResult {
  valid: boolean;
  error?: string;
  doctorName?: string;
  situation?: string;
  specialties?: string[];
  hint?: string;
}

export default function DoctorRegisterPage() {
  const navigate = useNavigate();
  const { registerDoctor, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [documentUploaded, setDocumentUploaded] = useState(false);
  
  // CRM validation state
  const [crmValidation, setCrmValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message?: string;
    doctorName?: string;
  }>({ status: 'idle' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    crm: '',
    crmState: '',
    specialty: '',
    bio: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset CRM validation when relevant fields change
    if (field === 'crm' || field === 'crmState' || field === 'name') {
      setCrmValidation({ status: 'idle' });
    }
  };

  const validateCRM = async () => {
    if (!formData.crm || !formData.crmState || !formData.name) {
      toast.error('Preencha o nome, CRM e UF antes de validar');
      return false;
    }

    setCrmValidation({ status: 'validating' });

    try {
      const { data, error } = await supabase.functions.invoke('validate-crm', {
        body: {
          crm: formData.crm,
          uf: formData.crmState,
          name: formData.name,
        },
      });

      if (error) {
        logger.error('CRM validation error', error, {
          component: 'DoctorRegisterPage',
          action: 'validateCRM',
          crm: formData.crm,
        });
        setCrmValidation({ 
          status: 'invalid', 
          message: 'Erro ao validar CRM. Tente novamente.' 
        });
        return false;
      }

      const result = data as CrmValidationResult;

      if (result.valid) {
        setCrmValidation({ 
          status: 'valid', 
          message: 'CRM validado com sucesso!',
          doctorName: result.doctorName 
        });
        toast.success('CRM validado com sucesso!');
        return true;
      } else {
        setCrmValidation({ 
          status: 'invalid', 
          message: result.error || 'CRM inválido',
          doctorName: result.doctorName
        });
        if (result.hint) {
          toast.error(result.error, { description: result.hint });
        } else {
          toast.error(result.error || 'CRM inválido');
        }
        return false;
      }
    } catch (err) {
      logger.error('CRM validation error', err, {
        component: 'DoctorRegisterPage',
        action: 'validateCRM',
        crm: formData.crm,
      });
      setCrmValidation({ 
        status: 'invalid', 
        message: 'Erro ao conectar com o serviço de validação' 
      });
      return false;
    }
  };

  const handleContinue = async () => {
    // Validate CRM before proceeding to step 2
    if (crmValidation.status !== 'valid') {
      const isValid = await validateCRM();
      if (!isValid) return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check CRM validation
    if (crmValidation.status !== 'valid') {
      toast.error('Por favor, valide o CRM antes de continuar');
      return;
    }
    
    setIsLoading(true);

    const result = await registerDoctor({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      crm: formData.crm,
      crmState: formData.crmState,
      specialty: formData.specialty,
    });
    
    if (!result.error) {
      navigate('/doctor');
    }
    
    setIsLoading(false);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const canProceedToStep2 = formData.name && formData.crm && formData.crmState && formData.specialty;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-health-blue-light via-white to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Logo size="sm" />
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Cadastro Médico - Passo {step} de 2
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-8">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal & Professional Info */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-2xl font-display font-bold mb-6">Dados Profissionais</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Dr. João da Silva"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o nome exatamente como consta no registro do CRM
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CRM *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="12345"
                      value={formData.crm}
                      onChange={(e) => updateField('crm', e.target.value.replace(/\D/g, '').substring(0, 7))}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">UF do CRM *</label>
                  <Select value={formData.crmState} onValueChange={(value) => updateField('crmState', value)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CRM Validation Status */}
              {crmValidation.status !== 'idle' && (
                <div className={`p-3 rounded-xl flex items-start gap-3 ${
                  crmValidation.status === 'validating' ? 'bg-muted' :
                  crmValidation.status === 'valid' ? 'bg-health-green/10 border border-health-green/30' :
                  'bg-destructive/10 border border-destructive/30'
                }`}>
                  {crmValidation.status === 'validating' && (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mt-0.5" />
                  )}
                  {crmValidation.status === 'valid' && (
                    <CheckCircle className="w-5 h-5 text-health-green mt-0.5" />
                  )}
                  {crmValidation.status === 'invalid' && (
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      crmValidation.status === 'valid' ? 'text-health-green' :
                      crmValidation.status === 'invalid' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {crmValidation.status === 'validating' ? 'Validando CRM...' : crmValidation.message}
                    </p>
                    {crmValidation.doctorName && crmValidation.status === 'valid' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Registrado como: {crmValidation.doctorName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Validate CRM Button */}
              {formData.name && formData.crm && formData.crmState && crmValidation.status !== 'valid' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateCRM}
                  disabled={crmValidation.status === 'validating'}
                  className="w-full h-10 rounded-xl"
                >
                  {crmValidation.status === 'validating' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validando...
                    </div>
                  ) : (
                    'Validar CRM no CFM'
                  )}
                </Button>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidade *</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Select value={formData.specialty} onValueChange={(value) => updateField('specialty', value)}>
                    <SelectTrigger className="h-12 rounded-xl pl-10">
                      <SelectValue placeholder="Selecione sua especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((spec) => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio (opcional)</label>
                <Textarea
                  placeholder="Conte um pouco sobre sua experiência..."
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Documento CRM</label>
                <button
                  type="button"
                  onClick={() => setDocumentUploaded(true)}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                    documentUploaded
                      ? 'border-health-green bg-health-green/5 text-health-green'
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">
                    {documentUploaded ? 'Documento enviado ✓' : 'Enviar foto do CRM'}
                  </span>
                </button>
              </div>

              <Button
                type="button"
                onClick={handleContinue}
                disabled={!canProceedToStep2 || crmValidation.status === 'validating'}
                className="w-full h-12 rounded-xl text-base font-semibold mt-6"
              >
                {crmValidation.status === 'validating' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validando CRM...
                  </div>
                ) : crmValidation.status !== 'valid' ? (
                  'Validar e Continuar'
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Account */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <h2 className="text-2xl font-display font-bold mb-6">Criar Conta</h2>

              {/* Show validated doctor info */}
              {crmValidation.doctorName && (
                <div className="p-3 rounded-xl bg-health-green/10 border border-health-green/30 flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-health-green" />
                  <div>
                    <p className="text-sm font-medium text-health-green">CRM Validado</p>
                    <p className="text-xs text-muted-foreground">{crmValidation.doctorName}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail profissional</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="medico@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 py-4">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  Li e aceito os{' '}
                  <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !acceptedTerms}
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </div>
                ) : (
                  'Criar conta médica'
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
