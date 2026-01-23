import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('sonner');
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));
vi.mock('@/lib/errorHandler', () => ({
  errorHandler: {
    handleError: vi.fn(),
  },
}));

describe('useFileUpload', () => {
  const mockUser = { id: 'user-123' };
  const mockStorage = {
    from: vi.fn(),
  };
  const mockFunctions = {
    invoke: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
    } as any);

    vi.mocked(supabase.storage).mockReturnValue(mockStorage as any);
    vi.mocked(supabase.functions).mockReturnValue(mockFunctions as any);
  });

  describe('uploadFile', () => {
    it('should upload file successfully for avatars', async () => {
      const mockFile = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/avatar.jpg' },
        error: null,
      });
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/avatar.jpg' },
      });

      mockStorage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'avatars');

      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
      expect(url).toBe('https://example.com/avatar.jpg');
    });

    it('should return null if user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as any);

      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'prescription-images');

      expect(url).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Você precisa estar logado para fazer upload');
    });

    it('should validate file type for prescription images', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'prescription-images');

      expect(url).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        'Formato de arquivo não suportado. Use JPG, PNG, WebP ou PDF'
      );
    });

    it('should validate file size', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'prescription-images');

      expect(url).toBeNull();
      expect(toast.error).toHaveBeenCalled();
    });

    it('should handle upload error', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Upload failed'),
      });

      mockStorage.from.mockReturnValue({
        upload: mockUpload,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'avatars');

      expect(url).toBeNull();
    });

    it('should validate image after upload for prescription images', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/test.jpg' },
        error: null,
      });
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockInvoke = vi.fn().mockResolvedValue({
        data: { success: false },
        error: null,
      });

      mockStorage.from.mockReturnValue({
        upload: mockUpload,
        remove: mockRemove,
      } as any);
      mockFunctions.invoke = mockInvoke;

      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.uploadFile(mockFile, 'prescription-images');

      expect(mockInvoke).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
      expect(url).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });

      mockStorage.from.mockReturnValue({
        remove: mockRemove,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const success = await result.current.deleteFile('avatars', 'user-123/file.jpg');

      expect(mockRemove).toHaveBeenCalledWith(['user-123/file.jpg']);
      expect(success).toBe(true);
    });

    it('should handle delete error', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        error: new Error('Delete failed'),
      });

      mockStorage.from.mockReturnValue({
        remove: mockRemove,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const success = await result.current.deleteFile('avatars', 'user-123/file.jpg');

      expect(success).toBe(false);
    });
  });

  describe('getSignedUrl', () => {
    it('should get signed URL successfully', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://example.com/signed-url' },
        error: null,
      });

      mockStorage.from.mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.getSignedUrl('prescription-images', 'user-123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-123/file.jpg', 3600);
      expect(url).toBe('https://example.com/signed-url');
    });

    it('should handle signed URL error', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Failed to create signed URL'),
      });

      mockStorage.from.mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      } as any);

      const { result } = renderHook(() => useFileUpload());

      const url = await result.current.getSignedUrl('prescription-images', 'user-123/file.jpg');

      expect(url).toBeNull();
    });
  });
});
