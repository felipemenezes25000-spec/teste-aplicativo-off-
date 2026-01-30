#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'frontend', 'app');

// Mapa de substituições de cores
const colorReplacements = [
  { from: /#00B4CD/g, to: '{colors.primary}', inStyle: 'colors.primary' },
  { from: /#4AC5E0/g, to: '{colors.primary}', inStyle: 'colors.primary' },
  { from: /#E6F7FA/g, to: '{colors.primaryLight}', inStyle: 'colors.primaryLight' },
  { from: /#CCF0F5/g, to: '{colors.primaryLight}', inStyle: 'colors.primaryLight' },
  { from: /#F8FAFB/g, to: '{colors.background}', inStyle: 'colors.background' },
  { from: /#F1F5F7/g, to: '{colors.backgroundDark}', inStyle: 'colors.backgroundDark' },
  { from: /#FFFFFF/g, to: '{colors.card}', inStyle: 'colors.card' },
  { from: /#1A3A4A/g, to: '{colors.textPrimary}', inStyle: 'colors.textPrimary' },
  { from: /#2D5A6B/g, to: '{colors.secondary}', inStyle: 'colors.secondary' },
  { from: /#6B7C85/g, to: '{colors.textSecondary}', inStyle: 'colors.textSecondary' },
  { from: /#9BA7AF/g, to: '{colors.textMuted}', inStyle: 'colors.textMuted' },
  { from: /#4A5960/g, to: '{colors.textSecondary}', inStyle: 'colors.textSecondary' },
  { from: /#CDD5DA/g, to: '{colors.border}', inStyle: 'colors.border' },
  { from: /#E4E9EC/g, to: '{colors.border}', inStyle: 'colors.border' },
  { from: /#10B981/g, to: '{colors.success}', inStyle: 'colors.success' },
  { from: /#34D399/g, to: '{colors.success}', inStyle: 'colors.success' },
  { from: /#EF4444/g, to: '{colors.error}', inStyle: 'colors.error' },
  { from: /#DC2626/g, to: '{colors.error}', inStyle: 'colors.error' },
  { from: /#F59E0B/g, to: '{colors.warning}', inStyle: 'colors.warning' },
  { from: /#0F172A/g, to: '{colors.background}', inStyle: 'colors.background' },
  { from: /#1E293B/g, to: '{colors.backgroundDark}', inStyle: 'colors.backgroundDark' },
];

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pular se já tem useColors
  if (content.includes('useColors')) {
    return { modified: false, reason: 'already has useColors' };
  }
  
  // Verificar se tem cores hardcoded
  const hasColors = /#[0-9A-F]{6}/i.test(content);
  if (!hasColors) {
    return { modified: false, reason: 'no hardcoded colors' };
  }
  
  // 1. Adicionar import do useColors
  const importRegex = /import\s+{[^}]+}\s+from\s+['"]@\/contexts\/AuthContext['"]/;
  const importMatch = content.match(importRegex);
  
  if (importMatch) {
    const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
    content = content.slice(0, insertPos) + '\nimport { useColors } from \'@/contexts/ThemeContext\';' + content.slice(insertPos);
    modified = true;
  } else {
    // Tentar adicionar após último import
    const lastImport = content.lastIndexOf('import ');
    if (lastImport !== -1) {
      const nextLine = content.indexOf('\n', lastImport);
      content = content.slice(0, nextLine + 1) + 'import { useColors } from \'@/contexts/ThemeContext\';\n' + content.slice(nextLine + 1);
      modified = true;
    }
  }
  
  // 2. Adicionar const colors = useColors(); no componente
  const functionRegex = /export\s+default\s+function\s+\w+[^{]*{\s*\n/;
  const funcMatch = content.match(functionRegex);
  
  if (funcMatch && !content.includes('const colors = useColors()')) {
    const insertPos = content.indexOf(funcMatch[0]) + funcMatch[0].length;
    content = content.slice(0, insertPos) + '  const colors = useColors();\n' + content.slice(insertPos);
    modified = true;
  }
  
  // 3. Substituir cores em strings (backgroundColor, color, etc)
  for (const replacement of colorReplacements) {
    // Em propriedades de estilo inline
    content = content.replace(
      new RegExp(`(backgroundColor|color|borderColor|shadowColor):\\s*["']${replacement.from.source}["']`, 'g'),
      `$1: ${replacement.inStyle}`
    );
    
    // Em StatusBar backgroundColor
    content = content.replace(
      new RegExp(`backgroundColor=["']${replacement.from.source}["']`, 'g'),
      `backgroundColor={${replacement.inStyle}}`
    );
    
    // Em arrays de gradiente
    if (content.includes(replacement.from.source)) {
      modified = true;
    }
  }
  
  // 4. Substituir gradientes específicos
  content = content.replace(
    /colors=\{?\[['"]#1A3A4A['"],\s*['"]#2D5A6B['"]\]\}?/g,
    'colors={colors.headerGradient}'
  );
  
  content = content.replace(
    /colors=\{?\[['"]#0F172A['"],\s*['"]#1E293B['"]\]\}?/g,
    'colors={colors.headerGradient}'
  );
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return { modified, reason: modified ? 'refactored' : 'no changes needed' };
}

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const results = { total: 0, refactored: 0, skipped: 0, errors: 0 };
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subResults = processDir(fullPath);
      results.total += subResults.total;
      results.refactored += subResults.refactored;
      results.skipped += subResults.skipped;
      results.errors += subResults.errors;
    } else if (file.name.endsWith('.tsx') && file.name !== 'index.tsx' || fullPath.includes('(tabs)')) {
      results.total++;
      try {
        const result = refactorFile(fullPath);
        if (result.modified) {
          console.log(`✅ ${fullPath.replace(appDir, 'app')}`);
          results.refactored++;
        } else {
          console.log(`⏭️  ${fullPath.replace(appDir, 'app')} - ${result.reason}`);
          results.skipped++;
        }
      } catch (error) {
        console.error(`❌ ${fullPath.replace(appDir, 'app')}: ${error.message}`);
        results.errors++;
      }
    }
  }
  
  return results;
}

console.log('🚀 Iniciando refatoração em batch...\n');
const results = processDir(appDir);
console.log('\n📊 Resultados:');
console.log(`   Total de arquivos: ${results.total}`);
console.log(`   ✅ Refatorados: ${results.refactored}`);
console.log(`   ⏭️  Pulados: ${results.skipped}`);
console.log(`   ❌ Erros: ${results.errors}`);
