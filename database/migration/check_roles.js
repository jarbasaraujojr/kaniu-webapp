const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  // Check roles
  const roles = await client.query(`SELECT * FROM roles ORDER BY id`)
  console.log('Roles disponíveis:')
  roles.rows.forEach(role => console.log(`  ${role.id} - ${role.name}`))

  await client.end()
}

main().catch(console.error)
