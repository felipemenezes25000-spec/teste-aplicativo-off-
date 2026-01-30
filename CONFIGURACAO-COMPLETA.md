# ✅ Configuração Completa - RenoveJá+ App

**Data:** 30/01/2025  
**Status:** PRONTO PARA RODAR 🚀

---

## 🔐 Credenciais Configuradas

### Supabase ✅
- **URL:** `https://cnfadyhxczrldavmlobh.supabase.co`
- **Anon Key:** Configurada em `.env`
- **Service Role Key:** Configurada em `.env`

### Arquivos Criados
- ✅ `backend/.env` - Variáveis do backend
- ✅ `frontend/.env` - Variáveis do frontend
- ✅ `frontend/src/services/supabase.ts` - Cliente Supabase

---

## 📦 Dependências Atualizadas

### Backend
```txt
✅ supabase==2.9.0 (ADICIONADO)
✅ fastapi==0.109.0
✅ uvicorn==0.27.0
✅ python-dotenv==1.0.0
✅ bcrypt==4.1.2
```

### Frontend
```json
✅ @supabase/supabase-js (adicionar ao package.json)
✅ @react-native-async-storage/async-storage
✅ axios
✅ expo
```

---

## 🚀 Como Rodar AGORA

### 1️⃣ Backend (FastAPI + Supabase)

```bash
cd projeto-app/backend

# Criar ambiente virtual (recomendado)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Rodar servidor
python server.py
```

**Backend rodará em:** `http://localhost:8000`  
**Docs API:** `http://localhost:8000/docs`

---

### 2️⃣ Frontend (React Native/Expo)

```bash
cd projeto-app/frontend

# Instalar dependências
npm install

# Adicionar Supabase client
npm install @supabase/supabase-js

# Rodar app
npm start
```

**Opções:**
- Pressione `a` - Android emulator
- Pressione `i` - iOS simulator
- Pressione `w` - Web browser
- Scan QR code - Expo Go app (celular)

---

## 🗄️ Banco de Dados Supabase

### Próximos Passos

1. **Acessar Supabase Dashboard:**
   - URL: https://cnfadyhxczrldavmlobh.supabase.co
   - Login: sua conta Supabase

2. **Criar Tabelas (SQL Editor):**

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Solicitações
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES users(id) NOT NULL,
  doctor_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('prescription', 'exam', 'consultation')),
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Receitas
CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) NOT NULL,
  doctor_id UUID REFERENCES users(id) NOT NULL,
  patient_id UUID REFERENCES users(id) NOT NULL,
  medications JSONB NOT NULL,
  instructions TEXT,
  valid_until DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Policies (exemplo básico - ajustar conforme necessário)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Patients can create requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can read own requests" ON requests
  FOR SELECT USING (
    auth.uid() = patient_id OR 
    auth.uid() = doctor_id
  );
```

3. **Executar Migrations:**
   - Copiar SQL acima
   - Colar no SQL Editor do Supabase
   - Executar

---

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
SUPABASE_URL=https://cnfadyhxczrldavmlobh.supabase.co
SUPABASE_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=RQGKyG1piBpRwT7e
PORT=8000
ENVIRONMENT=development
```

### Frontend (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://cnfadyhxczrldavmlobh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## 📱 Testando o App

### Fluxo Básico

1. **Abrir app** → Ver splash screen
2. **Tela de login** → Criar conta (register)
3. **Home** → Ver dashboard
4. **Solicitar receita** → Criar nova solicitação
5. **Perfil** → Ver dados do usuário

### Contas de Teste (criar via app)

```
Paciente:
  Email: paciente@teste.com
  Senha: 123456

Médico:
  Email: medico@teste.com
  Senha: 123456
```

---

## 🎨 Sistema de Cores

### Light Mode
- Primary: `#00B4CD` (azul turquesa)
- Secondary: `#1A3A4A` (navy)
- Background: `#F8FAFB` (cinza claro)

### Dark Mode
- Primary: `#22D3EE` (ciano)
- Secondary: `#E2E8F0` (cinza)
- Background: `#0F172A` (navy escuro)

**Alternar tema:** App → Configurações → Tema

---

## ✅ Checklist de Configuração

- [x] Backend configurado com Supabase
- [x] Frontend configurado com Supabase
- [x] Variáveis de ambiente criadas (.env)
- [x] Cliente Supabase criado (supabase.ts)
- [x] API URL atualizada (api.ts)
- [x] Dependencies atualizadas (requirements.txt)
- [x] Sistema de cores aplicado (30/52 telas)
- [x] Logo oficial adicionada
- [ ] Supabase tables criadas (próximo passo)
- [ ] Dependências instaladas (npm/pip)
- [ ] App testado em emulador

---

## 🔄 Git Status

**Branch:** main  
**Último commit:** Adiciona configuração Supabase  
**Arquivos .env:** Ignorados pelo .gitignore ✅  
**Segurança:** Credenciais não vão pro GitHub ✅

---

## 📞 Suporte

**Problemas comuns:**

1. **Backend não conecta ao Supabase:**
   - Verificar URL e keys em `.env`
   - Instalar `pip install supabase`

2. **Frontend não conecta ao backend:**
   - Verificar `EXPO_PUBLIC_API_URL` em `.env`
   - Backend deve estar rodando em localhost:8000

3. **Expo não inicia:**
   - Rodar `npm install` novamente
   - Limpar cache: `expo start --clear`

---

**Status:** ✅ TUDO CONFIGURADO  
**Pronto para:** Criar tabelas no Supabase e testar! 🎉
