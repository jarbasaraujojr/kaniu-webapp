#!/usr/bin/env node
/**
 * Migração de Pesagens (Animal Weights) do Viralatinha
 * Banco Antigo → Banco Novo
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
  console.log('MIGRAÇÃO DE PESAGENS - VIRALATINHA')
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
    // 1. Verificar se existe tabela de pesagens no banco antigo
    const tablesCheck = await oldDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('pesagens', 'animal_weights', 'peso_animal', 'pesos')
    `)

    console.log('📊 Tabelas de pesagens encontradas no banco antigo:')
    if (tablesCheck.rows.length === 0) {
      console.log('   ⚠ Nenhuma tabela de pesagens encontrada')
      console.log()
      console.log('Verificando estrutura de tabelas disponíveis...')

      const allTables = await oldDb.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `)

      console.log('\nTabelas disponíveis no banco antigo:')
      allTables.rows.forEach(row => console.log(`   - ${row.table_name}`))

      await oldDb.end()
      await newDb.end()
      return
    }

    const weightTable = tablesCheck.rows[0].table_name
    console.log(`   ✓ Usando tabela: ${weightTable}`)
    console.log()

    // 2. Verificar estrutura da tabela de pesagens
    console.log('📋 Estrutura da tabela de pesagens:')
    const columnsCheck = await oldDb.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `, [weightTable])

    columnsCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type}`)
    })
    console.log()

    // 3. Buscar ID do abrigo Viralatinha no banco antigo
    const viralatinhaOld = await oldDb.query(`
      SELECT id, canil as name
      FROM canis
      WHERE LOWER(canil) LIKE '%viralatinha%'
      LIMIT 1
    `)

    if (viralatinhaOld.rows.length === 0) {
      console.log('❌ Abrigo Viralatinha não encontrado no banco antigo')
      await oldDb.end()
      await newDb.end()
      return
    }

    const oldShelterId = viralatinhaOld.rows[0].id
    console.log(`✓ Abrigo Viralatinha no banco antigo: ${viralatinhaOld.rows[0].name} (ID: ${oldShelterId})`)
    console.log()

    // 4. Buscar ID do abrigo Viralatinha no banco novo
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

    // 5. Buscar mapeamento de animais antigo → novo (usando nome)
    console.log('🔗 Buscando mapeamento de animais por nome...')

    // Buscar animais do banco antigo
    const oldAnimals = await oldDb.query(`
      SELECT animal_id, nome
      FROM animais
      WHERE canil = $1
    `, [oldShelterId])

    // Buscar animais do banco novo
    const newAnimals = await newDb.query(`
      SELECT id, name
      FROM animals
      WHERE shelter_id = $1
    `, [newShelterId])

    console.log(`   ✓ ${oldAnimals.rows.length} animais no banco antigo`)
    console.log(`   ✓ ${newAnimals.rows.length} animais no banco novo`)
    console.log()

    if (newAnimals.rows.length === 0) {
      console.log('⚠ Nenhum animal do Viralatinha encontrado no banco novo')
      console.log('   Execute primeiro a migração de animais antes de migrar as pesagens')
      await oldDb.end()
      await newDb.end()
      return
    }

    // Criar mapa de nome → novo ID
    const nameToNewIdMap = {}
    newAnimals.rows.forEach(row => {
      nameToNewIdMap[row.name.toLowerCase().trim()] = row.id
    })

    // Criar mapa de antigo ID → novo ID
    const oldToNewMap = {}
    oldAnimals.rows.forEach(oldAnimal => {
      const normalizedName = oldAnimal.nome.toLowerCase().trim()
      const newId = nameToNewIdMap[normalizedName]
      if (newId) {
        oldToNewMap[oldAnimal.animal_id] = newId
      }
    })

    console.log(`✓ ${Object.keys(oldToNewMap).length} animais mapeados por nome`)
    console.log()

    // 6. Buscar pesagens do banco antigo para animais do Viralatinha
    console.log('📦 Buscando pesagens do banco antigo...')

    // A tabela pesagens tem a coluna 'animal' (uuid)
    const oldWeights = await oldDb.query(`
      SELECT w.*
      FROM pesagens w
      INNER JOIN animais a ON a.animal_id = w.animal
      WHERE a.canil = $1
      ORDER BY w.data
    `, [oldShelterId])

    console.log(`   ✓ ${oldWeights.rows.length} pesagens encontradas`)
    console.log()

    if (oldWeights.rows.length === 0) {
      console.log('⚠ Nenhuma pesagem encontrada para migrar')
      await oldDb.end()
      await newDb.end()
      return
    }

    // 7. Buscar usuário padrão para recorded_by
    const defaultUser = await newDb.query(`
      SELECT id FROM users ORDER BY created_at LIMIT 1
    `)

    if (defaultUser.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco novo')
      await oldDb.end()
      await newDb.end()
      return
    }

    const defaultUserId = defaultUser.rows[0].id
    console.log(`✓ Usando usuário padrão: ${defaultUserId}`)
    console.log()

    // 8. Migrar pesagens
    console.log('🔄 Migrando pesagens...')
    console.log()

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const oldWeight of oldWeights.rows) {
      const oldAnimalId = oldWeight.animal // coluna 'animal' é o UUID
      const newAnimalId = oldToNewMap[oldAnimalId]

      if (!newAnimalId) {
        console.log(`   ⚠ Animal antigo ${oldAnimalId} não tem mapeamento - pulando`)
        skipped++
        continue
      }

      try {
        // Mapear campos da tabela pesagens: id, animal, data, peso
        const value = oldWeight.peso
        const dateTime = oldWeight.data // apenas data, sem hora
        const notes = null
        const recordedBy = defaultUserId

        // Verificar se já existe
        const exists = await newDb.query(`
          SELECT id FROM animal_weights
          WHERE animal_id = $1 AND DATE(date_time) = $2
        `, [newAnimalId, dateTime])

        if (exists.rows.length > 0) {
          console.log(`   - Pesagem já existe para animal ${newAnimalId} em ${dateTime}`)
          skipped++
          continue
        }

        await newDb.query(`
          INSERT INTO animal_weights (
            animal_id,
            value,
            unit,
            recorded_by,
            date_time,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          newAnimalId,
          value,
          'kg',
          recordedBy,
          dateTime,
          notes
        ])

        migrated++
        console.log(`   ✓ Migrada pesagem: ${value}kg em ${new Date(dateTime).toLocaleDateString()}`)

      } catch (error) {
        errors++
        console.log(`   ✗ Erro ao migrar pesagem: ${error.message}`)
      }
    }

    console.log()
    console.log('=' .repeat(70))
    console.log('RESUMO DA MIGRAÇÃO')
    console.log('=' .repeat(70))
    console.log()
    console.log(`   ✓ ${migrated} pesagens migradas`)
    console.log(`   - ${skipped} pesagens puladas (já existem ou sem mapeamento)`)
    console.log(`   ✗ ${errors} erros`)
    console.log()
    console.log('✅ Migração de pesagens concluída!')
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
