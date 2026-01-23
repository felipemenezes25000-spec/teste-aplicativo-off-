#!/bin/bash
# Script Bash para sincronizar projeto com Supabase
# Uso: ./scripts/sync-supabase.sh

echo "🚀 Sincronizando projeto com Supabase..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo "📦 Instale o Supabase CLI:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado: $(supabase --version)"

# Verificar se está logado
echo ""
echo "🔐 Verificando login..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Você precisa fazer login primeiro:"
    echo "   supabase login"
    exit 1
fi

# Aplicar migrations
echo ""
echo "📊 Aplicando migrations..."
if ! supabase db push; then
    echo "❌ Erro ao aplicar migrations!"
    exit 1
fi
echo "✅ Migrations aplicadas com sucesso!"

# Deploy das Edge Functions
echo ""
echo "⚡ Fazendo deploy das Edge Functions..."
echo "   (Isso pode demorar alguns minutos...)"

functions=(
    "create-payment"
    "create-request"
    "get-signed-url"
    "update-request-status"
    "update-prescription"
    "validate-image"
    "generate-pdf"
    "send-push-notification"
    "validate-crm"
    "detect-anomalies"
    "reconcile-payments"
    "mercadopago-webhook"
)

for func in "${functions[@]}"; do
    echo "   Deploying $func..."
    if supabase functions deploy "$func"; then
        echo "   ✅ $func deployed"
    else
        echo "   ⚠️  Erro ao fazer deploy de $func"
    fi
done

echo ""
echo "✅ Sincronização concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar variáveis de ambiente no Supabase Dashboard"
echo "   2. Testar as funcionalidades modificadas"
echo "   3. Verificar logs: supabase functions logs <function-name>"
