#!/usr/bin/env node
/**
 * Limpeza Final - Consolidar Cão/Cachorro
 */

const { Client } = require('pg');

const NEW_DB = {
  connectionString: 'postgresql://postgres:Tqsd17IeEkIygpZP@db.hgqhtkgmonshnsuevnoz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function main() {
  const client = new Client(NEW_DB);

  try {
    await client.connect();

    header('LIMPEZA FINAL - CONSOLIDAR CÃO/CACHORRO');

    // Buscar IDs
    const cao = await client.query(`
      SELECT id FROM catalogs WHERE category = 'species' AND name = 'Cão'
    `);

    const cachorro = await client.query(`
      SELECT id FROM catalogs WHERE category = 'species' AND name = 'Cachorro'
    `);

    if (cao.rows.length === 0 || cachorro.rows.length === 0) {
      log('✓ Já está consolidado!', 'green');
      await client.end();
      return;
    }

    const caoId = cao.rows[0].id;
    const cachorroId = cachorro.rows[0].id;

    log(`ID de "Cão": ${caoId}`, 'cyan');
    log(`ID de "Cachorro": ${cachorroId}`, 'cyan');

    // Contar raças usando cada um
    const breedsCao = await client.query(`
      SELECT COUNT(*) as count FROM catalogs
      WHERE category = 'breed' AND parent_id = $1
    `, [caoId]);

    const breedsCachorro = await client.query(`
      SELECT COUNT(*) as count FROM catalogs
      WHERE category = 'breed' AND parent_id = $1
    `, [cachorroId]);

    console.log();
    log(`Raças associadas a "Cão": ${breedsCao.rows[0].count}`, 'yellow');
    log(`Raças associadas a "Cachorro": ${breedsCachorro.rows[0].count}`, 'yellow');

    // Decidir qual manter (o que tem mais raças)
    const keepId = parseInt(breedsCachorro.rows[0].count) > parseInt(breedsCao.rows[0].count)
      ? cachorroId
      : caoId;
    const removeId = keepId === cachorroId ? caoId : cachorroId;
    const keepName = keepId === cachorroId ? 'Cachorro' : 'Cão';

    console.log();
    log(`Decisão: Manter "${keepName}" (ID: ${keepId})`, 'green');
    log(`Migrar raças de ID ${removeId} para ID ${keepId}`, 'blue');

    // Migrar raças para o ID correto
    const migrated = await client.query(`
      UPDATE catalogs
      SET parent_id = $1
      WHERE category = 'breed' AND parent_id = $2
      RETURNING id, name
    `, [keepId, removeId]);

    if (migrated.rows.length > 0) {
      log(`\n✓ ${migrated.rows.length} raças migradas:`, 'green');
      migrated.rows.forEach(r => console.log(`  - ${r.name}`));
    }

    // Deletar o registro duplicado
    await client.query(`DELETE FROM catalogs WHERE id = $1`, [removeId]);
    log(`\n✓ Registro ID ${removeId} removido`, 'green');

    // VALIDAÇÃO FINAL
    header('VALIDAÇÃO FINAL');

    const species = await client.query(`
      SELECT id, name,
             (SELECT COUNT(*) FROM catalogs WHERE category = 'breed' AND parent_id = catalogs.id) as breed_count
      FROM catalogs
      WHERE category = 'species'
      ORDER BY name
    `);

    log('Espécies finais:', 'blue');
    species.rows.forEach(s => {
      console.log(`  ${s.name.padEnd(20)} ID: ${s.id.toString().padStart(3)} | ${s.breed_count} raças`);
    });

    const allBreeds = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(parent_id) as with_parent
      FROM catalogs
      WHERE category = 'breed'
    `);

    console.log();
    log(`Total de raças: ${allBreeds.rows[0].total}`, 'cyan');
    log(`Com espécie: ${allBreeds.rows[0].with_parent}`, 'cyan');

    if (allBreeds.rows[0].total === allBreeds.rows[0].with_parent) {
      log('✓ Todas as raças têm espécie associada!', 'green');
    }

    // Verificar duplicações
    const dups = await client.query(`
      SELECT name, COUNT(*) as count, STRING_AGG(category, ', ') as categories
      FROM catalogs
      GROUP BY name
      HAVING COUNT(*) > 1
      AND COUNT(DISTINCT category) = 1
    `);

    console.log();
    if (dups.rows.length === 0) {
      log('✓ Sem duplicações inválidas!', 'green');
    } else {
      log(`⚠ ${dups.rows.length} duplicações dentro da mesma categoria:`, 'yellow');
      dups.rows.forEach(d => console.log(`  - ${d.name} em ${d.categories}`));
    }

    header('✅ LIMPEZA CONCLUÍDA!');

  } catch (error) {
    log('\n✗ ERRO:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
