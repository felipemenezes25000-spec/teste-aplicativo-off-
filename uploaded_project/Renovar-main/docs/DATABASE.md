# 📚 Documentação do Banco de Dados - RenoveJá+

Este documento explica todas as tabelas e colunas do banco de dados do sistema RenoveJá+.

---

## 📋 Índice

1. [profiles](#profiles---perfis-de-usuários)
2. [user_roles](#user_roles---papéis-de-usuários)
3. [doctor_profiles](#doctor_profiles---perfis-de-médicos)
4. [prescription_requests](#prescription_requests---solicitações-de-receitas)
5. [exam_requests](#exam_requests---solicitações-de-exames)
6. [consultation_requests](#consultation_requests---solicitações-de-consultas)
7. [payments](#payments---pagamentos)
8. [notifications](#notifications---notificações)
9. [chat_messages](#chat_messages---mensagens-do-chat)
10. [push_subscriptions](#push_subscriptions---assinaturas-de-notificações-push)

---

## profiles - Perfis de Usuários

Armazena informações pessoais de todos os usuários (pacientes e médicos).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único do perfil |
| `user_id` | uuid | ID do usuário no sistema de autenticação (auth.users) |
| `name` | text | Nome completo do usuário |
| `email` | text | E-mail do usuário (validado: formato válido, bloqueia domínios temporários) |
| `phone` | text | Telefone no formato (00) 00000-0000 (validado: 10 ou 11 dígitos) |
| `cpf` | text | CPF no formato 000.000.000-00 (validado: formato e dígitos verificadores) |
| `birth_date` | date | Data de nascimento (validado: não pode ser futuro, mínimo 1900-01-01) |
| `avatar_url` | text | URL da foto de perfil (validado: formato URL válido) |
| `address` | jsonb | Endereço completo em formato JSON* (validado: estrutura JSONB) |
| `created_at` | timestamp | Data de criação do perfil |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ Email: formato válido e bloqueio de domínios temporários
- ✅ Telefone: formato brasileiro (10 ou 11 dígitos)
- ✅ CPF: formato e validação de dígitos verificadores
- ✅ Birth Date: não pode ser futuro, mínimo 1900-01-01
- ✅ Avatar URL: formato URL válido
- ✅ Address: estrutura JSONB validada

**Estrutura do campo `address`:**
```json
{
  "street": "Nome da rua",
  "number": "123",
  "complement": "Apto 45",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567"
}
```

---

## user_roles - Papéis de Usuários

Define o papel (role) de cada usuário no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | ID do usuário |
| `role` | app_role | Papel do usuário: `patient`, `doctor` ou `admin` |
| `created_at` | timestamp | Data de atribuição do papel |

**Valores possíveis para `role`:**
- `patient` - Paciente (padrão para novos usuários)
- `doctor` - Médico
- `admin` - Administrador

---

## doctor_profiles - Perfis de Médicos

Informações específicas dos médicos cadastrados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | ID do usuário médico |
| `crm` | text | Número do CRM (validado: formato e estado) |
| `crm_state` | text | Estado do CRM (validado: sigla brasileira válida) |
| `specialty` | text | Especialidade médica (ex: Clínico Geral, Cardiologia) |
| `bio` | text | Biografia/descrição profissional |
| `available` | boolean | Se o médico está disponível para atendimentos |
| `rating` | numeric | Avaliação média (validado: entre 0 e 5) |
| `total_consultations` | integer | Total de consultas realizadas (validado: >= 0) |
| `created_at` | timestamp | Data de cadastro |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ CRM: formato válido (4 a 8 dígitos) e estado brasileiro válido
- ✅ Rating: entre 0 e 5
- ✅ Total Consultations: >= 0

---

## prescription_requests - Solicitações de Receitas

Pedidos de renovação de receitas médicas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único da solicitação |
| `patient_id` | uuid | ID do paciente que fez a solicitação |
| `doctor_id` | uuid | ID do médico que está analisando/analisou |
| `prescription_type` | prescription_type | Tipo da receita* |
| `status` | request_status | Status atual da solicitação** |
| `price` | numeric | Valor cobrado pelo serviço (validado: > 0) |
| `image_url` | text | URL da imagem da receita antiga enviada (validado: formato e path seguro) |
| `pdf_url` | text | URL do PDF da nova receita gerada (validado: formato URL válido) |
| `medications` | jsonb | Lista de medicamentos em formato JSON*** (validado: estrutura e segurança) |
| `patient_notes` | text | Observações do paciente (validado: <= 2000 caracteres, sanitizado) |
| `doctor_notes` | text | Observações do médico (validado: <= 2000 caracteres, sanitizado) |
| `rejection_reason` | text | Motivo da rejeição (validado: <= 1000 caracteres, sanitizado) |
| `validated_at` | timestamp | Data de validação/aprovação |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ Price: deve ser > 0
- ✅ Status: transições válidas validadas (pending → analyzing → approved/rejected)
- ✅ Medications: estrutura JSONB validada (máximo 50 itens, campos obrigatórios)
- ✅ Image URL: formato e path seguro (previne path traversal)
- ✅ PDF URL: formato URL válido
- ✅ Text Fields: sanitização contra XSS, limites de tamanho
- ✅ Image Hash: hash SHA-256 para verificação de integridade

**Valores de `prescription_type`:**
- `simple` - Receita simples (branca)
- `controlled` - Receita controlada (amarela)
- `blue` - Receita azul (especial)

**Valores de `status`:**
- `pending` - Pendente (aguardando análise)
- `analyzing` - Em análise por um médico
- `approved` - Aprovada
- `rejected` - Rejeitada
- `correction_needed` - Correção necessária
- `completed` - Concluída

**Estrutura de `medications`:**
```json
[
  {
    "name": "Nome do medicamento",
    "dosage": "Dosagem",
    "quantity": "Quantidade"
  }
]
```

---

## exam_requests - Solicitações de Exames

Pedidos de requisição de exames médicos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `patient_id` | uuid | ID do paciente |
| `doctor_id` | uuid | ID do médico responsável |
| `exam_type` | exam_type | Tipo de exame* |
| `status` | request_status | Status da solicitação |
| `price` | numeric | Valor do serviço (validado: > 0) |
| `exams` | jsonb | Lista de exames solicitados |
| `image_url` | text | URL da imagem/documento enviado (validado: formato e path seguro) |
| `pdf_url` | text | URL do PDF da requisição gerada (validado: formato URL válido) |
| `patient_notes` | text | Observações do paciente (validado: <= 2000 caracteres, sanitizado) |
| `doctor_notes` | text | Observações do médico (validado: <= 2000 caracteres, sanitizado) |
| `rejection_reason` | text | Motivo da rejeição (validado: <= 1000 caracteres, sanitizado) |
| `validated_at` | timestamp | Data de validação |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ Price: deve ser > 0
- ✅ Status: transições válidas validadas
- ✅ Image URL: formato e path seguro (previne path traversal)
- ✅ PDF URL: formato URL válido
- ✅ Text Fields: sanitização contra XSS, limites de tamanho
- ✅ Image Hash: hash SHA-256 para verificação de integridade

**Valores de `exam_type`:**
- `laboratory` - Exames laboratoriais (sangue, urina, etc.)
- `imaging` - Exames de imagem (raio-x, ultrassom, etc.)

---

## consultation_requests - Solicitações de Consultas

Agendamentos de teleconsultas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `patient_id` | uuid | ID do paciente |
| `doctor_id` | uuid | ID do médico |
| `specialty` | text | Especialidade desejada |
| `status` | request_status | Status da consulta |
| `duration_minutes` | integer | Duração em minutos (validado: > 0) |
| `price_per_minute` | numeric | Preço por minuto (validado: > 0) |
| `total_price` | numeric | Preço total (calculado automaticamente: duration × price_per_minute) |
| `scheduled_at` | timestamp | Data/hora agendada (validado: não pode ser muito antiga) |
| `started_at` | timestamp | Data/hora de início real |
| `ended_at` | timestamp | Data/hora de término |
| `patient_notes` | text | Observações do paciente |
| `doctor_notes` | text | Observações do médico |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ Duration Minutes: deve ser > 0
- ✅ Price Per Minute: deve ser > 0
- ✅ Total Price: calculado automaticamente via trigger (duration_minutes × price_per_minute)
- ✅ Scheduled At: não pode ser muito antiga (máximo 1 dia antes de created_at)

---

## payments - Pagamentos

Registro de todos os pagamentos realizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | ID do usuário que pagou |
| `request_id` | uuid | ID da solicitação relacionada (validado: deve existir) |
| `request_type` | text | Tipo: `prescription`, `exam` ou `consultation` |
| `amount` | numeric | Valor pago (validado: > 0) |
| `method` | payment_method | Método de pagamento* |
| `status` | payment_status | Status do pagamento** |
| `pix_code` | text | Código PIX para pagamento |
| `qr_code` | text | Código QR para pagamento |
| `qr_code_base64` | text | QR Code em base64 |
| `checkout_url` | text | URL de checkout (MercadoPago) |
| `mercadopago_payment_id` | text | ID do pagamento no MercadoPago |
| `mercadopago_preference_id` | text | ID da preferência no MercadoPago |
| `idempotency_key` | text | Chave de idempotência (única) |
| `amount_cents_locked` | integer | Valor em centavos (fonte de verdade) |
| `pricing_version_id` | uuid | Referência à versão de pricing usada |
| `expires_at` | timestamp | Data de expiração (validado: > created_at) |
| `external_id` | text | ID externo (gateway de pagamento) |
| `paid_at` | timestamp | Data/hora do pagamento |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

**Validações Implementadas:**
- ✅ Amount: deve ser > 0
- ✅ Request ID: validado para existir na tabela correspondente
- ✅ Expires At: deve ser > created_at quando não null
- ✅ Idempotency Key: índice único para prevenir duplicação
- ✅ Request Unique: índice único parcial para evitar múltiplos pagamentos pending/completed do mesmo request

**Valores de `method`:**
- `pix` - PIX
- `credit_card` - Cartão de crédito
- `debit_card` - Cartão de débito

**Valores de `status`:**
- `pending` - Pendente
- `processing` - Processando
- `completed` - Concluído
- `failed` - Falhou
- `refunded` - Reembolsado

---

## notifications - Notificações

Notificações enviadas aos usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | ID do usuário destinatário |
| `title` | text | Título da notificação (validado: não vazio) |
| `message` | text | Mensagem/conteúdo (validado: não vazio, <= 1000 caracteres) |
| `type` | text | Tipo: `info`, `success`, `warning`, `error`, `push` |
| `read` | boolean | Se foi lida (true/false) |
| `created_at` | timestamp | Data de criação |

**Validações Implementadas:**
- ✅ Title: não pode ser vazio após trim
- ✅ Message: não pode ser vazio após trim, máximo 1000 caracteres

---

## chat_messages - Mensagens do Chat

Mensagens trocadas entre pacientes e médicos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `request_id` | uuid | ID da solicitação relacionada (validado: deve existir) |
| `request_type` | text | Tipo: `prescription`, `exam` ou `consultation` |
| `sender_id` | uuid | ID de quem enviou a mensagem |
| `message` | text | Conteúdo da mensagem (validado: não vazio, <= 5000 caracteres) |
| `read` | boolean | Se foi lida pelo destinatário |
| `created_at` | timestamp | Data/hora do envio |

**Validações Implementadas:**
- ✅ Request ID: validado para existir na tabela correspondente
- ✅ Message: não pode ser vazio após trim, máximo 5000 caracteres

---

## push_subscriptions - Assinaturas de Notificações Push

Armazena as assinaturas para notificações push no navegador.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | Identificador único |
| `user_id` | uuid | ID do usuário |
| `endpoint` | text | URL do endpoint do navegador |
| `p256dh` | text | Chave pública para criptografia |
| `auth` | text | Chave de autenticação |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data da última atualização |

---

## 🔐 Segurança (RLS - Row Level Security)

Todas as tabelas possuem políticas de segurança que garantem:

- **Pacientes** só podem ver e modificar seus próprios dados
- **Médicos** podem ver solicitações pendentes e as que estão atendendo
- **Administradores** têm acesso total para gerenciamento

**Políticas RLS Implementadas:**
- ✅ Todas as tabelas têm RLS habilitado
- ✅ Políticas específicas por role (patient, doctor, admin)
- ✅ Admins têm acesso completo a todas as tabelas
- ✅ Validação de integridade referencial via triggers

---

## 📊 Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    ├── profiles (1:1)
    │       └── user_id → auth.users.id
    │
    ├── user_roles (1:N)
    │       └── user_id → auth.users.id
    │
    ├── doctor_profiles (1:1, apenas médicos)
    │       └── user_id → auth.users.id
    │
    ├── prescription_requests (1:N)
    │       ├── patient_id → auth.users.id
    │       └── doctor_id → auth.users.id
    │
    ├── exam_requests (1:N)
    │       ├── patient_id → auth.users.id
    │       └── doctor_id → auth.users.id
    │
    ├── consultation_requests (1:N)
    │       ├── patient_id → auth.users.id
    │       └── doctor_id → auth.users.id
    │
    ├── payments (1:N)
    │       └── user_id → auth.users.id
    │
    ├── notifications (1:N)
    │       └── user_id → auth.users.id
    │
    ├── chat_messages (1:N)
    │       └── sender_id → auth.users.id
    │
    └── push_subscriptions (1:N)
            └── user_id → auth.users.id
```

---

## 📝 Glossário Inglês → Português

| Inglês | Português |
|--------|-----------|
| user | usuário |
| patient | paciente |
| doctor | médico |
| admin | administrador |
| profile | perfil |
| role | papel/função |
| request | solicitação |
| prescription | receita |
| exam | exame |
| consultation | consulta |
| payment | pagamento |
| notification | notificação |
| message | mensagem |
| status | status/estado |
| pending | pendente |
| analyzing | em análise |
| approved | aprovado |
| rejected | rejeitado |
| completed | concluído |
| created_at | criado em |
| updated_at | atualizado em |

---

## 🚀 Melhorias e Validações Implementadas

### Validações de Dados

#### Perfis e Usuários
- ✅ Validação de email (formato e bloqueio de domínios temporários)
- ✅ Validação de telefone brasileiro (10 ou 11 dígitos)
- ✅ Validação de CPF (formato e dígitos verificadores)
- ✅ Validação de data de nascimento (não pode ser futuro, mínimo 1900-01-01)
- ✅ Validação de URLs (avatar_url, image_url, pdf_url)
- ✅ Validação de estrutura JSONB (address)

#### Médicos
- ✅ Validação de CRM (formato 4-8 dígitos e estado brasileiro válido)
- ✅ Validação de rating (0 a 5)
- ✅ Validação de total_consultations (>= 0)

#### Solicitações
- ✅ Validação de preços (price > 0, amount > 0)
- ✅ Validação de transições de status
- ✅ Validação de campos calculados (total_price = duration × price_per_minute)
- ✅ Validação de duração e preços por minuto (> 0)
- ✅ Validação de request_id em chat_messages e payments
- ✅ Sanitização de campos de texto (prevenção XSS)
- ✅ Validação de tamanho de mensagens e notas

### Constraints de Integridade

- ✅ Foreign Keys: validação de integridade referencial via triggers
- ✅ Check Constraints: valores mínimos/máximos, formatos válidos
- ✅ Unique Constraints: idempotency_key, índices únicos parciais
- ✅ Validação de datas: birth_date, scheduled_at, expires_at

### Índices para Performance

#### Índices Compostos
- ✅ `prescription_requests(patient_id, status, created_at DESC)`
- ✅ `prescription_requests(doctor_id, status, created_at DESC)`
- ✅ `exam_requests(patient_id, status, created_at DESC)`
- ✅ `exam_requests(doctor_id, status, created_at DESC)`
- ✅ `consultation_requests(patient_id, status, created_at DESC)`
- ✅ `consultation_requests(doctor_id, status)`
- ✅ `notifications(user_id, read, created_at DESC)`
- ✅ `chat_messages(request_id, request_type, created_at DESC)`
- ✅ `payments(user_id, status, created_at DESC)`

#### Índices Adicionais
- ✅ `profiles(email)` - busca por email
- ✅ `profiles(cpf)` - busca por CPF
- ✅ `doctor_profiles(crm, crm_state)` - busca por CRM
- ✅ `doctor_profiles(specialty)` - busca por especialidade
- ✅ `doctor_profiles(available, rating DESC)` - médicos disponíveis

### Triggers e Funções

- ✅ Trigger para calcular `total_price` automaticamente em `consultation_requests`
- ✅ Trigger para validar `request_id` em `chat_messages` e `payments`
- ✅ Funções de validação: `validate_request_exists`, `validate_crm`, `validate_url`
- ✅ Função de cálculo: `calculate_consultation_total_price`

### Documentação

- ✅ Comentários (COMMENT) em todas as tabelas
- ✅ Comentários em colunas importantes
- ✅ Comentários em funções e triggers
- ✅ Documentação de constraints e validações

### Segurança Avançada

- ✅ Sanitização de dados de entrada (prevenção XSS)
- ✅ Validação de paths de arquivos (prevenção path traversal)
- ✅ Validação de URLs (prevenção de URLs perigosas)
- ✅ Hash de integridade para imagens (SHA-256)
- ✅ Idempotência em pagamentos
- ✅ Rate limiting para criação de requests

---

*Documentação gerada para o projeto RenoveJá+ - Telemedicina*
*Última atualização: 2025-01-23 - Migração de validação e melhorias aplicada*