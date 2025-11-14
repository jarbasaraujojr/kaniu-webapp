#!/usr/bin/env node
/**
 * Teste de Login - Verificar senha do usuário
 */

const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const DB = {
  connectionString: 'postgresql://postgres:Tqsd17IeEkIygpZP@db.hgqhtkgmonshnsuevnoz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

async function main() {
  const client = new Client(DB);
  await client.connect();

  const email = 'admin@viralatinhaz.com.br';
  const senha = 'viralatinhaz2024';

  console.log('='.repeat(70));
  console.log('TESTE DE LOGIN');
  console.log('='.repeat(70));
  console.log();
  console.log('Testando credenciais:');
  console.log('  Email:', email);
  console.log('  Senha:', senha);
  console.log();

  // Buscar usuário
  const result = await client.query(
    `SELECT u.id, u.email, u.name, u.password, u.role_id,
            r.name as role_name, r.permissions
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    console.log('✗ Usuário não encontrado!');
    await client.end();
    return;
  }

  const user = result.rows[0];
  console.log('✓ Usuário encontrado:');
  console.log('  ID:', user.id);
  console.log('  Nome:', user.name);
  console.log('  Role ID:', user.role_id);
  console.log('  Role Name:', user.role_name);
  console.log('  Hash stored:', user.password.substring(0, 20) + '...');
  console.log();

  // Testar senha
  console.log('Verificando senha...');
  const isValid = await bcrypt.compare(senha, user.password);

  console.log();
  if (isValid) {
    console.log('✓ SENHA CORRETA!');
    console.log();
    console.log('Dados que seriam retornados no login:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role_name,
      roleId: user.role_id,
      permissions: user.permissions
    });
  } else {
    console.log('✗ SENHA INCORRETA!');
    console.log();
    console.log('Gerando novo hash para comparação:');
    const newHash = await bcrypt.hash(senha, 10);
    console.log('  Novo hash:', newHash.substring(0, 20) + '...');
    console.log();
    console.log('SOLUÇÃO: Execute o script para resetar a senha:');
    console.log('  node database/migration/reset_password.js');
  }

  console.log();
  console.log('='.repeat(70));

  await client.end();
}

main().catch(console.error);
