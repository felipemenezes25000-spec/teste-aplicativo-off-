# Script PowerShell para sincronizar alterações com GitHub
# Uso: .\scripts\git-sync.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "chore: atualizações automáticas"
)

Write-Host "🔄 Sincronizando alterações com GitHub..." -ForegroundColor Cyan

# Verificar se há alterações
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ Nenhuma alteração para commitar." -ForegroundColor Green
    exit 0
}

Write-Host "📝 Alterações encontradas:" -ForegroundColor Yellow
git status --short

# Adicionar todos os arquivos
Write-Host "`n📦 Adicionando arquivos..." -ForegroundColor Cyan
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos." -ForegroundColor Red
    exit 1
}

# Fazer commit
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
git commit -m $Message

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer commit." -ForegroundColor Red
    exit 1
}

# Fazer push
Write-Host "🚀 Enviando para GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Alterações sincronizadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Erro ao enviar para GitHub." -ForegroundColor Red
    exit 1
}
