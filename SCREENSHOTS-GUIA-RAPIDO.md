# ⚡ Guia Rápido - Screenshots de Todas as Telas

## 🎯 3 PASSOS SIMPLES

---

## 1️⃣ PREPARAR (5 min)

### A. Criar Usuários de Teste

1. Supabase → SQL Editor → New query
2. Copiar: `criar-usuarios-teste.sql`
3. Colar e RUN
4. Você terá 4 contas:
   - paciente@teste.com
   - medico@teste.com
   - enfermeiro@teste.com
   - admin@teste.com
   - **Senha de todos:** `teste123`

### B. Rodar o App

**Terminal 1 (Backend):**
```bash
cd /home/elipe/clawd/projeto-app/backend
python3 server.py
```

**Terminal 2 (Frontend):**
```bash
cd /home/elipe/clawd/projeto-app/frontend
npm start
```

Pressione **`w`** (abrir no navegador)

### C. Configurar Navegador

1. Pressione **F12**
2. Clique no ícone 📱 (Toggle Device Toolbar)
3. Escolha: **iPhone 14 Pro** (375x812)

---

## 2️⃣ CAPTURAR (30 min)

### Atalho Windows: Win + Shift + S

Use a ferramenta de captura do Windows e vá navegando:

### Sequência:

#### Login como PACIENTE (paciente@teste.com / teste123)
1. Splash → Screenshot
2. Login → Screenshot
3. Criar conta → Screenshot
4. Esqueci senha → Screenshot
5. Home → Screenshot
6. Histórico (tab) → Screenshot
7. Notificações (tab) → Screenshot
8. Perfil (tab) → Screenshot
9. Home → Receitas → Screenshot
10. Preencher → Screenshot
11. Upload → Screenshot
12. Pagamento → Screenshot
13. Exames → Screenshot
14. Consultas → Screenshot
15. Configurações → Screenshot

#### Logout → Login como MÉDICO (medico@teste.com / teste123)
16. Dashboard Médico → Screenshot
17. Consultas → Screenshot
18. Analisar (clicar em request) → Screenshot
19. Chat → Screenshot

#### Logout → Login como ENFERMEIRO (enfermeiro@teste.com / teste123)
20. Dashboard Enfermeiro → Screenshot

#### Logout → Login como ADMIN (admin@teste.com / teste123)
21. Dashboard Admin → Screenshot
22. Usuários → Screenshot
23. Relatórios → Screenshot

---

## 3️⃣ ENVIAR (2 min)

### Salvar Screenshots

Salve todas as capturas em:
```
C:\Users\Felipe\Screenshots\RenoveJa\
```

### Copiar pro Projeto

```bash
# Copiar do Windows pro WSL
cp /mnt/c/Users/Felipe/Screenshots/RenoveJa/* /home/elipe/clawd/projeto-app/docs/screenshots/novas/

# Ou usar o Explorer
\\wsl.localhost\Ubuntu\home\elipe\clawd\projeto-app\docs\screenshots\
```

### Commit + Push

```bash
cd /home/elipe/clawd/projeto-app

git add docs/screenshots/
git commit -m "📸 Adiciona screenshots completos - todas as telas"
git push origin main
```

---

## 📋 CHECKLIST MÍNIMO (20 screenshots essenciais)

- [ ] 01. Splash
- [ ] 02. Login
- [ ] 03. Registro
- [ ] 04. Home Paciente
- [ ] 05. Histórico
- [ ] 06. Perfil
- [ ] 07. Receitas (início)
- [ ] 08. Receitas (upload)
- [ ] 09. Receitas (pagamento)
- [ ] 10. Receitas (confirmação)
- [ ] 11. Exames
- [ ] 12. Consultas
- [ ] 13. Configurações
- [ ] 14. Dashboard Médico
- [ ] 15. Consultas Médico
- [ ] 16. Análise (médico)
- [ ] 17. Dashboard Enfermeiro
- [ ] 18. Dashboard Admin
- [ ] 19. Usuários (admin)
- [ ] 20. Relatórios (admin)

---

## 💡 DICA PRO

**Capturar rápido:**
1. Win + Shift + S (abre ferramenta de captura)
2. Selecionar área do celular emulado
3. Screenshot salvo no clipboard
4. Ctrl + V no Paint
5. Salvar como "01-splash.png"
6. Próxima tela...

**Organizar depois:**
- Renomear todos de uma vez
- Mover para pastas categorizadas
- Fazer commit

---

## ⚡ TEMPO TOTAL

- **Preparar:** 5 min
- **Capturar:** 20-30 min
- **Organizar:** 5 min
- **Enviar:** 2 min

**TOTAL:** ~40 minutos para screenshots completos!

---

**Pronto! Simples e rápido!** 📸✨
