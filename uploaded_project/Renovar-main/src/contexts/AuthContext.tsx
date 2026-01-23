import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { setSentryUser } from '@/lib/sentry';

type AppRole = 'patient' | 'doctor' | 'admin';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: unknown;
  avatar_url: string | null;
}

interface DoctorProfile {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string | null;
  rating: number;
  total_consultations: number;
  available: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  doctorProfile: DoctorProfile | null;
  userRole: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  loginWithApple: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ error: string | null }>;
  registerDoctor: (data: DoctorRegisterData) => Promise<{ error: string | null }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

interface DoctorRegisterData extends RegisterData {
  crm: string;
  crmState: string;
  specialty: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile', profileError, {
          component: 'AuthContext',
          action: 'fetchUserData',
          userId,
        });
      } else {
        setProfile(profileData);
      }

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        logger.error('Error fetching role', roleError, {
          component: 'AuthContext',
          action: 'fetchUserData',
          userId,
        });
      } else if (roleData) {
        setUserRole(roleData.role as AppRole);

        // If doctor, fetch doctor profile
        if (roleData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (doctorError) {
            logger.error('Error fetching doctor profile', doctorError, {
              component: 'AuthContext',
              action: 'fetchUserData',
              userId,
            });
          } else {
            setDoctorProfile(doctorData);
          }
        }
      }
    } catch (error) {
      logger.error('Error fetching user data', error, {
        component: 'AuthContext',
        action: 'fetchUserData',
        userId,
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to avoid deadlock
        if (session?.user) {
          setSentryUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name,
          });
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setSentryUser(null);
          setProfile(null);
          setDoctorProfile(null);
          setUserRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setSentryUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
        });
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: 'Email ou senha incorretos' };
        }
        if (error.message === 'Email not confirmed') {
          return { error: 'Por favor, confirme seu email antes de fazer login' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro ao fazer login com Google. Tente novamente.' };
    }
  };

  const loginWithApple = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Erro ao fazer login com Apple. Tente novamente.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSentryUser(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setDoctorProfile(null);
    setUserRole(null);
  };

  const register = async (data: RegisterData): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado' };
        }
        return { error: signUpError.message };
      }

      // Update profile with additional data
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            cpf: data.cpf || null,
            birth_date: data.birthDate || null,
            address: data.address || {},
          })
          .eq('user_id', authData.user.id);

        if (updateError) {
          logger.error('Error updating profile', updateError, {
            component: 'AuthContext',
            action: 'register',
            userId: authData.user.id,
          });
        }
      }

      toast.success('Conta criada com sucesso!');
      return { error: null };
    } catch (error) {
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const registerDoctor = async (data: DoctorRegisterData): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado' };
        }
        return { error: signUpError.message };
      }

      if (authData.user) {
        // Update profile
        await supabase
          .from('profiles')
          .update({
            phone: data.phone || null,
            cpf: data.cpf || null,
          })
          .eq('user_id', authData.user.id);

        // Add doctor role
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'doctor' as const,
          });

        // Create doctor profile
        await supabase
          .from('doctor_profiles')
          .insert({
            user_id: authData.user.id,
            crm: data.crm,
            crm_state: data.crmState,
            specialty: data.specialty,
          });
      }

      toast.success('Conta médica criada com sucesso!');
      return { error: null };
    } catch (error) {
      return { error: 'Erro ao criar conta médica. Tente novamente.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        doctorProfile,
        userRole,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithApple,
        logout,
        register,
        registerDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
