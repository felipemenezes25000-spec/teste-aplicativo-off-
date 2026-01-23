import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Calendar, CreditCard, ArrowLeft, Eye, EyeOff, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { validateCPF, validateMinimumAge } from '@/lib/validators';

// Get today's date for max date validation
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Get max birth date (must be at least 18 years old)
const getMaxBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
};

// Validation schemas
const cpfSchema = z.string()
  .min(11, 'CPF deve ter 11 dígitos')
  .max(14, 'CPF inválido')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    return validateCPF(val);
  }, 'CPF inválido (dígito verificador incorreto)');

const phoneSchema = z.string()
  .min(10, 'Telefone deve ter pelo menos 10 dígitos')
  .max(15, 'Telefone inválido')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }, 'Telefone inválido');

const birthDateSchema = z.string()
  .min(1, 'Data de nascimento é obrigatória')
  .refine((val) => {
    const date = new Date(val);
    const today = new Date();
    return date <= today;
  }, 'Data de nascimento não pode ser no futuro')
  .refine((val) => validateMinimumAge(val, 18), 'Você deve ter pelo menos 18 anos para usar o app');

const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo');

const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .refine((val) => /^[a-zA-ZÀ-ÿ\s]+$/.test(val.trim()), 'Nome deve conter apenas letras');

const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa');

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birthDate: '',
    phone: '',
    email: '',
    password: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    try {
      nameSchema.parse(formData.name);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    try {
      cpfSchema.parse(formData.cpf);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    try {
      phoneSchema.parse(formData.phone);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    // Validate birth date
    try {
      birthDateSchema.parse(formData.birthDate);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    return true;
  };

  const validateStep3 = () => {
    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return false;
      }
    }
    
    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos de uso');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) return;

    setIsLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      cpf: formData.cpf.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
      birthDate: formData.birthDate,
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode.replace(/\D/g, ''),
      },
    });
    
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success('Conta criada! Verifique seu email para confirmar.');
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-health-blue/5 via-background to-health-green/5 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-health-blue/5 via-background to-health-green/5 flex flex-col">
      {/* Premium Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} 
            className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm shadow-soft flex items-center justify-center hover:bg-white transition-all duration-300 border border-border/50"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Logo size="sm" />
          <div className="w-12" />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className="flex-1 relative">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      s < step ? 'w-full bg-gradient-to-r from-primary to-health-green' 
                      : s === step ? 'w-1/2 bg-gradient-to-r from-primary to-primary/50' 
                      : 'w-0'
                    }`}
                  />
                </div>
              </div>
              {i < 2 && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 text-xs font-bold transition-all duration-300 ${
                  s < step ? 'bg-health-green text-white shadow-lg' 
                  : s === step ? 'bg-primary text-white shadow-lg animate-pulse-soft' 
                  : 'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3">
          <span className={`text-xs font-medium ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>Dados Pessoais</span>
          <span className={`text-xs font-medium ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>Endereço</span>
          <span className={`text-xs font-medium ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>Conta</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 px-6 pb-8">
        <div className="premium-card p-6 animate-slide-up">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-shake flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">!</span>
                </div>
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-health-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Dados Pessoais</h2>
                  <p className="text-muted-foreground mt-1">Informe seus dados para criar sua conta</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Nome completo
                  </label>
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    CPF
                  </label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => updateField('cpf', formatCPF(e.target.value))}
                    className="input-premium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Data de nascimento
                  </label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField('birthDate', e.target.value)}
                    max={getMaxBirthDate()}
                    className="input-premium"
                  />
                  <p className="text-xs text-muted-foreground pl-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Você deve ter pelo menos 18 anos
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Telefone
                  </label>
                  <Input
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                    className="input-premium"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-14 rounded-2xl text-base font-bold mt-8 bg-gradient-to-r from-primary to-health-blue hover:opacity-95 transition-all duration-300 shadow-lg shadow-primary/30"
                >
                  Continuar
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-health-green to-health-teal rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Endereço</h2>
                  <p className="text-muted-foreground mt-1">Onde podemos te encontrar?</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    CEP
                  </label>
                  <Input
                    placeholder="00000-000"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', formatCEP(e.target.value))}
                    className="input-premium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-foreground">Rua</label>
                    <Input
                      placeholder="Nome da rua"
                      value={formData.street}
                      onChange={(e) => updateField('street', e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Nº</label>
                    <Input
                      placeholder="123"
                      value={formData.number}
                      onChange={(e) => updateField('number', e.target.value)}
                      className="input-premium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Complemento (opcional)</label>
                  <Input
                    placeholder="Apto, bloco, etc."
                    value={formData.complement}
                    onChange={(e) => updateField('complement', e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Bairro</label>
                  <Input
                    placeholder="Nome do bairro"
                    value={formData.neighborhood}
                    onChange={(e) => updateField('neighborhood', e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-foreground">Cidade</label>
                    <Input
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">UF</label>
                    <Input
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value.toUpperCase().substring(0, 2))}
                      className="input-premium"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full h-14 rounded-2xl text-base font-bold mt-8 bg-gradient-to-r from-health-green to-health-teal hover:opacity-95 transition-all duration-300 shadow-lg shadow-health-green/30"
                >
                  Continuar
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </div>
            )}

            {/* Step 3: Account */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-health-purple to-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Criar Conta</h2>
                  <p className="text-muted-foreground mt-1">Defina suas credenciais de acesso</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    E-mail
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="input-premium"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="input-premium pr-12"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength >= level
                                ? level <= 1 ? 'bg-health-red'
                                : level <= 2 ? 'bg-health-orange'
                                : level <= 3 ? 'bg-health-yellow'
                                : 'bg-health-green'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        passwordStrength <= 1 ? 'text-health-red'
                        : passwordStrength <= 2 ? 'text-health-orange'
                        : passwordStrength <= 3 ? 'text-health-yellow'
                        : 'text-health-green'
                      }`}>
                        {passwordStrength <= 1 ? 'Senha fraca' 
                        : passwordStrength <= 2 ? 'Senha razoável'
                        : passwordStrength <= 3 ? 'Senha boa'
                        : 'Senha forte'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-1 border-2"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                      Li e concordo com os{' '}
                      <Link to="/terms" className="text-primary font-semibold hover:underline">
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link to="/privacy" className="text-primary font-semibold hover:underline">
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !acceptedTerms}
                  className="w-full h-14 rounded-2xl text-base font-bold mt-4 bg-gradient-to-r from-health-green to-health-teal hover:opacity-95 transition-all duration-300 shadow-lg shadow-health-green/30 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Criar minha conta
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
