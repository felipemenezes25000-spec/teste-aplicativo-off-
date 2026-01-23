import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Phone, CreditCard, Calendar, MapPin, ChevronRight, ChevronLeft, CheckCircle2, User, Loader2, Search, Shield } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { validateCPF, validateMinimumAge, formatCPF, formatPhone, formatCEP, fetchAddressByCep } from '@/lib/validators';

const getMaxBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
};

const cpfSchema = z.string()
  .min(14, 'CPF deve ter 11 dígitos')
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
  .refine((cpf) => validateCPF(cpf), { message: 'CPF inválido (dígito verificador incorreto)' });

const phoneSchema = z.string()
  .min(14, 'Telefone deve ter 10 ou 11 dígitos')
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido');

const birthDateSchema = z.string()
  .min(1, 'Data de nascimento é obrigatória')
  .refine((date) => validateMinimumAge(date, 18), { 
    message: 'Você deve ter pelo menos 18 anos para usar o app' 
  });

const step1Schema = z.object({
  phone: phoneSchema,
  cpf: cpfSchema,
  birth_date: birthDateSchema,
});

const step2Schema = z.object({
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
});

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isUpdating, isLoading } = useProfile();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    cpf: '',
    birth_date: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    cep: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (profile) {
      const address = profile.address as Record<string, string> || {};
      setFormData({
        phone: profile.phone || '',
        cpf: profile.cpf || '',
        birth_date: profile.birth_date || '',
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        cep: address.cep || '',
        city: address.city || '',
        state: address.state || '',
      });
    }
  }, [profile]);

  const handleCepLookup = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;
    
    setIsLoadingCep(true);
    setErrors(prev => ({ ...prev, cep: '' }));
    
    const data = await fetchAddressByCep(cep);
    
    if (!data) {
      setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
      setIsLoadingCep(false);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      street: data.logradouro || prev.street,
      neighborhood: data.bairro || prev.neighborhood,
      city: data.localidade || prev.city,
      state: data.uf || prev.state,
      complement: data.complemento || prev.complement,
    }));
    
    toast.success('Endereço encontrado!');
    setIsLoadingCep(false);
    
    setTimeout(() => {
      document.getElementById('number')?.focus();
    }, 100);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') formattedValue = formatPhone(value);
    if (field === 'cpf') formattedValue = formatCPF(value);
    if (field === 'cep') formattedValue = formatCEP(value);
    if (field === 'state') formattedValue = value.toUpperCase().slice(0, 2);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    
    if (field === 'cep') {
      const cleanCep = formattedValue.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        handleCepLookup(formattedValue);
      }
    }
  };

  const validateStep1 = () => {
    try {
      step1Schema.parse({
        phone: formData.phone,
        cpf: formData.cpf,
        birth_date: formData.birth_date,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateStep2 = () => {
    try {
      step2Schema.parse({
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        cep: formData.cep,
        city: formData.city,
        state: formData.state,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    updateProfile({
      phone: formData.phone,
      cpf: formData.cpf,
      birth_date: formData.birth_date,
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        cep: formData.cep,
        city: formData.city,
        state: formData.state,
      },
    }, {
      onSuccess: () => {
        toast.success('Perfil completado com sucesso!');
        navigate('/dashboard');
      },
    });
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const progress = step === 1 ? 50 : 100;

  return (
    <MobileLayout>
      <div className="p-4 space-y-6 pb-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Complete seu Perfil</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Precisamos de algumas informações para continuar
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Dados Pessoais
              </span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-muted rounded">
              <div 
                className="h-full bg-primary rounded transition-all duration-300" 
                style={{ width: step > 1 ? '100%' : '0%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Endereço
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1 - Personal Data */}
        {step === 1 && (
          <Card className="border border-border/50 shadow-lg animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {profile?.name && (
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-xl border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    Olá, <span className="font-semibold text-foreground">{profile.name}</span>! 👋
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete seus dados para acessar todos os serviços
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`h-12 ${errors.phone ? 'border-destructive' : ''}`}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className={`h-12 ${errors.cpf ? 'border-destructive' : ''}`}
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive">{errors.cpf}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Data de Nascimento *
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  max={getMaxBirthDate()}
                  className={`h-12 ${errors.birth_date ? 'border-destructive' : ''}`}
                />
                {errors.birth_date ? (
                  <p className="text-xs text-destructive">{errors.birth_date}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Você deve ter pelo menos 18 anos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - Address */}
        {step === 2 && (
          <Card className="border border-border/50 shadow-lg animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cep" className="text-sm">CEP *</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    className={`h-12 pr-10 ${errors.cep ? 'border-destructive' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLoadingCep ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {errors.cep ? (
                  <p className="text-xs text-destructive">{errors.cep}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Digite o CEP para preencher automaticamente
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street" className="text-sm">Rua/Avenida *</Label>
                  <Input
                    id="street"
                    placeholder="Nome da rua"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className={`h-12 ${errors.street ? 'border-destructive' : ''}`}
                  />
                  {errors.street && (
                    <p className="text-xs text-destructive">{errors.street}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-sm">Número *</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className={`h-12 ${errors.number ? 'border-destructive' : ''}`}
                  />
                  {errors.number && (
                    <p className="text-xs text-destructive">{errors.number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="complement" className="text-sm">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apto, Bloco..."
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-sm">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Nome do bairro"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className={`h-12 ${errors.neighborhood ? 'border-destructive' : ''}`}
                  />
                  {errors.neighborhood && (
                    <p className="text-xs text-destructive">{errors.neighborhood}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city" className="text-sm">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`h-12 ${errors.city ? 'border-destructive' : ''}`}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm">UF *</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`h-12 ${errors.state ? 'border-destructive' : ''}`}
                    maxLength={2}
                  />
                  {errors.state && (
                    <p className="text-xs text-destructive">{errors.state}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-14 rounded-xl font-medium"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isUpdating}
            className="flex-1 h-14 rounded-xl font-medium bg-primary hover:bg-primary/90 shadow-lg"
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 2 ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Finalizar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Seus dados estão protegidos e criptografados</span>
        </div>
      </div>
    </MobileLayout>
  );
}
