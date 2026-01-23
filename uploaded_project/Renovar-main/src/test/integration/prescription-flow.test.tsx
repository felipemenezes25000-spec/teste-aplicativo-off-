import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from './setup';
import PrescriptionTypePage from '@/pages/prescription/PrescriptionTypePage';
import { useAuth } from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/usePrescriptionRequests');

describe('Prescription Flow Integration', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render prescription type selection page', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      isAuthenticated: true,
      isLoading: false,
    } as any);

    renderWithProviders(<PrescriptionTypePage />);

    expect(screen.getByText(/receita/i)).toBeInTheDocument();
  });
});
