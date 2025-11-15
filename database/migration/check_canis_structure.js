const { Client } = require('pg')

const oldDbConfig = {
  connectionString: 'postgresql://postgres:RJxyqaWWII6tkule@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
}

async function main() {
  const client = new Client(oldDbConfig)
  await client.connect()

  // Ver estrutura da tabela animais
  const columns = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'animais'
    ORDER BY ordinal_position
  `)

  console.log('Colunas da tabela animais:')
  columns.rows.forEach(col => console.log(`  ${col.column_name} - ${col.data_type}`))

  // Ver alguns registros
  const records = await client.query(`SELECT idx, nome, canil FROM animais WHERE canil = 1 LIMIT 3`)
  console.log('\nPrimeiros registros:')
  console.log(records.rows)

  await client.end()
}

main().catch(console.error)
