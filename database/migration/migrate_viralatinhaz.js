#!/usr/bin/env node
/**
 * Migração Incremental - Abrigo Viralatinhaz
 * Etapa 1: Admin + Abrigo + Animais
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const OLD_DB = {
  connectionString: 'postgresql://postgres:RJxyqaWWII6tkule@db.vhktmkudbxfwgrjfxwpn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

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

  header('MIGRAÇÃO VIRALATINHAZ - Etapa 1');

  const oldClient = new Client(OLD_DB);
  const newClient = new Client(NEW_DB);

  try {
    log('Conectando aos bancos...', 'blue');
    await oldClient.connect();
    await newClient.connect();
    log('✓ Conectado!', 'green');

    // Carregar backup
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // ETAPA 1: CRIAR USUÁRIO ADMIN
    header('ETAPA 1: CRIAR USUÁRIO ADMIN');

    log('Criando admin@viralatinhaz.com.br...', 'blue');

    // Buscar role de admin
    const adminRole = await newClient.query(
      `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`
    );

    if (adminRole.rows.length === 0) {
      log('⚠ Role admin não encontrada, criando...', 'yellow');
      await newClient.query(
        `INSERT INTO roles (id, name, description) VALUES ('1', 'admin', 'Administrator')`
      );
    }

    const adminRoleId = adminRole.rows.length > 0 ? adminRole.rows[0].id : '1';

    // Hash da senha
    const hashedPassword = await bcrypt.hash('viralatinhaz2024', 10);

    // Criar usuário admin
    const adminResult = await newClient.query(
      `INSERT INTO users (email, password, name, role_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, role_id = EXCLUDED.role_id
       RETURNING id, email, name`,
      ['admin@viralatinhaz.com.br', hashedPassword, 'Administrador Viralatinhaz', adminRoleId]
    );

    const adminUser = adminResult.rows[0];
    log(`✓ Usuário criado:`, 'green');
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Nome: ${adminUser.name}`);
    console.log(`  Senha: viralatinhaz2024`);

    // ETAPA 2: MIGRAR ABRIGO VIRALATINHAZ
    header('ETAPA 2: MIGRAR ABRIGO VIRALATINHAZ');

    log('Buscando dados do Viralatinhaz no projeto antigo...', 'blue');

    const canis = backup.tables.canis || [];
    const viralatinhaz = canis.find(c =>
      c.canil && c.canil.toLowerCase().includes('viralatinha')
    );

    if (!viralatinhaz) {
      log('✗ Abrigo Viralatinhaz não encontrado!', 'red');
      log('Abrigos disponíveis:', 'yellow');
      canis.forEach(c => console.log(`  - ${c.canil} (ID: ${c.id})`));
      process.exit(1);
    }

    log(`✓ Encontrado: ${viralatinhaz.canil} (ID antigo: ${viralatinhaz.id})`, 'green');

    // Inserir abrigo
    const shelterResult = await newClient.query(
      `INSERT INTO shelters (
        name, description, owner_id, phone, email, website, is_active,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      RETURNING id, name`,
      [
        viralatinhaz.canil || 'Viralatinha',
        'Abrigo de animais resgatados',
        adminUser.id,
        null,
        'contato@viralatinha.org.br',
        null
      ]
    );

    const shelter = shelterResult.rows[0];
    log(`✓ Abrigo criado:`, 'green');
    console.log(`  ID novo: ${shelter.id}`);
    console.log(`  Nome: ${shelter.name}`);

    // ETAPA 3: BUSCAR CATÁLOGOS NECESSÁRIOS
    header('ETAPA 3: PREPARAR CATÁLOGOS');

    log('Buscando catálogos existentes...', 'blue');

    const catalogs = await newClient.query(`
      SELECT id, category, name FROM catalogs
      WHERE category IN ('species', 'gender', 'size', 'animal_status')
      ORDER BY category, name
    `);

    const catalogMap = {
      species: {},
      gender: {},
      size: {},
      animal_status: {}
    };

    catalogs.rows.forEach(cat => {
      catalogMap[cat.category][cat.name.toLowerCase()] = cat.id;
    });

    log('✓ Catálogos carregados:', 'green');
    Object.keys(catalogMap).forEach(cat => {
      console.log(`  ${cat}: ${Object.keys(catalogMap[cat]).length} valores`);
    });

    // ETAPA 4: MIGRAR ANIMAIS DO VIRALATINHAZ
    header('ETAPA 4: MIGRAR ANIMAIS');

    const animais = backup.tables.animais || [];
    const animaisViralatinhaz = animais.filter(a =>
      a.canil === viralatinhaz.id || a.canil === viralatinhaz.id.toString()
    );

    log(`Encontrados ${animaisViralatinhaz.length} animais do Viralatinhaz`, 'blue');

    const animalMapping = {}; // old_id -> new_id
    let migrated = 0;
    let skipped = 0;

    for (const animal of animaisViralatinhaz) {
      try {
        // Mapear espécie
        let speciesId = catalogMap.species['dog']; // default
        if (animal.especie) {
          const speciesKey = animal.especie.toString().toLowerCase();
          speciesId = catalogMap.species[speciesKey] || catalogMap.species['dog'];
        }

        // Mapear gênero
        let genderId = catalogMap.gender['unknown']; // default
        if (animal.sexo) {
          const genderKey = animal.sexo.toString().toLowerCase();
          genderId = catalogMap.gender[genderKey] ||
                    catalogMap.gender['male'] ||
                    catalogMap.gender['unknown'];
        }

        // Mapear porte
        let sizeId = catalogMap.size['medium']; // default
        if (animal.porte) {
          const sizeKey = animal.porte.toString().toLowerCase();
          sizeId = catalogMap.size[sizeKey] || catalogMap.size['medium'];
        }

        // Status
        let statusId = catalogMap.status['available']; // default
        if (animal.status) {
          const statusKey = animal.status.toString().toLowerCase();
          statusId = catalogMap.status[statusKey] || catalogMap.status['available'];
        }

        // Inserir animal
        const result = await newClient.query(
          `INSERT INTO animals (
            name, description, shelter_id, species_id, gender, size,
            birth_date, microchip_id, castrated, health_status,
            appearance, behavior, status_id,
            created_at, updated_at, created_by, updated_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $14)
          RETURNING id, name`,
          [
            animal.nome || 'Sem nome',
            animal.descricao || null,
            shelter.id,
            speciesId,
            genderId,
            sizeId,
            animal.nascimento || null,
            animal.chip || null,
            animal.castrado || false,
            JSON.stringify({}),
            JSON.stringify({ color: animal.cor, coat: animal.pelagem }),
            JSON.stringify({}),
            statusId,
            adminUser.id
          ]
        );

        animalMapping[animal.id] = result.rows[0].id;
        migrated++;

        if (migrated % 10 === 0) {
          process.stdout.write(`\r  Migrados: ${migrated}/${animaisViralatinhaz.length}`);
        }
      } catch (error) {
        skipped++;
        console.log(`\n  ⚠ ${animal.nome}: ${error.message}`);
      }
    }

    console.log(`\n✓ ${migrated}/${animaisViralatinhaz.length} animais migrados (${skipped} erros)`, 'green');

    // Salvar mapeamento
    const mappingFile = path.join(__dirname, 'backups', 'viralatinhaz_mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify({
      admin_user_id: adminUser.id,
      shelter_id: shelter.id,
      old_shelter_id: viralatinhaz.id,
      animals: animalMapping,
      migrated_at: new Date().toISOString()
    }, null, 2));

    log(`\n✓ Mapeamento salvo: ${path.basename(mappingFile)}`, 'cyan');

    // RESUMO
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('✅ ETAPA 1 CONCLUÍDA!');

    log(`Tempo: ${duration}s`, 'magenta');
    console.log();
    log('Resumo:', 'cyan');
    console.log(`  ✓ Usuário admin criado`);
    console.log(`  ✓ Abrigo Viralatinhaz migrado`);
    console.log(`  ✓ ${migrated} animais migrados`);
    console.log();
    log('Credenciais de acesso:', 'yellow');
    console.log(`  Email: admin@viralatinhaz.com.br`);
    console.log(`  Senha: viralatinhaz2024`);
    console.log();
    log('Próxima etapa:', 'blue');
    console.log('  Migrar prescrições dos animais do Viralatinhaz');
    console.log();

  } catch (error) {
    log('\n✗ ERRO:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main();
