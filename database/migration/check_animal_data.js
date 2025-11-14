require('dotenv').config()
const { Client } = require('pg')

async function checkAnimalData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Conectado ao Supabase!\n')

    // Buscar alguns animais para ver os dados
    const result = await client.query(`
      SELECT
        a.id,
        a.name,
        a.gender,
        a.size,
        a.species_id,
        a.breed_id,
        a.status_id,
        species.name as species_name,
        breed.name as breed_name,
        status.name as status_name
      FROM animals a
      LEFT JOIN catalogs species ON a.species_id = species.id
      LEFT JOIN catalogs breed ON a.breed_id = breed.id
      LEFT JOIN catalogs status ON a.status_id = status.id
      ORDER BY a.name
      LIMIT 5
    `)

    console.log('=== PRIMEIROS 5 ANIMAIS ===\n')
    result.rows.forEach(animal => {
      console.log(`Nome: ${animal.name}`)
      console.log(`Gender (campo): ${animal.gender}`)
      console.log(`Size (campo): ${animal.size}`)
      console.log(`Species ID: ${animal.species_id} → ${animal.species_name}`)
      console.log(`Breed ID: ${animal.breed_id} → ${animal.breed_name}`)
      console.log(`Status ID: ${animal.status_id} → ${animal.status_name}`)
      console.log('---\n')
    })

    // Verificar se gender e size têm IDs ao invés de valores
    const genderCheck = await client.query(`
      SELECT DISTINCT gender FROM animals WHERE gender IS NOT NULL LIMIT 10
    `)

    console.log('=== VALORES ÚNICOS DE GENDER ===')
    genderCheck.rows.forEach(r => console.log(`- "${r.gender}"`))

    const sizeCheck = await client.query(`
      SELECT DISTINCT size FROM animals WHERE size IS NOT NULL LIMIT 10
    `)

    console.log('\n=== VALORES ÚNICOS DE SIZE ===')
    sizeCheck.rows.forEach(r => console.log(`- "${r.size}"`))

  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await client.end()
  }
}

checkAnimalData()
