#!/usr/bin/env node
/**
 * Script de Validação de Sincronização com Supabase (Node.js)
 * 
 * Verifica se o projeto está 100% sincronizado com o Supabase
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');

const results = [];

// Cores para output
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

function addResult(category, status, message, details = []) {
  results.push({ category, status, message, details });
}

// 1. Validar Migrations
async function validateMigrations() {
  log('\n📊 Validando Migrations...', 'cyan');
  
  try {
    const migrationsDir = join(PROJECT_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));
    
    if (sqlFiles.length === 0) {
      addResult('Migrations', 'error', 'Nenhuma migration encontrada');
      return;
    }
    
    // Verificar se a migration mais recente existe
    const latestMigration = '20260125000001_improve_rate_limit_atomic.sql';
    if (!sqlFiles.includes(latestMigration)) {
      addResult('Migrations', 'warning', `Migration mais recente não encontrada: ${latestMigration}`);
    }
    
    // Verificar estrutura das migrations
    const migrationIssues = [];
    for (const file of sqlFiles) {
      const content = await readFile(join(migrationsDir, file), 'utf-8');
      
      // Verificar se não está vazia
      if (content.trim().length === 0) {
        migrationIssues.push(`${file}: arquivo vazio`);
      }
      
      // Verificar se tem sintaxe SQL básica
      if (!content.match(/CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT/i)) {
        migrationIssues.push(`${file}: possível arquivo SQL inválido`);
      }
    }
    
    if (migrationIssues.length > 0) {
      addResult('Migrations', 'warning', `Encontrados ${migrationIssues.length} problemas nas migrations`, migrationIssues);
    } else {
      addResult('Migrations', 'success', `${sqlFiles.length} migrations encontradas e validadas`);
    }
    
  } catch (error) {
    addResult('Migrations', 'error', `Erro ao validar migrations: ${error.message}`);
  }
}

// 2. Validar Edge Functions
async function validateEdgeFunctions() {
  log('\n⚡ Validando Edge Functions...', 'cyan');
  
  try {
    const functionsDir = join(PROJECT_ROOT, 'supabase', 'functions');
    const functions = await readdir(functionsDir);
    
    const expectedFunctions = [
      'create-payment',
      'create-request',
      'get-signed-url',
      'update-request-status',
      'update-prescription',
      'validate-image',
      'generate-pdf',
      'send-push-notification',
      'validate-crm',
      'detect-anomalies',
      'reconcile-payments',
      'mercadopago-webhook',
    ];
    
    const missingFunctions = [];
    const extraFunctions = [];
    const functionIssues = [];
    
    for (const expected of expectedFunctions) {
      if (!functions.includes(expected)) {
        missingFunctions.push(expected);
      } else {
        // Verificar se tem index.ts
        const indexPath = join(functionsDir, expected, 'index.ts');
        try {
          const stats = await stat(indexPath);
          if (!stats.isFile()) {
            functionIssues.push(`${expected}: index.ts não encontrado`);
          } else {
            const content = await readFile(indexPath, 'utf-8');
            if (content.trim().length === 0) {
              functionIssues.push(`${expected}: index.ts está vazio`);
            }
          }
        } catch {
          functionIssues.push(`${expected}: index.ts não encontrado`);
        }
      }
    }
    
    for (const func of functions) {
      if (!expectedFunctions.includes(func)) {
        extraFunctions.push(func);
      }
    }
    
    if (missingFunctions.length > 0) {
      addResult('Edge Functions', 'error', `${missingFunctions.length} functions faltando`, missingFunctions);
    }
    
    if (functionIssues.length > 0) {
      addResult('Edge Functions', 'warning', `Problemas encontrados em ${functionIssues.length} functions`, functionIssues);
    }
    
    if (extraFunctions.length > 0) {
      addResult('Edge Functions', 'warning', `${extraFunctions.length} functions extras encontradas`, extraFunctions);
    }
    
    if (missingFunctions.length === 0 && functionIssues.length === 0) {
      addResult('Edge Functions', 'success', `${expectedFunctions.length} Edge Functions validadas`);
    }
    
  } catch (error) {
    addResult('Edge Functions', 'error', `Erro ao validar Edge Functions: ${error.message}`);
  }
}

// 3. Validar Tipos TypeScript
async function validateTypes() {
  log('\n📝 Validando Tipos TypeScript...', 'cyan');
  
  try {
    const typesPath = join(PROJECT_ROOT, 'src', 'integrations', 'supabase', 'types.ts');
    const typesContent = await readFile(typesPath, 'utf-8');
    
    const expectedTables = [
      'chat_messages',
      'consultation_requests',
      'doctor_profiles',
      'exam_requests',
      'notifications',
      'payments',
      'prescription_requests',
      'profiles',
      'push_subscriptions',
      'user_roles',
    ];
    
    const missingTables = [];
    const typeIssues = [];
    
    for (const table of expectedTables) {
      // Buscar tanto com aspas quanto sem aspas
      if (!typesContent.includes(`"${table}":`) && !typesContent.includes(`${table}:`)) {
        missingTables.push(table);
      }
    }
    
    // Verificar se tem Database type
    if (!typesContent.includes('export type Database')) {
      typeIssues.push('Tipo Database não encontrado');
    }
    
    // Verificar enums - buscar na seção Enums
    const expectedEnums = [
      'app_role',
      'exam_type',
      'payment_method',
      'payment_status',
      'prescription_type',
      'request_status',
    ];
    
    // Verificar se a seção Enums existe
    if (!typesContent.includes('Enums:')) {
      typeIssues.push('Seção Enums não encontrada');
    } else {
      for (const enumName of expectedEnums) {
        // Buscar na seção Enums
        const enumPattern = new RegExp(`Enums:\\s*{[^}]*"${enumName}"`, 's');
        if (!enumPattern.test(typesContent) && !typesContent.includes(`${enumName}:`)) {
          typeIssues.push(`Enum ${enumName} não encontrado`);
        }
      }
    }
    
    if (missingTables.length > 0) {
      addResult('Tipos TypeScript', 'error', `${missingTables.length} tabelas faltando nos tipos`, missingTables);
    }
    
    if (typeIssues.length > 0) {
      addResult('Tipos TypeScript', 'warning', `Problemas encontrados nos tipos`, typeIssues);
    }
    
    if (missingTables.length === 0 && typeIssues.length === 0) {
      addResult('Tipos TypeScript', 'success', 'Tipos TypeScript validados');
    }
    
  } catch (error) {
    addResult('Tipos TypeScript', 'error', `Erro ao validar tipos: ${error.message}`);
  }
}

// 4. Validar Configuração
async function validateConfig() {
  log('\n⚙️  Validando Configuração...', 'cyan');
  
  try {
    const configPath = join(PROJECT_ROOT, 'supabase', 'config.toml');
    const configContent = await readFile(configPath, 'utf-8');
    
    const configIssues = [];
    
    // Verificar project_id
    if (!configContent.includes('project_id = "cnfadyhxczrldavmlobh"')) {
      configIssues.push('project_id não encontrado ou incorreto');
    }
    
    // Verificar configurações de functions principais
    // Nota: Nem todas as functions precisam estar no config.toml
    const criticalFunctionConfigs = [
      'create-payment',
      'get-signed-url',
      'update-prescription',
    ];
    
    for (const func of criticalFunctionConfigs) {
      if (!configContent.includes(`[functions.${func}]`)) {
        configIssues.push(`Configuração de ${func} não encontrada`);
      }
    }
    
    if (configIssues.length > 0) {
      addResult('Configuração', 'warning', `Problemas na configuração`, configIssues);
    } else {
      addResult('Configuração', 'success', 'Configuração validada');
    }
    
  } catch (error) {
    addResult('Configuração', 'error', `Erro ao validar configuração: ${error.message}`);
  }
}

// Função principal
async function main() {
  log('🔍 Validação de Sincronização com Supabase', 'blue');
  log('='.repeat(50), 'blue');
  
  await validateMigrations();
  await validateEdgeFunctions();
  await validateTypes();
  await validateConfig();
  
  // Resumo
  log('\n' + '='.repeat(50), 'blue');
  log('📋 RESUMO DA VALIDAÇÃO', 'blue');
  log('='.repeat(50), 'blue');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'success' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    
    log(`\n${icon} ${result.category}: ${result.message}`, color);
    
    if (result.details && result.details.length > 0) {
      for (const detail of result.details.slice(0, 5)) {
        log(`   • ${detail}`, 'yellow');
      }
      if (result.details.length > 5) {
        log(`   ... e mais ${result.details.length - 5} itens`, 'yellow');
      }
    }
  }
  
  log('\n' + '='.repeat(50), 'blue');
  log(`✅ Sucessos: ${successCount}`, 'green');
  log(`⚠️  Avisos: ${warningCount}`, 'yellow');
  log(`❌ Erros: ${errorCount}`, 'red');
  log('='.repeat(50), 'blue');
  
  if (errorCount > 0) {
    log('\n❌ Validação falhou! Corrija os erros antes de continuar.', 'red');
    process.exit(1);
  } else if (warningCount > 0) {
    log('\n⚠️  Validação concluída com avisos. Revise os itens acima.', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ Validação concluída com sucesso! Projeto está sincronizado.', 'green');
    process.exit(0);
  }
}

main().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
