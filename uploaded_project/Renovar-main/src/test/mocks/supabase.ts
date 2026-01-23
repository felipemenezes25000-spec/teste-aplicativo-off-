import { vi } from 'vitest';

export const createMockSupabaseClient = () => {
  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  };

  const mockAuth = {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithOAuth: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  }));

  const mockFunctions = {
    invoke: vi.fn(),
  };

  return {
    storage: mockStorage,
    auth: mockAuth,
    from: mockFrom,
    functions: mockFunctions,
  };
};

export const mockSupabaseResponse = <T>(data: T | null, error: Error | null = null) => ({
  data,
  error,
});
