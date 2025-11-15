#!/usr/bin/env node
/**
 * Migração de Dosagens de Medicamentos
 * Banco Antigo (medicacoes_dosagem) → Banco Novo (catalogs)
 */

const { Client } = require('pg')
require('dotenv').config()

// Configuração do banco antigo
const oldDbConfigs = [
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
]

async function connectToOldDb() {
  for (const config of oldDbConfigs) {
    const client = new Client(config)
    try {
      await client.connect()
      console.log(`✓ Conectado ao banco antigo com ${config.name}`)
      return client
    } catch (error) {
      console.log(`✗ Falhou com ${config.name}: ${error.message}`)
      await client.end().catch(() => {})
    }
  }
  throw new Error('Não foi possível conectar ao banco antigo')
}

async function main() {
  console.log('=' .repeat(70))
  console.log('MIGRAÇÃO DE DOSAGENS DE MEDICAMENTOS')
  console.log('=' .repeat(70))
  console.log()

  // Conectar aos dois bancos
  const oldDb = await connectToOldDb()
  const newDb = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  await newDb.connect()
  console.log('✓ Conectado ao banco novo')
  console.log()

  try {
    // 1. Verificar se existe a tabela medicamento_dosagem no banco antigo
    const tableCheck = await oldDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'medicamento_dosagem'
    `)

    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela medicamento_dosagem não encontrada no banco antigo')

      // Listar tabelas disponíveis
      const allTables = await oldDb.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%medic%'
        ORDER BY table_name
      `)

      console.log('\nTabelas relacionadas a medicamentos disponíveis:')
      allTables.rows.forEach(row => console.log(`   - ${row.table_name}`))

      await oldDb.end()
      await newDb.end()
      return
    }

    console.log('✓ Tabela medicamento_dosagem encontrada')
    console.log()

    // 2. Verificar estrutura da tabela
    console.log('📋 Estrutura da tabela medicamento_dosagem:')
    const columnsCheck = await oldDb.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'medicamento_dosagem'
      ORDER BY ordinal_position
    `)

    columnsCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type}`)
    })
    console.log()

    // 3. Buscar ID do abrigo Viralatinha no banco novo
    const viralatinhaNew = await newDb.query(`
      SELECT id, name
      FROM shelters
      WHERE LOWER(name) LIKE '%viralatinha%'
      LIMIT 1
    `)

    if (viralatinhaNew.rows.length === 0) {
      console.log('❌ Abrigo Viralatinha não encontrado no banco novo')
      await oldDb.end()
      await newDb.end()
      return
    }

    const newShelterId = viralatinhaNew.rows[0].id
    console.log(`✓ Abrigo Viralatinha no banco novo: ${viralatinhaNew.rows[0].name} (ID: ${newShelterId})`)
    console.log()

    // 4. Buscar dosagens do banco antigo
    console.log('📦 Buscando dosagens do banco antigo...')

    const oldDosages = await oldDb.query(`
      SELECT *
      FROM medicamento_dosagem
      ORDER BY id
    `)

    console.log(`   ✓ ${oldDosages.rows.length} dosagens encontradas`)
    console.log()

    if (oldDosages.rows.length === 0) {
      console.log('⚠ Nenhuma dosagem encontrada para migrar')
      await oldDb.end()
      await newDb.end()
      return
    }

    // 5. Mostrar algumas dosagens de exemplo
    console.log('📝 Primeiras 5 dosagens:')
    oldDosages.rows.slice(0, 5).forEach(dosage => {
      console.log(`   - ID: ${dosage.id}, Dosagem: ${dosage.dosagem || 'N/A'}`)
    })
    console.log()

    // 6. Migrar dosagens para catalogs
    console.log('🔄 Migrando dosagens para catalogs...')
    console.log()

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const oldDosage of oldDosages.rows) {
      try {
        // Determinar o nome da dosagem (pode variar dependendo da estrutura)
        const dosageName = oldDosage.dosagem || oldDosage.nome || oldDosage.descricao || `Dosagem ${oldDosage.id}`

        // Verificar se já existe
        const exists = await newDb.query(`
          SELECT id FROM catalogs
          WHERE category = 'medication_dosage'
          AND LOWER(name) = LOWER($1)
        `, [dosageName])

        if (exists.rows.length > 0) {
          console.log(`   - Dosagem já existe: ${dosageName}`)
          skipped++
          continue
        }

        // Inserir na tabela catalogs
        await newDb.query(`
          INSERT INTO catalogs (
            category,
            name,
            description,
            is_active,
            created_at
          ) VALUES ($1, $2, $3, $4, NOW())
        `, [
          'medication_dosage',
          dosageName,
          `Migrado do banco antigo (ID: ${oldDosage.id})`,
          true
        ])

        migrated++
        console.log(`   ✓ Migrada dosagem: ${dosageName}`)

      } catch (error) {
        errors++
        console.log(`   ✗ Erro ao migrar dosagem ID ${oldDosage.id}: ${error.message}`)
      }
    }

    console.log()
    console.log('=' .repeat(70))
    console.log('RESUMO DA MIGRAÇÃO')
    console.log('=' .repeat(70))
    console.log()
    console.log(`   ✓ ${migrated} dosagens migradas`)
    console.log(`   - ${skipped} dosagens puladas (já existem)`)
    console.log(`   ✗ ${errors} erros`)
    console.log()
    console.log('✅ Migração de dosagens concluída!')
    console.log()

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  } finally {
    await oldDb.end()
    await newDb.end()
    console.log('🔌 Conexões fechadas')
  }
}

main().catch(error => {
  console.error('Erro fatal:', error)
  process.exit(1)
})
