#!/usr/bin/env node
/**
 * Migração de Catálogos com Hierarquia
 * Extrai valores únicos de: especie, raça, cor, pelagem, porte, genero, faixaetaria
 * dos dados de animais e cria registros em catalogs
 * Mantém relação: raças -> espécies
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

// Mapeamento campo -> categoria
const FIELD_MAPPING = {
  especie: 'species',
  raça: 'breed',
  cor: 'color',
  pelagem: 'coat',
  porte: 'size',
  genero: 'gender',
  faixaetaria: 'age_range'
};

async function main() {
  const startTime = Date.now();

  header('MIGRAÇÃO DE CATÁLOGOS - EXTRAÇÃO DE VALORES ÚNICOS');

  const newClient = new Client(NEW_DB);

  try {
    log('Conectando ao banco novo...', 'blue');
    await newClient.connect();
    log('✓ Conectado!', 'green');

    // Carregar backup
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');

    if (!fs.existsSync(backupFile)) {
      log('✗ Arquivo de backup não encontrado!', 'red');
      log(`  Esperado: ${backupFile}`, 'yellow');
      process.exit(1);
    }

    log(`\nCarregando backup: ${path.basename(backupFile)}`, 'blue');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    log('✓ Backup carregado', 'green');

    const animais = backup.tables.animais || [];
    log(`Total de animais no backup: ${animais.length}`, 'cyan');

    // ETAPA 1: Extrair valores únicos
    header('ETAPA 1: EXTRAIR VALORES ÚNICOS');

    const uniqueValues = {};
    const breedToSpecies = {}; // raça -> espécie

    Object.keys(FIELD_MAPPING).forEach(field => {
      uniqueValues[field] = new Set();
    });

    animais.forEach(animal => {
      Object.keys(FIELD_MAPPING).forEach(field => {
        const value = animal[field];
        if (value && value.trim()) {
          uniqueValues[field].add(value.trim());

          // Guardar relação raça -> espécie
          if (field === 'raça' && animal.especie) {
            breedToSpecies[value.trim()] = animal.especie.trim();
          }
        }
      });
    });

    log('Valores únicos encontrados:', 'blue');
    Object.entries(uniqueValues).forEach(([field, values]) => {
      console.log(`  ${field.padEnd(15)} ${values.size} valores únicos`);
    });

    // ETAPA 2: Migrar espécies primeiro (sem parent)
    header('ETAPA 2: MIGRAR ESPÉCIES');

    const speciesMapping = {}; // nome_especie -> id
    const especies = Array.from(uniqueValues.especie);

    log(`Migrando ${especies.length} espécies...`, 'blue');

    for (const especie of especies) {
      try {
        const result = await newClient.query(
          `INSERT INTO catalogs (category, name, is_active, created_at)
           VALUES ($1, $2, true, NOW())
           ON CONFLICT (category, name) DO UPDATE
           SET is_active = true
           RETURNING id, name`,
          ['species', especie]
        );

        speciesMapping[especie] = result.rows[0].id;
        log(`  ✓ ${especie} (ID: ${result.rows[0].id})`, 'green');

      } catch (error) {
        log(`  ✗ ${especie}: ${error.message}`, 'red');
      }
    }

    // ETAPA 3: Migrar raças (com parent_id = espécie)
    header('ETAPA 3: MIGRAR RAÇAS COM HIERARQUIA');

    const racas = Array.from(uniqueValues.raça);
    log(`Migrando ${racas.length} raças...`, 'blue');

    let withParent = 0;
    let withoutParent = 0;

    for (const raca of racas) {
      try {
        const especieNome = breedToSpecies[raca];
        const parentId = especieNome ? speciesMapping[especieNome] : null;

        const result = await newClient.query(
          `INSERT INTO catalogs (category, name, parent_id, is_active, created_at)
           VALUES ($1, $2, $3, true, NOW())
           ON CONFLICT (category, name) DO UPDATE
           SET parent_id = EXCLUDED.parent_id
           RETURNING id, name, parent_id`,
          ['breed', raca, parentId]
        );

        if (parentId) {
          log(`  ✓ ${raca} -> ${especieNome}`, 'green');
          withParent++;
        } else {
          log(`  ⚠ ${raca} (sem espécie)`, 'yellow');
          withoutParent++;
        }

      } catch (error) {
        log(`  ✗ ${raca}: ${error.message}`, 'red');
      }
    }

    console.log();
    log(`Raças com espécie: ${withParent}`, 'green');
    log(`Raças sem espécie: ${withoutParent}`, withoutParent > 0 ? 'yellow' : 'green');

    // ETAPA 4: Migrar demais catálogos (sem parent)
    header('ETAPA 4: MIGRAR OUTROS CATÁLOGOS');

    const simpleCatalogs = ['cor', 'pelagem', 'porte', 'genero', 'faixaetaria'];

    for (const field of simpleCatalogs) {
      const category = FIELD_MAPPING[field];
      const values = Array.from(uniqueValues[field]);

      if (values.length === 0) continue;

      log(`\nMigrando ${field} (${values.length} valores)...`, 'blue');

      for (const value of values) {
        try {
          await newClient.query(
            `INSERT INTO catalogs (category, name, is_active, created_at)
             VALUES ($1, $2, true, NOW())
             ON CONFLICT (category, name) DO NOTHING`,
            [category, value]
          );

          console.log(`  ✓ ${value}`);

        } catch (error) {
          log(`  ✗ ${value}: ${error.message}`, 'red');
        }
      }
    }

    // VALIDAÇÃO
    header('ETAPA 5: VALIDAÇÃO');

    const validation = await newClient.query(`
      SELECT
        category,
        COUNT(*) as total,
        COUNT(parent_id) as with_parent,
        COUNT(*) - COUNT(parent_id) as without_parent
      FROM catalogs
      GROUP BY category
      ORDER BY category
    `);

    console.log('Resumo por categoria:');
    console.log('  ' + 'Categoria'.padEnd(20) + ' | ' + 'Total'.padStart(5) + ' | ' +
                'Com parent'.padStart(10) + ' | ' + 'Sem parent'.padStart(10));
    console.log('  ' + '-'.repeat(65));

    validation.rows.forEach(row => {
      console.log('  ' +
        row.category.padEnd(20) + ' | ' +
        row.total.toString().padStart(5) + ' | ' +
        row.with_parent.toString().padStart(10) + ' | ' +
        row.without_parent.toString().padStart(10)
      );
    });

    // Verificar integridade hierárquica
    const orphans = await newClient.query(`
      SELECT c1.id, c1.category, c1.name, c1.parent_id
      FROM catalogs c1
      LEFT JOIN catalogs c2 ON c1.parent_id = c2.id
      WHERE c1.parent_id IS NOT NULL AND c2.id IS NULL
    `);

    console.log();
    if (orphans.rows.length === 0) {
      log('✓ Integridade hierárquica OK (sem órfãos)', 'green');
    } else {
      log(`⚠ ${orphans.rows.length} registros órfãos encontrados:`, 'yellow');
      orphans.rows.forEach(row => {
        console.log(`  - ${row.category}/${row.name} (parent_id: ${row.parent_id})`);
      });
    }

    // Exemplo de hierarquia
    console.log();
    log('Exemplos de hierarquia (raças -> espécies):', 'blue');

    const examples = await newClient.query(`
      SELECT
        c1.name as breed_name,
        c2.name as species_name
      FROM catalogs c1
      LEFT JOIN catalogs c2 ON c1.parent_id = c2.id
      WHERE c1.category = 'breed'
      ORDER BY c2.name, c1.name
      LIMIT 15
    `);

    examples.rows.forEach(row => {
      if (row.species_name) {
        console.log(`  ✓ ${row.breed_name.padEnd(30)} -> ${row.species_name}`);
      } else {
        console.log(`  ⚠ ${row.breed_name.padEnd(30)} -> (sem espécie)`);
      }
    });

    // Salvar mapeamento
    const mappingFile = path.join(__dirname, 'backups', 'catalog_mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify({
      species: speciesMapping,
      breed_to_species: breedToSpecies,
      timestamp: new Date().toISOString()
    }, null, 2));

    log(`\n✓ Mapeamento salvo: ${path.basename(mappingFile)}`, 'cyan');

    // RESUMO FINAL
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('✅ MIGRAÇÃO DE CATÁLOGOS CONCLUÍDA!');

    log(`Tempo total: ${duration}s`, 'magenta');
    console.log();
    log('Categorias migradas:', 'cyan');
    validation.rows.forEach(row => {
      console.log(`  ${row.category.padEnd(20)} ${row.total} registros`);
    });
    console.log();
    log('Próxima etapa:', 'blue');
    console.log('  Migrar animais do Viralatinhaz usando os catálogos');
    console.log();

  } catch (error) {
    log('\n✗ ERRO:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await newClient.end();
  }
}

main();
