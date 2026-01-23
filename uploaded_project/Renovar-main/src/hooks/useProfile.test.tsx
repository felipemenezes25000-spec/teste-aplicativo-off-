import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from './useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));
vi.mock('@/lib/errorHandler', () => ({
  errorHandler: {
    handleError: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProfile', () => {
  const mockUser = { id: 'user-123' };
  const mockProfile = {
    id: 'profile-123',
    user_id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '11999999999',
    cpf: '12345678909',
    birth_date: '1990-01-01',
    address: {
      street: 'Rua Teste',
      city: 'São Paulo',
    },
  };

  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
    } as any);

    vi.mocked(supabase.from).mockReturnValue(mockFrom as any);
  });

  describe('profile fetching', () => {
    it('should fetch profile successfully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return null when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Fetch failed'),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockProfile, name: 'Jane Doe' },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        update: mockUpdate,
        single: mockSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateProfile({ name: 'Jane Doe' });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ name: 'Jane Doe' });
    });

    it('should handle update error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        update: mockUpdate,
        single: mockSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateProfile({ name: 'Jane Doe' });

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe('isProfileComplete', () => {
    it('should return true for complete profile', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isProfileComplete).toBe(true);
    });

    it('should return false for incomplete profile', async () => {
      const incompleteProfile = {
        ...mockProfile,
        phone: null,
        cpf: null,
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: incompleteProfile,
        error: null,
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
      } as any);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isProfileComplete).toBe(false);
    });
  });
});
