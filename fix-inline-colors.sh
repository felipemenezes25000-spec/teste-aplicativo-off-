#!/bin/bash

# Script para substituir cores inline nos arquivos principais

FILES=(
  "frontend/app/admin/index.tsx"
  "frontend/app/doctor/index.tsx"
  "frontend/app/nurse/index.tsx"
  "frontend/app/exam/index.tsx"
  "frontend/app/prescription/index.tsx"
  "frontend/app/pharmacies/index.tsx"
  "frontend/app/consultation/index.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Adicionar import useColors se não existe
  if ! grep -q "useColors" "$file"; then
    sed -i "/import { useAuth } from '@\/contexts\/AuthContext';/a import { useColors } from '@/contexts/ThemeContext';" "$file"
    
    # Adicionar const colors no component
    sed -i "/const { user/a \ \ const colors = useColors();" "$file" 2>/dev/null || \
    sed -i "/const router = useRouter();/a \ \ const colors = useColors();" "$file"
  fi
  
  # Substituir cores em color: props
  sed -i "s/color: ['\"]#00B4CD['\"]/color: colors.primary/g" "$file"
  sed -i "s/color: ['\"]#4AC5E0['\"]/color: colors.primary/g" "$file"
  sed -i "s/color: ['\"]#10B981['\"]/color: colors.success/g" "$file"
  sed -i "s/color: ['\"]#34D399['\"]/color: colors.success/g" "$file"
  sed -i "s/color: ['\"]#EF4444['\"]/color: colors.error/g" "$file"
  sed -i "s/color: ['\"]#DC2626['\"]/color: colors.error/g" "$file"
  sed -i "s/color: ['\"]#F59E0B['\"]/color: colors.warning/g" "$file"
  sed -i "s/color: ['\"]#1A3A4A['\"]/color: colors.textPrimary/g" "$file"
  sed -i "s/color: ['\"]#6B7C85['\"]/color: colors.textSecondary/g" "$file"
  
  # Substituir backgroundColor em StatusBar
  sed -i 's/backgroundColor="#00B4CD"/backgroundColor={colors.primary}/g' "$file"
  sed -i 's/backgroundColor="#0F172A"/backgroundColor={colors.background}/g' "$file"
  sed -i 's/backgroundColor="#F8FAFB"/backgroundColor={colors.background}/g' "$file"
  
  # Substituir color em components
  sed -i 's/color="#00B4CD"/color={colors.primary}/g' "$file"
  sed -i 's/color="#10B981"/color={colors.success}/g' "$file"
  sed -i 's/color="#EF4444"/color={colors.error}/g' "$file"
  sed -i 's/color="#F59E0B"/color={colors.warning}/g' "$file"
  sed -i 's/color="#FFFFFF"/color="#FFFFFF"/g' "$file"
  
  # Substituir tintColor
  sed -i 's/tintColor="#00B4CD"/tintColor={colors.primary}/g' "$file"
  
  # Substituir arrays de gradiente
  sed -i "s/colors={\?\\[['\"](#0F172A|#1E293B)['\"],\s*['\"]#(0F172A|1E293B)['\"]\\\]}\?/colors={colors.headerGradient}/g" "$file"
  sed -i "s/colors={\?\\[['\"](#00B4CD|#4AC5E0)['\"],\s*['\"]#(00B4CD|4AC5E0)['\"]\\\]}\?/colors={[colors.primary, '#4AC5E0']}/g" "$file"
  
  echo "✅ $file"
done

echo "Done!"
