import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Stethoscope, 
  Mail,
  Star,
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { errorHandler } from '@/lib/errorHandler';

interface DoctorInfo {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string | null;
  available: boolean;
  rating: number | null;
  total_consultations: number | null;
  created_at: string;
  profile?: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export default function DoctorsManagement() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean; doctor?: DoctorInfo; action?: 'activate' | 'deactivate'}>({open: false});
  const itemsPerPage = 20;

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredDoctors(
        doctors.filter(d => 
          d.profile?.name.toLowerCase().includes(query) ||
          d.profile?.email.toLowerCase().includes(query) ||
          d.crm.toLowerCase().includes(query) ||
          d.specialty.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredDoctors(doctors);
    }
    setPage(1);
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      
      const { data: doctorProfiles, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for doctors
      const userIds = doctorProfiles?.map(d => d.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const doctorsWithProfiles = doctorProfiles?.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id)
      })) || [];

      setDoctors(doctorsWithProfiles);
      setFilteredDoctors(doctorsWithProfiles);
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'DoctorsManagement',
        action: 'fetchDoctors',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDoctorAvailability = async (doctor: DoctorInfo, available: boolean) => {
    try {
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ available })
        .eq('id', doctor.id);

      if (error) throw error;

      setDoctors(prev => prev.map(d => 
        d.id === doctor.id ? { ...d, available } : d
      ));
      
      toast.success(available ? 'Médico ativado' : 'Médico desativado');
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'DoctorsManagement',
        action: 'toggleDoctorAvailability',
        doctorId: doctor.id,
      });
    }
  };

  const handleToggle = (doctor: DoctorInfo, newValue: boolean) => {
    setConfirmDialog({
      open: true,
      doctor,
      action: newValue ? 'activate' : 'deactivate'
    });
  };

  const confirmToggle = () => {
    if (confirmDialog.doctor && confirmDialog.action) {
      toggleDoctorAvailability(
        confirmDialog.doctor, 
        confirmDialog.action === 'activate'
      );
    }
    setConfirmDialog({open: false});
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const paginatedDoctors = filteredDoctors.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-health-blue px-6 pt-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Logo size="sm" />
          <Button
            onClick={fetchDoctors}
            variant="ghost"
            size="icon"
            className="rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Gerenciar Médicos</h1>
        <p className="text-white/70 text-sm mt-1">Visualize e gerencie os médicos cadastrados</p>
      </div>

      <div className="flex-1 px-6 pb-24 -mt-4 space-y-4 overflow-y-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar por nome, CRM ou especialidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-white border-0 shadow-card"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm bg-white rounded-2xl p-4 shadow-card">
          <div className="flex gap-4">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredDoctors.length}</span> médicos
            </span>
            <span className="text-health-green">
              <span className="font-semibold">{filteredDoctors.filter(d => d.available).length}</span> ativos
            </span>
          </div>
          {totalPages > 1 && (
            <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          )}
        </div>

        {/* Doctors List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedDoctors.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'Nenhum médico encontrado' : 'Nenhum médico cadastrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedDoctors.map((doctor, index) => (
              <Card 
                key={doctor.id} 
                className="border-0 shadow-card hover:shadow-lg transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 rounded-2xl">
                      <AvatarImage src={doctor.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-health-green/10 text-health-green rounded-2xl text-lg font-bold">
                        {getInitials(doctor.profile?.name || 'Dr')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          Dr(a). {doctor.profile?.name}
                        </p>
                        {doctor.available ? (
                          <CheckCircle className="w-4 h-4 text-health-green flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        CRM: {doctor.crm}/{doctor.crm_state}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                          {doctor.specialty}
                        </Badge>
                        {doctor.rating && (
                          <span className="text-xs flex items-center gap-1 text-health-orange">
                            <Star className="w-3 h-3 fill-health-orange" />
                            {doctor.rating.toFixed(1)}
                          </span>
                        )}
                        {doctor.total_consultations !== null && (
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Activity className="w-3 h-3" />
                            {doctor.total_consultations} consultas
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{doctor.profile?.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={doctor.available}
                        onCheckedChange={(value) => handleToggle(doctor, value)}
                      />
                      <span className={`text-xs font-medium ${doctor.available ? 'text-health-green' : 'text-muted-foreground'}`}>
                        {doctor.available ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'activate' ? 'Ativar Médico' : 'Desativar Médico'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'activate' 
                ? `Tem certeza que deseja ativar Dr(a). ${confirmDialog.doctor?.profile?.name}? Ele poderá receber e analisar solicitações.`
                : `Tem certeza que deseja desativar Dr(a). ${confirmDialog.doctor?.profile?.name}? Ele não poderá receber novas solicitações.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} className="rounded-xl">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
