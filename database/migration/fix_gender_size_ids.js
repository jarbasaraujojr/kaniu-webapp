require('dotenv').config()
const { Client } = require('pg')

async function fixGenderSizeIds() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Conectado ao Supabase!\n')

    // 1. Buscar os IDs na tabela catalogs
    const catalogsResult = await client.query(`
      SELECT id, category, name
      FROM catalogs
      WHERE id IN (157, 158, 159, 160, 161, 162, 163)
      ORDER BY id
    `)

    console.log('=== MAPEAMENTO IDS → VALORES ===\n')
    const mapping = {}
    catalogsResult.rows.forEach(r => {
      console.log(`ID ${r.id}: [${r.category}] ${r.name}`)
      mapping[r.id] = r.name
    })

    console.log('\n=== CORRIGINDO REGISTROS ===\n')

    // 2. Atualizar gender
    for (const [id, value] of Object.entries(mapping)) {
      const result = await client.query(`
        UPDATE animals
        SET gender = $1
        WHERE gender = $2
      `, [value, id])

      if (result.rowCount > 0) {
        console.log(`✓ Atualizados ${result.rowCount} registros: gender "${id}" → "${value}"`)
      }
    }

    // 3. Atualizar size
    for (const [id, value] of Object.entries(mapping)) {
      const result = await client.query(`
        UPDATE animals
        SET size = $1
        WHERE size = $2
      `, [value, id])

      if (result.rowCount > 0) {
        console.log(`✓ Atualizados ${result.rowCount} registros: size "${id}" → "${value}"`)
      }
    }

    // 4. Verificar resultado
    console.log('\n=== VERIFICAÇÃO ===\n')

    const genderCheck = await client.query(`
      SELECT DISTINCT gender FROM animals WHERE gender IS NOT NULL ORDER BY gender
    `)
    console.log('Valores únicos de GENDER:')
    genderCheck.rows.forEach(r => console.log(`  - "${r.gender}"`))

    const sizeCheck = await client.query(`
      SELECT DISTINCT size FROM animals WHERE size IS NOT NULL ORDER BY size
    `)
    console.log('\nValores únicos de SIZE:')
    sizeCheck.rows.forEach(r => console.log(`  - "${r.size}"`))

    console.log('\n✅ Correção concluída!')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

fixGenderSizeIds()
