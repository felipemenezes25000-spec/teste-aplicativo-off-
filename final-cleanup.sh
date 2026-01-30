#!/bin/bash

# Cleanup final de cores hardcoded nos arquivos que já têm useColors

echo "🧹 Limpeza final de cores hardcoded..."

# Encontrar todos os arquivos que TÊM useColors
FILES=$(grep -l "useColors\|useTheme" frontend/app/**/*.tsx 2>/dev/null)

for file in $FILES; do
  CHANGED=0
  
  # Backup
  cp "$file" "$file.bak"
  
  # Substituir cores em componentes JSX (backgroundColor, color attributes)
  if grep -q 'backgroundColor="#00B4CD"' "$file"; then
    sed -i 's/backgroundColor="#00B4CD"/backgroundColor={colors.primary}/g' "$file"
    CHANGED=1
  fi
  
  if grep -q 'backgroundColor="#4AC5E0"' "$file"; then
    sed -i 's/backgroundColor="#4AC5E0"/backgroundColor={colors.primary}/g' "$file"
    CHANGED=1
  fi
  
  if grep -q 'backgroundColor="#1A3A4A"' "$file"; then
    sed -i 's/backgroundColor="#1A3A4A"/backgroundColor={colors.textPrimary}/g' "$file"
    CHANGED=1
  fi
  
  if grep -q 'backgroundColor="#F8FAFB"' "$file"; then
    sed -i 's/backgroundColor="#F8FAFB"/backgroundColor={colors.background}/g' "$file"
    CHANGED=1
  fi
  
  if grep -q 'color="#00B4CD"' "$file"; then
    sed -i 's/color="#00B4CD"/color={colors.primary}/g' "$file"
    CHANGED=1
  fi
  
  if grep -q 'color="#1A3A4A"' "$file"; then
    sed -i 's/color="#1A3A4A"/color={colors.textPrimary}/g' "$file"
    CHANGED=1
  fi
  
  # Substituir em arrays inline
  if grep -q "\['#00B4CD', '#4AC5E0'\]" "$file"; then
    sed -i "s/\\['#00B4CD', '#4AC5E0'\\]/[colors.primary, '#4AC5E0']/g" "$file"
    CHANGED=1
  fi
  
  if grep -q "\['#1A3A4A', '#2D5A6B'\]" "$file"; then
    sed -i "s/\\['#1A3A4A', '#2D5A6B'\\]/colors.headerGradient/g" "$file"
    CHANGED=1
  fi
  
  if [ $CHANGED -eq 1 ]; then
    echo "✅ $file"
    rm "$file.bak"
  else
    rm "$file.bak"
  fi
done

echo ""
echo "🎯 Verificação final de cores principais:"
echo "   #00B4CD (primary): $(grep -r '#00B4CD' frontend/app --include='*.tsx' | wc -l) ocorrências"
echo "   #4AC5E0 (primary): $(grep -r '#4AC5E0' frontend/app --include='*.tsx' | wc -l) ocorrências"
echo "   #1A3A4A (text/secondary): $(grep -r '#1A3A4A' frontend/app --include='*.tsx' | wc -l) ocorrências"
echo "   #F8FAFB (background): $(grep -r '#F8FAFB' frontend/app --include='*.tsx' | wc -l) ocorrências"
echo ""
echo "✨ Limpeza concluída!"
