# 📝 Exemplos de Implementação das Melhorias

Este documento contém exemplos práticos de como implementar as melhorias sugeridas.

---

## 1. Sistema de Logging

### Uso Básico

```typescript
// ❌ Antes
console.log('User logged in', userId);
console.error('Payment failed', error);

// ✅ Depois
import { logger } from '@/lib/logger';

logger.log('User logged in', { userId, action: 'login' });
logger.error('Payment failed', error, { userId, paymentId });
```

### Substituir em Todo o Código

```bash
# Buscar e substituir console.log
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console\.log/logger.log/g'
```

---

## 2. Tratamento de Erros Centralizado

### Em Hooks

```typescript
// src/hooks/usePrescriptionRequests.ts
import { errorHandler } from '@/lib/errorHandler';

export function usePrescriptionRequests() {
  const createRequest = useMutation({
    mutationFn: async (data: CreatePrescriptionRequest) => {
      try {
        const { data: newRequest, error } = await supabase
          .from('prescription_requests')
          .insert([{ ...data }])
          .select()
          .single();
        
        if (error) throw error;
        return newRequest;
      } catch (error) {
        // Tratamento centralizado
        errorHandler.handleError(error, {
          action: 'create_prescription_request',
          data,
        });
        throw error;
      }
    },
  });
}
```

### Em Componentes

```typescript
// src/pages/patient/PatientDashboard.tsx
import { errorHandler } from '@/lib/errorHandler';

const handleAction = async () => {
  try {
    await someAsyncOperation();
  } catch (error) {
    errorHandler.handleError(error, {
      component: 'PatientDashboard',
      action: 'handleAction',
    });
  }
};
```

---

## 3. Lazy Loading de Rotas

### Atualizar App.tsx

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load das páginas
const PatientDashboard = lazy(() => import('@/pages/patient/PatientDashboard'));
const DoctorDashboard = lazy(() => import('@/pages/doctor/DoctorDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

// Componente de loading
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-health flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Usar Suspense nas rotas
<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['patient']}>
      <Suspense fallback={<PageLoader />}>
        <PatientDashboard />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

## 4. Error Boundary no App

### Adicionar ao App.tsx

```typescript
// src/App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <DemoProvider>
          {/* ... resto do app */}
        </DemoProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);
```

---

## 5. Usar Constantes

### Antes

```typescript
// ❌ Valores mágicos espalhados
if (price === 29.90) { ... }
if (status === 'pending') { ... }
```

### Depois

```typescript
// ✅ Constantes centralizadas
import { PRICING, REQUEST_STATUS } from '@/lib/constants';

if (price === PRICING.PRESCRIPTION.SIMPLE) { ... }
if (status === REQUEST_STATUS.PENDING) { ... }
```

---

## 6. Debounce em Buscas

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';
import { TIMINGS } from '@/lib/constants';

export function useDebounce<T>(value: T, delay: number = TIMINGS.DEBOUNCE_SEARCH): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Uso
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 7. Skeletons em vez de Spinners

```typescript
// src/components/SkeletonLoader.tsx
export function RequestSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="premium-card p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-muted rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Uso
{isLoading ? <RequestSkeleton /> : <RequestList />}
```

---

## 8. Validação de Schema Unificada

```typescript
// src/lib/schemas.ts
import { z } from 'zod';
import { PATTERNS } from '@/lib/constants';

export const prescriptionRequestSchema = z.object({
  prescription_type: z.enum(['simple', 'controlled', 'blue']),
  price: z.number().positive(),
  image_url: z.string().url().optional(),
  patient_notes: z.string().max(500).optional(),
});

export const examRequestSchema = z.object({
  exam_type: z.enum(['laboratory', 'imaging']),
  price: z.number().positive(),
  image_url: z.string().url().optional(),
});

// Usar em hooks e Edge Functions
```

---

## 9. Cache de Queries Otimizado

```typescript
// src/main.tsx ou App.tsx
import { QueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '@/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_KEYS.STALE_TIME.MEDIUM,
      gcTime: CACHE_KEYS.STALE_TIME.LONG, // antigo cacheTime
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 10. Migração Gradual

### Passo 1: Substituir console.log
```bash
# Criar script de migração
# scripts/replace-console-logs.sh
```

### Passo 2: Adicionar Error Boundary
- Adicionar em App.tsx
- Testar com erro proposital

### Passo 3: Implementar Lazy Loading
- Começar com páginas grandes
- Medir impacto no bundle size

### Passo 4: Centralizar Constantes
- Criar arquivo de constantes
- Substituir valores mágicos gradualmente

---

## 11. Testes de Exemplo

```typescript
// src/lib/__tests__/logger.test.ts
import { describe, it, expect, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger', () => {
  it('should not log in production', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    logger.log('test');
    // Verificar comportamento baseado em env
  });
});
```

---

## 12. Configuração de Ambiente

```typescript
// src/lib/config.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
});

export const config = envSchema.parse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
});
```

---

*Estes são exemplos práticos. Adapte conforme necessário para seu projeto.*
