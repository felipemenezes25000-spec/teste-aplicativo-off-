# 🚀 Checklist de Deploy - RenoveJá+

Guia completo para colocar o app em produção.

---

## ✅ Pré-requisitos

- [ ] Conta no [Supabase](https://supabase.com) (banco de dados)
- [ ] Conta no [Railway](https://railway.app) ou similar (backend)
- [ ] Conta no [Expo](https://expo.dev) (build do app)
- [ ] Conta no [MercadoPago](https://www.mercadopago.com.br/developers) (pagamentos)
- [ ] CNPJ ativo (obrigatório para receber pagamentos)

---

## 📦 1. Backend (Railway)

### 1.1 Configurar variáveis de ambiente

No Railway, adicione estas variáveis:

```env
# OBRIGATÓRIO
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# PAGAMENTOS (sem isso, fica modo simulado)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxxx

# OPCIONAL
OPENAI_API_KEY=sk-xxxxx
DAILY_API_KEY=xxxxx
```

### 1.2 Configurar Webhook do MercadoPago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em "Webhooks"
4. Adicione URL: `https://SEU-DOMINIO.up.railway.app/api/webhooks/mercadopago`
5. Selecione eventos: `payment.created`, `payment.updated`
6. Copie o Secret e coloque em `MERCADOPAGO_WEBHOOK_SECRET`

### 1.3 Configurar CORS

Edite `server.py` e altere:

```python
origins = [
    "https://seu-app.com",
    "exp://192.168.x.x:8081",  # desenvolvimento
]
```

---

## 📱 2. App (Expo/EAS)

### 2.1 Configurar app.json

Edite `frontend/app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "seu-project-id-do-expo"
      }
    }
  }
}
```

### 2.2 Configurar variáveis

Crie `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=https://SEU-DOMINIO.up.railway.app
```

### 2.3 Build para as lojas

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build Android (APK para teste)
eas build --platform android --profile preview

# Build Android (AAB para Play Store)
eas build --platform android --profile production

# Build iOS (requer conta Apple Developer $99/ano)
eas build --platform ios --profile production
```

---

## 🏪 3. Lojas

### 3.1 Google Play Store

**Requisitos:**
- [ ] Conta de desenvolvedor ($25 única vez)
- [ ] AAB assinado (gerado pelo EAS)
- [ ] Ícone 512x512 PNG
- [ ] Feature graphic 1024x500
- [ ] Screenshots (mínimo 2)
- [ ] Descrição curta (80 chars)
- [ ] Descrição completa (4000 chars)
- [ ] Política de privacidade URL
- [ ] Classificação de conteúdo
- [ ] Categoria: Medicina

**Upload:**
1. Acesse: https://play.google.com/console
2. Criar aplicativo
3. Preencher ficha da loja
4. Fazer upload do AAB
5. Enviar para revisão (2-7 dias)

### 3.2 Apple App Store

**Requisitos:**
- [ ] Conta Apple Developer ($99/ano)
- [ ] IPA assinado (gerado pelo EAS)
- [ ] Ícone 1024x1024 PNG (sem transparência)
- [ ] Screenshots para cada tamanho de tela
- [ ] Descrição
- [ ] Política de privacidade URL
- [ ] Classificação de idade

**Upload:**
1. Acesse: https://appstoreconnect.apple.com
2. Criar app
3. Preencher informações
4. Upload via Transporter ou EAS Submit
5. Enviar para revisão (1-3 dias)

---

## 📋 4. Documentos Legais

### 4.1 Política de Privacidade
- [ ] Hospedar em URL pública
- [ ] Atualizar email de contato
- [ ] Atualizar CNPJ
- Arquivo: `docs/legal/POLITICA_PRIVACIDADE.md`

### 4.2 Termos de Uso
- [ ] Hospedar em URL pública
- [ ] Atualizar dados da empresa
- Arquivo: `docs/legal/TERMOS_DE_USO.md`

### 4.3 Termo de Consentimento Telemedicina
- Já integrado no app
- Arquivo: `docs/legal/TERMO_CONSENTIMENTO_TELEMEDICINA.md`

---

## ⚖️ 5. Conformidade Legal

### 5.1 LGPD
- [x] Política de privacidade criada
- [x] Consentimento no cadastro
- [ ] Procedimento para exclusão de dados
- [ ] Nomear DPO (encarregado)

### 5.2 CFM (Telemedicina)
- [x] Termo de consentimento
- [ ] Verificar CRM dos médicos cadastrados
- [ ] Manter prontuários por 20 anos
- [ ] Consultar advogado especializado

### 5.3 ANVISA
- [ ] Verificar se precisa registro (depende do modelo de negócio)
- [ ] Consultar regulamentação de farmácias online

---

## 🔒 6. Segurança Final

- [x] Senhas com bcrypt
- [x] Tokens com expiração
- [x] Rate limiting
- [x] Validação de CPF/CRM/COREN
- [x] Proteção IDOR
- [ ] Configurar CORS específico (não usar `*`)
- [ ] Ativar HTTPS no backend
- [ ] Migrar tokens para SecureStore no app

---

## 📊 7. Monitoramento (Recomendado)

- [ ] [Sentry](https://sentry.io) - Monitoramento de erros
- [ ] [Mixpanel](https://mixpanel.com) - Analytics
- [ ] [UptimeRobot](https://uptimerobot.com) - Monitorar uptime

---

## 🎯 Resumo - Ordem de Execução

1. **Configurar Supabase** → Rodar schema.sql
2. **Deploy Backend** → Railway + variáveis
3. **Configurar MercadoPago** → Webhook + credenciais
4. **Build App** → EAS Build
5. **Testar Pagamento** → Modo teste do MercadoPago
6. **Hospedar Docs Legais** → Política + Termos
7. **Submit Lojas** → Play Store + App Store
8. **Configurar Produção** → Trocar credenciais teste → produção

---

## 🆘 Suporte

- Documentação Expo: https://docs.expo.dev
- Documentação MercadoPago: https://www.mercadopago.com.br/developers/pt/docs
- Documentação Supabase: https://supabase.com/docs
- Documentação Railway: https://docs.railway.app

---

**Boa sorte com o deploy! 🚀**
