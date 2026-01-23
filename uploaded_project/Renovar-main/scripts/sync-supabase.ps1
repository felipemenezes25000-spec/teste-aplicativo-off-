# Script PowerShell para sincronizar projeto com Supabase
# Uso: .\scripts\sync-supabase.ps1

Write-Host "🚀 Sincronizando projeto com Supabase..." -ForegroundColor Cyan

# Verificar se Supabase CLI está instalado
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instale o Supabase CLI:" -ForegroundColor Yellow
    Write-Host "   npm install -g supabase" -ForegroundColor White
    Write-Host "   ou" -ForegroundColor White
    Write-Host "   scoop install supabase" -ForegroundColor White
    exit 1
}

# Verificar se está logado
Write-Host "`n🔐 Verificando login..." -ForegroundColor Cyan
$loginStatus = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Você precisa fazer login primeiro:" -ForegroundColor Yellow
    Write-Host "   supabase login" -ForegroundColor White
    exit 1
}

# Aplicar migrations
Write-Host "`n📊 Aplicando migrations..." -ForegroundColor Cyan
supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao aplicar migrations!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations aplicadas com sucesso!" -ForegroundColor Green

# Deploy das Edge Functions
Write-Host "`n⚡ Fazendo deploy das Edge Functions..." -ForegroundColor Cyan
Write-Host "   (Isso pode demorar alguns minutos...)" -ForegroundColor Yellow

$functions = @(
    "create-payment",
    "create-request",
    "get-signed-url",
    "update-request-status",
    "update-prescription",
    "validate-image",
    "generate-pdf",
    "send-push-notification",
    "validate-crm",
    "detect-anomalies",
    "reconcile-payments",
    "mercadopago-webhook"
)

foreach ($func in $functions) {
    Write-Host "   Deploying $func..." -ForegroundColor Gray
    supabase functions deploy $func
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $func deployed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Erro ao fazer deploy de $func" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Sincronização concluída!" -ForegroundColor Green
Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verificar variáveis de ambiente no Supabase Dashboard" -ForegroundColor White
Write-Host "   2. Testar as funcionalidades modificadas" -ForegroundColor White
Write-Host "   3. Verificar logs: supabase functions logs <function-name>" -ForegroundColor White
