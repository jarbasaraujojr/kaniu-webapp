#!/usr/bin/env node
/**
 * Correção de Duplicações e Sobreposições em Catalogs
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
    log('✓ Conectado!', 'green');

    // ETAPA 1: Análise completa
    header('ETAPA 1: ANÁLISE COMPLETA DOS REGISTROS');

    const all = await client.query(`
      SELECT category, name, parent_id, id, created_at
      FROM catalogs
      ORDER BY category, name
    `);

    console.log('Total de registros:', all.rows.length);
    console.log();

    let currentCat = '';
    all.rows.forEach(row => {
      if (row.category !== currentCat) {
        currentCat = row.category;
        console.log(`\n[${row.category}]`);
      }
      const parent = row.parent_id ? `parent: ${row.parent_id}` : 'sem parent';
      console.log(`  ID: ${row.id.toString().padStart(4)} | ${row.name.padEnd(35)} | ${parent}`);
    });

    // ETAPA 2: Identificar problemas
    header('ETAPA 2: IDENTIFICAR PROBLEMAS');

    // 2.1 Padrão antigo vs novo
    const oldPattern = await client.query(`
      SELECT category, COUNT(*) as count
      FROM catalogs
      WHERE category LIKE 'animal_%'
      GROUP BY category
      ORDER BY category
    `);

    log('Categorias com padrão antigo (animal_*):', 'yellow');
    oldPattern.rows.forEach(row => {
      console.log(`  ${row.category.padEnd(25)} ${row.count} registros`);
    });

    // 2.2 breed_dog e breed_cat
    const breedSplit = await client.query(`
      SELECT category, COUNT(*) as count
      FROM catalogs
      WHERE category IN ('breed_dog', 'breed_cat', 'breed')
      GROUP BY category
      ORDER BY category
    `);

    console.log();
    log('Raças separadas por espécie:', 'yellow');
    breedSplit.rows.forEach(row => {
      console.log(`  ${row.category.padEnd(25)} ${row.count} registros`);
    });

    // 2.3 Duplicações por nome
    const duplicates = await client.query(`
      SELECT name, COUNT(*) as count,
             STRING_AGG(category || ':' || id::text, ', ') as categories
      FROM catalogs
      GROUP BY name
      HAVING COUNT(*) > 1
      ORDER BY count DESC, name
    `);

    console.log();
    if (duplicates.rows.length > 0) {
      log(`⚠ ${duplicates.rows.length} nomes duplicados encontrados:`, 'yellow');
      duplicates.rows.forEach(row => {
        console.log(`  ${row.name.padEnd(30)} x${row.count} -> ${row.categories}`);
      });
    } else {
      log('✓ Sem duplicações de nome', 'green');
    }

    // ETAPA 3: Correções
    header('ETAPA 3: APLICAR CORREÇÕES');

    // 3.1 Buscar IDs das espécies
    const speciesCao = await client.query(`
      SELECT id FROM catalogs
      WHERE category IN ('species', 'animal_species')
      AND (name = 'Cão' OR name = 'Cachorro')
      LIMIT 1
    `);

    const speciesGato = await client.query(`
      SELECT id FROM catalogs
      WHERE category IN ('species', 'animal_species')
      AND name = 'Gato'
      LIMIT 1
    `);

    const cachorroId = speciesCao.rows.length > 0 ? speciesCao.rows[0].id : null;
    const gatoId = speciesGato.rows.length > 0 ? speciesGato.rows[0].id : null;

    log(`Espécie Cachorro ID: ${cachorroId}`, 'cyan');
    log(`Espécie Gato ID: ${gatoId}`, 'cyan');

    // 3.2 Migrar breed_dog -> breed (com parent Cachorro)
    if (cachorroId) {
      log('\nMigrando breed_dog -> breed...', 'blue');

      const breedDog = await client.query(`
        SELECT id, name FROM catalogs WHERE category = 'breed_dog'
      `);

      for (const dog of breedDog.rows) {
        // Verificar se já existe em breed
        const existing = await client.query(`
          SELECT id FROM catalogs
          WHERE category = 'breed' AND name = $1
        `, [dog.name]);

        if (existing.rows.length > 0) {
          // Atualizar o existente com parent_id
          await client.query(`
            UPDATE catalogs
            SET parent_id = $1
            WHERE id = $2
          `, [cachorroId, existing.rows[0].id]);

          // Deletar o breed_dog duplicado
          await client.query(`DELETE FROM catalogs WHERE id = $1`, [dog.id]);
          log(`  ✓ ${dog.name}: mesclado (duplicado removido)`, 'green');
        } else {
          // Atualizar categoria e parent_id
          await client.query(`
            UPDATE catalogs
            SET category = 'breed', parent_id = $1
            WHERE id = $2
          `, [cachorroId, dog.id]);
          log(`  ✓ ${dog.name}: migrado`, 'green');
        }
      }
    }

    // 3.3 Migrar breed_cat -> breed (com parent Gato)
    if (gatoId) {
      log('\nMigrando breed_cat -> breed...', 'blue');

      const breedCat = await client.query(`
        SELECT id, name FROM catalogs WHERE category = 'breed_cat'
      `);

      for (const cat of breedCat.rows) {
        const existing = await client.query(`
          SELECT id FROM catalogs
          WHERE category = 'breed' AND name = $1
        `, [cat.name]);

        if (existing.rows.length > 0) {
          await client.query(`
            UPDATE catalogs
            SET parent_id = $1
            WHERE id = $2
          `, [gatoId, existing.rows[0].id]);

          await client.query(`DELETE FROM catalogs WHERE id = $1`, [cat.id]);
          log(`  ✓ ${cat.name}: mesclado (duplicado removido)`, 'green');
        } else {
          await client.query(`
            UPDATE catalogs
            SET category = 'breed', parent_id = $1
            WHERE id = $2
          `, [gatoId, cat.id]);
          log(`  ✓ ${cat.name}: migrado`, 'green');
        }
      }
    }

    // 3.4 Consolidar categorias com padrão animal_*
    log('\nConsolidando categorias animal_*...', 'blue');

    const migrations = [
      { old: 'animal_species', new: 'species' },
      { old: 'animal_size', new: 'size' },
      { old: 'animal_status', new: 'status' }
    ];

    for (const { old, new: newCat } of migrations) {
      const oldRecords = await client.query(`
        SELECT id, name FROM catalogs WHERE category = $1
      `, [old]);

      if (oldRecords.rows.length === 0) continue;

      log(`  Processando ${old} -> ${newCat}...`, 'cyan');

      for (const record of oldRecords.rows) {
        const existing = await client.query(`
          SELECT id FROM catalogs
          WHERE category = $1 AND name = $2
        `, [newCat, record.name]);

        if (existing.rows.length > 0) {
          // Já existe, deletar o antigo
          await client.query(`DELETE FROM catalogs WHERE id = $1`, [record.id]);
          log(`    ✓ ${record.name}: duplicado removido`, 'green');
        } else {
          // Migrar categoria
          await client.query(`
            UPDATE catalogs SET category = $1 WHERE id = $2
          `, [newCat, record.id]);
          log(`    ✓ ${record.name}: migrado`, 'green');
        }
      }
    }

    // VALIDAÇÃO FINAL
    header('ETAPA 4: VALIDAÇÃO FINAL');

    const final = await client.query(`
      SELECT category, COUNT(*) as count
      FROM catalogs
      GROUP BY category
      ORDER BY category
    `);

    log('Categorias finais:', 'blue');
    final.rows.forEach(row => {
      console.log(`  ${row.category.padEnd(25)} ${row.count} registros`);
    });

    // Verificar duplicados
    const dupCheck = await client.query(`
      SELECT name, COUNT(*) as count
      FROM catalogs
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    console.log();
    if (dupCheck.rows.length === 0) {
      log('✓ Sem duplicações de nome!', 'green');
    } else {
      log(`⚠ Ainda há ${dupCheck.rows.length} nomes duplicados`, 'yellow');
    }

    // Verificar hierarquia
    const hierarchy = await client.query(`
      SELECT category,
             COUNT(*) as total,
             COUNT(parent_id) as with_parent
      FROM catalogs
      WHERE category = 'breed'
      GROUP BY category
    `);

    console.log();
    if (hierarchy.rows.length > 0) {
      const row = hierarchy.rows[0];
      log(`Raças: ${row.total} total, ${row.with_parent} com espécie`, 'cyan');

      if (row.total === parseInt(row.with_parent)) {
        log('✓ Todas as raças têm espécie!', 'green');
      } else {
        log(`⚠ ${row.total - row.with_parent} raças sem espécie`, 'yellow');
      }
    }

    header('✅ CORREÇÃO CONCLUÍDA!');

  } catch (error) {
    log('\n✗ ERRO:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
