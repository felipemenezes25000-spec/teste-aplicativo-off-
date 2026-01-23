import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { errorHandler } from '@/lib/errorHandler';

interface UpdateProfileData {
  name?: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  address?: Record<string, string>;
  avatar_url?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      errorHandler.handleError(error, {
        component: 'useProfile',
        action: 'updateProfile',
        userId: user?.id,
      });
    },
  });

  // Check if profile is complete (has required fields)
  const isProfileComplete = Boolean(
    profile?.phone &&
    profile?.cpf &&
    profile?.birth_date &&
    profile?.address &&
    typeof profile.address === 'object' &&
    (profile.address as Record<string, string>).street &&
    (profile.address as Record<string, string>).city
  );

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    isProfileComplete,
  };
}
