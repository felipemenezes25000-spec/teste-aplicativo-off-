# 🛠️ Correções de Deploy - RenoveJá+

Este documento descreve todas as correções realizadas no código para garantir um deploy sem erros.

## 📋 Correções Realizadas

### Frontend

#### 1. **Versões de Dependências Ajustadas**
- Padronizadas todas as versões do Expo para usar `~` ao invés de `^`
- Atualizada versão do React para 18.3.1 (mais estável)
- Ajustada versão do @types/react para ser compatível

#### 2. **TypeScript e Tipos**
- Criado arquivo `src/types/global.d.ts` para declarar `__DEV__`
- Criado mock para SVGs nos testes
- Corrigido getter do `isSecureStoreAvailable` no SecureStorage

#### 3. **Testes Corrigidos**
- Ajustado mock do Platform.OS para ser configurável nos testes
- Configurados arquivos de setup do Jest
- Adicionadas dependências de teste no package.json

#### 4. **Warnings Suprimidos**
- Criado `src/utils/ignoreWarnings.ts` para suprimir warnings conhecidos
- Importado no _layout.tsx principal

### Backend

#### 1. **Correções no Monitoring**
- Removido import não utilizado `SqlalchemyIntegration`
- Removido `GeneratorExit` da lista de erros ignorados

#### 2. **Validações Mantidas**
- Todas as validações de segurança estão funcionando
- Rate limiting configurado corretamente
- CORS configurado com domínios específicos

## 🚀 Como Fazer o Deploy

### Pré-requisitos
1. **Instalar dependências do Frontend** (com versões corrigidas):
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json yarn.lock
   npm install --legacy-peer-deps
   # ou
   yarn install
   ```

2. **Instalar dependências do Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configurar variáveis de ambiente**:
   - Copiar `.env.example` para `.env` em ambas as pastas
   - Preencher todas as variáveis necessárias

### Deploy do Backend (Railway/Heroku/VPS)

1. **Railway.app** (Recomendado):
   ```bash
   cd backend
   railway login
   railway link
   railway up
   ```

2. **Heroku**:
   ```bash
   cd backend
   heroku create renoveja-api
   heroku config:set SUPABASE_URL=xxx
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=xxx
   git push heroku main
   ```

3. **VPS Manual**:
   ```bash
   # No servidor
   git clone https://github.com/felipemenezes25000-spec/teste-aplicativo-off-.git
   cd teste-aplicativo-off-/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Configurar supervisor ou systemd
   sudo cp renoveja-api.service /etc/systemd/system/
   sudo systemctl enable renoveja-api
   sudo systemctl start renoveja-api
   ```

### Deploy do Frontend (Expo)

1. **Build para Produção**:
   ```bash
   cd frontend
   
   # Para Android
   eas build --platform android --profile production
   
   # Para iOS
   eas build --platform ios --profile production
   ```

2. **Configurar EAS**:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

3. **Atualizar `app.json`**:
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "your-project-id"
         }
       }
     }
   }
   ```

## 🔍 Verificações Finais

### Checklist de Deploy

- [ ] Todas as dependências instaladas sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Testes passando (backend e frontend)
- [ ] CORS configurado para domínios de produção
- [ ] Sentry DSN configurado para monitoramento
- [ ] Backup automatizado configurado
- [ ] SSL/HTTPS configurado no servidor
- [ ] Rate limiting testado
- [ ] SecureStore funcionando nos dispositivos

### Comandos de Teste

```bash
# Backend
cd backend
python -m pytest test_basic.py -v

# Frontend (se as deps estiverem instaladas)
cd frontend
npm test
```

## 🐛 Problemas Conhecidos e Soluções

### 1. **Erro de versão do expo-secure-store**
```bash
npm install expo-secure-store@~13.0.0 --legacy-peer-deps
```

### 2. **Conflitos de peer dependencies**
Sempre use `--legacy-peer-deps` ou configure:
```bash
echo "legacy-peer-deps=true" >> .npmrc
```

### 3. **Python não encontrado**
Use `python3` ao invés de `python` em sistemas Unix.

### 4. **Erro de CORS em produção**
Certifique-se de adicionar seu domínio em `ALLOWED_ORIGINS` no `.env`.

## 📊 Monitoramento Pós-Deploy

1. **Verificar logs**:
   - Railway: `railway logs`
   - Heroku: `heroku logs --tail`
   - VPS: `journalctl -u renoveja-api -f`

2. **Monitorar no Sentry**:
   - Acessar dashboard.sentry.io
   - Verificar erros e performance

3. **Testar endpoints**:
   ```bash
   curl https://api.renoveja.com.br/api/health
   ```

## 🔒 Segurança Final

1. **Remover tokens do código**
2. **Usar HTTPS sempre**
3. **Manter backups atualizados**
4. **Monitorar tentativas de acesso suspeitas**
5. **Atualizar dependências regularmente**