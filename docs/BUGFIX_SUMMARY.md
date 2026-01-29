# 🐛 RenoveJá - Relatório de Correções de Bugs

**Data:** 2026-01-29
**Autor:** Nasus (Familiar Digital)

---

## 🔴 BUGS CRÍTICOS CORRIGIDOS

### 1. ✅ Arquivos .env ausentes
**Problema:** Backend e frontend não tinham arquivos de configuração de ambiente.
**Solução:** Criados arquivos `.env` e `.env.example` para ambos.

**Arquivos criados:**
- `backend/.env`
- `backend/.env.example`
- `frontend/.env`
- `frontend/.env.example`

### 2. ✅ Modelo Payment sem campo `external_id`
**Arquivo:** `backend/server.py`
**Problema:** O campo `external_id` era usado no código mas não estava definido no modelo.
**Solução:** Adicionado campo `external_id: Optional[str] = None` ao modelo Payment.

### 3. ✅ Frontend enviava campo errado na criação de receita
**Arquivo:** `frontend/app/prescription/payment.tsx`
**Problema:** Enviava `image_base64` (legado) em vez de `prescription_images` (array).
**Solução:** Alterado para enviar `prescription_images: image ? [image] : undefined`.

---

## 🟠 BUGS MÉDIOS CORRIGIDOS

### 4. ✅ QueueManager usava status inconsistente
**Arquivo:** `backend/queue_manager.py`
**Problema:** Procurava apenas por `status: "pending"` mas novos requests têm `status: "submitted"`.
**Solução:** Alterado para buscar `{"$in": ["pending", "submitted"]}` em todas as queries relevantes.

### 5. ✅ Doctor Dashboard não mostrava exames da enfermagem
**Arquivo:** `frontend/app/doctor/index.tsx`
**Problema:** A API retornava `forwarded_from_nursing` mas não era renderizado.
**Solução:** Adicionada seção completa para exibir exames encaminhados pela enfermagem.

### 6. ✅ handleApproveRequest usava endpoint errado
**Arquivo:** `frontend/app/doctor/index.tsx`
**Problema:** Usava `requestsAPI.update()` genérico em vez do endpoint específico de aprovação.
**Solução:** Alterado para usar `requestsAPI.approve()`.

### 7. ✅ Frontend createExam com tipos errados
**Arquivo:** `frontend/src/services/api.ts`
**Problema:** Campos obrigatórios que deveriam ser opcionais.
**Solução:** Alterados campos para `Optional` conforme a API do backend.

### 8. ✅ API sem endpoints de workflow de médico
**Arquivo:** `frontend/src/services/api.ts`
**Problema:** Faltavam funções para accept, approve, reject e sign.
**Solução:** Adicionados métodos `requestsAPI.accept()`, `.approve()`, `.reject()`, `.sign()`.

---

## 🟡 BUGS MENORES CORRIGIDOS

### 9. ✅ Memory leak no Chat polling
**Arquivo:** `frontend/src/components/Chat.tsx`
**Problema:** Polling fixo a cada 5 segundos, mesmo sem novas mensagens.
**Solução:** Implementado polling adaptativo (3-10 segundos baseado em atividade).

### 10. ✅ Google Client ID hardcoded
**Arquivo:** `frontend/app/(auth)/login.tsx`
**Problema:** Client ID do Google exposto diretamente no código.
**Solução:** Movido para variável de ambiente `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

### 11. ✅ AuthContext não carregava nurse_profile
**Arquivo:** `frontend/src/contexts/AuthContext.tsx`
**Problema:** Ao recarregar auth, `nurse_profile` não era preservado.
**Solução:** Adicionada lógica para preservar profiles de médico e enfermeiro.

### 12. ✅ Types incompletos
**Arquivo:** `frontend/src/types/index.ts`
**Problema:** Faltavam `NurseProfile`, novos status e campos do Request.
**Solução:** Adicionados todos os tipos faltantes.

### 13. ✅ .gitignore com duplicatas e mal formatado
**Arquivo:** `.gitignore`
**Problema:** Entradas duplicadas e formatação quebrada.
**Solução:** Reorganizado e limpo, garantindo que `.env.example` seja rastreado.

---

## 📋 ARQUIVOS MODIFICADOS

```
backend/
├── .env (NOVO)
├── .env.example (NOVO)
├── server.py
└── queue_manager.py

frontend/
├── .env (NOVO)
├── .env.example (NOVO)
├── app/
│   ├── (auth)/login.tsx
│   ├── doctor/index.tsx
│   └── prescription/payment.tsx
└── src/
    ├── components/Chat.tsx
    ├── contexts/AuthContext.tsx
    ├── services/api.ts
    └── types/index.ts

.gitignore
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Configurar MongoDB** - Instalar localmente ou usar MongoDB Atlas
2. **Configurar MercadoPago** - Obter credenciais de teste
3. **Testar fluxos completos:**
   - Cadastro paciente/médico/enfermeiro
   - Solicitação de receita
   - Fluxo de aprovação médica
   - Pagamento PIX
   - Assinatura digital
4. **Deploy** - Configurar ambiente de produção

---

*Todas as correções foram aplicadas e estão prontas para commit.*
