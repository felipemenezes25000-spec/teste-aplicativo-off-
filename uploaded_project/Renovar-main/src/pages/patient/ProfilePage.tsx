import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard, Camera, Save, LogOut, Trash2, Loader2, Bell, BellOff, Send, Search, Shield, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useProfile } from '@/hooks/useProfile';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { validateCPF, validateMinimumAge, formatCPF, formatPhone, formatCEP, fetchAddressByCep } from '@/lib/validators';
import { MobileLayout } from '@/components/layout/MobileLayout';

const getMaxBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().split('T')[0];
};

const cpfValidation = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido. Use o formato 000.000.000-00')
  .refine((cpf) => validateCPF(cpf), { message: 'CPF inválido (dígito verificador incorreto)' })
  .optional()
  .or(z.literal(''));

const birthDateValidation = z.string()
  .refine((date) => !date || validateMinimumAge(date, 18), { 
    message: 'Você deve ter pelo menos 18 anos para usar o app' 
  })
  .optional()
  .or(z.literal(''));

const profileSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  phone: z.string().trim().regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido. Use o formato (00) 00000-0000').optional().or(z.literal('')),
  cpf: cpfValidation,
  birth_date: birthDateValidation,
  street: z.string().trim().max(200, 'Endereço muito longo').optional().or(z.literal('')),
  number: z.string().trim().max(10, 'Número muito longo').optional().or(z.literal('')),
  complement: z.string().trim().max(100, 'Complemento muito longo').optional().or(z.literal('')),
  neighborhood: z.string().trim().max(100, 'Bairro muito longo').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'Cidade muito longa').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Use a sigla do estado (ex: SP)').optional().or(z.literal('')),
  zip_code: z.string().trim().regex(/^\d{5}-?\d{3}$/, 'CEP inválido. Use o formato 00000-000').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const { uploadAvatar, deleteAvatar, isUploading, progress } = useAvatarUpload();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, toggleSubscription, sendTestNotification } = usePushNotifications();
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phone: '',
    cpf: '',
    birth_date: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    if (profile) {
      const address = profile.address as Record<string, string> | null;
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        cpf: profile.cpf || '',
        birth_date: profile.birth_date || '',
        street: address?.street || '',
        number: address?.number || '',
        complement: address?.complement || '',
        neighborhood: address?.neighborhood || '',
        city: address?.city || '',
        state: address?.state || '',
        zip_code: address?.zip_code || '',
      });
    }
  }, [profile]);

  const handleCepLookup = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;
    
    setIsLoadingCep(true);
    setErrors(prev => ({ ...prev, zip_code: '' }));
    
    const data = await fetchAddressByCep(cep);
    
    if (!data) {
      setErrors(prev => ({ ...prev, zip_code: 'CEP não encontrado' }));
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

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') formattedValue = formatPhone(value);
    if (field === 'cpf') formattedValue = formatCPF(value);
    if (field === 'zip_code') formattedValue = formatCEP(value);
    if (field === 'state') formattedValue = value.toUpperCase().slice(0, 2);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    if (field === 'zip_code') {
      const cleanCep = formattedValue.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        handleCepLookup(formattedValue);
      }
    }
  };

  const handleSave = () => {
    const result = profileSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const address = {
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
    };

    updateProfile({
      name: formData.name,
      phone: formData.phone || null,
      cpf: formData.cpf || null,
      birth_date: formData.birth_date || null,
      address,
    });
    
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      setShowAvatarDialog(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadConfirm = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const newUrl = await uploadAvatar(file);
      if (newUrl) {
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        setShowAvatarDialog(false);
        setAvatarPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDeleteAvatar = async () => {
    const success = await deleteAvatar();
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setShowAvatarDialog(false);
      setAvatarPreview(null);
    }
  };

  const handleDialogClose = () => {
    setShowAvatarDialog(false);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Meu Perfil" showBackButton>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title={isEditing ? "Editar Perfil" : "Meu Perfil"} 
      showBackButton
      showNotifications={false}
    >
      <div className="p-4 space-y-6 pb-24">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Settings className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>
            </>
          )}
        </div>

        {/* Avatar Section */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-primary/3 to-transparent overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar 
                  className={`h-28 w-28 border-4 border-background shadow-xl ${isEditing ? 'ring-2 ring-primary/30 active:ring-primary/50 active:scale-[0.98] transition-all duration-150' : ''}`}
                  style={isEditing ? { touchAction: 'manipulation' } : undefined}
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="icon" 
                    className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-lg bg-primary active:bg-primary/90 active:scale-[0.95] transition-all duration-150"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-foreground">{formData.name || 'Usuário'}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {isEditing && (
                <p className="text-xs text-primary mt-2">Toque na foto para alterar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avatar Upload Dialog */}
        <Dialog open={showAvatarDialog} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Foto de Perfil</DialogTitle>
              <DialogDescription>
                Escolha uma nova foto ou remova a atual
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-32 w-32 border-4 border-muted">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Enviando... {progress}%
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="avatar-upload">Selecionar foto</Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {profile?.avatar_url && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteAvatar}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleDialogClose}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUploadConfirm}
                  disabled={isUploading || !avatarPreview}
                  className="flex-1"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Personal Info Card */}
        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-4 w-4 text-primary" />
              </div>
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-mail
              </Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={!isEditing}
                  maxLength={15}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  CPF
                </Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  disabled={!isEditing}
                  maxLength={14}
                  className={errors.cpf ? 'border-destructive' : ''}
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Data de Nascimento
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                max={getMaxBirthDate()}
                disabled={!isEditing}
                className={errors.birth_date ? 'border-destructive' : ''}
              />
              {errors.birth_date && <p className="text-sm text-destructive">{errors.birth_date}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <div className="relative">
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="00000-000"
                  disabled={!isEditing}
                  maxLength={9}
                  className={`pr-10 ${errors.zip_code ? 'border-destructive' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isLoadingCep ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {errors.zip_code && <p className="text-sm text-destructive">{errors.zip_code}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  disabled={!isEditing}
                  className={errors.street ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  disabled={!isEditing}
                  className={errors.number ? 'border-destructive' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  placeholder="Apto, Bloco..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  disabled={!isEditing}
                  className={errors.neighborhood ? 'border-destructive' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!isEditing}
                  className={errors.city ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="SP"
                  disabled={!isEditing}
                  maxLength={2}
                  className={errors.state ? 'border-destructive' : ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        {pushSupported && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                Notificações Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Receber notificações</p>
                  <p className="text-xs text-muted-foreground">
                    {pushSubscribed ? 'Você receberá alertas sobre suas solicitações' : 'Ative para receber atualizações'}
                  </p>
                </div>
                <Switch
                  checked={pushSubscribed}
                  onCheckedChange={toggleSubscription}
                  disabled={pushLoading}
                />
              </div>
              
              {pushSubscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendTestNotification}
                  disabled={pushLoading}
                  className="w-full gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar notificação de teste
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="border border-border/50 shadow-md">
          <CardContent className="p-0">
            <button
              onClick={() => navigate('/terms')}
              className="flex items-center justify-between w-full p-4 active:bg-muted/50 active:scale-[0.98] transition-all duration-150"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium">Termos de Uso</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <Separator />
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center justify-between w-full p-4 active:bg-muted/50 active:scale-[0.98] transition-all duration-150"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium">Política de Privacidade</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 gap-2 border-destructive/30 text-destructive active:bg-destructive/10 active:text-destructive active:scale-[0.98] transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
