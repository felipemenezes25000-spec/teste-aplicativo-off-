# 🏥 RenoveJá - Plataforma de Telemedicina

Sistema completo de telemedicina com renovação de receitas, solicitação de exames e consultas por vídeo.

## 📋 Funcionalidades

- **Pacientes:** Solicitar renovação de receitas, exames e consultas
- **Médicos:** Analisar e aprovar solicitações, assinar documentos
- **Enfermeiros:** Triagem de solicitações de exames
- **Admin:** Gerenciar usuários, médicos e solicitações

## 🚀 Como Rodar o Projeto

### Opção 1: Docker (Recomendado) 🐳

```bash
# Clone o repositório
git clone <seu-repo>
cd <pasta-do-projeto>

# Rode tudo com um comando
docker-compose up -d

# Acesse:
# Frontend: http://localhost:3000
# Backend: http://localhost:8001
# MongoDB: localhost:27017
```

### Opção 2: Manual

#### Pré-requisitos
- Node.js 18+ 
- Python 3.10+
- MongoDB (local ou Atlas)
- Yarn ou npm

#### 1. Backend (FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Rodar o servidor
uvicorn server:app --reload --port 8001
```

#### 2. Frontend (Expo)

```bash
cd frontend

# Instalar dependências
yarn install
# ou: npm install

# Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL do backend

# Rodar o projeto
yarn start
# ou: npx expo start
```

#### 3. MongoDB

**Opção A - Local:**
```bash
# Instalar MongoDB Community
# https://www.mongodb.com/try/download/community

# Iniciar MongoDB
mongod
```

**Opção B - Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Opção C - MongoDB Atlas (Cloud):**
1. Crie conta em https://www.mongodb.com/atlas
2. Crie um cluster gratuito
3. Pegue a connection string e coloque no .env

## 📱 Testando no Celular

1. Instale o app **Expo Go** no celular
2. Rode `yarn start` no frontend
3. Escaneie o QR Code com o Expo Go

## 🔐 Variáveis de Ambiente

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=renoveja
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica
```

### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

## 👥 Usuários de Teste

Após rodar o projeto, você pode criar usuários:

1. **Paciente:** Cadastre-se pela tela inicial
2. **Médico:** Clique em "É médico? Cadastre-se aqui"
3. **Enfermeiro:** Clique em "É enfermeiro(a)? Cadastre-se aqui"
4. **Admin:** Crie manualmente no banco:

```javascript
// No MongoDB Compass ou mongosh:
db.users.insertOne({
  id: "admin-1",
  name: "Admin",
  email: "admin@renoveja.com",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWWQIqS5qeO", // senha: admin123
  role: "admin",
  created_at: new Date()
})
```

## 🏗️ Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py          # API FastAPI
│   ├── integrations.py    # Serviços externos
│   ├── requirements.txt   # Dependências Python
│   └── .env.example       # Exemplo de configuração
│
├── frontend/
│   ├── app/               # Telas (Expo Router)
│   │   ├── (auth)/        # Login, Registro
│   │   ├── (tabs)/        # Home, Histórico, Perfil
│   │   ├── admin/         # Painel Admin
│   │   ├── doctor/        # Painel Médico
│   │   ├── nurse/         # Painel Enfermagem
│   │   └── ...            # Outras telas
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Contextos React
│   │   ├── services/      # APIs e serviços
│   │   └── utils/         # Utilitários
│   ├── package.json       # Dependências Node
│   └── .env.example       # Exemplo de configuração
│
├── docker-compose.yml     # Orquestração Docker
└── README.md              # Este arquivo
```

## 🔧 Troubleshooting

### Erro: "Cannot connect to MongoDB"
- Verifique se o MongoDB está rodando
- Verifique a MONGO_URL no .env

### Erro: "Network request failed" no app
- Verifique se o backend está rodando na porta 8001
- Verifique a EXPO_PUBLIC_BACKEND_URL no frontend/.env
- Se estiver no celular, use o IP da máquina ao invés de localhost

### Erro: "Module not found"
```bash
# Frontend
cd frontend && rm -rf node_modules && yarn install

# Backend
cd backend && pip install -r requirements.txt
```

### Tela branca no app
```bash
cd frontend
rm -rf node_modules .expo .metro-cache
yarn install
yarn start --clear
```

## 📄 Licença

MIT

## 🤝 Suporte

Dúvidas? Abra uma issue no repositório.
