import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';
import { LIMITS } from '@/lib/constants';

export function useAvatarUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return null;
    }

    // Validate file type
    const validTypes = LIMITS.ALLOWED_IMAGE_TYPES.filter(t => t.startsWith('image/'));
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF');
      return null;
    }

    // Validate file size (max 5MB for avatars)
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(`Arquivo muito grande. Máximo ${MAX_AVATAR_SIZE / (1024 * 1024)}MB`);
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }

      setProgress(30);

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        errorHandler.handleError(error, {
          component: 'useAvatarUpload',
          action: 'uploadAvatar',
          userId: user.id,
        });
        return null;
      }

      setProgress(70);

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        errorHandler.handleError(updateError, {
          component: 'useAvatarUpload',
          action: 'updateProfile',
          userId: user.id,
        });
        return null;
      }

      setProgress(100);
      toast.success('Foto atualizada com sucesso!');
      
      return publicUrl;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'useAvatarUpload',
        action: 'uploadAvatar',
        userId: user.id,
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setIsUploading(true);

    try {
      // List and delete all files in user's avatar folder
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) {
        errorHandler.handleError(updateError, {
          component: 'useAvatarUpload',
          action: 'deleteAvatar',
          userId: user.id,
        });
        return false;
      }

      toast.success('Foto removida com sucesso!');
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'useAvatarUpload',
        action: 'deleteAvatar',
        userId: user.id,
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading,
    progress,
  };
}
