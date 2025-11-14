#!/usr/bin/env node
/**
 * Verificar projeto antigo do Supabase
 */

const { Client } = require('pg');

const configs = [
  {
    name: 'Senha 1',
    connectionString: 'postgresql://postgres:RJxyqaWWII6tkule@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  },
  {
    name: 'Senha 2',
    connectionString: 'postgresql://postgres:D7Grm%25MegZ0wMnm@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  }
];

async function main() {
  console.log('='.repeat(70));
  console.log('VERIFICAÇÃO DO PROJETO ANTIGO');
  console.log('='.repeat(70));
  console.log();
  console.log('Host: db.vhktmkudbxfwgrjfxwpn.supabase.co');
  console.log();

  let client = null;
  let workingConfig = null;

  // Tentar ambas as senhas
  for (const config of configs) {
    console.log(`Tentando ${config.name}...`);
    client = new Client(config);

    try {
      await client.connect();
      console.log(`✓ Conectado com ${config.name}!\n`);
      workingConfig = config;
      break;
    } catch (error) {
      console.log(`✗ Falhou: ${error.message}\n`);
      client = null;
    }
  }

  if (!client) {
    console.log('✗ Não foi possível conectar com nenhuma senha');
    console.log('\nPor favor, verifique as credenciais no Supabase:');
    console.log('1. Acesse: https://app.supabase.com');
    console.log('2. Selecione o projeto antigo');
    console.log('3. Settings → Database → Connection string');
    process.exit(1);
  }

  // Listar tabelas
  console.log('='.repeat(70));
  console.log('TABELAS ENCONTRADAS');
  console.log('='.repeat(70));
  console.log();

  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`Total: ${tablesResult.rows.length} tabelas\n`);

  const tableCounts = [];

  for (const row of tablesResult.rows) {
    try {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
      const count = parseInt(countResult.rows[0].count);
      tableCounts.push({ name: row.table_name, count });

      const countStr = count.toString().padStart(10);
      console.log(`  ${row.table_name.padEnd(40)} ${countStr} registros`);
    } catch (error) {
      console.log(`  ${row.table_name.padEnd(40)}      ERRO`);
    }
  }

  // Analisar dados de medicação
  console.log();
  console.log('='.repeat(70));
  console.log('DADOS DE MEDICAÇÃO');
  console.log('='.repeat(70));
  console.log();

  const medicationTables = {
    'medicamento': 'Medicamentos cadastrados',
    'medicamento_dosagem': 'Dosagens',
    'medicamento_via': 'Vias de administração',
    'prescricao': 'Prescrições veterinárias',
    'prescricao_tarefa': 'Tarefas de administração',
    'receita': 'Receitas médicas'
  };

  let hasMedicationData = false;

  for (const [table, description] of Object.entries(medicationTables)) {
    const tableData = tableCounts.find(t => t.name === table);

    if (tableData) {
      console.log(`  ✓ ${description.padEnd(40)} ${tableData.count} registros`);
      if (tableData.count > 0) hasMedicationData = true;
    } else {
      console.log(`  ✗ ${description.padEnd(40)} NÃO EXISTE`);
    }
  }

  console.log();

  if (hasMedicationData) {
    console.log('✓ Projeto antigo TEM dados de medicação para migrar!');
  } else {
    console.log('⚠ Projeto antigo NÃO tem dados de medicação');
  }

  // Dados essenciais
  console.log();
  console.log('='.repeat(70));
  console.log('DADOS ESSENCIAIS');
  console.log('='.repeat(70));
  console.log();

  const essentialTables = {
    'animais': 'Animais',
    'usuarios': 'Usuários',
    'canis': 'Abrigos/Canis'
  };

  for (const [table, description] of Object.entries(essentialTables)) {
    const tableData = tableCounts.find(t => t.name === table);

    if (tableData) {
      console.log(`  ${description.padEnd(30)} ${tableData.count} registros`);
    } else {
      console.log(`  ${description.padEnd(30)} NÃO EXISTE`);
    }
  }

  await client.end();

  console.log();
  console.log('='.repeat(70));
  console.log('PRÓXIMO PASSO');
  console.log('='.repeat(70));
  console.log();
  console.log('Execute: node migrate_between_projects.js');
  console.log();
}

main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});
