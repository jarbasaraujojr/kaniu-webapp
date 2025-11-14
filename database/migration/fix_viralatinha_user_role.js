require('dotenv').config()
const { Client } = require('pg')

async function fixUserRole() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Conectado ao Supabase!\n')

    // 1. Buscar o ID do role shelter_manager
    const roleResult = await client.query(`
      SELECT id, name FROM roles WHERE name = 'shelter_manager'
    `)

    if (roleResult.rows.length === 0) {
      console.error('❌ Role "shelter_manager" não encontrado!')
      return
    }

    const shelterManagerRoleId = roleResult.rows[0].id
    console.log(`✓ Role "shelter_manager" encontrado (ID: ${shelterManagerRoleId})`)

    // 2. Buscar o usuário admin@viralatinhaz.com.br
    const userResult = await client.query(`
      SELECT id, email, name, role_id
      FROM users
      WHERE email = 'admin@viralatinhaz.com.br'
    `)

    if (userResult.rows.length === 0) {
      console.error('❌ Usuário admin@viralatinhaz.com.br não encontrado!')
      return
    }

    const user = userResult.rows[0]
    console.log(`\n✓ Usuário encontrado:`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Nome: ${user.name}`)
    console.log(`  Role ID atual: ${user.role_id}`)

    // 3. Atualizar o role do usuário
    await client.query(`
      UPDATE users
      SET role_id = $1
      WHERE id = $2
    `, [shelterManagerRoleId, user.id])

    console.log(`\n✓ Role atualizado com sucesso!`)
    console.log(`  Novo Role ID: ${shelterManagerRoleId} (shelter_manager)`)

    // 4. Verificar a atualização
    const verifyResult = await client.query(`
      SELECT u.email, u.name, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [user.id])

    console.log(`\n✓ Verificação:`)
    console.log(`  Email: ${verifyResult.rows[0].email}`)
    console.log(`  Nome: ${verifyResult.rows[0].name}`)
    console.log(`  Role: ${verifyResult.rows[0].role_name}`)

    console.log(`\n✅ Atualização concluída! O usuário admin@viralatinhaz.com.br agora é shelter_manager.`)
    console.log(`   Ao fazer login, será redirecionado para /dashboard/painel (painel do abrigo Viralatinhaz)`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

fixUserRole()
