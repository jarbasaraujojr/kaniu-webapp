#!/usr/bin/env node
/**
 * Migração de Vias de Administração de Medicamentos
 * Banco Antigo (medicamento_via) → Banco Novo (catalogs)
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
  console.log('MIGRAÇÃO DE VIAS DE ADMINISTRAÇÃO DE MEDICAMENTOS')
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
    // 1. Verificar se existe a tabela medicamento_via no banco antigo
    const tableCheck = await oldDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'medicamento_via'
    `)

    if (tableCheck.rows.length === 0) {
      console.log('❌ Tabela medicamento_via não encontrada no banco antigo')
      await oldDb.end()
      await newDb.end()
      return
    }

    console.log('✓ Tabela medicamento_via encontrada')
    console.log()

    // 2. Verificar estrutura da tabela
    console.log('📋 Estrutura da tabela medicamento_via:')
    const columnsCheck = await oldDb.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'medicamento_via'
      ORDER BY ordinal_position
    `)

    columnsCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type}`)
    })
    console.log()

    // 3. Buscar vias de administração do banco antigo
    console.log('📦 Buscando vias de administração do banco antigo...')

    const oldRoutes = await oldDb.query(`
      SELECT *
      FROM medicamento_via
      ORDER BY id
    `)

    console.log(`   ✓ ${oldRoutes.rows.length} vias encontradas`)
    console.log()

    if (oldRoutes.rows.length === 0) {
      console.log('⚠ Nenhuma via encontrada para migrar')
      await oldDb.end()
      await newDb.end()
      return
    }

    // 4. Mostrar algumas vias de exemplo
    console.log('📝 Primeiras 5 vias de administração:')
    oldRoutes.rows.slice(0, 5).forEach(route => {
      console.log(`   - ID: ${route.id}, Via: ${route.via || route.nome || 'N/A'}`)
    })
    console.log()

    // 5. Migrar vias para catalogs
    console.log('🔄 Migrando vias de administração para catalogs...')
    console.log()

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const oldRoute of oldRoutes.rows) {
      try {
        // Determinar o nome da via (pode variar dependendo da estrutura)
        const routeName = oldRoute.via || oldRoute.nome || oldRoute.descricao || `Via ${oldRoute.id}`

        // Verificar se já existe
        const exists = await newDb.query(`
          SELECT id FROM catalogs
          WHERE category = 'medication_route'
          AND LOWER(name) = LOWER($1)
        `, [routeName])

        if (exists.rows.length > 0) {
          console.log(`   - Via já existe: ${routeName}`)
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
          'medication_route',
          routeName,
          `Migrado do banco antigo (ID: ${oldRoute.id})`,
          true
        ])

        migrated++
        console.log(`   ✓ Migrada via: ${routeName}`)

      } catch (error) {
        errors++
        console.log(`   ✗ Erro ao migrar via ID ${oldRoute.id}: ${error.message}`)
      }
    }

    console.log()
    console.log('=' .repeat(70))
    console.log('RESUMO DA MIGRAÇÃO')
    console.log('=' .repeat(70))
    console.log()
    console.log(`   ✓ ${migrated} vias migradas`)
    console.log(`   - ${skipped} vias puladas (já existem)`)
    console.log(`   ✗ ${errors} erros`)
    console.log()
    console.log('✅ Migração de vias de administração concluída!')
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
