# Guia de Sincronização com Supabase

Este guia explica como sincronizar o projeto local com o Supabase (banco de dados e Edge Functions).

## Pré-requisitos

1. **Instalar Supabase CLI** (se ainda não tiver):
   ```bash
   # Windows (via Scoop ou Chocolatey)
   scoop install supabase
   # ou
   choco install supabase

   # Ou via npm
   npm install -g supabase
   ```

2. **Fazer login no Supabase**:
   ```bash
   supabase login
   ```

3. **Linkar o projeto ao seu projeto Supabase**:
   ```bash
   supabase link --project-ref cnfadyhxczrldavmlobh
   ```
   (O project_ref está no arquivo `supabase/config.toml`)

## Sincronização Completa

### 1. Aplicar Migrations (Banco de Dados)

Aplicar todas as migrations pendentes no banco de dados:

```bash
# Verificar status das migrations
supabase migration list

# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar uma migration específica
supabase migration up
```

**Importante**: A nova migration `20260125000001_improve_rate_limit_atomic.sql` precisa ser aplicada para o rate limit atômico funcionar.

### 2. Fazer Deploy das Edge Functions

Fazer deploy de todas as Edge Functions:

```bash
# Deploy de todas as functions
supabase functions deploy

# Ou deploy de uma function específica
supabase functions deploy create-payment
supabase functions deploy create-request
supabase functions deploy get-signed-url
supabase functions deploy update-request-status
supabase functions deploy update-prescription
```

### 3. Configurar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no Supabase Dashboard:

**No Supabase Dashboard → Project Settings → Edge Functions → Secrets:**

- `MERCADO_PAGO_ACCESS_TOKEN` - Token de acesso do Mercado Pago
- `FRONTEND_URL` - URL do frontend (ex: `https://renoveja.com` ou `http://localhost:8080`)
- `ENVIRONMENT` - Ambiente (`development` ou `production`)

**Para configurar via CLI:**
```bash
supabase secrets set MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
supabase secrets set FRONTEND_URL=https://renoveja.com
supabase secrets set ENVIRONMENT=production
```

### 4. Verificar Status

```bash
# Ver status do projeto
supabase status

# Ver logs das Edge Functions
supabase functions logs create-payment
```

## Sincronização Incremental

### Apenas Nova Migration

Se você adicionou apenas uma nova migration:

```bash
supabase db push
```

### Apenas Edge Functions Modificadas

Se você modificou apenas algumas Edge Functions:

```bash
# Deploy apenas das functions modificadas
supabase functions deploy create-payment
supabase functions deploy create-request
# ... etc
```

## Troubleshooting

### Erro: "Migration already applied"

Se uma migration já foi aplicada, você pode:

1. **Verificar o histórico:**
   ```bash
   supabase migration list
   ```

2. **Resetar migrations (CUIDADO - apaga dados):**
   ```bash
   supabase db reset
   ```

### Erro: "Function not found"

Certifique-se de que a function existe na pasta `supabase/functions/` e tente fazer deploy novamente.

### Erro: "CORS error"

Verifique se:
1. A variável `FRONTEND_URL` está configurada corretamente
2. O CORS allowlist nas Edge Functions inclui sua origem

## Scripts Úteis

Você pode adicionar estes scripts ao `package.json`:

```json
{
  "scripts": {
    "supabase:link": "supabase link --project-ref cnfadyhxczrldavmlobh",
    "supabase:push": "supabase db push",
    "supabase:deploy": "supabase functions deploy",
    "supabase:deploy:payment": "supabase functions deploy create-payment",
    "supabase:deploy:request": "supabase functions deploy create-request",
    "supabase:status": "supabase status",
    "supabase:logs": "supabase functions logs"
  }
}
```

## Checklist de Sincronização

Após fazer alterações, execute:

- [ ] Aplicar migrations: `supabase db push`
- [ ] Deploy das Edge Functions modificadas: `supabase functions deploy`
- [ ] Verificar variáveis de ambiente no Dashboard
- [ ] Testar as funcionalidades modificadas
- [ ] Verificar logs em caso de erro: `supabase functions logs <function-name>`

## Próximos Passos

Após sincronizar:

1. **Testar o hook usePricing()** - Verificar se os preços estão sendo buscados corretamente do backend
2. **Testar CORS** - Verificar se apenas origens permitidas conseguem acessar as Edge Functions
3. **Testar Rate Limit** - Verificar se o contador atômico está funcionando corretamente
