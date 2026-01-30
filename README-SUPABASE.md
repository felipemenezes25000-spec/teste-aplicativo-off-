# 🗄️ Configuração do Supabase - RenoveJá+

## ⚠️ IMPORTANTE - LEIA PRIMEIRO!

As tabelas do banco de dados **NÃO foram criadas automaticamente**.  
Você precisa **executar o SQL manualmente** no Supabase Dashboard.

---

## 🚀 PASSO-A-PASSO RÁPIDO

### 1. Abra o Supabase
https://cnfadyhxczrldavmlobh.supabase.co

### 2. SQL Editor
Clique em **"SQL Editor"** (barra lateral esquerda)

### 3. New Query
Clique em **"+ New query"**

### 4. Cole o SQL
Copie TUDO de: `supabase/setup-complete.sql`  
Cole no editor

### 5. Execute
Clique em **"RUN"** ou pressione **Ctrl/Cmd + Enter**

### 6. Aguarde
Vai executar ~200 comandos (30-60 segundos)

### 7. Verifique
```bash
python3 verify-supabase.py
```

Deve mostrar: **"10/10 tabelas encontradas ✅"**

---

## 📦 O que será criado

### Tabelas (10)
1. `users` - Usuários (pacientes, médicos, enfermeiros, admins)
2. `requests` - Solicitações de serviços
3. `prescriptions` - Receitas médicas
4. `exam_requests` - Pedidos de exames
5. `consultation_requests` - Consultas agendadas
6. `chat_messages` - Mensagens do chat
7. `notifications` - Notificações push
8. `pharmacies` - Farmácias parceiras
9. `doctor_schedules` - Agendas de médicos
10. `nurse_availability` - Disponibilidade de enfermeiros

### Segurança (RLS)
- ✅ Row Level Security habilitado
- ✅ 14 policies criadas
- ✅ Acesso restrito por role (patient/doctor/admin)

### Automação
- ✅ 7 triggers para auto-update de timestamps
- ✅ 2 funções RPC (get_available_doctors, get_admin_stats)

### Dados Iniciais
- ✅ Admin: admin@renoveja.com
- ✅ Médico: dr.exemplo@renoveja.com
- ✅ Farmácia: Farmácia Popular

---

## 🔐 Credenciais Configuradas

✅ `.env` criado no backend  
✅ `.env` criado no frontend  
✅ Service Role Key configurada  
✅ Anon Key configurada  

**Não commitar os arquivos .env!** (já está no .gitignore)

---

## 🧪 Testar Conexão

Após executar o SQL:

```bash
# Verificar tabelas
python3 verify-supabase.py

# Deve retornar:
# ✅ users                          OK (2 registros)
# ✅ requests                       OK (0 registros)
# ... 
# 🎯 Resultado: 10/10 tabelas encontradas
```

---

## 🏃 Rodar o App

Só depois de criar as tabelas:

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 📚 Documentação Completa

- **DEPLOY-SUPABASE-MANUAL.md** - Guia detalhado passo-a-passo
- **supabase/setup-complete.sql** - Script SQL completo
- **verify-supabase.py** - Script de validação

---

## 🆘 Problemas?

### Erro 401 no verify-supabase.py
➡️ **Tabelas ainda não foram criadas**  
Solução: Execute o SQL no Dashboard

### "relation already exists"
➡️ **Tabela já existe** (isso é OK!)  
Solução: Ignore o erro

### "permission denied"
➡️ **Chave errada**  
Solução: Use Service Role Key no backend

---

## ✅ Status Atual

- [x] SQL criado (setup-complete.sql)
- [x] Credenciais configuradas (.env)
- [x] Script de verificação (verify-supabase.py)
- [x] Documentação completa
- [ ] **SQL EXECUTADO NO SUPABASE** ← **PRÓXIMO PASSO!**
- [ ] Backend rodando
- [ ] Frontend rodando

---

**⏭️ PRÓXIMO PASSO:**  
Execute o SQL no Supabase Dashboard agora! 🚀
