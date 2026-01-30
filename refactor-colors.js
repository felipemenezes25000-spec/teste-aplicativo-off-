#!/usr/bin/env node
/**
 * Script para refatorar cores hardcoded para usar useTheme
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de cores hardcoded para propriedades do theme
const colorMap = {
  // Primary colors
  '#00B4CD': 'colors.primary',
  '#4AC5E0': 'colors.primary', // Variação do primary
  '#E6F7FA': 'colors.primaryLight',
  '#CCF0F5': 'colors.primaryLight',
  
  // Secondary/Dark
  '#1A3A4A': 'colors.secondary',
  '#2D5A6B': 'colors.secondary',
  '#0F172A': 'colors.background',
  '#1E293B': 'colors.backgroundDark',
  
  // Backgrounds
  '#F8FAFB': 'colors.background',
  '#F1F5F7': 'colors.backgroundDark',
  '#FFFFFF': 'colors.card',
  '#000000': "'#000000'", // Black absoluto
  
  // Text colors
  '#1A3A4A': 'colors.textPrimary',
  '#6B7C85': 'colors.textSecondary',
  '#9BA7AF': 'colors.textMuted',
  '#4A5960': 'colors.textSecondary',
  
  // Borders
  '#E4E9EC': 'colors.border',
  '#CDD5DA': 'colors.border',
  '#333F44': 'colors.border',
  
  // Status colors
  '#10B981': 'colors.success',
  '#34D399': 'colors.success',
  '#F59E0B': 'colors.warning',
  '#FBBF24': 'colors.warning',
  '#EF4444': 'colors.error',
  '#DC2626': 'colors.error',
  '#FEE2E2': "'#FEE2E2'", // Error light background
  '#D1FAE5': "'#D1FAE5'", // Success light background
  
  // Gradients (manter como array)
  "['#00B4CD', '#4AC5E0']": "['#00B4CD', '#4AC5E0']",
  "['#4AC5E0', '#00B4CD']": "['#4AC5E0', '#00B4CD']",
  "['#1A3A4A', '#2D5A6B']": "colors.headerGradient",
  "['#0F172A', '#1E293B']": "colors.headerGradient",
};

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Verificar se já importa useTheme/useColors
  const hasUseTheme = content.includes('useTheme') || content.includes('useColors');
  
  // Verificar se tem cores hardcoded
  const hasHardcodedColors = /#[0-9A-F]{6}/i.test(content) || 
                             content.includes("'#") || 
                             content.includes('"#');
  
  if (!hasHardcodedColors) {
    return false; // Nada para fazer
  }
  
  // Adicionar import do useColors se não existir
  if (!hasUseTheme) {
    // Encontrar a última linha de import
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 0) {
      const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
      const insertPosition = content.indexOf('\n', lastImportIndex) + 1;
      
      content = content.slice(0, insertPosition) +
                "import { useColors } from '@/contexts/ThemeContext';\n" +
                content.slice(insertPosition);
      modified = true;
    }
  }
  
  // Adicionar const { colors } = useColors(); no componente
  if (!content.includes('useColors()')) {
    // Procurar pela função do componente
    const functionMatch = content.match(/export default function \w+\([^)]*\)\s*{/);
    if (functionMatch) {
      const insertPosition = functionMatch.index + functionMatch[0].length;
      content = content.slice(0, insertPosition) +
                "\n  const colors = useColors();\n" +
                content.slice(insertPosition);
      modified = true;
    }
  }
  
  // Substituir cores hardcoded
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(oldColor)) {
      content = content.replace(regex, newColor);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Processar todos os arquivos
const appDir = path.join(__dirname, 'frontend', 'app');

function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      count += processDirectory(fullPath);
    } else if (file.name.endsWith('.tsx')) {
      try {
        if (refactorFile(fullPath)) {
          console.log(`✅ Refatorado: ${fullPath.replace(appDir, 'app')}`);
          count++;
        }
      } catch (error) {
        console.error(`❌ Erro em ${fullPath}:`, error.message);
      }
    }
  }
  
  return count;
}

const totalRefactored = processDirectory(appDir);
console.log(`\n🎉 Total de arquivos refatorados: ${totalRefactored}`);
