# ⚡ Deploy Rápido - Só as Tabelas Faltantes

## ✅ Status Atual

**Já existem 5 tabelas:**
- ✅ users
- ✅ exam_requests
- ✅ consultation_requests
- ✅ chat_messages
- ✅ notifications

**Faltam apenas 5 tabelas:**
- ❌ requests (PRINCIPAL - solicitações)
- ❌ prescriptions (receitas)
- ❌ pharmacies (farmácias)
- ❌ doctor_schedules (agendas)
- ❌ nurse_availability (disponibilidade)

---

## 🚀 Execute AGORA (2 minutos)

### 1. Abra o Supabase
https://cnfadyhxczrldavmlobh.supabase.co

### 2. SQL Editor
Clique em **"SQL Editor"** (barra esquerda)

### 3. New Query
Clique em **"+ New query"**

### 4. Cole o SQL
Copie **TODO** o arquivo `supabase/missing-tables.sql`  
Cole no editor

### 5. Execute
Clique em **"RUN"** ou pressione **Ctrl/Cmd + Enter**

Aguarde ~10 segundos

### 6. Verifique
```bash
cd projeto-app
python3 deploy-sql-direct.py
```

**Resultado esperado:**
```
✅ users                          existe (0 registros)
✅ requests                       existe (0 registros)  ← NOVA!
✅ prescriptions                  existe (0 registros)  ← NOVA!
✅ exam_requests                  existe (0 registros)
✅ consultation_requests          existe (0 registros)
✅ chat_messages                  existe (0 registros)
✅ notifications                  existe (0 registros)
✅ pharmacies                     existe (1 registros)  ← NOVA!
✅ doctor_schedules               existe (0 registros)  ← NOVA!
✅ nurse_availability             existe (0 registros)  ← NOVA!

✅ TODAS AS TABELAS JÁ EXISTEM!
```

---

## 📋 O que será criado

### Tabela: `requests`
Solicitações de receitas, exames e consultas

**Campos principais:**
- patient_id, doctor_id, nurse_id
- type (prescription/exam/consultation)
- status (pending/completed/etc)
- attachments, ai_analysis
- payment_status, payment_amount

### Tabela: `prescriptions`
Receitas médicas digitais

**Campos principais:**
- request_id, patient_id, doctor_id
- medications (JSONB)
- valid_until (data de validade)
- pdf_url, digital_signature

### Tabela: `pharmacies`
Farmácias parceiras

**Campos principais:**
- name, cnpj, phone, email
- address (completo)
- latitude, longitude
- opening_hours (JSONB)

**Seed:** 1 farmácia (Farmácia Popular)

### Tabela: `doctor_schedules`
Agendas de disponibilidade dos médicos

**Campos principais:**
- doctor_id
- day_of_week (0-6)
- start_time, end_time

### Tabela: `nurse_availability`
Disponibilidade dos enfermeiros

**Campos principais:**
- nurse_id
- available (true/false)
- max_concurrent_patients
- shift (morning/afternoon/night)

---

## 🔐 Segurança (RLS)

Todas as tabelas já vêm com:
- ✅ Row Level Security habilitado
- ✅ Policies configuradas
- ✅ Triggers de auto-update

---

## ⚡ Arquivo a Executar

**Arquivo:** `supabase/missing-tables.sql`  
**Tamanho:** ~8KB  
**Comandos:** ~60  
**Tempo:** ~10 segundos  

---

## ✅ Depois de Executar

### Rodar Backend
```bash
cd backend
python server.py
```

### Rodar Frontend
```bash
cd frontend
npm start
```

---

**Pronto! Simples e rápido!** ⚡
