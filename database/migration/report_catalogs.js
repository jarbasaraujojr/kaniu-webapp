#!/usr/bin/env node
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Tqsd17IeEkIygpZP@db.hgqhtkgmonshnsuevnoz.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();

  console.log('='.repeat(70));
  console.log('RELATÓRIO FINAL - TABELA CATALOGS');
  console.log('='.repeat(70) + '\n');

  // Categorias
  const cats = await client.query(`
    SELECT category, COUNT(*) as cnt
    FROM catalogs
    GROUP BY category
    ORDER BY category
  `);

  console.log('CATEGORIAS:');
  cats.rows.forEach(r => {
    console.log(`  ${r.category.padEnd(20)} ${r.cnt} registros`);
  });

  // Espécies
  console.log('\nESPÉCIES:');
  const species = await client.query(`
    SELECT id, name FROM catalogs
    WHERE category = 'species'
    ORDER BY name
  `);

  species.rows.forEach(r => {
    console.log(`  ${r.name.padEnd(20)} ID: ${r.id}`);
  });

  // Raças por espécie
  console.log('\nRAÇAS POR ESPÉCIE:');

  for (const sp of species.rows) {
    const breeds = await client.query(
      `SELECT name FROM catalogs
       WHERE category = 'breed' AND parent_id = $1
       ORDER BY name`,
      [sp.id]
    );

    console.log(`\n  ${sp.name} (${breeds.rows.length} raças):`);

    breeds.rows.slice(0, 10).forEach(b => {
      console.log(`    - ${b.name}`);
    });

    if (breeds.rows.length > 10) {
      console.log(`    ... e mais ${breeds.rows.length - 10} raças`);
    }
  }

  // Duplicações
  const dups = await client.query(`
    SELECT name, COUNT(*) as cnt
    FROM catalogs
    GROUP BY name
    HAVING COUNT(*) > 1 AND COUNT(DISTINCT category) = 1
  `);

  console.log('\n\nDUPLICAÇÕES INVÁLIDAS:');
  if (dups.rows.length === 0) {
    console.log('  ✓ Nenhuma duplicação inválida!');
  } else {
    dups.rows.forEach(d => {
      console.log(`  ⚠ ${d.name} (${d.cnt}x)`);
    });
  }

  // Duplicações válidas (mesmo nome, categorias diferentes)
  const validDups = await client.query(`
    SELECT name, COUNT(*) as cnt, STRING_AGG(DISTINCT category, ', ') as cats
    FROM catalogs
    GROUP BY name
    HAVING COUNT(*) > 1 AND COUNT(DISTINCT category) > 1
  `);

  console.log('\nDUPLICAÇÕES VÁLIDAS (categorias diferentes):');
  if (validDups.rows.length === 0) {
    console.log('  Nenhuma');
  } else {
    validDups.rows.forEach(d => {
      console.log(`  ✓ "${d.name}" em: ${d.cats}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ANÁLISE CONCLUÍDA!');
  console.log('='.repeat(70));

  await client.end();
}

main().catch(console.error);
