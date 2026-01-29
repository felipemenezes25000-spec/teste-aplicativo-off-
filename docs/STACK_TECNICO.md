# 📋 STACK TÉCNICO - RenoveJá+

**Plataforma de Telemedicina**  
**Documento para apresentação institucional**

---

## 1. VISÃO GERAL DO PROJETO

### 1.1 Descrição
O **RenoveJá+** é uma plataforma de telemedicina que conecta pacientes a profissionais de saúde para:
- Renovação de receitas médicas (simples, controladas e azuis)
- Solicitação de pedidos de exames (laboratoriais e de imagem)
- Teleconsultas por videoconferência

### 1.2 Métricas do Código
| Métrica | Valor |
|---------|-------|
| Arquivos TypeScript/TSX | 81 |
| Arquivos Python | 7 |
| Linhas de código (backend) | ~4.500 |
| Linhas de código (frontend) | ~15.000 |

---

## 2. ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIOS                                  │
│     (Pacientes, Médicos, Enfermeiros, Administradores)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APLICATIVO MÓVEL                              │
│         React Native + Expo (iOS, Android, Web)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (API)                               │
│                  FastAPI + Python 3.11+                          │
│                    (Hospedado na Railway)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌─────────────┐ ┌─────────────────┐
│    SUPABASE       │ │ MERCADOPAGO │ │  EXPO PUSH API  │
│   (PostgreSQL)    │ │ (Pagamentos)│ │  (Notificações) │
│   Banco de Dados  │ │     PIX     │ │                 │
└───────────────────┘ └─────────────┘ └─────────────────┘
```

---

## 3. TECNOLOGIAS UTILIZADAS

### 3.1 Frontend (Aplicativo Móvel)

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **React Native** | 0.81.5 | Framework multiplataforma (iOS/Android) |
| **Expo** | 54.0.32 | Plataforma de desenvolvimento e build |
| **TypeScript** | 5.8.3 | Linguagem com tipagem estática |
| **React** | 19.1.0 | Biblioteca de interfaces |
| **Expo Router** | 6.0.22 | Navegação baseada em arquivos |
| **React Navigation** | 7.x | Sistema de navegação |
| **Zustand** | 5.0.10 | Gerenciamento de estado global |
| **Axios** | 1.13.2 | Cliente HTTP para APIs |
| **React Native Reanimated** | 4.1.1 | Animações de alta performance |
| **Lottie** | 7.3.5 | Animações vetoriais |
| **date-fns** | 4.1.0 | Manipulação de datas |

#### Módulos Expo Utilizados:
- `expo-camera` - Captura de fotos/vídeo
- `expo-image-picker` - Seleção de imagens
- `expo-notifications` - Push notifications
- `expo-local-authentication` - Biometria (Face ID/Touch ID)
- `expo-location` - Geolocalização
- `expo-av` - Áudio e vídeo
- `expo-clipboard` - Copiar/colar
- `expo-haptics` - Feedback tátil
- `expo-linear-gradient` - Gradientes visuais

### 3.2 Backend (API)

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **Python** | 3.11+ | Linguagem de programação |
| **FastAPI** | 0.109.0 | Framework web assíncrono de alta performance |
| **Uvicorn** | 0.27.0 | Servidor ASGI |
| **Pydantic** | 2.9.2 | Validação de dados e serialização |
| **httpx** | 0.28.1 | Cliente HTTP assíncrono |
| **bcrypt** | 4.1.2 | Hash seguro de senhas |
| **slowapi** | 0.1.9 | Rate limiting |
| **python-dotenv** | 1.0.0 | Variáveis de ambiente |

### 3.3 Banco de Dados

| Tecnologia | Finalidade |
|------------|------------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Banco de dados relacional |
| **Row Level Security** | Segurança em nível de linha |

### 3.4 Infraestrutura e Deploy

| Serviço | Finalidade |
|---------|------------|
| **Railway** | Hospedagem do backend (API) |
| **Supabase Cloud** | Hospedagem do banco de dados |
| **Expo Application Services (EAS)** | Build e distribuição do app |
| **GitHub** | Controle de versão |

### 3.5 Integrações Externas

| Serviço | Finalidade |
|---------|------------|
| **MercadoPago** | Pagamentos via PIX |
| **Expo Push API** | Notificações push |
| **Jitsi Meet** | Videoconferência (teleconsulta) |
| **OpenAI** | Análise de documentos médicos com IA (opcional) |

---

## 4. FUNCIONALIDADES IMPLEMENTADAS

### 4.1 Para Pacientes
- ✅ Cadastro e autenticação segura
- ✅ Solicitação de renovação de receitas
- ✅ Solicitação de pedidos de exames
- ✅ Agendamento de teleconsultas
- ✅ Chat em tempo real com médicos
- ✅ Pagamento via PIX
- ✅ Recebimento de receitas digitais
- ✅ Histórico de solicitações
- ✅ Notificações push
- ✅ Modo escuro (Dark Mode)

### 4.2 Para Médicos
- ✅ Fila de atendimento
- ✅ Análise e aprovação de solicitações
- ✅ Assinatura digital de receitas
- ✅ Chat com pacientes
- ✅ Teleconsulta por vídeo
- ✅ Dashboard de estatísticas

### 4.3 Para Enfermeiros
- ✅ Triagem de pedidos de exames
- ✅ Aprovação ou encaminhamento para médico
- ✅ Fila de triagem

### 4.4 Para Administradores
- ✅ Dashboard administrativo
- ✅ Gestão de usuários
- ✅ Relatórios e estatísticas
- ✅ Monitoramento de pagamentos

---

## 5. SEGURANÇA

### 5.1 Autenticação e Autorização
- Senhas com hash **bcrypt** (algoritmo seguro)
- Tokens JWT com expiração de 24 horas
- Controle de acesso por perfil (RBAC)

### 5.2 Proteção de Dados
- Criptografia em trânsito (HTTPS/TLS)
- Criptografia em repouso (AES-256)
- Conformidade com **LGPD** (Lei Geral de Proteção de Dados)

### 5.3 Segurança da API
- Rate limiting (proteção contra ataques)
- Validação de entrada (Pydantic)
- Proteção contra IDOR (Insecure Direct Object Reference)
- Validação de CPF, CRM e COREN

### 5.4 Segurança de Pagamentos
- Integração oficial com MercadoPago
- Verificação de assinatura de webhooks
- Nenhum dado de cartão armazenado

---

## 6. CONFORMIDADE REGULATÓRIA

### 6.1 LGPD (Lei nº 13.709/2018)
- ✅ Política de Privacidade completa
- ✅ Termos de Uso
- ✅ Consentimento explícito no cadastro
- ✅ Direito de acesso e exclusão de dados

### 6.2 CFM (Conselho Federal de Medicina)
- ✅ Termo de Consentimento para Telemedicina
- ✅ Conformidade com Resolução CFM nº 2.314/2022
- ✅ Prontuário eletrônico
- ✅ Validação de registro profissional (CRM)

---

## 7. FLUXO DE FUNCIONAMENTO

### 7.1 Fluxo de Renovação de Receita

```
1. Paciente solicita renovação
         ↓
2. Notificação enviada aos médicos
         ↓
3. Médico aceita e analisa
         ↓
4. Médico aprova (com preço) ou rejeita
         ↓
5. Paciente realiza pagamento (PIX)
         ↓
6. Médico assina digitalmente
         ↓
7. Paciente recebe receita digital
```

### 7.2 Fluxo de Teleconsulta

```
1. Paciente agenda consulta
         ↓
2. Médico confirma horário
         ↓
3. Paciente realiza pagamento
         ↓
4. Sala de vídeo é criada
         ↓
5. Consulta realizada
         ↓
6. Médico pode emitir receita/exames
         ↓
7. Paciente avalia o atendimento
```

---

## 8. PLATAFORMAS SUPORTADAS

| Plataforma | Suporte |
|------------|---------|
| **Android** | ✅ 6.0+ (API 23+) |
| **iOS** | ✅ 13.0+ |
| **Web** | ✅ Navegadores modernos |

---

## 9. REQUISITOS DE INFRAESTRUTURA

### Para Produção:
- Servidor backend: 1 vCPU, 512MB RAM (mínimo)
- Banco de dados: PostgreSQL 14+
- Domínio com certificado SSL
- Conta MercadoPago (para pagamentos)
- Conta Expo (para builds)

---

## 10. DIFERENCIAIS TÉCNICOS

1. **Código Moderno**: React 19, TypeScript 5.8, Python 3.11
2. **Performance**: FastAPI assíncrono, React Native otimizado
3. **Segurança**: Score 8/10 em auditoria de segurança
4. **Escalabilidade**: Arquitetura cloud-native
5. **Multiplataforma**: Um código, três plataformas (iOS, Android, Web)
6. **IA Integrada**: Análise automática de documentos médicos

---

## 11. CONTATO TÉCNICO

**Desenvolvedor:** Felipe Menezes  
**Projeto:** RenoveJá+ Telemedicina  
**Repositório:** Privado  

---

*Documento gerado em Janeiro de 2025*
