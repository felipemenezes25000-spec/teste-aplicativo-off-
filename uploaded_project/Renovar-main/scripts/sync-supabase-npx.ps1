# Script para sincronizar Supabase via npx
# Execute após fazer: npx supabase login

Write-Host "🚀 Sincronizando projeto com Supabase..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está logado
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Yellow
$linkResult = npx supabase link --project-ref cnfadyhxczrldavmlobh 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Você precisa fazer login primeiro!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute este comando e faça login no navegador:" -ForegroundColor Yellow
    Write-Host "  npx supabase login" -ForegroundColor White
    Write-Host ""
    Write-Host "Depois execute este script novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Projeto linkado!" -ForegroundColor Green
Write-Host ""

# Aplicar migrations
Write-Host "📊 Aplicando migrations..." -ForegroundColor Cyan
npx supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erro ao aplicar migrations. Continuando..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Migrations aplicadas!" -ForegroundColor Green
}
Write-Host ""

# Deploy das Edge Functions principais
Write-Host "⚡ Fazendo deploy das Edge Functions..." -ForegroundColor Cyan
Write-Host ""

$functions = @(
    "create-payment",
    "create-request",
    "get-signed-url",
    "update-request-status",
    "update-prescription"
)

foreach ($func in $functions) {
    Write-Host "   Deploying $func..." -ForegroundColor Gray
    npx supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $func deployed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Erro ao fazer deploy de $func" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✅ Sincronização concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar variáveis de ambiente no Dashboard" -ForegroundColor White
Write-Host "   2. Testar as funcionalidades" -ForegroundColor White
