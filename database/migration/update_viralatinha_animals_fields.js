#!/usr/bin/env node
/**
 * Atualização de campos específicos dos animais do Viralatinha
 * 1. Move 'castrated' de health_status para campo direto animals.castrated
 * 2. Atualiza status_id baseado nos campos da base antiga
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

  header('ATUALIZAÇÃO DE CAMPOS - ANIMAIS VIRALATINHA');

  const client = new Client(NEW_DB);

  try {
    await client.connect();
    log('✓ Conectado!', 'green');

    // Carregar backup
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');
    log(`\nCarregando backup...`, 'blue');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Carregar mapeamento
    const mappingFile = path.join(__dirname, 'backups', 'viralatinha_animals_mapping.json');

    if (!fs.existsSync(mappingFile)) {
      log('✗ Arquivo de mapeamento de animais não encontrado!', 'red');
      log('Execute primeiro: node migrate_viralatinha_animals.js', 'yellow');
      process.exit(1);
    }

    const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    const animalMapping = mapping.animals;
    const shelterId = mapping.shelter_id;

    log(`✓ Backup e mapeamento carregados`, 'green');
    log(`Animais mapeados: ${Object.keys(animalMapping).length}`, 'cyan');

    // ETAPA 1: Carregar status do catálogo
    header('ETAPA 1: CARREGAR STATUS DO CATÁLOGO');

    const statusQuery = await client.query(`
      SELECT id, name
      FROM catalogs
      WHERE category = 'status'
      ORDER BY name
    `);

    const statusMap = {};
    statusQuery.rows.forEach(row => {
      statusMap[row.name.toLowerCase()] = row.id;
    });

    log('Status disponíveis:', 'blue');
    Object.keys(statusMap).forEach(status => {
      console.log(`  ${status}`);
    });

    // ETAPA 2: Atualizar campos dos animais
    header('ETAPA 2: ATUALIZAR CAMPOS DOS ANIMAIS');

    const animaisViralatinha = backup.tables.animais.filter(a =>
      a.canil === mapping.old_shelter_id || a.canil === mapping.old_shelter_id.toString()
    );

    let updated = 0;
    let errors = 0;
    const errorsList = [];

    for (const oldAnimal of animaisViralatinha) {
      const newAnimalId = animalMapping[oldAnimal.animal_id];

      if (!newAnimalId) {
        continue; // Animal não foi migrado
      }

      try {
        // Determinar status baseado nos campos da base antiga
        let statusId = statusMap['disponível']; // padrão

        if (oldAnimal.falecido) {
          statusId = statusMap['falecido'];
        } else if (oldAnimal.adotado) {
          statusId = statusMap['adotado'];
        } else if (oldAnimal.desaparecido) {
          statusId = statusMap['desaparecido'];
        } else if (oldAnimal.internado) {
          statusId = statusMap['internado'];
        } else if (oldAnimal.disponivel === false) {
          statusId = statusMap['abrigado'];
        }

        // Pegar o valor de castrado
        const castrated = oldAnimal.castrado || false;

        // Buscar health_status atual
        const currentData = await client.query(
          `SELECT health_status FROM animals WHERE id = $1`,
          [newAnimalId]
        );

        if (currentData.rows.length === 0) {
          continue;
        }

        const healthStatus = currentData.rows[0].health_status || {};

        // Remover 'castrated' do health_status se existir
        delete healthStatus.castrated;

        // Atualizar animal
        await client.query(
          `UPDATE animals
           SET castrated = $1,
               status_id = $2,
               health_status = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [castrated, statusId, JSON.stringify(healthStatus), newAnimalId]
        );

        updated++;

        if (updated % 10 === 0) {
          process.stdout.write(`\r  Progresso: ${updated}/${animaisViralatinha.length}`);
        }

      } catch (error) {
        errors++;
        errorsList.push({
          name: oldAnimal.nome || 'Sem nome',
          error: error.message
        });
      }
    }

    console.log(`\n`);
    log(`✓ ${updated} animais atualizados`, 'green');

    if (errors > 0) {
      log(`⚠ ${errors} erros`, 'yellow');
      console.log('\nPrimeiros erros:');
      errorsList.slice(0, 5).forEach(e => {
        console.log(`  - ${e.name}: ${e.error}`);
      });
    }

    // VALIDAÇÃO
    header('ETAPA 3: VALIDAÇÃO');

    const validation = await client.query(`
      SELECT
        st.name as status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE a.castrated = true) as castrados
      FROM animals a
      JOIN catalogs st ON a.status_id = st.id
      WHERE a.shelter_id = $1
      GROUP BY st.name
      ORDER BY count DESC
    `, [shelterId]);

    log('Animais por status:', 'blue');
    validation.rows.forEach(row => {
      console.log(`  ${row.status.padEnd(20)} ${row.count} animais (${row.castrados} castrados)`);
    });

    // Verificar se ainda há castrated em health_status
    const checkHealthStatus = await client.query(`
      SELECT COUNT(*) as count
      FROM animals
      WHERE shelter_id = $1
        AND health_status ? 'castrated'
    `, [shelterId]);

    console.log();
    if (parseInt(checkHealthStatus.rows[0].count) === 0) {
      log('✓ Campo castrated removido de health_status', 'green');
    } else {
      log(`⚠ Ainda existem ${checkHealthStatus.rows[0].count} animais com castrated em health_status`, 'yellow');
    }

    // RESUMO FINAL
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('✅ ATUALIZAÇÃO CONCLUÍDA!');

    log(`Tempo total: ${duration}s`, 'magenta');
    console.log();
    log('Resumo:', 'cyan');
    console.log(`  Abrigo: Viralatinha`);
    console.log(`  ✓ Atualizados: ${updated}`);
    console.log(`  ⚠ Erros: ${errors}`);
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
