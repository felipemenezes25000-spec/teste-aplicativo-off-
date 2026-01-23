#!/bin/bash
# Script Bash para sincronizar alterações com GitHub
# Uso: ./scripts/git-sync.sh "mensagem do commit"

MESSAGE="${1:-chore: atualizações automáticas}"

echo "🔄 Sincronizando alterações com GitHub..."

# Verificar se há alterações
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma alteração para commitar."
    exit 0
fi

echo "📝 Alterações encontradas:"
git status --short

# Adicionar todos os arquivos
echo ""
echo "📦 Adicionando arquivos..."
git add .

if [ $? -ne 0 ]; then
    echo "❌ Erro ao adicionar arquivos."
    exit 1
fi

# Fazer commit
echo "💾 Fazendo commit..."
git commit -m "$MESSAGE"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer commit."
    exit 1
fi

# Fazer push
echo "🚀 Enviando para GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Alterações sincronizadas com sucesso!"
else
    echo ""
    echo "❌ Erro ao enviar para GitHub."
    exit 1
fi
