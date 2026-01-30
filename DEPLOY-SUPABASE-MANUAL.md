# 🚀 Deploy Manual no Supabase - Passo a Passo

## 📋 Instruções Completas

### 1️⃣ Acessar o Supabase Dashboard

1. Abra: **https://cnfadyhxczrldavmlobh.supabase.co**
2. Faça login na sua conta Supabase

---

### 2️⃣ Abrir o SQL Editor

1. Na barra lateral **esquerda**, clique em **"SQL Editor"** (ícone de banco de dados com </> )
2. Clique no botão **"+ New query"** (canto superior direito)

---

### 3️⃣ Copiar o SQL

1. Abra o arquivo `supabase/setup-complete.sql` deste projeto
2. **Selecione TODO o conteúdo** (Ctrl+A ou Cmd+A)
3. **Copie** (Ctrl+C ou Cmd+C)

---

### 4️⃣ Colar e Executar

1. **Cole** o SQL no editor que abriu (Ctrl+V ou Cmd+V)
2. Clique no botão **"RUN"** (canto inferior direito)
   - Ou pressione **Ctrl+Enter** (Windows/Linux)
   - Ou pressione **Cmd+Enter** (Mac)

---

### 5️⃣ Aguardar Execução

- O Supabase executará ~200+ comandos SQL
- Você verá mensagens de sucesso aparecerem
- **Aguarde até aparecer:** `Database setup completed successfully!`

**Tempo estimado:** 30-60 segundos

---

### 6️⃣ Verificar Tabelas Criadas

1. Na barra lateral, clique em **"Table Editor"**
2. Você deve ver **10 tabelas** criadas:
   - ✅ `users`
   - ✅ `requests`
   - ✅ `prescriptions`
   - ✅ `exam_requests`
   - ✅ `consultation_requests`
   - ✅ `chat_messages`
   - ✅ `notifications`
   - ✅ `pharmacies`
   - ✅ `doctor_schedules`
   - ✅ `nurse_availability`

---

### 7️⃣ Verificar Dados Iniciais

1. Clique na tabela **`users`**
2. Você deve ver **2 usuários** já criados:
   - `admin@renoveja.com` (Admin)
   - `dr.exemplo@renoveja.com` (Médico)

3. Clique na tabela **`pharmacies`**
4. Você deve ver **1 farmácia** criada:
   - Farmácia Popular

---

## ✅ Validação Final

Execute este comando no seu terminal para verificar se está tudo OK:

```bash
cd projeto-app
python3 deploy-supabase.py
```

**Resultado esperado:**
```
🔍 Verificando tabelas criadas...
📊 Status das Tabelas:
==================================================
   users                          ✅ OK (2 registros)
   requests                       ✅ OK (0 registros)
   prescriptions                  ✅ OK (0 registros)
   exam_requests                  ✅ OK (0 registros)
   consultation_requests          ✅ OK (0 registros)
   chat_messages                  ✅ OK (0 registros)
   notifications                  ✅ OK (0 registros)
   pharmacies                     ✅ OK (1 registros)
   doctor_schedules               ✅ OK (0 registros)
   nurse_availability             ✅ OK (0 registros)
==================================================

🎯 Resultado: 10/10 tabelas OK
✅ BANCO DE DADOS COMPLETO E FUNCIONANDO!
```

---

## 🔐 Row Level Security (RLS)

O SQL já configurou **RLS (segurança por linha)** automaticamente:

### Policies Criadas

#### Users (Usuários)
- ✅ Usuários podem ver próprio perfil
- ✅ Usuários podem editar próprio perfil
- ✅ Admins podem ver todos os usuários

#### Requests (Solicitações)
- ✅ Pacientes/Médicos podem ver suas solicitações
- ✅ Pacientes podem criar solicitações
- ✅ Médicos podem atualizar solicitações atribuídas

#### Prescriptions (Receitas)
- ✅ Pacientes e médicos podem ver suas receitas
- ✅ Médicos podem criar receitas

#### Chat Messages
- ✅ Participantes podem ver mensagens da conversa
- ✅ Usuários podem enviar mensagens

#### Notifications
- ✅ Usuários podem ver próprias notificações
- ✅ Usuários podem marcar como lidas

#### Pharmacies/Schedules
- ✅ Público pode ver farmácias e agendas ativas

---

## 🔄 Auto-Update Timestamps

Triggers criados automaticamente para atualizar `updated_at`:

- ✅ `users`
- ✅ `requests`
- ✅ `prescriptions`
- ✅ `exam_requests`
- ✅ `consultation_requests`
- ✅ `pharmacies`
- ✅ `nurse_availability`

---

## 🛠️ Funções RPC Criadas

### `get_available_doctors(specialty_filter)`
Retorna médicos disponíveis (opcionalmente filtrados por especialidade)

**Uso:**
```sql
SELECT * FROM get_available_doctors('Clínico Geral');
```

### `get_admin_stats()`
Retorna estatísticas do sistema para o dashboard admin

**Uso:**
```sql
SELECT * FROM get_admin_stats();
```

**Retorna:**
```json
{
  "total_users": 2,
  "total_patients": 0,
  "total_doctors": 1,
  "total_nurses": 0,
  "pending_requests": 0,
  "completed_today": 0,
  "total_prescriptions": 0,
  "active_consultations": 0
}
```

---

## 🧪 Testar Inserção Manual

Você pode testar criando um usuário manualmente:

1. No **Table Editor**, clique em **`users`**
2. Clique em **"Insert row"**
3. Preencha:
   - `email`: seu-email@teste.com
   - `name`: Seu Nome
   - `role`: patient
   - `cpf`: 12345678901 (opcional)
4. Clique em **"Save"**

---

## 🚨 Problemas Comuns

### "relation already exists"
- ✅ **Normal!** Significa que a tabela já existe
- Solução: Ignore o erro ou delete as tabelas antes (DROP)

### "permission denied"
- ❌ Você está usando a chave errada
- Solução: Use a **Service Role Key** (não a Anon Key)

### "syntax error near..."
- ❌ Erro no SQL
- Solução: Copie novamente o arquivo `setup-complete.sql`

---

## 📊 Estrutura Criada

### Resumo das Tabelas

| Tabela | Descrição | Registros Iniciais |
|--------|-----------|-------------------|
| `users` | Usuários do sistema | 2 (admin + médico) |
| `requests` | Solicitações de serviços | 0 |
| `prescriptions` | Receitas médicas | 0 |
| `exam_requests` | Pedidos de exames | 0 |
| `consultation_requests` | Consultas agendadas | 0 |
| `chat_messages` | Mensagens do chat | 0 |
| `notifications` | Notificações | 0 |
| `pharmacies` | Farmácias parceiras | 1 |
| `doctor_schedules` | Agendas médicas | 0 |
| `nurse_availability` | Disponibilidade enfermeiros | 0 |

### Total
- **10 tabelas**
- **14 policies (RLS)**
- **7 triggers (auto-update)**
- **2 funções RPC**
- **3 registros seed** (2 usuários + 1 farmácia)

---

## ✅ Checklist Final

Antes de rodar o app, verifique:

- [ ] 10 tabelas criadas no Table Editor
- [ ] 2 usuários em `users` (admin + médico)
- [ ] 1 farmácia em `pharmacies`
- [ ] RLS habilitado (ícone de cadeado nas tabelas)
- [ ] Nenhum erro vermelho no SQL Editor
- [ ] Validação python3 retornou 10/10 OK

---

## 🎯 Próximos Passos

Após completar o deploy:

1. **Rodar Backend:**
```bash
cd projeto-app/backend
pip install -r requirements.txt
python server.py
```

2. **Rodar Frontend:**
```bash
cd projeto-app/frontend
npm install
npm start
```

3. **Testar App:**
- Criar conta (register)
- Fazer login
- Criar solicitação
- Ver dashboard

---

**🎉 Pronto! Seu banco de dados Supabase está configurado e pronto para uso!**
