#!/usr/bin/env node
/**
 * Migração Remota - Supabase via Node.js
 *
 * Este script executa a migração do sistema de medicação
 * diretamente no Supabase usando Node.js, sem precisar do psql
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuração
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Cores para output
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

async function executeSQL(sqlContent, scriptName) {
  try {
    log(`Executando ${scriptName}...`, 'blue');
    await client.query(sqlContent);
    log(`✓ ${scriptName} concluído com sucesso`, 'green');
    return true;
  } catch (error) {
    log(`✗ Erro em ${scriptName}:`, 'red');
    console.error(error.message);
    return false;
  }
}

async function validateTables() {
  try {
    // Verificar tabelas antigas
    const oldTables = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('medicamento', 'prescricao', 'prescricao_tarefa', 'receita')
    `);

    // Verificar tabelas novas
    const newTables = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('medications', 'prescriptions', 'prescription_tasks')
    `);

    return {
      oldTables: parseInt(oldTables.rows[0].count),
      newTables: parseInt(newTables.rows[0].count)
    };
  } catch (error) {
    log('Erro ao validar tabelas:', 'red');
    console.error(error.message);
    return null;
  }
}

async function getCounts() {
  try {
    const result = await client.query(`
      SELECT 'medications' as tabela, COUNT(*) as total FROM medications
      UNION ALL
      SELECT 'prescriptions', COUNT(*) FROM prescriptions
      UNION ALL
      SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks
    `);
    return result.rows;
  } catch (error) {
    log('Erro ao obter contagens:', 'red');
    console.error(error.message);
    return [];
  }
}

async function checkIntegrity() {
  try {
    const result = await client.query(`
      SELECT COUNT(*) as orphans
      FROM prescriptions p
      LEFT JOIN medications m ON p.medication_id = m.id
      WHERE m.id IS NULL
    `);
    return parseInt(result.rows[0].orphans);
  } catch (error) {
    log('Erro ao verificar integridade:', 'red');
    console.error(error.message);
    return -1;
  }
}

async function main() {
  header('MIGRAÇÃO REMOTA - SUPABASE via Node.js');

  // Conectar
  log('Conectando ao Supabase...', 'blue');
  try {
    await client.connect();
    log('✓ Conectado com sucesso!', 'green');
  } catch (error) {
    log('✗ Erro ao conectar:', 'red');
    console.error(error.message);
    console.log('\nVerifique:');
    console.log('1. DATABASE_URL no arquivo .env está correto');
    console.log('2. Seu IP está permitido no Supabase (Settings → Database → Restrictions)');
    console.log('3. Você tem conexão com internet');
    process.exit(1);
  }

  // Validar ambiente
  header('VALIDAÇÃO DO AMBIENTE');

  const tables = await validateTables();
  if (!tables) {
    log('✗ Erro ao validar ambiente', 'red');
    await client.end();
    process.exit(1);
  }

  log(`Tabelas antigas encontradas: ${tables.oldTables}/4`, tables.oldTables >= 4 ? 'green' : 'yellow');
  log(`Tabelas novas encontradas: ${tables.newTables}/3`, tables.newTables === 3 ? 'green' : 'yellow');

  if (tables.oldTables < 4) {
    log('\n⚠ AVISO: Tabelas antigas não encontradas ou incompletas', 'yellow');
    log('As tabelas antigas são necessárias para migrar os dados', 'yellow');
  }

  if (tables.newTables !== 3) {
    log('\n⚠ AVISO: Tabelas novas não encontradas', 'yellow');
    log('Execute primeiro: npx prisma migrate deploy', 'yellow');
    await client.end();
    process.exit(1);
  }

  // Confirmação
  console.log('\n' + '⚠'.repeat(30));
  log('ATENÇÃO: Você está prestes a modificar a base de PRODUÇÃO!', 'yellow');
  console.log('⚠'.repeat(30) + '\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer1 = await new Promise(resolve => {
    readline.question('Você fez BACKUP da base de dados? (sim/não): ', resolve);
  });

  if (answer1.toLowerCase() !== 'sim') {
    log('\n⚠ Por favor, faça backup primeiro!', 'red');
    log('\nOpções:', 'yellow');
    log('1. Via Supabase Dashboard: Database → Backups → Create backup');
    log('2. Via script: node backup_node.js');
    readline.close();
    await client.end();
    process.exit(0);
  }

  const answer2 = await new Promise(resolve => {
    readline.question('\nTem CERTEZA que deseja continuar? (sim/não): ', resolve);
  });

  readline.close();

  if (answer2.toLowerCase() !== 'sim') {
    log('\nMigração cancelada.', 'yellow');
    await client.end();
    process.exit(0);
  }

  // Executar migração
  header('EXECUTANDO MIGRAÇÃO');

  const scripts = [
    { file: '18_migrate_medications.sql', name: 'Medicamentos' },
    { file: '19_migrate_prescriptions.sql', name: 'Prescrições' },
    { file: '20_migrate_prescription_tasks.sql', name: 'Tarefas de Administração' }
  ];

  let allSuccess = true;

  for (const script of scripts) {
    const scriptPath = path.join(__dirname, 'scripts', script.file);

    if (!fs.existsSync(scriptPath)) {
      log(`✗ Arquivo não encontrado: ${script.file}`, 'red');
      allSuccess = false;
      break;
    }

    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    const success = await executeSQL(sqlContent, script.name);

    if (!success) {
      allSuccess = false;
      break;
    }
  }

  if (!allSuccess) {
    log('\n✗ Migração falhou!', 'red');
    await client.end();
    process.exit(1);
  }

  // Validação
  header('VALIDAÇÃO');

  log('Contagens:', 'blue');
  const counts = await getCounts();
  counts.forEach(row => {
    console.log(`  ${row.tabela}: ${row.total}`);
  });

  console.log();
  log('Integridade referencial:', 'blue');
  const orphans = await checkIntegrity();
  if (orphans === 0) {
    log(`  ✓ Sem registros órfãos`, 'green');
  } else if (orphans > 0) {
    log(`  ⚠ ${orphans} prescrições órfãs encontradas`, 'yellow');
  }

  // Finalizar
  await client.end();

  header('MIGRAÇÃO CONCLUÍDA!');
  log('✓ Todos os scripts foram executados com sucesso', 'green');
  log('\nPróximos passos:', 'cyan');
  console.log('1. Revisar contagens acima');
  console.log('2. Validar dados no Supabase Dashboard');
  console.log('3. Testar aplicação com dados migrados');
  console.log('');
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
