#!/usr/bin/env node
/**
 * Migração de Veterinários
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
  console.log('MIGRAÇÃO DE VETERINÁRIOS')
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
    // 1. Verificar tabelas relacionadas a veterinários no banco antigo
    console.log('📋 Buscando tabelas relacionadas a veterinários...')
    const tablesCheck = await oldDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%vet%' OR table_name LIKE '%medic%')
      ORDER BY table_name
    `)

    console.log('Tabelas encontradas:')
    tablesCheck.rows.forEach(row => console.log(`   - ${row.table_name}`))
    console.log()

    // Tentar encontrar tabela de veterinários (pode ter diferentes nomes)
    const possibleTables = ['veterinarios', 'veterinario', 'vets', 'vet']
    let vetTable = null

    for (const tableName of possibleTables) {
      const check = await oldDb.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      `, [tableName])

      if (check.rows.length > 0) {
        vetTable = tableName
        break
      }
    }

    if (!vetTable) {
      console.log('❌ Tabela de veterinários não encontrada no banco antigo')
      console.log('Tentou: ' + possibleTables.join(', '))
      await oldDb.end()
      await newDb.end()
      return
    }

    console.log(`✓ Tabela de veterinários encontrada: ${vetTable}`)
    console.log()

    // 2. Verificar estrutura da tabela
    console.log(`📋 Estrutura da tabela ${vetTable}:`)
    const columnsCheck = await oldDb.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `, [vetTable])

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

    // 5. Buscar veterinários do banco antigo
    console.log('📦 Buscando veterinários do banco antigo...')

    // Primeiro ver uma amostra para entender a estrutura
    const sample = await oldDb.query(`SELECT * FROM ${vetTable} LIMIT 1`)
    if (sample.rows.length > 0) {
      console.log('Exemplo de registro:')
      console.log(sample.rows[0])
      console.log()
    }

    const oldVets = await oldDb.query(`
      SELECT *
      FROM ${vetTable}
      WHERE canil_id = $1
      ORDER BY vet_id
    `, [oldShelterId])

    console.log(`   ✓ ${oldVets.rows.length} veterinários encontrados`)
    console.log()

    if (oldVets.rows.length === 0) {
      console.log('⚠ Nenhum veterinário encontrado para migrar')
      await oldDb.end()
      await newDb.end()
      return
    }

    // 6. Mostrar alguns veterinários de exemplo
    console.log('📝 Primeiros 5 veterinários:')
    oldVets.rows.slice(0, 5).forEach(vet => {
      const name = vet.nome || vet.name || vet.veterinario || 'N/A'
      const crmv = vet.crmv || vet.registro || 'N/A'
      console.log(`   - Nome: ${name}, CRMV: ${crmv}`)
    })
    console.log()

    // 7. Migrar veterinários
    console.log('🔄 Migrando veterinários...')
    console.log()

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const oldVet of oldVets.rows) {
      try {
        // Determinar campos (adaptando aos nomes possíveis)
        const name = oldVet.nome || oldVet.name || oldVet.veterinario || `Veterinário ${oldVet.vet_id}`
        const crmv = oldVet.crmv || oldVet.registro || null
        const phone = oldVet.telefone || oldVet.phone || oldVet.celular || null
        const email = oldVet.email || null
        const specialty = oldVet.especialidade || oldVet.specialty || null

        // Gerar email temporário se não existir
        const vetEmail = email || `vet.${oldVet.vet_id}@temp.viralatinha.com`

        // Verificar se já existe (por email ou nome)
        const exists = await newDb.query(`
          SELECT id FROM users
          WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($2)
        `, [vetEmail, name])

        if (exists.rows.length > 0) {
          console.log(`   - Veterinário já existe: ${name}`)
          skipped++
          continue
        }

        // Inserir veterinário como usuário com role veterinarian (ID: 13)
        // Senha temporária: veterinario123
        const bcrypt = require('bcryptjs')
        const tempPassword = await bcrypt.hash('veterinario123', 10)

        await newDb.query(`
          INSERT INTO users (
            name,
            email,
            password,
            phone,
            document_id,
            role_id,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          name,
          vetEmail,
          tempPassword,
          phone,
          crmv ? crmv.toString() : null,  // Usar CRMV como document_id
          13  // role_id para veterinarian
        ])

        migrated++
        console.log(`   ✓ Migrado veterinário: ${name}${crmv ? ` (CRMV: ${crmv})` : ''}`)

      } catch (error) {
        errors++
        console.log(`   ✗ Erro ao migrar veterinário: ${error.message}`)
      }
    }

    console.log()
    console.log('=' .repeat(70))
    console.log('RESUMO DA MIGRAÇÃO')
    console.log('=' .repeat(70))
    console.log()
    console.log(`   ✓ ${migrated} veterinários migrados`)
    console.log(`   - ${skipped} veterinários pulados (já existem)`)
    console.log(`   ✗ ${errors} erros`)
    console.log()
    console.log('✅ Migração de veterinários concluída!')
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
