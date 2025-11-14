#!/usr/bin/env node
/**
 * Backup Supabase via Node.js
 *
 * Script para fazer backup da base de dados Supabase
 * sem precisar de pg_dump instalado
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function getTableData(tableName) {
  try {
    const result = await client.query(`SELECT * FROM ${tableName}`);
    return result.rows;
  } catch (error) {
    log(`Erro ao ler ${tableName}: ${error.message}`, 'red');
    return null;
  }
}

async function main() {
  header('BACKUP SUPABASE via Node.js');

  // Conectar
  log('Conectando ao Supabase...', 'blue');
  try {
    await client.connect();
    log('✓ Conectado com sucesso!', 'green');
  } catch (error) {
    log('✗ Erro ao conectar:', 'red');
    console.error(error.message);
    process.exit(1);
  }

  // Criar diretório de backups
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  // Tabelas essenciais para migração
  const tables = [
    'medicamento',
    'medicamento_dosagem',
    'medicamento_via',
    'prescricao',
    'prescricao_tarefa',
    'receita',
    'animais',
    'usuarios',
    'canis'
  ];

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(backupDir, `supabase_backup_${timestamp}.json`);

  log('Fazendo backup das tabelas essenciais...', 'blue');

  const backup = {
    timestamp: new Date().toISOString(),
    database: 'supabase_production',
    tables: {}
  };

  let totalRecords = 0;

  for (const table of tables) {
    process.stdout.write(`  ${table}... `);
    const data = await getTableData(table);

    if (data === null) {
      log('ERRO', 'red');
      continue;
    }

    backup.tables[table] = data;
    totalRecords += data.length;
    log(`${data.length} registros`, 'green');
  }

  // Salvar backup
  log('\nSalvando backup...', 'blue');
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

  // Estatísticas
  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / 1048576).toFixed(2);

  header('BACKUP CONCLUÍDO!');
  log(`✓ Arquivo: ${backupFile}`, 'green');
  log(`✓ Tamanho: ${sizeMB} MB`, 'green');
  log(`✓ Total de registros: ${totalRecords}`, 'green');

  console.log('\n' + '⚠'.repeat(30));
  log('IMPORTANTE:', 'yellow');
  console.log('⚠'.repeat(30));
  console.log('\n1. Guarde este backup em local seguro');
  console.log('2. Considere copiar para nuvem (Google Drive, etc.)');
  console.log('3. Este backup está em formato JSON (não é restaurável via pg_restore)');
  console.log('4. Para backup completo, use o Supabase Dashboard\n');

  // Também gerar SQL para restauração manual se necessário
  const sqlFile = backupFile.replace('.json', '.sql');
  log(`\nGerando arquivo SQL para restauração manual...`, 'blue');

  let sqlContent = '-- Backup Supabase - ' + new Date().toISOString() + '\n\n';
  sqlContent += '-- IMPORTANTE: Este arquivo é apenas para referência\n';
  sqlContent += '-- Use o JSON para dados ou Supabase Dashboard para backup completo\n\n';

  for (const [table, data] of Object.entries(backup.tables)) {
    sqlContent += `\n-- Tabela: ${table} (${data.length} registros)\n`;
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      sqlContent += `-- Colunas: ${columns.join(', ')}\n`;
    }
  }

  fs.writeFileSync(sqlFile, sqlContent);
  log(`✓ Arquivo SQL gerado: ${sqlFile}`, 'green');

  await client.end();

  log('\nPróximo passo:', 'cyan');
  console.log('  node migrate_node.js\n');
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
