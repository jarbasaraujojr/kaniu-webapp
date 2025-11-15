const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('🔗 Conectado ao banco de dados')

    // Buscar todos os animais que têm health_status
    const result = await client.query(`
      SELECT id, health_status
      FROM animals
      WHERE health_status IS NOT NULL
    `)

    console.log(`📊 Encontrados ${result.rows.length} animais com health_status`)

    let updated = 0
    let skipped = 0
    let copied = 0

    for (const row of result.rows) {
      const healthStatus = row.health_status

      // Verificar se existe o campo 'castrated' no health_status
      if (healthStatus && typeof healthStatus === 'object' && 'castrated' in healthStatus) {
        // Criar uma cópia do health_status sem o campo 'castrated'
        const { castrated, ...cleanedHealthStatus } = healthStatus

        // Primeiro, copiar o valor para o campo direto 'castrated' da tabela
        // E depois remover do health_status JSON
        await client.query(
          `UPDATE animals SET castrated = $1, health_status = $2 WHERE id = $3`,
          [castrated, JSON.stringify(cleanedHealthStatus), row.id]
        )

        updated++
        copied++
        console.log(`✓ Animal ${row.id}: Copiado castrated=${castrated} para campo direto e removido do health_status`)
      } else {
        skipped++
      }
    }

    console.log('\n📈 Resumo da migração:')
    console.log(`   ✓ ${updated} registros atualizados`)
    console.log(`   ✓ ${copied} valores copiados de health_status.castrated para campo direto`)
    console.log(`   - ${skipped} registros já sem o campo 'castrated'`)
    console.log('\n✅ Migração concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Conexão fechada')
  }
}

main()
  .catch(error => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
