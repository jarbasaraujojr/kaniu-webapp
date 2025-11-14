require('dotenv').config()
const { Client } = require('pg')

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Conectado ao Supabase!\n')

    // Buscar usuários com suas roles e shelters
    const result = await client.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        r.name as role_name,
        s.id as shelter_id,
        s.name as shelter_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN shelters s ON s.owner_id = u.id
      ORDER BY u.email
    `)

    console.log('=== USUÁRIOS E SUAS ROLES ===\n')
    result.rows.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Nome: ${user.name}`)
      console.log(`Role: ${user.role_name}`)
      console.log(`Shelter ID: ${user.shelter_id || 'Nenhum'}`)
      console.log(`Shelter: ${user.shelter_name || 'Nenhum'}`)
      console.log('---')
    })

    // Buscar abrigos
    console.log('\n=== ABRIGOS ===\n')
    const shelters = await client.query(`
      SELECT s.id, s.name, s.owner_id, u.name as owner_name, u.email as owner_email
      FROM shelters s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.name
    `)

    shelters.rows.forEach(shelter => {
      console.log(`Nome: ${shelter.name}`)
      console.log(`ID: ${shelter.id}`)
      console.log(`Owner ID: ${shelter.owner_id}`)
      console.log(`Owner: ${shelter.owner_name} (${shelter.owner_email})`)
      console.log('---')
    })

  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await client.end()
  }
}

checkUsers()
