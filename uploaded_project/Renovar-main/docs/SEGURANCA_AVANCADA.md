# Segurança Avançada - RenoveJá

## Resumo das Melhorias Implementadas

Este documento descreve todas as melhorias de segurança implementadas para tornar o RenoveJá um dos apps mais seguros do mundo, especialmente em relação a receitas médicas e dados sensíveis de saúde.

## 1. Proteção de Receitas e Dados Médicos

### 1.1 Validação de Transições de Status
- ✅ Função `validate_status_transition()` garante que status só muda em sequência válida
- ✅ Triggers impedem mudanças inválidas (ex: pending → completed)
- ✅ Validação de que receita aprovada precisa ter médico atribuído
- ✅ Validação de que receita completada precisa ter PDF gerado

### 1.2 Proteção Contra Modificação Não Autorizada
- ✅ Paciente não pode modificar receita após submissão (exceto notes em correction_needed)
- ✅ Receitas aprovadas/completadas não podem ser modificadas (exceto por admin)
- ✅ Médico só pode aprovar/rejeitar receitas atribuídas a ele
- ✅ Triggers verificam autorização antes de permitir mudanças

### 1.3 Validação de Dados de Entrada
- ✅ Validação de estrutura JSONB de `medications` (máx 50, campos validados)
- ✅ Sanitização automática de `patient_notes`, `doctor_notes`, `rejection_reason`
- ✅ Limites de tamanho para prevenir overflow e XSS
- ✅ Validação de `image_url` para prevenir path traversal

### 1.4 Integridade de Imagens
- ✅ Coluna `image_hash` para verificação de integridade (SHA-256)
- ✅ Edge Function `validate-image` verifica magic numbers (não apenas extensão)
- ✅ Validação de conteúdo real do arquivo (não apenas tipo MIME)
- ✅ Proteção contra upload de arquivos maliciosos disfarçados

## 2. Proteção de Dados Sensíveis (LGPD)

### 2.1 Mascaramento de CPF
- ✅ Função `mask_cpf()` para mascarar CPF em logs e auditoria
- ✅ View `profiles_masked` com CPF mascarado
- ✅ Validação de CPF com dígitos verificadores

### 2.2 Sanitização de Dados
- ✅ Função `sanitize_text()` remove caracteres de controle e tags HTML
- ✅ Triggers automáticos sanitizam todos os campos de texto
- ✅ Prevenção de XSS em notas e mensagens

### 2.3 Validação de Dados Pessoais
- ✅ Validação de email (formato + bloqueio de domínios temporários)
- ✅ Validação de telefone brasileiro (formato e tamanho)
- ✅ Validação de CPF (formato e dígitos verificadores)

## 3. Proteção Contra Ataques

### 3.1 SQL Injection
- ✅ Validação de JSONB para prevenir SQL injection em `medications`
- ✅ Função `validate_jsonb_safe()` verifica padrões perigosos
- ✅ Uso de prepared statements via Supabase (proteção nativa)

### 3.2 Path Traversal
- ✅ Validação de `image_url` não permite `..` ou caminhos absolutos
- ✅ Sanitização de nomes de arquivo no upload
- ✅ Verificação de que path pertence ao usuário

### 3.3 Mass Assignment
- ✅ Triggers impedem modificação de campos sensíveis (price, validated_at)
- ✅ Paciente não pode alterar preço ou data de validação
- ✅ Validação de ownership antes de permitir modificações

### 3.4 Enumeration Attacks
- ✅ Função `request_exists()` para verificar sem expor informações
- ✅ Mensagens de erro genéricas (não expõem se recurso existe)

### 3.5 Timing Attacks
- ✅ Função `constant_time_compare()` para comparação segura de strings
- ✅ Prevenção de vazamento de informações via timing

## 4. Rate Limiting e Anti-Abuse

### 4.1 Rate Limiting Avançado
- ✅ Tabela `rate_limits` para tracking por user_id, IP, device_id
- ✅ Limites diferentes por tipo de endpoint
- ✅ Função `check_request_creation_rate_limit()` para criação de requests

### 4.2 Detecção de Anomalias
- ✅ Tabela `anomaly_events` para registrar comportamentos suspeitos
- ✅ Edge Function `detect-anomalies` monitora:
  - Múltiplos pagamentos não concluídos
  - Múltiplas contas no mesmo device/IP
  - Padrões suspeitos de acesso

### 4.3 Auditoria de Acesso Negado
- ✅ Tabela `access_denied_events` registra tentativas de acesso negado
- ✅ Função `log_access_denied()` para registrar eventos
- ✅ Integração com detecção de anomalias

## 5. Validação de Imagens e Arquivos

### 5.1 Validação de Conteúdo
- ✅ Verificação de magic numbers (não apenas extensão)
- ✅ Validação de tamanho máximo (10MB)
- ✅ Verificação de formato real do arquivo

### 5.2 Integridade
- ✅ Cálculo de hash SHA-256 para verificação de integridade
- ✅ Armazenamento de hash no banco de dados
- ✅ Validação após upload

### 5.3 Rate Limiting de Uploads
- ✅ Limite de uploads por hora por usuário
- ✅ Função `count_recent_uploads()` para verificação

## 6. Auditoria e Compliance

### 6.1 Trilha de Auditoria Completa
- ✅ Tabela `request_events` registra todas as ações importantes
- ✅ Triggers automáticos logam mudanças de status
- ✅ Logs de geração de PDF e visualização de documentos

### 6.2 Logs Estruturados
- ✅ `correlation_id` em todas as requisições
- ✅ Logs estruturados em JSON para fácil análise
- ✅ Função `sanitize_for_logs()` mascara dados sensíveis

### 6.3 Compliance LGPD
- ✅ Mascaramento de CPF em logs
- ✅ View com dados mascarados
- ✅ Retenção e purga de dados (via jobs)

## 7. Validação de Médicos

### 7.1 Validação de CRM
- ✅ Integração com API Infosimples para validação real
- ✅ Verificação de situação do CRM (ativo/regular)
- ✅ Validação de correspondência de nome
- ✅ Rate limiting de validações

### 7.2 Autorização de Médicos
- ✅ Médico só pode aprovar/rejeitar receitas atribuídas
- ✅ Verificação de role antes de permitir ações
- ✅ Logs de todas as ações médicas

## 8. Edge Functions de Segurança

### 8.1 validate-image
- ✅ Valida conteúdo real do arquivo
- ✅ Calcula hash SHA-256
- ✅ Verifica magic numbers
- ✅ Valida tamanho e formato

### 8.2 update-prescription
- ✅ Validação rigorosa de autorização
- ✅ Verificação de transições de status
- ✅ Sanitização de dados de entrada
- ✅ Logs de auditoria

## 9. Melhorias de RLS

### 9.1 Políticas Revisadas
- ✅ Admins têm acesso completo a todas as tabelas
- ✅ Pacientes só veem seus próprios dados
- ✅ Médicos só veem receitas atribuídas ou fila
- ✅ Políticas específicas para cada ação (SELECT, INSERT, UPDATE)

### 9.2 Proteção de Storage
- ✅ Buckets privados para dados sensíveis
- ✅ Signed URLs com TTL curto (2 minutos)
- ✅ Verificação de ownership antes de gerar URL
- ✅ Políticas RLS no storage

## 10. Prevenção de Fraude em Pagamentos

### 10.1 Cálculo de Preço no Backend
- ✅ Tabela `pricing` como fonte de verdade
- ✅ Frontend nunca envia `amount`
- ✅ Cálculo baseado em `service_type` e `service_subtype`
- ✅ Armazenamento de `amount_cents_locked` (valor congelado)

### 10.2 Idempotência Forte
- ✅ `idempotency_key` UNIQUE
- ✅ Constraints UNIQUE em `request_id`, `mercadopago_payment_id`
- ✅ Verificação antes de criar pagamento
- ✅ Retorno de pagamento existente se duplicado

### 10.3 Auditoria de Webhooks
- ✅ Tabela `webhook_events` registra todos os webhooks
- ✅ Prevenção de reprocessamento duplicado
- ✅ Validação de assinatura obrigatória
- ✅ Replay seguro via `external_event_id` UNIQUE

### 10.4 Reconciliação
- ✅ Edge Function `reconcile-payments` verifica pagamentos pending
- ✅ Consulta MercadoPago para corrigir divergências
- ✅ Atualização automática de status
- ✅ Logs de todas as correções

## Checklist de Segurança

### ✅ Implementado

- [x] Validação de transições de status
- [x] Proteção contra modificação não autorizada
- [x] Sanitização de dados de entrada
- [x] Validação de integridade de imagens
- [x] Mascaramento de CPF (LGPD)
- [x] Validação de CPF, email, telefone
- [x] Proteção contra SQL injection
- [x] Proteção contra path traversal
- [x] Proteção contra mass assignment
- [x] Rate limiting avançado
- [x] Detecção de anomalias
- [x] Auditoria completa
- [x] Logs estruturados
- [x] Validação de CRM
- [x] Cálculo de preço no backend
- [x] Idempotência forte
- [x] Auditoria de webhooks
- [x] Reconciliação de pagamentos
- [x] RLS revisado e melhorado
- [x] Storage privado com signed URLs curtas

### 🔄 Recomendações Futuras (P2)

- [ ] Device attestation (Android/iOS nativo)
- [ ] Certificate pinning
- [ ] WAF/CDN na borda
- [ ] Scanners no CI (SAST/DAST)
- [ ] Pentest profissional
- [ ] Criptografia de campos sensíveis no banco (AES-GCM)
- [ ] KMS para gerenciamento de chaves
- [ ] Assinatura digital em PDFs
- [ ] Verificação de conteúdo de imagem (OCR para validar que é receita)

## Conclusão

O RenoveJá agora possui um nível de segurança extremamente alto, com:

1. **Proteção multicamadas** em todas as camadas (frontend, backend, banco)
2. **Auditoria completa** de todas as ações importantes
3. **Validação rigorosa** de todos os dados de entrada
4. **Proteção contra fraude** em pagamentos e receitas
5. **Compliance LGPD** com mascaramento de dados sensíveis
6. **Detecção proativa** de anomalias e comportamentos suspeitos

O app está preparado para lidar com dados sensíveis de saúde de forma segura e em conformidade com as melhores práticas de segurança e privacidade.
