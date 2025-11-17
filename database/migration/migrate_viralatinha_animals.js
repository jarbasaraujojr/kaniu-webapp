#!/usr/bin/env node
/**
 * Migração de Animais do Viralatinha
 * Usa os catálogos hierárquicos para mapear espécie, raça, porte, etc.
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

async function main() {
  const startTime = Date.now();

  header('MIGRAÇÃO DE ANIMAIS - VIRALATINHA');

  const client = new Client(NEW_DB);

  try {
    await client.connect();
    log('✓ Conectado!', 'green');

    // Carregar backup
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');
    log(`\nCarregando backup...`, 'blue');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Carregar mapeamento do Viralatinha
    const mappingFile = path.join(__dirname, 'backups', 'viralatinhaz_mapping.json');

    if (!fs.existsSync(mappingFile)) {
      log('✗ Arquivo de mapeamento não encontrado!', 'red');
      log('Execute primeiro: node migrate_viralatinhaz.js', 'yellow');
      process.exit(1);
    }

    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    const shelterId = mapping.shelter_id;
    const oldShelterId = mapping.old_shelter_id;
    const adminUserId = mapping.admin_user_id;

    log(`✓ Backup carregado`, 'green');
    log(`Abrigo ID: ${shelterId}`, 'cyan');
    log(`Admin ID: ${adminUserId}`, 'cyan');

    // ETAPA 1: Carregar catálogos
    header('ETAPA 1: CARREGAR CATÁLOGOS');

    const catalogs = await client.query(`
      SELECT id, category, name, parent_id
      FROM catalogs
      ORDER BY category, name
    `);

    const catalogMap = {
      species: {},
      breed: {},
      color: {},
      coat: {},
      size: {},
      gender: {},
      age_range: {},
      status: {}
    };

    catalogs.rows.forEach(cat => {
      if (!catalogMap[cat.category]) {
        catalogMap[cat.category] = {};
      }
      catalogMap[cat.category][cat.name.toLowerCase()] = cat.id;
    });

    log('Catálogos carregados:', 'blue');
    Object.keys(catalogMap).forEach(cat => {
      const count = Object.keys(catalogMap[cat]).length;
      if (count > 0) {
        console.log(`  ${cat.padEnd(20)} ${count} valores`);
      }
    });

    // ETAPA 2: Filtrar animais do Viralatinha
    header('ETAPA 2: FILTRAR ANIMAIS DO VIRALATINHA');

    const animais = backup.tables.animais || [];
    const animaisViralatinha = animais.filter(a =>
      a.canil === oldShelterId || a.canil === oldShelterId.toString()
    );

    log(`Total de animais no backup: ${animais.length}`, 'cyan');
    log(`Animais do Viralatinha: ${animaisViralatinha.length}`, 'green');

    if (animaisViralatinha.length === 0) {
      log('⚠ Nenhum animal encontrado para o Viralatinha', 'yellow');
      await client.end();
      return;
    }

    // ETAPA 3: Migrar animais
    header('ETAPA 3: MIGRAR ANIMAIS');

    const animalMapping = {}; // old_id -> new_id
    let migrated = 0;
    let skipped = 0;
    const errors = [];

    for (const animal of animaisViralatinha) {
      try {
        // Mapear espécie
        const especieKey = (animal.especie || 'cachorro').toLowerCase();
        let speciesId = catalogMap.species[especieKey] ||
                       catalogMap.species['cão'] ||
                       catalogMap.species['cachorro'];

        if (!speciesId) {
          throw new Error(`Espécie "${animal.especie}" não encontrada no catálogo`);
        }

        // Mapear raça
        let breedId = null;
        if (animal.raça) {
          const racaKey = animal.raça.toLowerCase();
          breedId = catalogMap.breed[racaKey];

          if (!breedId) {
            // Tentar variações
            const racaClean = racaKey.replace(/[()]/g, '').trim();
            breedId = catalogMap.breed[racaClean];
          }
        }

        // Mapear gênero
        let genderId = null;
        if (animal.genero) {
          const generoKey = animal.genero.toLowerCase();
          genderId = catalogMap.gender[generoKey] ||
                     catalogMap.gender['macho'] ||
                     catalogMap.gender['fêmea'];
        }

        // Mapear porte
        let sizeId = null;
        if (animal.porte) {
          const porteKey = animal.porte.toLowerCase();
          sizeId = catalogMap.size[porteKey] ||
                   catalogMap.size['médio'];
        }

        // Mapear status
        let statusId = catalogMap.status['disponível'];
        if (animal.adotado) {
          statusId = catalogMap.status['adotado'];
        } else if (animal.falecido) {
          statusId = catalogMap.status['falecido'];
        } else if (animal.desaparecido) {
          statusId = catalogMap.status['desaparecido'];
        } else if (animal.internado) {
          statusId = catalogMap.status['internado'];
        } else if (animal.disponivel === false) {
          statusId = catalogMap.status['abrigado'];
        }

        // Preparar dados JSONB
        const appearance = {
          color: animal.cor || null,
          coat_type: animal.pelagem || null,
          weight: animal.peso || null,
          chest: animal.torax || null,
          length: animal.comprimento || null,
          neck: animal.pescoço || null,
          height: animal.altura || null
        };

        const healthStatus = {
          vaccinated: animal.vacinado || false,
          dewormed: animal.vermifugado || false,
          deparasitized: animal.desparasitado || false,
          diagnoses: animal.diagnosticos || null
        };

        const behavior = {};

        // Castrado agora é campo direto
        const castrated = animal.castrado || false;

        // Inserir animal
        const result = await client.query(
          `INSERT INTO animals (
            name, description, shelter_id, species_id, breed_id, gender,
            size, birth_date, microchip_id, status_id, castrated,
            appearance, health_status, behavior,
            created_at, updated_at, created_by, updated_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16, $16)
          ON CONFLICT DO NOTHING
          RETURNING id, name`,
          [
            animal.nome || 'Sem nome',
            null, // description
            shelterId,
            speciesId,
            breedId,
            genderId,
            sizeId,
            animal.nascimento || null,
            animal.chip || null,
            statusId,
            castrated,
            JSON.stringify(appearance),
            JSON.stringify(healthStatus),
            JSON.stringify(behavior),
            animal.criado || new Date(),
            adminUserId
          ]
        );

        if (result.rows.length > 0) {
          animalMapping[animal.animal_id] = result.rows[0].id;
          migrated++;

          if (migrated % 10 === 0) {
            process.stdout.write(`\r  Progresso: ${migrated}/${animaisViralatinha.length}`);
          }
        }

      } catch (error) {
        skipped++;
        errors.push({
          name: animal.nome || 'Sem nome',
          error: error.message
        });
      }
    }

    console.log(`\n`);
    log(`✓ ${migrated}/${animaisViralatinha.length} animais migrados`, 'green');

    if (skipped > 0) {
      log(`⚠ ${skipped} animais pulados`, 'yellow');
      console.log('\nPrimeiros erros:');
      errors.slice(0, 5).forEach(e => {
        console.log(`  - ${e.name}: ${e.error}`);
      });
      if (errors.length > 5) {
        console.log(`  ... e mais ${errors.length - 5} erros`);
      }
    }

    // Salvar mapeamento de animais
    const animalMappingFile = path.join(__dirname, 'backups', 'viralatinha_animals_mapping.json');
    fs.writeFileSync(animalMappingFile, JSON.stringify({
      shelter_id: shelterId,
      old_shelter_id: oldShelterId,
      animals: animalMapping,
      migrated_at: new Date().toISOString(),
      stats: {
        total: animaisViralatinha.length,
        migrated,
        skipped
      }
    }, null, 2));

    log(`\n✓ Mapeamento salvo: ${path.basename(animalMappingFile)}`, 'cyan');

    // VALIDAÇÃO
    header('ETAPA 4: VALIDAÇÃO');

    const validation = await client.query(`
      SELECT
        s.name as species,
        COUNT(*) as count
      FROM animals a
      JOIN catalogs s ON a.species_id = s.id
      WHERE a.shelter_id = $1
      GROUP BY s.name
      ORDER BY count DESC
    `, [shelterId]);

    log('Animais por espécie:', 'blue');
    validation.rows.forEach(row => {
      console.log(`  ${row.species.padEnd(20)} ${row.count} animais`);
    });

    // Verificar integridade
    const integrity = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE species_id IS NULL) as sem_especie,
        COUNT(*) FILTER (WHERE gender IS NULL) as sem_genero,
        COUNT(*) FILTER (WHERE size IS NULL) as sem_porte,
        COUNT(*) FILTER (WHERE status_id IS NULL) as sem_status
      FROM animals
      WHERE shelter_id = $1
    `, [shelterId]);

    console.log();
    const int = integrity.rows[0];
    if (parseInt(int.sem_especie) === 0 &&
        parseInt(int.sem_status) === 0) {
      log('✓ Integridade dos dados OK', 'green');
    } else {
      log('⚠ Avisos de integridade:', 'yellow');
      if (parseInt(int.sem_especie) > 0)
        console.log(`  - ${int.sem_especie} animais sem espécie`);
      if (parseInt(int.sem_genero) > 0)
        console.log(`  - ${int.sem_genero} animais sem gênero`);
      if (parseInt(int.sem_porte) > 0)
        console.log(`  - ${int.sem_porte} animais sem porte`);
      if (parseInt(int.sem_status) > 0)
        console.log(`  - ${int.sem_status} animais sem status`);
    }

    // Exemplos
    console.log();
    log('Exemplos de animais migrados:', 'blue');

    const examples = await client.query(`
      SELECT
        a.name,
        s.name as species,
        b.name as breed,
        st.name as status
      FROM animals a
      JOIN catalogs s ON a.species_id = s.id
      LEFT JOIN catalogs b ON a.breed_id = b.id
      JOIN catalogs st ON a.status_id = st.id
      WHERE a.shelter_id = $1
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [shelterId]);

    examples.rows.forEach(row => {
      const breed = row.breed || 'SRD';
      console.log(`  ${row.name.padEnd(20)} | ${row.species} - ${breed.padEnd(20)} | ${row.status}`);
    });

    // RESUMO FINAL
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('✅ MIGRAÇÃO DE ANIMAIS CONCLUÍDA!');

    log(`Tempo total: ${duration}s`, 'magenta');
    console.log();
    log('Resumo:', 'cyan');
    console.log(`  Abrigo: Viralatinha`);
    console.log(`  Total processado: ${animaisViralatinha.length}`);
    console.log(`  ✓ Migrados: ${migrated}`);
    console.log(`  ⚠ Erros: ${skipped}`);
    console.log();
    log('Próxima etapa:', 'blue');
    console.log('  Migrar prescrições dos animais do Viralatinha');
    console.log();

  } catch (error) {
    log('\n✗ ERRO:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
