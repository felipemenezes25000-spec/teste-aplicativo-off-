# 💳 Integração MercadoPago PIX - RenoveJá+

## Visão Geral

O RenoveJá+ suporta pagamentos via PIX através do MercadoPago. O sistema funciona em dois modos:

1. **Modo Real**: Com credenciais do MercadoPago configuradas
2. **Modo Simulado**: Sem credenciais (fallback para testes)

## Configuração

### 1. Criar Conta no MercadoPago Developers

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie uma nova aplicação
3. Copie as credenciais:
   - **Access Token** (para autenticação da API)
   - **Public Key** (para o frontend, se necessário)

### 2. Configurar Credenciais no Backend

Edite o arquivo `/backend/.env`:

```env
# Para PRODUÇÃO (começa com APP_USR-)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Para TESTES (começa com TEST-)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcional - para validar webhooks
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### 3. Configurar Webhook (Importante para Produção!)

1. No painel do MercadoPago Developers, vá em "Webhooks"
2. Configure a URL:
   ```
   https://seu-dominio.com/api/webhooks/mercadopago
   ```
3. Selecione os eventos:
   - ✅ `payment.created`
   - ✅ `payment.updated`
4. Salve e copie o **Secret Key** para `MERCADOPAGO_WEBHOOK_SECRET`

## Fluxo de Pagamento

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │ MercadoPago  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ POST /payments     │                    │
       │ (gerar PIX)        │                    │
       │───────────────────>│                    │
       │                    │ POST /v1/payments  │
       │                    │───────────────────>│
       │                    │<───────────────────│
       │                    │ QR Code + PIX Code │
       │<───────────────────│                    │
       │ Exibe QR Code      │                    │
       │                    │                    │
       │ GET /payments/{id}/status              │
       │───────────────────>│ (polling)          │
       │                    │ GET /v1/payments/x │
       │                    │───────────────────>│
       │                    │<───────────────────│
       │<───────────────────│                    │
       │ status: pending    │                    │
       │                    │                    │
       │        [Usuário paga via PIX]           │
       │                    │                    │
       │                    │ Webhook: approved  │
       │                    │<───────────────────│
       │                    │ Atualiza DB        │
       │                    │ Notifica usuário   │
       │                    │                    │
       │ GET /payments/{id}/status              │
       │───────────────────>│                    │
       │<───────────────────│                    │
       │ status: completed  │                    │
       │                    │                    │
       │ ✅ Pagamento OK!   │                    │
       │                    │                    │
```

## Endpoints da API

### Criar Pagamento PIX

```http
POST /api/payments?token=xxx
Content-Type: application/json

{
  "request_id": "uuid-da-solicitacao",
  "amount": 49.90,
  "method": "pix"
}
```

**Resposta:**
```json
{
  "id": "payment-uuid",
  "request_id": "request-uuid",
  "patient_id": "user-uuid",
  "amount": 49.90,
  "method": "pix",
  "status": "pending",
  "pix_code": "00020126580014BR.GOV.BCB.PIX...",
  "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "ticket_url": "https://www.mercadopago.com.br/...",
  "is_real_payment": true,
  "external_id": "12345678901"
}
```

### Verificar Status

```http
GET /api/payments/{payment_id}/status?token=xxx
```

**Resposta:**
```json
{
  "payment_id": "payment-uuid",
  "status": "pending|completed",
  "amount": 49.90,
  "is_real_payment": true,
  "mp_status": {
    "status": "approved",
    "status_detail": "accredited",
    "date_approved": "2024-01-15T10:30:00Z"
  }
}
```

### Webhook MercadoPago

```http
POST /api/webhooks/mercadopago

Headers:
  x-signature: ts=xxx,v1=xxx
  x-request-id: xxx

Body:
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "12345678901"
  }
}
```

## Frontend - Componente de Pagamento

O componente `/app/prescription/payment.tsx` implementa:

1. **Geração do PIX**: Chama a API para criar pagamento
2. **Exibição do QR Code**: Mostra QR code real (base64) ou placeholder
3. **Código copia-e-cola**: Permite copiar o código PIX
4. **Polling automático**: Verifica status a cada 5 segundos
5. **Feedback visual**: Indica quando pagamento é confirmado

### Configurações do Polling

```typescript
const POLL_INTERVAL = 5000;      // 5 segundos
const MAX_POLL_TIME = 30 * 60 * 1000;  // 30 minutos
```

## Modo Simulado

Quando `MERCADOPAGO_ACCESS_TOKEN` não está configurado:

1. O backend gera um código PIX fictício
2. `is_real_payment` retorna `false`
3. Usuário pode clicar em "Já paguei" para confirmar manualmente
4. Útil para desenvolvimento e testes

## Segurança

### Validação de Webhook

O webhook valida a assinatura usando HMAC-SHA256:

```python
manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
expected = hmac.new(
    MERCADOPAGO_WEBHOOK_SECRET.encode(),
    manifest.encode(),
    hashlib.sha256
).hexdigest()
```

### Boas Práticas

- ✅ Nunca exponha o `ACCESS_TOKEN` no frontend
- ✅ Configure `WEBHOOK_SECRET` em produção
- ✅ Use HTTPS para o webhook
- ✅ Valide `is_real_payment` antes de liberar serviços
- ✅ Log todos os webhooks para auditoria

## Testando

### Com Credenciais de Teste

1. Use credenciais `TEST-xxx` do MercadoPago
2. Crie usuários de teste no painel de developers
3. Use cartões de teste para simular pagamentos

### Cartões de Teste

| Cartão | Resultado |
|--------|-----------|
| 5031 4332 1540 6351 | Aprovado |
| 4235 6477 2802 5682 | Rejeitado |

### PIX de Teste

Para PIX, use a conta sandbox do MercadoPago para simular pagamentos.

## Troubleshooting

### Webhook não recebe notificações

1. Verifique se a URL está acessível publicamente
2. Confirme que o certificado SSL é válido
3. Verifique os logs do MercadoPago no painel

### QR Code não aparece

1. Verifique se `qr_code_base64` está presente na resposta
2. Confirme que o Access Token tem permissões de PIX
3. Verifique logs do backend para erros da API

### Pagamento não atualiza automaticamente

1. Webhook pode não estar configurado
2. Verifique `MERCADOPAGO_WEBHOOK_SECRET`
3. Use o polling como fallback

## Referências

- [MercadoPago Developers](https://www.mercadopago.com.br/developers)
- [API de Pagamentos](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
