# 🏥 RenoveJá+

**Plataforma de Telemedicina** - Renovação de receitas, pedidos de exames e teleconsultas.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/backend-FastAPI-green)
![Frontend](https://img.shields.io/badge/frontend-Expo%20React%20Native-blue)
![Database](https://img.shields.io/badge/database-Supabase-purple)

---

## 📱 Sobre o Projeto

O RenoveJá+ é um aplicativo que conecta pacientes a médicos para:

- 💊 **Renovação de Receitas** - Simples, controladas e azuis
- 🔬 **Pedidos de Exames** - Laboratório e imagem
- 📹 **Teleconsultas** - Consultas por vídeo

### Fluxo do Paciente
1. Solicita receita/exame/consulta
2. Médico analisa e aprova
3. Paciente paga via PIX
4. Recebe receita digital assinada

---

## 🏗️ Estrutura do Projeto

```
projeto-renoveja/
├── backend/                 # API FastAPI
│   ├── server.py           # Servidor principal
│   ├── database.py         # Conexão Supabase
│   ├── queue_manager.py    # Gerenciamento de filas
│   └── requirements.txt    # Dependências Python
│
├── frontend/               # App React Native (Expo)
│   ├── app/               # Rotas (Expo Router)
│   │   ├── (auth)/        # Login, registro
│   │   ├── (tabs)/        # Tabs do paciente
│   │   ├── doctor/        # Dashboard médico
│   │   ├── nurse/         # Dashboard enfermagem
│   │   ├── admin/         # Dashboard admin
│   │   └── prescription/  # Fluxo de receitas
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # AuthContext, ThemeContext
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API client
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── supabase/              # Schema do banco
│   └── schema.sql
│
└── docs/                  # Documentação
    ├── ARQUITETURA.md     # Fluxos e diagramas
    └── ROADMAP_MELHORIAS.md
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- Conta no [Supabase](https://supabase.com)

### Backend

```bash
cd backend

# Criar .env
cp .env.example .env
# Editar com suas credenciais Supabase

# Instalar dependências
pip install -r requirements.txt

# Rodar servidor
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend

# Instalar dependências
yarn install

# Criar .env
cp .env.example .env
# Editar com URL da API

# Rodar app
yarn start
```

---

## 🔗 URLs

| Ambiente | URL |
|----------|-----|
| **API (Produção)** | https://teste-aplicativo-off-production.up.railway.app |
| **Docs da API** | https://teste-aplicativo-off-production.up.railway.app/docs |
| **Supabase** | https://supabase.com/dashboard/project/gklkznyyouwqsohszula |

---

## 👥 Tipos de Usuário

| Tipo | Descrição | Dashboard |
|------|-----------|-----------|
| **patient** | Paciente | `/(tabs)` |
| **doctor** | Médico | `/doctor` |
| **nurse** | Enfermeiro | `/nurse` |
| **admin** | Administrador | `/admin` |

---

## 📋 Status das Solicitações

```
submitted → in_review → approved_pending_payment → paid → signed → delivered
                ↓
            rejected
```

---

## ✨ Features

### Implementadas ✅
- [x] Autenticação (email/senha)
- [x] Registro de pacientes, médicos e enfermeiros
- [x] Solicitação de receitas
- [x] Fila de atendimento médico
- [x] Triagem de enfermagem (exames)
- [x] Aprovação/rejeição com motivo
- [x] Pagamento simulado (PIX)
- [x] Assinatura digital
- [x] Chat médico-paciente
- [x] Notificações no app
- [x] Dark mode
- [x] Skeleton loading

### Em Desenvolvimento 🚧
- [ ] Push notifications
- [ ] Pagamento real (MercadoPago)
- [ ] Teleconsulta por vídeo
- [ ] Lembretes de medicamento
- [ ] Biometria (Face ID / Touch ID)

---

## 🛠️ Tecnologias

### Backend
- **FastAPI** - Framework web
- **Supabase** - Banco de dados PostgreSQL
- **httpx** - Cliente HTTP async

### Frontend
- **Expo** - Framework React Native
- **Expo Router** - Navegação
- **React Native Reanimated** - Animações
- **Zustand** - Estado global

---

## 📄 Licença

Projeto privado - Todos os direitos reservados.

---

## 👨‍💻 Desenvolvido por

Felipe Menezes
