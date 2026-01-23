#!/usr/bin/env node
/**
 * Script para comparar migrations locais com as aplicadas no Supabase
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Migrations aplicadas no Supabase (baseado na imagem do Dashboard)
// Última migration visível: 20260119123501
const appliedMigrations = [
  '20260119015428',
  '20260119015440',
  '20260119015532',
  '20260119020355',
  '20260119020614',
  '20260119023024',
  '20260119023239',
  '20260119023618',
  '20260119024410',
  '20260119024509',
  '20260119024628',
  '20260119024718',
  '20260119030018',
  '20260119030130',
  '20260119030221',
  '20260119030622',
  '20260119030840',
  '20260119045135',
  '20260119055122',
  '20260119113444',
  '20260119121609',
  '20260119123501',
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🔍 Comparando Migrations Locais vs Remotas', 'blue');
  log('='.repeat(60), 'blue');
  
  try {
    const migrationsDir = join(PROJECT_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    log(`\n📊 Total de migrations locais: ${sqlFiles.length}`, 'cyan');
    log(`📊 Total de migrations aplicadas (remoto): ${appliedMigrations.length}`, 'cyan');
    
    // Extrair timestamps das migrations locais
    const localMigrations = sqlFiles.map(file => {
      const match = file.match(/^(\d{14})/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Encontrar migrations pendentes
    const pendingMigrations = localMigrations.filter(
      local => !appliedMigrations.some(applied => local.startsWith(applied))
    );
    
    // Encontrar migrations aplicadas que não existem localmente (improvável, mas verificar)
    const extraRemoteMigrations = appliedMigrations.filter(
      applied => !localMigrations.some(local => local.startsWith(applied))
    );
    
    log('\n' + '='.repeat(60), 'blue');
    log('📋 RESULTADO DA COMPARAÇÃO', 'blue');
    log('='.repeat(60), 'blue');
    
    if (pendingMigrations.length > 0) {
      log(`\n⚠️  MIGRATIONS PENDENTES: ${pendingMigrations.length}`, 'yellow');
      log('Estas migrations existem localmente mas NÃO foram aplicadas no Supabase:', 'yellow');
      
      for (const pending of pendingMigrations) {
        const file = sqlFiles.find(f => f.startsWith(pending));
        log(`   ❌ ${file}`, 'red');
      }
      
      log('\n📝 PRÓXIMOS PASSOS:', 'cyan');
      log('1. Acesse o Supabase Dashboard:', 'cyan');
      log('   https://supabase.com/dashboard/project/cnfadyhxczrldavmlobh/sql/new', 'cyan');
      log('2. Para cada migration pendente:', 'cyan');
      log('   - Abra o arquivo em supabase/migrations/', 'cyan');
      log('   - Copie o conteúdo SQL', 'cyan');
      log('   - Cole no SQL Editor do Dashboard', 'cyan');
      log('   - Execute (RUN)', 'cyan');
      log('\nOU use o CLI:', 'cyan');
      log('   npx supabase db push --project-ref cnfadyhxczrldavmlobh', 'cyan');
      
    } else {
      log('\n✅ Todas as migrations locais foram aplicadas no remoto!', 'green');
    }
    
    if (extraRemoteMigrations.length > 0) {
      log(`\n⚠️  MIGRATIONS EXTRAS NO REMOTO: ${extraRemoteMigrations.length}`, 'yellow');
      log('Estas migrations estão no Supabase mas não existem localmente:', 'yellow');
      for (const extra of extraRemoteMigrations) {
        log(`   ⚠️  ${extra}`, 'yellow');
      }
    }
    
    // Listar migrations mais recentes
    if (pendingMigrations.length > 0) {
      log('\n' + '='.repeat(60), 'blue');
      log('📅 MIGRATIONS PENDENTES (em ordem cronológica):', 'blue');
      log('='.repeat(60), 'blue');
      
      const pendingFiles = pendingMigrations
        .map(timestamp => sqlFiles.find(f => f.startsWith(timestamp)))
        .filter(Boolean)
        .sort();
      
      for (const file of pendingFiles) {
        log(`   • ${file}`, 'yellow');
      }
      
      // Destacar a mais recente
      const latest = pendingFiles[pendingFiles.length - 1];
      if (latest) {
        log(`\n🎯 MIGRATION MAIS RECENTE PENDENTE:`, 'cyan');
        log(`   ${latest}`, 'cyan');
        log(`\n⚠️  IMPORTANTE: Esta migration deve ser aplicada primeiro!`, 'yellow');
      }
    }
    
    log('\n' + '='.repeat(60), 'blue');
    
    if (pendingMigrations.length > 0) {
      log(`\n❌ Sincronização incompleta: ${pendingMigrations.length} migration(s) pendente(s)`, 'red');
      process.exit(1);
    } else {
      log(`\n✅ Projeto 100% sincronizado!`, 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`\n❌ Erro: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
