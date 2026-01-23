import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  User, 
  Mail, 
  Phone,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { errorHandler } from '@/lib/errorHandler';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  created_at: string;
}

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(u => 
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone?.includes(query) ||
          u.cpf?.includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
    setPage(1);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get patient user_ids
      const { data: patientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'patient');

      if (rolesError) throw rolesError;

      const patientIds = patientRoles?.map(r => r.user_id) || [];

      if (patientIds.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setIsLoading(false);
        return;
      }

      // Get profiles for patients
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', patientIds)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setUsers(profiles || []);
      setFilteredUsers(profiles || []);
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'UsersManagement',
        action: 'fetchUsers',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
            onClick={fetchUsers}
            variant="ghost"
            size="icon"
            className="rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Gerenciar Usuários</h1>
        <p className="text-white/70 text-sm mt-1">Visualize os pacientes cadastrados</p>
      </div>

      <div className="flex-1 px-6 pb-24 -mt-4 space-y-4 overflow-y-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-white border-0 shadow-card"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm bg-white rounded-2xl p-4 shadow-card">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredUsers.length}</span> usuários encontrados
          </span>
          {totalPages > 1 && (
            <span className="text-muted-foreground">Página {page} de {totalPages}</span>
          )}
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedUsers.map((user, index) => (
              <Card 
                key={user.id} 
                className="border-0 shadow-card hover:shadow-lg transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-2xl">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary rounded-2xl font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{user.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                        Paciente
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at)}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => toast.info('Ver detalhes em breve')}>
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Histórico em breve')}>
                          Ver histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
    </div>
  );
}
