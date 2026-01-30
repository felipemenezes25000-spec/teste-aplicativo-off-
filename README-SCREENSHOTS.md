# 📸 README - Screenshots do RenoveJá+

## 🎯 Objetivo
Documentar visualmente **TODAS as 52 telas** do aplicativo RenoveJá+.

---

## ✅ Status Atual

### Screenshots Existentes (25 telas)
- ✅ Autenticação (4)
- ✅ Legal/Termos (3)
- ✅ Dashboard Paciente (4)
- ✅ Fluxo Receitas (4)
- ✅ Exames (1)
- ✅ Teleconsulta (1)
- ✅ Dashboard Médico (2)
- ✅ Dashboard Enfermeiro (1)
- ✅ Dashboard Admin (3)
- ✅ Outros (2)

**Localização:** `docs/screenshots/`

### Screenshots Pendentes (27 telas)
- ⏳ Chat (1)
- ⏳ Videochamada (1)
- ⏳ Solicitações detalhadas (4)
- ⏳ Telas médico/enfermeiro dinâmicas (3)
- ⏳ Layouts estruturais (16)

---

## 📚 Guias Disponíveis

| Guia | Descrição | Tempo |
|------|-----------|-------|
| **SCREENSHOTS-GUIA-RAPIDO.md** | ⚡ Passo-a-passo simplificado | 40 min |
| **CAPTURAR-TODAS-TELAS.md** | 📋 Guia completo detalhado | - |
| **GALERIA-COMPLETA.md** | 🖼️ Índice visual dos screenshots | - |
| **criar-usuarios-teste.sql** | 👥 Criar 4 usuários de teste | 2 min |

---

## 🚀 Como Capturar (Resumo)

### 1. Preparar (5 min)
```bash
# Backend
cd backend && python3 server.py

# Frontend (nova aba)
cd frontend && npm start
```

**Criar usuários:** Execute `criar-usuarios-teste.sql` no Supabase

### 2. Capturar (30 min)
1. Pressione **`w`** no Expo (abre navegador)
2. **F12** → Toggle Device (📱)
3. Escolha: iPhone 14 Pro
4. Navegue pelo app
5. **Win + Shift + S** para capturar cada tela

### 3. Organizar (5 min)
Salve em: `docs/screenshots/[categoria]/[numero]-[nome].png`

### 4. Enviar (2 min)
```bash
git add docs/screenshots/
git commit -m "📸 Screenshots [categoria]"
git push origin main
```

---

## 👥 Contas de Teste

Após executar `criar-usuarios-teste.sql`:

| Email | Senha | Role |
|-------|-------|------|
| paciente@teste.com | teste123 | Paciente |
| medico@teste.com | teste123 | Médico |
| enfermeiro@teste.com | teste123 | Enfermeiro |
| admin@teste.com | teste123 | Admin |

---

## 📂 Estrutura de Pastas

```
docs/screenshots/
├── 01-auth/              # Autenticação (4)
├── 02-legal/             # Termos (3)
├── 03-paciente/          # Dashboard (4)
├── 04-receitas/          # Receitas (4)
├── 05-exames/            # Exames (1)
├── 06-teleconsulta/      # Consultas (1)
├── 07-chat/              # Chat (1) ⏳
├── 08-video/             # Vídeo (1) ⏳
├── 09-solicitacoes/      # Requests (4) ⏳
├── 10-medico/            # Médico (5)
├── 11-enfermeiro/        # Enfermeiro (2)
├── 12-admin/             # Admin (3)
└── 13-outros/            # Config + Farmácias (2)
```

---

## 🎨 Padrões de Captura

### Resolução
- **iPhone 14 Pro:** 375 x 812
- **Pixel 5:** 412 x 915

### Formato
- **PNG** (melhor qualidade)
- **Compressão:** Moderada

### Nomenclatura
```
[numero]-[nome-descritivo].png

Exemplos:
01-splash.png
02-login.png
08-home-paciente.png
26-medico-dashboard.png
```

### Dark Mode (Opcional)
Criar pasta separada:
```
docs/screenshots-dark/
```

---

## ✅ Checklist de Captura

### Essenciais (20 telas)
- [ ] Splash
- [ ] Login
- [ ] Registro
- [ ] Home (paciente)
- [ ] Histórico
- [ ] Perfil
- [ ] Receitas - 4 telas do fluxo
- [ ] Exames
- [ ] Consultas
- [ ] Configurações
- [ ] Dashboard Médico
- [ ] Análise (médico)
- [ ] Dashboard Enfermeiro
- [ ] Dashboard Admin
- [ ] Usuários (admin)
- [ ] Relatórios (admin)

### Complementares (15 telas)
- [ ] Termos de uso
- [ ] Privacidade
- [ ] Consentimento
- [ ] Notificações
- [ ] Chat
- [ ] Videochamada
- [ ] Farmácias
- [ ] Esqueci senha
- [ ] Consultas (médico)
- [ ] Request details
- [ ] Receita view
- [ ] Sala de espera
- [ ] Avaliação
- [ ] Chat médico
- [ ] Request enfermeiro

### Avançadas (17 telas)
Telas dinâmicas que precisam de dados reais e interação completa.

---

## 📊 Meta

**Objetivo:** 35+ screenshots de alta qualidade  
**Cobertura:** 67% das telas (35/52)  
**Status:** 25/35 (71% da meta)

---

## 🔗 Links Úteis

- **Galeria completa:** [GALERIA-COMPLETA.md](GALERIA-COMPLETA.md)
- **Telas pendentes:** [SCREENSHOTS-PENDENTES.md](SCREENSHOTS-PENDENTES.md)
- **Guia rápido:** [SCREENSHOTS-GUIA-RAPIDO.md](SCREENSHOTS-GUIA-RAPIDO.md)
- **Guia completo:** [CAPTURAR-TODAS-TELAS.md](CAPTURAR-TODAS-TELAS.md)

---

## 💡 Dicas

1. **Use navegador:** Mais fácil que emulador
2. **Ferramenta de Captura:** Win + Shift + S
3. **Organize depois:** Capture primeiro, renomeie depois
4. **Dark mode:** Opcional, mas interessante
5. **Telas dinâmicas:** Podem precisar de dados mockados

---

## ⏱️ Tempo Estimado

- **Mínimo (20 telas):** 20 minutos
- **Recomendado (35 telas):** 40 minutos
- **Completo (52 telas):** 60+ minutos

---

**Pronto para começar!** 🚀

Execute o guia rápido: [SCREENSHOTS-GUIA-RAPIDO.md](SCREENSHOTS-GUIA-RAPIDO.md)
