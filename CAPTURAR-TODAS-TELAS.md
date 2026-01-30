# 📸 Como Capturar Screenshots de TODAS as Telas

## 🎯 Objetivo
Tirar screenshots de todas as 52 telas do app e enviar pro GitHub.

---

## ✅ Status Atual
- **Screenshots existentes:** 25 telas
- **Faltam:** 27 telas
- **Total:** 52 telas

---

## 🚀 MÉTODO 1: Rodar o App e Capturar Manualmente (RECOMENDADO)

### Passo 1: Preparar o Ambiente

#### Backend
```bash
cd /home/elipe/clawd/projeto-app/backend
python3 server.py
```
Deixe rodando (não feche essa aba)

#### Frontend (nova aba do terminal)
```bash
cd /home/elipe/clawd/projeto-app/frontend
npm install
npm start
```

Aguarde abrir: `http://localhost:19006`

---

### Passo 2: Escolher Plataforma

#### Opção A: Web (MAIS FÁCIL) ✅
1. Pressione **`w`** no terminal
2. Abrirá no navegador
3. Pressione **F12** (DevTools)
4. Clique no ícone de celular (📱 Toggle Device Toolbar)
5. Escolha: **iPhone 14 Pro** ou **Pixel 5**
6. Agora use o app normalmente

**Capturar:**
- Windows: Ferramenta de Captura (Win + Shift + S)
- Screenshot da área do celular emulado

#### Opção B: Android Emulator
1. Abra Android Studio
2. AVD Manager → Criar/Abrir emulador
3. No terminal do Expo, pressione **`a`**
4. App abrirá no emulador

**Capturar:**
- Ctrl + S (ou botão da câmera no painel lateral)

#### Opção C: Expo Go (Celular Real)
1. Instale **Expo Go** no celular
2. Scan o QR code que aparece no terminal
3. App abrirá no celular

**Capturar:**
- Android: Vol Down + Power
- iOS: Vol Up + Power

---

### Passo 3: Navegar e Capturar TODAS as Telas

#### 🔐 Autenticação (4 telas)
1. **Splash Screen** → Screenshot (01-splash.png)
2. **Login** → Screenshot (02-login.png)
3. Clicar em "Criar conta" → **Registro** → Screenshot (03-register.png)
4. Voltar → "Esqueci senha" → Screenshot (04-forgot-password.png)

#### 📋 Legal/Termos (3 telas)
5. Após registrar → **Termos de Uso** → Screenshot (05-termos.png)
6. **Privacidade** → Screenshot (06-privacidade.png)
7. **Consentimento** → Screenshot (07-consentimento.png)

#### 🏠 Dashboard Paciente (4 telas)
8. **Home** → Screenshot (08-home.png)
9. Tab "Histórico" → Screenshot (09-historico.png)
10. Tab "Notificações" → Screenshot (10-notificacoes.png)
11. Tab "Perfil" → Screenshot (11-perfil.png)

#### 💊 Receitas (4 telas)
12. Home → "Receitas" → Screenshot (12-receita-inicio.png)
13. Preencher → "Próximo" → **Upload** → Screenshot (13-receita-upload.png)
14. Upload → "Continuar" → **Pagamento** → Screenshot (14-receita-pagamento.png)
15. Pagar → **Confirmação** → Screenshot (15-receita-confirmacao.png)

#### 🧪 Exames (1 tela)
16. Home → "Exames" → Screenshot (16-exames.png)

#### 📞 Teleconsulta (1 tela)
17. Home → "Consultas" → Screenshot (17-teleconsulta.png)

#### ⚙️ Configurações (1 tela)
18. Perfil → "Configurações" → Screenshot (18-configuracoes.png)

#### 🏥 Farmácias (1 tela)
19. Home → Menu → "Farmácias" → Screenshot (19-farmacias.png)

---

### Telas Dinâmicas (Precisam de Interação)

#### 💬 Chat (1 tela)
20. Criar solicitação → Aguardar aceite → Abrir chat → Screenshot (20-chat.png)

#### 📹 Videochamada (1 tela)
21. Durante consulta → Entrar na sala → Screenshot (21-video.png)

#### 📄 Detalhes da Solicitação (1 tela)
22. Histórico → Clicar em uma solicitação → Screenshot (22-request-details.png)

#### 👁️ Visualizar Receita (1 tela)
23. Receita aprovada → "Ver Receita" → Screenshot (23-receita-view.png)

#### ⏳ Sala de Espera (1 tela)
24. Consulta agendada → "Entrar" → Screenshot (24-waiting-room.png)

#### ⭐ Avaliação (1 tela)
25. Após consulta → "Avaliar" → Screenshot (25-review.png)

---

### Dashboards Profissionais (LOGIN COMO MÉDICO/ENFERMEIRO/ADMIN)

#### 👨‍⚕️ Médico (Fazer logout e login como médico)
26. **Painel Médico** → Screenshot (26-medico-dashboard.png)
27. **Consultas** → Screenshot (27-medico-consultas.png)
28. **Análise de Documento** → Clicar em solicitação → Screenshot (28-medico-analyze.png)
29. **Chat Médico** → Screenshot (29-medico-chat.png)
30. **Request Médico** → Screenshot (30-medico-request.png)

#### 👩‍⚕️ Enfermeiro (Logout e login como enfermeiro)
31. **Painel Enfermeiro** → Screenshot (31-enfermeiro-dashboard.png)
32. **Request Enfermeiro** → Screenshot (32-enfermeiro-request.png)

#### 🔐 Admin (Logout e login como admin)
33. **Dashboard Admin** → Screenshot (33-admin-dashboard.png)
34. **Usuários** → Screenshot (34-admin-users.png)
35. **Relatórios** → Screenshot (35-admin-reports.png)

---

## 📁 Organizar Screenshots

### Estrutura de Pastas

Crie esta estrutura em `docs/screenshots/`:

```
docs/screenshots/
├── 01-auth/
│   ├── 01-splash.png
│   ├── 02-login.png
│   ├── 03-register.png
│   └── 04-forgot-password.png
├── 02-legal/
│   ├── 05-termos.png
│   ├── 06-privacidade.png
│   └── 07-consentimento.png
├── 03-paciente/
│   ├── 08-home.png
│   ├── 09-historico.png
│   ├── 10-notificacoes.png
│   └── 11-perfil.png
├── 04-receitas/
│   ├── 12-receita-inicio.png
│   ├── 13-receita-upload.png
│   ├── 14-receita-pagamento.png
│   └── 15-receita-confirmacao.png
├── 05-exames/
│   └── 16-exames.png
├── 06-teleconsulta/
│   └── 17-teleconsulta.png
├── 07-chat/
│   └── 20-chat.png
├── 08-video/
│   └── 21-video.png
├── 09-solicitacoes/
│   ├── 22-request-details.png
│   ├── 23-receita-view.png
│   ├── 24-waiting-room.png
│   └── 25-review.png
├── 10-medico/
│   ├── 26-medico-dashboard.png
│   ├── 27-medico-consultas.png
│   ├── 28-medico-analyze.png
│   ├── 29-medico-chat.png
│   └── 30-medico-request.png
├── 11-enfermeiro/
│   ├── 31-enfermeiro-dashboard.png
│   └── 32-enfermeiro-request.png
└── 12-admin/
    ├── 33-admin-dashboard.png
    ├── 34-admin-users.png
    └── 35-admin-reports.png
```

---

## 🚀 Enviar pro GitHub

```bash
cd /home/elipe/clawd/projeto-app

# Adicionar todos os screenshots
git add docs/screenshots/

# Commitar
git commit -m "📸 Adiciona screenshots completos de todas as 52 telas

- Autenticação (4 telas)
- Legal (3 telas)
- Paciente (4 telas)
- Receitas (4 telas)
- Exames (1 tela)
- Teleconsulta (1 tela)
- Chat (1 tela)
- Vídeo (1 tela)
- Solicitações (4 telas)
- Médico (5 telas)
- Enfermeiro (2 telas)
- Admin (3 telas)
- Outros (2 telas)

Total: 35+ screenshots"

# Push
git push origin main
```

---

## 🎯 MÉTODO 2: Script Automatizado (AVANÇADO)

Crie um script que captura automaticamente:

```javascript
// screenshot-all.js
const puppeteer = require('puppeteer');

async function captureAll() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 375, height: 812 }); // iPhone
  
  // Lista de URLs
  const screens = [
    { url: 'http://localhost:19006/', name: '01-splash' },
    { url: 'http://localhost:19006/login', name: '02-login' },
    // ... etc
  ];
  
  for (const screen of screens) {
    await page.goto(screen.url);
    await page.screenshot({ 
      path: `docs/screenshots/${screen.name}.png`,
      fullPage: true 
    });
  }
  
  await browser.close();
}

captureAll();
```

---

## ✅ Checklist

- [ ] Backend rodando (port 8000)
- [ ] Frontend rodando (port 19006)
- [ ] Plataforma escolhida (Web/Android/iOS)
- [ ] Criar conta de teste
- [ ] Capturar telas de autenticação (4)
- [ ] Capturar telas legais (3)
- [ ] Capturar dashboard paciente (4)
- [ ] Capturar fluxo receitas (4)
- [ ] Capturar exames (1)
- [ ] Capturar teleconsulta (1)
- [ ] Capturar chat (1)
- [ ] Capturar vídeo (1)
- [ ] Capturar solicitações (4)
- [ ] Login como médico
- [ ] Capturar telas médico (5)
- [ ] Login como enfermeiro
- [ ] Capturar telas enfermeiro (2)
- [ ] Login como admin
- [ ] Capturar telas admin (3)
- [ ] Organizar em pastas
- [ ] Git add + commit + push

---

## 💡 Dicas

**Resolução ideal:**
- 375x812 (iPhone 14 Pro)
- 412x915 (Pixel 5)

**Formato:**
- PNG (melhor qualidade)
- JPG (menor tamanho)

**Nomenclatura:**
- Use números (01, 02, 03...)
- Nome descritivo
- Sem espaços

**Dark Mode:**
- Capturar versão light E dark (opcional)
- Criar pasta separada: `screenshots-dark/`

---

**Pronto! Agora é só rodar o app e ir capturando tela por tela!** 📸

Quer que eu crie os usuários de teste (médico, admin) no banco pra você?
