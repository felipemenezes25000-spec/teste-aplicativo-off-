# 📸 CAPTURAR SCREENSHOTS - GUIA DEFINITIVO

## 🎯 OBJETIVO
Tirar screenshots de **TODAS as telas** do RenoveJá+ no estado atual.

---

## 🚀 PASSO 1: PREPARAR (10 min)

### A. Criar Usuários de Teste no Supabase

1. Abra: https://cnfadyhxczrldavmlobh.supabase.co
2. SQL Editor → + New query
3. Copie e cole:

```sql
-- USUÁRIOS DE TESTE
INSERT INTO users (email, name, cpf, role, verified) VALUES
('paciente@teste.com', 'João Silva', '123.456.789-00', 'patient', true),
('medico@teste.com', 'Dra. Maria Santos', '987.654.321-00', 'doctor', true),
('enfermeiro@teste.com', 'Carlos Oliveira', '111.222.333-44', 'nurse', true),
('admin@teste.com', 'Admin Sistema', '555.666.777-88', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Atualizar médico
UPDATE users SET crm = 'CRM-SP 123456', specialty = 'Clínico Geral' 
WHERE email = 'medico@teste.com';

-- Atualizar enfermeiro
UPDATE users SET coren = 'COREN-SP 654321' 
WHERE email = 'enfermeiro@teste.com';

SELECT email, name, role FROM users WHERE email LIKE '%@teste.com';
```

4. RUN
5. **Senhas de TODOS:** teste123

---

### B. Rodar Backend

```bash
cd /home/elipe/clawd/projeto-app/backend
python3 server.py
```

✅ Deve aparecer: `Uvicorn running on http://0.0.0.0:8000`

---

### C. Rodar Frontend (NOVA ABA)

```bash
cd /home/elipe/clawd/projeto-app/frontend

# Instalar dependências (se ainda não fez)
npm install

# Rodar
npm start
```

---

### D. Abrir no Navegador

Quando o Expo abrir, pressione: **`w`**

Abrirá: `http://localhost:19006`

---

### E. Configurar DevTools

1. Pressione **F12**
2. Clique no ícone 📱 (Toggle Device Toolbar)
3. Escolha: **iPhone 14 Pro** (375 x 812)
4. Zoom: 100%

---

## 📸 PASSO 2: CAPTURAR (40 min)

### Ferramenta: Win + Shift + S

### SEQUÊNCIA DE CAPTURA:

---

## 1️⃣ AUTENTICAÇÃO (Login como PACIENTE)

**Pasta:** `docs/screenshots/01-auth/`

1. **Splash** → Screenshot: `01-splash.png`
2. **Login** → Screenshot: `02-login.png`
3. Clicar "Criar conta" → **Registro** → Screenshot: `03-register.png`
4. Preencher dados → Próximo → **Dados Pessoais** → Screenshot: `04-register-data.png`
5. Voltar → Login → Esqueci senha → Screenshot: `05-forgot-password.png`

**Login agora:** paciente@teste.com / teste123

---

## 2️⃣ ONBOARDING (Primeira vez)

**Pasta:** `docs/screenshots/02-onboarding/`

6. **Termos de Uso** → Screenshot: `06-termos.png`
7. Aceitar → **Privacidade** → Screenshot: `07-privacidade.png`
8. Aceitar → **Consentimento** → Screenshot: `08-consentimento.png`

---

## 3️⃣ HOME / DASHBOARD PACIENTE

**Pasta:** `docs/screenshots/03-home/`

9. **Home** → Screenshot: `09-home.png`
10. Tab "Histórico" → Screenshot: `10-historico.png`
11. Tab "Notificações" → Screenshot: `11-notificacoes.png`
12. Tab "Perfil" → Screenshot: `12-perfil.png`

---

## 4️⃣ RECEITAS (Fluxo Completo)

**Pasta:** `docs/screenshots/04-receitas/`

13. Home → Serviço "Receitas" → Screenshot: `13-receita-inicio.png`
14. Preencher formulário → Próximo → Screenshot: `14-receita-form.png`
15. **Upload** → Screenshot: `15-receita-upload.png`
16. Fazer upload (fake) → Continuar → Screenshot: `16-receita-review.png`
17. **Pagamento** → Screenshot: `17-receita-pagamento.png`
18. Escolher PIX → Screenshot: `18-receita-pix.png`
19. **Confirmação** → Screenshot: `19-receita-confirmacao.png`

---

## 5️⃣ EXAMES

**Pasta:** `docs/screenshots/05-exames/`

20. Home → "Exames" → Screenshot: `20-exames-inicio.png`
21. Formulário → Screenshot: `21-exames-form.png`

---

## 6️⃣ CONSULTAS

**Pasta:** `docs/screenshots/06-consultas/`

22. Home → "Consultas" → Screenshot: `22-consulta-inicio.png`
23. Escolher especialidade → Screenshot: `23-consulta-especialidade.png`
24. Agendar → Screenshot: `24-consulta-agendar.png`

---

## 7️⃣ CHAT (Se tiver solicitação ativa)

**Pasta:** `docs/screenshots/07-chat/`

25. Histórico → Abrir solicitação → Chat → Screenshot: `25-chat-paciente.png`

---

## 8️⃣ VÍDEO (Se tiver consulta ativa)

**Pasta:** `docs/screenshots/08-video/`

26. Entrar na sala → Screenshot: `26-video-sala.png`
27. Durante chamada → Screenshot: `27-video-chamada.png`

---

## 9️⃣ CONFIGURAÇÕES

**Pasta:** `docs/screenshots/12-config/`

28. Perfil → Configurações → Screenshot: `28-config-geral.png`
29. Tema → Dark Mode → Screenshot: `29-config-dark.png`
30. Notificações → Screenshot: `30-config-notif.png`

---

## 🔟 FARMÁCIAS

**Pasta:** `docs/screenshots/12-config/`

31. Menu → Farmácias → Screenshot: `31-farmacias.png`
32. Mapa → Screenshot: `32-farmacias-mapa.png`

---

## 1️⃣1️⃣ MÉDICO (LOGOUT E LOGIN COMO MÉDICO)

**Pasta:** `docs/screenshots/09-medico/`

**Logout** → Login: medico@teste.com / teste123

33. **Dashboard Médico** → Screenshot: `33-medico-dashboard.png`
34. **Solicitações** → Screenshot: `34-medico-solicitacoes.png`
35. Clicar em uma → **Analisar** → Screenshot: `35-medico-analisar.png`
36. **Chat** → Screenshot: `36-medico-chat.png`
37. **Consultas Agendadas** → Screenshot: `37-medico-consultas.png`
38. **Perfil Médico** → Screenshot: `38-medico-perfil.png`

---

## 1️⃣2️⃣ ENFERMEIRO (LOGOUT E LOGIN)

**Pasta:** `docs/screenshots/10-enfermeiro/`

**Logout** → Login: enfermeiro@teste.com / teste123

39. **Dashboard Enfermeiro** → Screenshot: `39-enfermeiro-dashboard.png`
40. **Solicitações** → Screenshot: `40-enfermeiro-solicitacoes.png`
41. **Perfil** → Screenshot: `41-enfermeiro-perfil.png`

---

## 1️⃣3️⃣ ADMIN (LOGOUT E LOGIN)

**Pasta:** `docs/screenshots/11-admin/`

**Logout** → Login: admin@teste.com / teste123

42. **Dashboard Admin** → Screenshot: `42-admin-dashboard.png`
43. **Usuários** → Screenshot: `43-admin-usuarios.png`
44. Criar usuário → Screenshot: `44-admin-criar-user.png`
45. **Relatórios** → Screenshot: `45-admin-relatorios.png`
46. Gráficos → Screenshot: `46-admin-graficos.png`
47. **Configurações Sistema** → Screenshot: `47-admin-config.png`

---

## 💾 PASSO 3: ORGANIZAR (5 min)

### Salvar Screenshots

As capturas do Windows vão para:
```
C:\Users\Felipe\Pictures\Screenshots\
```

Ou use **Paint** e salve manualmente em:
```
C:\Users\Felipe\Screenshots\RenoveJa\
```

---

## 📤 PASSO 4: ENVIAR PRO PROJETO (5 min)

### Copiar do Windows pro WSL

```bash
# Copiar todos de uma vez
cp /mnt/c/Users/Felipe/Screenshots/RenoveJa/*.png /home/elipe/clawd/projeto-app/docs/screenshots/

# Ou organizar por pasta
cp /mnt/c/Users/Felipe/Screenshots/RenoveJa/01-*.png /home/elipe/clawd/projeto-app/docs/screenshots/01-auth/
cp /mnt/c/Users/Felipe/Screenshots/RenoveJa/02-*.png /home/elipe/clawd/projeto-app/docs/screenshots/01-auth/
# ... etc
```

### Ou usar Windows Explorer

1. Abrir: `\\wsl.localhost\Ubuntu\home\elipe\clawd\projeto-app\docs\screenshots\`
2. Arrastar e soltar as imagens nas pastas corretas

---

## 🚀 PASSO 5: COMMIT E PUSH (2 min)

```bash
cd /home/elipe/clawd/projeto-app

# Ver o que foi adicionado
git status

# Adicionar screenshots
git add docs/screenshots/

# Commit
git commit -m "📸 Adiciona screenshots completos do app - estado atual

- 47+ screenshots organizados por categoria
- Autenticação (5)
- Onboarding (3)
- Home/Dashboard (4)
- Receitas (7)
- Exames (2)
- Consultas (3)
- Chat (1)
- Vídeo (2)
- Configurações (3)
- Farmácias (2)
- Médico (6)
- Enfermeiro (3)
- Admin (6)

Todas as telas principais do app capturadas"

# Push
git push origin main
```

---

## ✅ CHECKLIST

- [ ] Backend rodando (port 8000)
- [ ] Frontend rodando (port 19006)
- [ ] Navegador aberto (localhost:19006)
- [ ] DevTools (F12) com iPhone 14 Pro
- [ ] Usuários criados no Supabase
- [ ] Senhas conhecidas (teste123)

**SEQUÊNCIA:**
- [ ] Login como PACIENTE → 32 screenshots
- [ ] Logout → Login como MÉDICO → 6 screenshots
- [ ] Logout → Login como ENFERMEIRO → 3 screenshots
- [ ] Logout → Login como ADMIN → 6 screenshots

**ORGANIZAR:**
- [ ] Copiar screenshots do Windows
- [ ] Organizar nas pastas corretas
- [ ] Renomear se necessário

**ENVIAR:**
- [ ] Git add
- [ ] Git commit
- [ ] Git push

---

## 🎯 META

**Objetivo:** 40-50 screenshots de alta qualidade  
**Tempo:** ~60 minutos  
**Resultado:** Documentação visual completa do app

---

## 💡 DICAS

1. **Capture rápido:** Win + Shift + S → Selecionar área → Salvar
2. **Nomeie depois:** Capture tudo primeiro, organize depois
3. **Dark Mode:** Opcional - capture versão light primeiro
4. **Erros:** Tudo bem ter telas de erro - faz parte do app
5. **Loading:** Capture estados de loading também

---

**PRONTO! BORA CAPTURAR!** 📸🚀

Use este guia como checklist e vá marcando conforme captura!
