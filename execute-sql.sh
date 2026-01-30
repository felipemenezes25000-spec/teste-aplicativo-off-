#!/bin/bash

# ===================================================
# Script para executar SQL no Supabase via psql
# ===================================================

SUPABASE_URL="cnfadyhxczrldavmlobh.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.cnfadyhxczrldavmlobh"
SUPABASE_PASS="RQGKyG1piBpRwT7e"
SUPABASE_HOST="aws-0-sa-east-1.pooler.supabase.com"
SUPABASE_PORT="6543"

echo "🚀 Executando SQL no Supabase..."
echo "================================================"

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ psql não encontrado. Instalando..."
    echo ""
    echo "Execute manualmente:"
    echo "1. Acesse: https://cnfadyhxczrldavmlobh.supabase.co"
    echo "2. Vá em SQL Editor (barra lateral esquerda)"
    echo "3. Clique em 'New Query'"
    echo "4. Cole o conteúdo do arquivo: supabase/setup-complete.sql"
    echo "5. Clique em RUN ou pressione Cmd/Ctrl + Enter"
    echo ""
    echo "📄 Arquivo SQL: $(pwd)/supabase/setup-complete.sql"
    exit 1
fi

# Conectar e executar SQL
echo "📤 Conectando ao banco de dados..."
PGPASSWORD=$SUPABASE_PASS psql \
  -h $SUPABASE_HOST \
  -p $SUPABASE_PORT \
  -U $SUPABASE_USER \
  -d $SUPABASE_DB \
  -f supabase/setup-complete.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ SQL executado com sucesso!"
    echo "================================================"
else
    echo ""
    echo "❌ Erro ao executar SQL"
    echo ""
    echo "Execute manualmente no Dashboard do Supabase:"
    echo "https://cnfadyhxczrldavmlobh.supabase.co"
fi
