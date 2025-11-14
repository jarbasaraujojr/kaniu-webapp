#!/usr/bin/env node
/**
 * Verificar estrutura do banco de dados
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Conectando ao Supabase...\n');
  await client.connect();

  // Listar todas as tabelas
  const tablesResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log('=== TABELAS ENCONTRADAS ===\n');
  console.log(`Total: ${tablesResult.rows.length} tabelas\n`);

  for (const row of tablesResult.rows) {
    const countResult = await client.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
    const count = countResult.rows[0].count;
    console.log(`  ${row.table_name.padEnd(40)} ${count.padStart(10)} registros`);
  }

  // Verificar se tem dados de medicação
  console.log('\n=== VERIFICAÇÃO DE SISTEMA DE MEDICAÇÃO ===\n');

  const medicationTables = {
    'medications': 'Tabela Nova de Medicamentos',
    'prescriptions': 'Tabela Nova de Prescrições',
    'prescription_tasks': 'Tabela Nova de Tarefas'
  };

  for (const [table, description] of Object.entries(medicationTables)) {
    try {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = result.rows[0].count;
      console.log(`  ✓ ${description}: ${count} registros`);
    } catch (error) {
      console.log(`  ✗ ${description}: NÃO EXISTE`);
    }
  }

  await client.end();
}

main().catch(console.error);
