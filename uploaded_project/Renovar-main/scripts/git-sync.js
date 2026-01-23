#!/usr/bin/env node
/**
 * Script Node.js para sincronizar alterações com GitHub
 * Funciona em Windows, Linux e Mac
 * Uso: node scripts/git-sync.js "mensagem do commit"
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Suporta argumentos passados via npm run git:sync -- "mensagem"
// ou diretamente: node scripts/git-sync.js "mensagem"
const args = process.argv.slice(2);
const message = args.find(arg => !arg.startsWith('--')) || 'chore: atualizações automáticas';

function exec(command, options = {}) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`);
    process.exit(1);
  }
}

console.log('🔄 Sincronizando alterações com GitHub...\n');

// Verificar se há alterações
try {
  const status = execSync('git status --porcelain', {
    cwd: rootDir,
    encoding: 'utf-8',
  });

  if (!status.trim()) {
    console.log('✅ Nenhuma alteração para commitar.');
    process.exit(0);
  }

  console.log('📝 Alterações encontradas:');
  execSync('git status --short', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  // Se não houver alterações, git status retorna erro
  console.log('✅ Nenhuma alteração para commitar.');
  process.exit(0);
}

// Adicionar todos os arquivos
console.log('\n📦 Adicionando arquivos...');
exec('git add .');

// Fazer commit
console.log('💾 Fazendo commit...');
exec(`git commit -m "${message}"`);

// Fazer push
console.log('🚀 Enviando para GitHub...');
exec('git push origin main');

console.log('\n✅ Alterações sincronizadas com sucesso!');
