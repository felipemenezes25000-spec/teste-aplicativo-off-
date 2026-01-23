# Sistema de Tempo Real (Realtime)

Este documento descreve como o sistema de tempo real está configurado e como utilizá-lo no projeto.

## Visão Geral

O projeto utiliza o Supabase Realtime para sincronizar dados entre o cliente e o servidor em tempo real. Isso permite que:

- Mensagens de chat sejam atualizadas instantaneamente
- Notificações apareçam sem necessidade de recarregar a página
- Status de requisições sejam atualizados automaticamente
- Pagamentos sejam sincronizados em tempo real
- Filas de médicos sejam atualizadas automaticamente

## Configuração

### Cliente Supabase

O cliente Supabase está configurado com suporte a realtime em `src/integrations/supabase/client.ts`:

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

## Hook Centralizado: `useRealtime`

Criamos um hook centralizado `useRealtime` que simplifica o uso de conexões em tempo real:

### Uso Básico

```typescript
import { useRealtime } from '@/hooks/useRealtime';

// Escutar inserções em uma tabela
useRealtime({
  table: 'notifications',
  event: 'INSERT',
  filter: `user_id=eq.${user.id}`,
  queryKey: ['notifications', user.id],
  enabled: !!user,
});
```

### Parâmetros

- `table`: Nome da tabela a ser monitorada
- `schema`: Schema do banco (padrão: 'public')
- `event`: Tipo de evento ('INSERT', 'UPDATE', 'DELETE', ou '*' para todos)
- `filter`: Filtro opcional (ex: `user_id=eq.123`)
- `queryKey`: Chave da query do React Query para invalidar quando houver mudanças
- `enabled`: Se a subscrição deve estar ativa (padrão: true)
- `onEvent`: Callback personalizado para processar eventos

### Exemplo Completo

```typescript
useRealtime({
  table: 'payments',
  event: '*',
  filter: `user_id=eq.${user.id}`,
  queryKey: ['payments', user.id],
  enabled: !!user,
  onEvent: (payload) => {
    if (payload.new?.status === 'completed') {
      toast.success('Pagamento confirmado!');
    }
  },
});
```

## Hook para Múltiplas Subscrições: `useMultipleRealtime`

Para escutar múltiplas tabelas simultaneamente:

```typescript
import { useMultipleRealtime } from '@/hooks/useRealtime';

useMultipleRealtime([
  {
    table: 'prescription_requests',
    event: '*',
    queryKey: ['prescription-requests'],
  },
  {
    table: 'exam_requests',
    event: '*',
    queryKey: ['exam-requests'],
  },
]);
```

## Implementações Existentes

### 1. Chat (`useChat.ts`)

Escuta novas mensagens em tempo real:

```typescript
useRealtime({
  table: 'chat_messages',
  event: 'INSERT',
  filter: `request_id=eq.${requestId}`,
  queryKey: ['chat-messages', requestId],
  enabled: !!requestId && !!user,
});
```

### 2. Notificações (`useNotifications.ts`)

Escuta novas notificações do usuário:

```typescript
useRealtime({
  table: 'notifications',
  event: 'INSERT',
  filter: user?.id ? `user_id=eq.${user.id}` : undefined,
  queryKey: ['notifications', user?.id],
  enabled: !!user,
});
```

### 3. Requisições (`usePrescriptionRequests.ts`, `useExamRequests.ts`, `useConsultationRequests.ts`)

Escuta mudanças nas requisições:

```typescript
// Para pacientes
useRealtime({
  table: 'prescription_requests',
  event: '*',
  filter: user?.id ? `patient_id=eq.${user.id}` : undefined,
  queryKey: ['prescription-requests', 'patient', user?.id],
  enabled: !!user?.id && userRole === 'patient',
});

// Para médicos
useRealtime({
  table: 'prescription_requests',
  event: '*',
  queryKey: ['prescription-requests', 'doctor-queue'],
  enabled: userRole === 'doctor',
});
```

### 4. Pagamentos (`usePayments.ts`)

Escuta mudanças no status dos pagamentos:

```typescript
useRealtime({
  table: 'payments',
  event: '*',
  filter: user?.id ? `user_id=eq.${user.id}` : undefined,
  queryKey: ['payments', user?.id],
  enabled: !!user?.id,
  onEvent: (payload) => {
    if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
      toast.success('Pagamento confirmado!');
    }
  },
});
```

### 5. Fila de Médicos (`useDoctorQueue.ts`)

Escuta mudanças em múltiplas tabelas:

```typescript
useMultipleRealtime([
  {
    table: 'prescription_requests',
    event: '*',
    queryKey: ['doctor-queue-combined'],
    enabled: userRole === 'doctor',
  },
  {
    table: 'exam_requests',
    event: '*',
    queryKey: ['doctor-queue-combined'],
    enabled: userRole === 'doctor',
  },
  {
    table: 'consultation_requests',
    event: '*',
    queryKey: ['doctor-queue-combined'],
    enabled: userRole === 'doctor',
  },
]);
```

## Componente de Status

O componente `RealtimeStatus` exibe o status da conexão em tempo real:

```typescript
import { RealtimeStatus } from '@/components/RealtimeStatus';

<RealtimeStatus />
```

## Boas Práticas

1. **Sempre use `enabled`**: Controle quando a subscrição deve estar ativa para evitar conexões desnecessárias
2. **Use filtros**: Filtre eventos para receber apenas os dados relevantes
3. **Invalide queries**: Use `queryKey` para invalidar automaticamente as queries do React Query
4. **Cleanup automático**: O hook gerencia automaticamente a limpeza das conexões
5. **Callbacks personalizados**: Use `onEvent` para lógica específica quando necessário

## Troubleshooting

### Conexão não está funcionando

1. Verifique se o Realtime está habilitado no Supabase Dashboard
2. Verifique se as políticas RLS (Row Level Security) permitem a leitura
3. Verifique o console do navegador para erros
4. Use o componente `RealtimeStatus` para verificar o status

### Muitas conexões

O hook gerencia automaticamente as conexões, mas se você criar múltiplas instâncias do mesmo hook, pode haver duplicação. Certifique-se de usar o hook apenas uma vez por contexto.

### Performance

O Supabase Realtime está configurado para limitar a 10 eventos por segundo. Se precisar de mais, ajuste em `client.ts`.

## Referências

- [Documentação do Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Query](https://tanstack.com/query/latest)
