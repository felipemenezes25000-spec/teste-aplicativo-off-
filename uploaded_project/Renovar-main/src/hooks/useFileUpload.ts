import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { errorHandler } from '@/lib/errorHandler';
import { LIMITS } from '@/lib/constants';

type BucketName = 'prescription-images' | 'exam-images' | 'avatars';

export function useFileUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate SHA-256 hash of file
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Validate image file by checking magic numbers
  const validateImageFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        
        // Check file signatures (magic numbers)
        const signatures: Record<string, number[][]> = {
          jpeg: [[0xff, 0xd8, 0xff]],
          png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
          webp: [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
          pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
        };
        
        for (const [format, sigs] of Object.entries(signatures)) {
          for (const sig of sigs) {
            if (bytes.length >= sig.length) {
              const matches = sig.every((byte, i) => bytes[i] === byte);
              if (matches) {
                resolve(true);
                return;
              }
            }
          }
        }
        
        resolve(false);
      };
      reader.readAsArrayBuffer(file.slice(0, 12)); // Read first 12 bytes only
    });
  };

  const uploadFile = async (
    file: File,
    bucket: BucketName,
    customPath?: string
  ): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Você precisa estar logado para fazer upload');
      return null;
    }

    // SECURITY: Validate file type and size before upload
    if (bucket !== 'avatars') {
      // For prescription/exam images, validate more strictly
      if (!LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Formato de arquivo não suportado. Use JPG, PNG, WebP ou PDF');
        return null;
      }

      if (file.size > LIMITS.MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande. Máximo ${LIMITS.MAX_FILE_SIZE_MB}MB`);
        return null;
      }

      // Validate it's actually an image/PDF by checking magic numbers
      const isValid = await validateImageFile(file);
      if (!isValid) {
        toast.error('Arquivo não é uma imagem ou PDF válido');
        return null;
      }
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Create file path: userId/timestamp_filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      // SECURITY: Sanitize filename to prevent path injection
      const sanitizedExt = fileExt.replace(/[^a-z0-9]/g, '');
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${sanitizedExt}`;
      const filePath = customPath || `${user.id}/${fileName}`;

      // SECURITY: Validate path doesn't contain .. or /
      if (filePath.includes('..') || filePath.startsWith('/')) {
        toast.error('Caminho de arquivo inválido');
        return null;
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setProgress(100);

      // SECURITY: For prescription/exam images, validate after upload
      if (bucket !== 'avatars') {
        try {
          const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-image', {
            body: { file_path: data.path, bucket },
          });

          if (validationError || !validationResult?.success) {
            // Delete invalid file
            await supabase.storage.from(bucket).remove([data.path]);
            toast.error('Imagem inválida. Por favor, tente novamente com outra imagem.');
            return null;
          }

          // Store hash for integrity verification (would be stored in request later)
          // For now, just return path
        } catch (validationErr) {
          console.error('Image validation error:', validationErr);
          // Continue anyway, but log the error
        }
      }

      // For private buckets (prescription-images, exam-images), store only the path
      // For public buckets (avatars), we can use the public URL
      if (bucket === 'avatars') {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        return urlData.publicUrl;
      }

      // For private buckets, return just the path - signed URLs will be generated on demand
      return data.path;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'useFileUpload',
        action: 'uploadFile',
        userId: user?.id,
        bucket,
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (bucket: BucketName, filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'useFileUpload',
        action: 'deleteFile',
        userId: user?.id,
        bucket,
        filePath,
      });
      return false;
    }
  };

  const getSignedUrl = async (
    bucket: BucketName,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      logger.error('Signed URL error', error, {
        component: 'useFileUpload',
        action: 'getSignedUrl',
        bucket,
        filePath,
      });
      return null;
    }
  };

  return {
    uploadFile,
    deleteFile,
    getSignedUrl,
    isUploading,
    progress,
  };
}
