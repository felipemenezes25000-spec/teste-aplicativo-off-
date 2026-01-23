# Scripts de Automação Git

Scripts para facilitar a sincronização de alterações com o GitHub.

## Scripts NPM (Recomendado - Multiplataforma)

Scripts adicionados ao `package.json`:

```bash
# Ver status do repositório
npm run git:status

# Adicionar todos os arquivos
npm run git:add

# Fazer commit (abre editor para mensagem)
npm run git:commit

# Fazer push
npm run git:push

# Sincronizar tudo (add + commit + push) com mensagem padrão
npm run git:sync

# Sincronizar com mensagem personalizada (Windows PowerShell)
npm run git:sync -- "feat: adiciona nova funcionalidade"

# Ou diretamente com Node.js
node scripts/git-sync.js "feat: adiciona nova funcionalidade"
```

**Nota:** O script `git:sync` usa um script Node.js que funciona em Windows, Linux e Mac.

## Scripts PowerShell (Windows)

```powershell
# Sincronizar com mensagem padrão
.\scripts\git-sync.ps1

# Sincronizar com mensagem personalizada
.\scripts\git-sync.ps1 "feat: adiciona nova funcionalidade"
```

## Scripts Bash (Linux/Mac)

```bash
# Dar permissão de execução (primeira vez)
chmod +x scripts/git-sync.sh

# Sincronizar com mensagem padrão
./scripts/git-sync.sh

# Sincronizar com mensagem personalizada
./scripts/git-sync.sh "feat: adiciona nova funcionalidade"
```

## Uso Recomendado

Para uso diário, recomendo usar o script npm:

```bash
npm run git:sync
```

Ou com mensagem personalizada usando o script PowerShell/Bash diretamente.
