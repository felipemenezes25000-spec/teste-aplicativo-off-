# RenoveJá+ 🏥

Sistema completo de telemedicina desenvolvido em React Native (Expo) e Python (FastAPI), oferecendo teleconsultas, prescrições digitais e pedidos de exames médicos.

![RenoveJá+ Logo](logo-renoveja.png)

## 🚀 Características Principais

### Para Pacientes
- 📱 **Teleconsultas**: Consultas médicas por vídeo com profissionais qualificados
- 💊 **Prescrições Digitais**: Receitas médicas válidas em todo território nacional
- 🔬 **Pedidos de Exames**: Solicitação e acompanhamento de exames laboratoriais
- 💬 **Chat em Tempo Real**: Comunicação direta com médicos e enfermeiros
- 🔔 **Notificações Push**: Lembretes de consultas e atualizações de pedidos
- 🔐 **Login Biométrico**: Acesso seguro com impressão digital ou Face ID

### Para Profissionais de Saúde
- 👨‍⚕️ **Painel Médico**: Interface dedicada para atendimento e gestão de pacientes
- 📋 **Fila de Atendimento**: Sistema inteligente de distribuição de consultas
- 📄 **Assinatura Digital**: Validação de documentos médicos
- 📊 **Dashboard Administrativo**: Métricas e gestão completa da plataforma

## 🛠 Tecnologias

### Frontend
- **React Native** com Expo SDK 54
- **TypeScript** para type safety
- **Expo Router** para navegação
- **Zustand** para gerenciamento de estado
- **React Native Reanimated** para animações fluidas
- **Expo SecureStore** para armazenamento seguro de tokens

### Backend
- **FastAPI** (Python 3.11+)
- **Supabase** (PostgreSQL) como banco de dados
- **JWT** para autenticação
- **Mercado Pago** para processamento de pagamentos
- **Sentry** para monitoramento de erros
- **Rate Limiting** para proteção contra abuso

## 📋 Pré-requisitos

- Node.js 18+ e npm/yarn
- Python 3.11+
- Conta no Supabase
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI para builds (`npm install -g eas-cli`)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/felipemenezes25000-spec/teste-aplicativo-off-.git
cd teste-aplicativo-off-
```

### 2. Configure o Backend

```bash
cd backend

# Crie ambiente virtual
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instale dependências
pip install -r requirements.txt

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

### 3. Configure o Frontend

```bash
cd ../frontend

# Instale dependências
npm install --legacy-peer-deps
# ou
yarn install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com a URL da sua API
```

### 4. Configure o Banco de Dados

```bash
# No painel do Supabase, execute os SQLs em ordem:
# 1. supabase/schema.sql
# 2. supabase/setup-complete.sql
```

## 🚀 Executando o Projeto

### Backend
```bash
cd backend
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
expo start
# Pressione 'a' para Android ou 'i' para iOS
```

## 🧪 Testes

### Backend
```bash
cd backend
python -m pytest test_basic.py -v
```

### Frontend
```bash
cd frontend
npm test
```

## 📱 Build para Produção

### Configure o EAS
```bash
cd frontend
eas build:configure
```

### Android
```bash
eas build --platform android --profile production
```

### iOS
```bash
eas build --platform ios --profile production
```

## 🔒 Segurança

- ✅ Autenticação JWT com tokens seguros
- ✅ Armazenamento seguro com Expo SecureStore
- ✅ CORS configurado adequadamente
- ✅ Rate limiting implementado
- ✅ Validação robusta de dados
- ✅ Criptografia de senhas com bcrypt
- ✅ Monitoramento com Sentry

## 📝 Variáveis de Ambiente

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_key

# Mercado Pago (opcional)
MERCADOPAGO_ACCESS_TOKEN=seu_token

# Sentry (opcional)
SENTRY_DSN=https://xxx@sentry.io/yyy

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.renoveja.com.br
ENV=production
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
```

## 🏗 Arquitetura

```
teste-aplicativo-off-/
├── backend/
│   ├── server.py           # API principal
│   ├── database.py         # Conexão Supabase
│   ├── monitoring.py       # Configuração Sentry
│   ├── backup_manager.py   # Sistema de backup
│   └── requirements.txt    # Dependências Python
├── frontend/
│   ├── app/               # Rotas do Expo Router
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contexts (Auth, Theme)
│   │   ├── services/      # APIs e serviços
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utilitários
│   └── package.json       # Dependências JS
└── supabase/
    ├── schema.sql         # Estrutura do banco
    └── setup-complete.sql # Dados e policies
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

## 👥 Equipe

- **Felipe Menezes** - Desenvolvedor Principal

## 📞 Suporte

Para suporte, envie um email para suporte@renoveja.com.br

---

**RenoveJá+** - Transformando o acesso à saúde no Brasil 🇧🇷