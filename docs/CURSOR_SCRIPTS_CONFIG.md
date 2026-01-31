# Como Configurar Execução de Scripts no Cursor

Este guia explica como liberar a execução de scripts e comandos no Cursor, tanto nas configurações do editor quanto no Windows.

---

## 1. Configurações do Cursor (mais importante)

### Onde ajustar

1. Abra **Cursor** → **Settings** → **Cursor Settings**  
   - Ou use: `Ctrl + Shift + J` (Windows/Linux) ou `Cmd + Shift + J` (Mac)
2. Vá em **Features** → **Chat**

### O que habilitar

- **Enable auto-run mode** (ou **YOLO mode**): permite que o agente execute comandos e ferramentas sem pedir confirmação.
- **Command allowlist**: lista de comandos que podem rodar automaticamente. Se estiver vazio, quase nada roda sem confirmação.

### Command allowlist – o que colocar

Para rodar scripts do projeto sem aprovação manual, adicione os prefixos dos comandos. **Lista completa (liberação total):**

```
yarn
npm
node
npx
expo
python
pip
pip3
python3
pytest
cd
Set-Location
pwsh
powershell
cmd
bash
sh
git
docker
docker-compose
psql
sqlite3
supabase
jest
eslint
tsc
curl
wget
rg
grep
find
echo
type
Get-Content
dotnet
ng
vite
webpack
winget
choco
```

- Prefixos como `yarn` liberam `yarn install`, `yarn start`, etc.
- `node` cobre scripts como `node ./scripts/...`
- `Set-Location` é o comando do PowerShell para mudar de pasta

### Passo a passo

1. Em **Features** → **Chat**, ative **Enable auto-run mode**
2. Em **Command allowlist**, clique para adicionar itens
3. Adicione: `yarn`, `npm`, `node`, `python`, `pip`, `cd`, `Set-Location`, `npx`, `expo`
4. Salve e reinicie o Cursor se necessário

---

## 2. Comandos sendo rejeitados ou travando

Se o Cursor rejeitar ou cancelar comandos sozinho:

- **Opção 1**: Ativar **"Run everything"** na interface do chat (perto de "Cancel") quando aparecer.
- **Opção 2**: Verificar a versão do Cursor – versões antigas (ex.: 2.4.5) tinham bug com "Ask every time". Atualize para a última versão.

---

## 3. PowerShell no Windows (Execution Policy)

Se o PowerShell bloquear scripts `.ps1`:

1. Abra PowerShell como **Administrador**
2. Execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Isso permite rodar scripts locais e ainda protege contra downloads não assinados.

---

## 4. Regras do projeto (.cursor/rules)

Já existe uma regra em `.cursor/rules/scripts-autorizados.mdc` que orienta o agente a executar os scripts padrão do projeto sem pedir confirmação extra. Não é preciso alterar nada aí para os comandos comuns.

---

## 5. Resumo rápido

| Problema | Solução |
|----------|---------|
| Pedir confirmação em todo comando | Features → Chat → Enable auto-run + Command allowlist |
| Comandos sendo cancelados | Verificar versão do Cursor e usar "Run everything" quando aparecer |
| PowerShell bloqueando scripts | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `yarn install` demorando | Normal; o aviso do `abab` é apenas informativo e não bloqueia |

---

## 6. Configuração automática (já aplicada)

Foi criado o script `scripts/configurar-cursor-yolo.py` que aplica as configurações diretamente no banco do Cursor. Para reaplicar no futuro:

```bash
python scripts/configurar-cursor-yolo.py
```

Depois, reinicie o Cursor.

---

## 7. Links úteis

- [Cursor Settings (documentação)](https://docs.cursor.com/settings/preferences)
- [Cursor Forum – comandos sem confirmação](https://forum.cursor.com/t/always-run-all-commands-without-user-confirmation/31199)
