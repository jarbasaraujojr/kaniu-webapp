#!/usr/bin/env node
/**
 * Migração entre dois projetos Supabase
 *
 * ANTIGO → NOVO
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configurações
const OLD_DB = {
  connectionString: 'postgresql://postgres:RJxyqaWWII6tkule@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

const OLD_DB_ALT = {
  connectionString: 'postgresql://postgres:D7Grm%25MegZ0wMnm@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

const NEW_DB = {
  connectionString: 'postgresql://postgres:Tqsd17IeEkIygpZP@db.hgqhtkgmonshnsuevnoz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

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
  console.log('\n' + '='.repeat(70));
  log(message, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function testConnection(config, name) {
  const client = new Client(config);
  try {
    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();
    log(`✓ Conectado a ${name}`, 'green');
    return true;
  } catch (error) {
    log(`✗ Erro ao conectar a ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function getTables(client) {
  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma%'
    ORDER BY table_name
  `);
  return result.rows.map(r => r.table_name);
}

async function getTableCount(client, tableName) {
  try {
    const result = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 0;
  }
}

async function main() {
  header('MIGRAÇÃO ENTRE PROJETOS SUPABASE');

  console.log('Projeto ANTIGO: db.vhktmkudbxfwgrjfxwpn.supabase.co');
  console.log('Projeto NOVO:   db.hgqhtkgmonshnsuevnoz.supabase.co');
  console.log();

  // Testar conexões
  log('Testando conexões...', 'blue');

  let oldConnected = await testConnection(OLD_DB, 'Projeto Antigo (senha 1)');
  let oldConfig = OLD_DB;

  if (!oldConnected) {
    log('Tentando senha alternativa...', 'yellow');
    oldConnected = await testConnection(OLD_DB_ALT, 'Projeto Antigo (senha 2)');
    oldConfig = OLD_DB_ALT;
  }

  if (!oldConnected) {
    log('\n✗ Não foi possível conectar ao projeto antigo', 'red');
    log('Verifique as credenciais e tente novamente', 'yellow');
    process.exit(1);
  }

  const newConnected = await testConnection(NEW_DB, 'Projeto Novo');
  if (!newConnected) {
    log('\n✗ Não foi possível conectar ao projeto novo', 'red');
    process.exit(1);
  }

  console.log();

  // Conectar aos dois bancos
  const oldClient = new Client(oldConfig);
  const newClient = new Client(NEW_DB);

  await oldClient.connect();
  await newClient.connect();

  // Listar tabelas do projeto antigo
  header('ANÁLISE DO PROJETO ANTIGO');

  const oldTables = await getTables(oldClient);
  log(`Total de tabelas: ${oldTables.length}`, 'blue');
  console.log();

  const tableStats = [];
  for (const table of oldTables) {
    const count = await getTableCount(oldClient, table);
    tableStats.push({ table, count });
    if (count > 0) {
      console.log(`  ${table.padEnd(40)} ${count.toString().padStart(10)} registros`);
    }
  }

  // Identificar tabelas de medicação
  const medicationTables = tableStats.filter(t =>
    ['medicamento', 'prescricao', 'prescricao_tarefa', 'receita',
     'medicamento_dosagem', 'medicamento_via'].includes(t.table) && t.count > 0
  );

  console.log();
  if (medicationTables.length > 0) {
    log('✓ Dados de medicação encontrados:', 'green');
    medicationTables.forEach(t => {
      console.log(`    ${t.table}: ${t.count} registros`);
    });
  } else {
    log('⚠ Nenhum dado de medicação encontrado no projeto antigo', 'yellow');
  }

  // Verificar estrutura do projeto novo
  header('ANÁLISE DO PROJETO NOVO');

  const newTables = await getTables(newClient);
  log(`Total de tabelas: ${newTables.length}`, 'blue');

  const hasMedicationTables = ['medications', 'prescriptions', 'prescription_tasks']
    .every(t => newTables.includes(t));

  if (hasMedicationTables) {
    log('✓ Tabelas de medicação existem no projeto novo', 'green');
  } else {
    log('✗ Tabelas de medicação NÃO existem no projeto novo', 'red');
    log('Execute primeiro: npx prisma db push', 'yellow');
    await oldClient.end();
    await newClient.end();
    process.exit(1);
  }

  // Verificar se já tem dados no novo
  const newMedCount = await getTableCount(newClient, 'medications');
  const newPrescCount = await getTableCount(newClient, 'prescriptions');
  const newTaskCount = await getTableCount(newClient, 'prescription_tasks');

  console.log();
  console.log('Dados atuais no projeto novo:');
  console.log(`  medications: ${newMedCount}`);
  console.log(`  prescriptions: ${newPrescCount}`);
  console.log(`  prescription_tasks: ${newTaskCount}`);

  if (newMedCount > 0 || newPrescCount > 0 || newTaskCount > 0) {
    log('\n⚠ AVISO: Projeto novo já tem dados de medicação!', 'yellow');
  }

  // Confirmação
  console.log('\n' + '⚠'.repeat(35));
  log('CONFIRMAÇÃO DE MIGRAÇÃO', 'yellow');
  console.log('⚠'.repeat(35) + '\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer1 = await new Promise(resolve => {
    readline.question('Você fez BACKUP dos dois projetos? (sim/não): ', resolve);
  });

  if (answer1.toLowerCase() !== 'sim') {
    log('\n⚠ Por favor, faça backup primeiro!', 'red');
    readline.close();
    await oldClient.end();
    await newClient.end();
    process.exit(0);
  }

  const answer2 = await new Promise(resolve => {
    readline.question('\nDeseja prosseguir com a migração? (sim/não): ', resolve);
  });

  readline.close();

  if (answer2.toLowerCase() !== 'sim') {
    log('\nMigração cancelada.', 'yellow');
    await oldClient.end();
    await newClient.end();
    process.exit(0);
  }

  // Salvar dump dos dados antigos
  header('BACKUP DOS DADOS ANTIGOS');

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(backupDir, `old_project_backup_${timestamp}.json`);

  log('Exportando dados do projeto antigo...', 'blue');

  const backup = {
    timestamp: new Date().toISOString(),
    source: 'db.vhktmkudbxfwgrjfxwpn.supabase.co',
    tables: {}
  };

  for (const { table, count } of tableStats.filter(t => t.count > 0)) {
    process.stdout.write(`  ${table}... `);
    try {
      const result = await oldClient.query(`SELECT * FROM "${table}"`);
      backup.tables[table] = result.rows;
      log(`${result.rows.length} registros`, 'green');
    } catch (error) {
      log(`ERRO: ${error.message}`, 'red');
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / 1048576).toFixed(2);
  log(`\n✓ Backup salvo: ${backupFile} (${sizeMB} MB)`, 'green');

  // Executar scripts de migração
  header('EXECUTANDO MIGRAÇÃO');

  log('Lendo scripts SQL...', 'blue');

  const scripts = [
    { file: '18_migrate_medications.sql', name: 'Medicamentos' },
    { file: '19_migrate_prescriptions.sql', name: 'Prescrições' },
    { file: '20_migrate_prescription_tasks.sql', name: 'Tarefas' }
  ];

  // Criar DBLink para conectar os dois bancos
  log('\nConfiguração especial necessária:', 'yellow');
  log('Os scripts SQL originais assumem que os dados estão no mesmo banco.', 'yellow');
  log('Como estão em projetos diferentes, vou adaptar a estratégia...', 'yellow');

  // Estratégia: Usar o backup JSON para migrar
  log('\nUsando dados do backup para migração...', 'blue');

  // Migrar medicamentos
  if (backup.tables.medicamento && backup.tables.medicamento.length > 0) {
    log('\nMigrando medicamentos...', 'blue');

    for (const med of backup.tables.medicamento) {
      const isGlobal = !med.canil_id;
      const insertQuery = `
        INSERT INTO medications (name, shelter_id, is_active, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `;

      try {
        await newClient.query(insertQuery, [
          med.nome,
          isGlobal ? null : med.canil_id,
          med.ativo !== false
        ]);
      } catch (error) {
        log(`  ⚠ Erro ao migrar ${med.nome}: ${error.message}`, 'yellow');
      }
    }

    const count = await getTableCount(newClient, 'medications');
    log(`✓ ${count} medicamentos migrados`, 'green');
  }

  // Finalizar
  await oldClient.end();
  await newClient.end();

  header('MIGRAÇÃO CONCLUÍDA!');

  log('✓ Backup salvo em: ' + backupFile, 'green');
  log('✓ Dados migrados para o projeto novo', 'green');

  console.log('\nPróximos passos:');
  console.log('1. Validar dados no projeto novo');
  console.log('2. Testar aplicação');
  console.log('3. Se tudo OK, apagar projeto antigo\n');
}

main().catch(error => {
  console.error('\nErro fatal:', error);
  process.exit(1);
});
