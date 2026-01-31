# Avaliação do Projeto RenoveJá+

**Data:** 30/01/2025  
**Escopo:** Entendimento, avaliação, melhorias e vulnerabilidades.

---

## 1. Resumo do Projeto

O **RenoveJá+** é uma plataforma de **telemedicina** que conecta pacientes a médicos e enfermeiros para:

- **Renovação de receitas** (simples, controladas, azul)
- **Pedidos de exames** (triagem por enfermagem, encaminhamento ao médico)
- **Teleconsultas** (vídeo) e **chat** em tempo real
- **Pagamentos** via PIX (Mercado Pago)

**Stack:** React Native (Expo) + TypeScript no frontend; FastAPI (Python 3.11) no backend; Supabase (PostgreSQL); integrações com Mercado Pago, Jitsi, Sentry.

**Papéis:** Paciente, Médico, Enfermeiro, Admin. Fluxos bem documentados em `docs/ARQUITETURA.md`.

---

## 2. Pontos Fortes

- **Documentação** clara: arquitetura, stack, segurança, deploy, termos legais (LGPD, CFM).
- **Segurança já trabalhada:** auditoria feita; IDOR, admin sem auth e filtros corrigidos; validação de CPF/CRM/COREN; rate limiting; tokens com expiração; uso de SecureStore no app.
- **Stack moderna:** FastAPI, React Native/Expo, TypeScript, Supabase.
- **Conformidade:** política de privacidade, termos de uso, termo de consentimento para telemedicina.
- **Testes:** `test_basic.py` no backend e testes de SecureStore no frontend.
- **Deploy previsto:** Docker, Railway, EAS para o app.

---

## 3. Possíveis Melhorias

| Área | Sugestão |
|------|----------|
| **Frontend** | Garantir uso consistente de SecureStore para token (evitar fallback para AsyncStorage em produção quando não for web). |
| **Backend** | Adicionar `model_config = ConfigDict(extra='forbid')` nos modelos Pydantic para evitar mass assignment. |
| **API** | Versionar a API explicitamente (ex.: `/api/v1/`) para evolução sem quebrar clientes. |
| **Testes** | Aumentar cobertura (integração com Supabase mock ou testcontainers) e testes E2E no app. |
| **Observabilidade** | Logs estruturados (JSON) e métricas (ex.: Prometheus) para produção. |
| **CI/CD** | Pipeline (GitHub Actions ou similar) para lint, testes e deploy. |
| **Docs** | Manter README e `.env.example` alinhados (ex.: porta 8001 no frontend para a API). |

---

## 4. Vulnerabilidades / Riscos a Monitorar

- **Token no frontend:** Auditoria apontou migração para SecureStore; confirmar que em produção não há token sensível só em AsyncStorage.
- **Secrets:** Nunca commitar `.env`; usar variáveis de ambiente ou vault em produção.
- **Supabase:** Usar RLS (Row Level Security) e service role apenas no backend; anon key no app com RLS bem definido.
- **Webhooks (Mercado Pago):** Validar assinatura em todos os handlers para evitar falsificação.
- **Dependências:** Manter `requirements.txt` e `package.json` atualizados e rodar `pip audit` / `npm audit` periodicamente.
- **Dados de saúde:** Tratar como sensíveis (LGPD); garantir criptografia em trânsito e em repouso e acesso restrito por papel.

---

## 5. Conclusão

Projeto bem estruturado, com boa documentação e várias correções de segurança já aplicadas (score de segurança documentado em 8/10 após correções). Para evoluir: reforçar testes e CI/CD, endurecer modelos Pydantic, alinhar env/docs (ex.: porta da API) e revisar uso de SecureStore vs AsyncStorage no app.
