#!/usr/bin/env node
/**
 * Importação de Animais do backup para banco atual
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Usar connection string do .env
const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
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
  const startTime = Date.now();

  header('IMPORTAÇÃO DE ANIMAIS - BANCO ATUAL');

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    log('✓ Conectado ao banco local!', 'green');

    // Carregar backup
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');
    log(`\nCarregando backup: ${backupFile}`, 'blue');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    log(`✓ Backup carregado: ${backup.animals?.length || 0} animais`, 'green');

    // Buscar abrigo existente no banco local
    const shelterResult = await client.query('SELECT id, name FROM shelters LIMIT 1');

    if (shelterResult.rows.length === 0) {
      log('✗ Nenhum abrigo encontrado! Execute o seed primeiro.', 'red');
      process.exit(1);
    }

    const shelterId = shelterResult.rows[0].id;
    log(`Usando abrigo: "${shelterResult.rows[0].name}" (ID: ${shelterId})`, 'cyan');

    // Buscar usuário admin
    const userResult = await client.query(`
      SELECT u.id FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'admin'
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      log('✗ Nenhum usuário admin encontrado!', 'red');
      process.exit(1);
    }

    const adminUserId = userResult.rows[0].id;
    log(`Admin User ID: ${adminUserId}`, 'cyan');

    // Carregar catálogos do banco local
    header('CARREGANDO CATÁLOGOS DO BANCO');

    const catalogsResult = await client.query(`
      SELECT id, category, name FROM catalogs WHERE is_active = true
    `);

    const catalogMap = {};
    catalogsResult.rows.forEach(cat => {
      if (!catalogMap[cat.category]) {
        catalogMap[cat.category] = {};
      }
      catalogMap[cat.category][cat.name.toLowerCase()] = cat.id;
      catalogMap[cat.category][cat.name] = cat.id; // também sem lowercase
    });

    log(`Catálogos carregados:`, 'blue');
    Object.keys(catalogMap).forEach(cat => {
      const count = Object.keys(catalogMap[cat]).length;
      if (count > 0) {
        log(`  ${cat}: ${count} itens`, 'cyan');
      }
    });

    // Função helper para buscar ID do catálogo
    function getCatalogId(category, name, defaultValue = null) {
      if (!name) return defaultValue;

      const normalized = name.toString().toLowerCase().trim();

      // Mapeamento específico para espécies
      if (category === 'species') {
        if (normalized.includes('dog') || normalized.includes('cachorro') || normalized === 'cão') {
          return catalogMap.species['cão'] || catalogMap.species['cao'];
        }
        if (normalized.includes('cat') || normalized === 'gato') {
          return catalogMap.species['gato'];
        }
      }

      // Mapeamento para raças
      if (category.startsWith('breed_')) {
        const species = category.split('_')[1];
        if (catalogMap[category]) {
          return catalogMap[category][normalized] || catalogMap[category]['srd (sem raça definida)'];
        }
      }

      // Mapeamento para status
      if (category === 'animal_status') {
        if (normalized === 'sheltered' || normalized === 'abrigado') {
          return catalogMap.animal_status['abrigado'];
        }
        if (normalized === 'available' || normalized === 'disponível' || normalized === 'disponivel') {
          return catalogMap.animal_status['disponível'];
        }
        if (normalized === 'adopted' || normalized === 'adotado') {
          return catalogMap.animal_status['adotado'];
        }
      }

      // Busca genérica
      if (catalogMap[category]) {
        return catalogMap[category][normalized] || catalogMap[category][name] || defaultValue;
      }

      return defaultValue;
    }

    // IMPORTAR ANIMAIS
    header('IMPORTANDO ANIMAIS');

    const animals = backup.animals || [];
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const oldAnimal of animals) {
      try {
        // Determinar espécie
        const speciesId = getCatalogId('species', oldAnimal.species);
        if (!speciesId) {
          log(`  ⚠ Animal "${oldAnimal.name}": espécie desconhecida "${oldAnimal.species}"`, 'yellow');
          skipped++;
          continue;
        }

        // Determinar raça
        const isdog = oldAnimal.species && (oldAnimal.species.toLowerCase().includes('dog') || oldAnimal.species.toLowerCase() === 'cão');
        const breedCategory = isdog ? 'breed_dog' : 'breed_cat';
        const breedId = getCatalogId(breedCategory, oldAnimal.breed);

        // Status
        const statusId = getCatalogId('animal_status', oldAnimal.status || 'Abrigado');

        // Verificar se já existe
        const existingAnimal = await client.query(
          'SELECT id FROM animals WHERE name = $1 AND shelter_id = $2 AND deleted_at IS NULL',
          [oldAnimal.name, shelterId]
        );

        if (existingAnimal.rows.length > 0) {
          log(`  ⊘ "${oldAnimal.name}" já existe`, 'yellow');
          skipped++;
          continue;
        }

        // Preparar dados
        const healthStatus = {
          vaccinated: oldAnimal.vaccinated || false,
          dewormed: oldAnimal.dewormed || false,
          healthConditions: oldAnimal.health_conditions || []
        };

        const behavior = {
          goodWithKids: oldAnimal.good_with_kids,
          goodWithDogs: oldAnimal.good_with_dogs,
          goodWithCats: oldAnimal.good_with_cats,
          energyLevel: oldAnimal.energy_level || 'medium'
        };

        const appearance = {
          color: oldAnimal.color ? [oldAnimal.color] : [],
          furLength: oldAnimal.fur_length || 'short'
        };

        // Inserir animal
        await client.query(`
          INSERT INTO animals (
            name, description, shelter_id, species_id, breed_id,
            gender, size, birth_date, status_id, castrated,
            health_status, behavior, appearance,
            created_by, updated_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
          )
        `, [
          oldAnimal.name,
          oldAnimal.description || `Animal importado do sistema antigo`,
          shelterId,
          speciesId,
          breedId,
          oldAnimal.gender || null,
          oldAnimal.size || null,
          oldAnimal.birth_date || null,
          statusId,
          oldAnimal.castrated || false,
          JSON.stringify(healthStatus),
          JSON.stringify(behavior),
          JSON.stringify(appearance),
          adminUserId,
          adminUserId
        ]);

        log(`  ✓ "${oldAnimal.name}" importado`, 'green');
        imported++;

      } catch (error) {
        log(`  ✗ Erro ao importar "${oldAnimal.name}": ${error.message}`, 'red');
        errors++;
      }
    }

    // Resumo
    header('RESUMO DA IMPORTAÇÃO');
    log(`✓ Importados: ${imported}`, 'green');
    log(`⊘ Ignorados (já existentes): ${skipped}`, 'yellow');
    if (errors > 0) {
      log(`✗ Erros: ${errors}`, 'red');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱  Tempo total: ${elapsed}s`, 'cyan');

  } catch (error) {
    log(`\n✗ Erro fatal: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
