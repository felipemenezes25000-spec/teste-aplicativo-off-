import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Create a new QueryClient for each test to avoid state pollution
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Mock Supabase client for integration tests
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
  functions: {
    invoke: vi.fn(),
  },
};
