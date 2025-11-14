#!/usr/bin/env node
/**
 * MIGRAÇÃO COMPLETA - Projeto Antigo → Projeto Novo
 * Inclui: Animais, Medicamentos, Prescrições, Tarefas
 */

const { Client } = require('pg');
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

  header('MIGRAÇÃO COMPLETA - TODOS OS DADOS');

  const oldClient = new Client(OLD_DB);
  const newClient = new Client(NEW_DB);

  try {
    log('Conectando...', 'blue');
    await oldClient.connect();
    await newClient.connect();
    log('✓ Conectado!', 'green');

    // CARREGAR BACKUP
    const backupFile = path.join(__dirname, 'backups', 'old_project_full_2025-11-13T21-44-09.json');
    log(`\nCarregando backup: ${path.basename(backupFile)}`, 'blue');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    log('✓ Backup carregado', 'green');

    // PASSO 1: MIGRAR ANIMAIS
    header('PASSO 1: MIGRAR ANIMAIS');

    const animais = backup.tables.animais || [];
    log(`Migrando ${animais.length} animais...`, 'blue');

    const animalMapping = {}; // old_id (int) -> new_id (uuid)
    let animalsMigrated = 0;

    for (const animal of animais) {
      try {
        const result = await newClient.query(
          `INSERT INTO animals (
            name, species, breed, sex, size, birth_date,
            shelter_id, status, chip_number,
            sterilized, vaccinated, dewormed,
            special_needs, medical_history,
            appearance, health_status, behavior,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
          ON CONFLICT DO NOTHING
          RETURNING id`,
          [
            animal.nome || 'Sem nome',
            animal.especie || 'dog',
            animal.raca || null,
            animal.sexo || 'unknown',
            animal.porte || 'medium',
            animal.nascimento || null,
            animal.canil || null,
            animal.status || 'available',
            animal.chip || null,
            animal.castrado || false,
            animal.vacinado || false,
            animal.vermifugado || false,
            animal.cuidados_especiais || null,
            null, // medical_history
            JSON.stringify({ color: animal.cor || null, coat: animal.pelagem || null }),
            JSON.stringify({}),
            JSON.stringify({}),
          ]
        );

        if (result.rows.length > 0) {
          animalMapping[animal.id] = result.rows[0].id;
          animalsMigrated++;
        }
      } catch (error) {
        log(`  ⚠ Animal ${animal.id}: ${error.message}`, 'yellow');
      }
    }

    log(`✓ ${animalsMigrated}/${animais.length} animais migrados`, 'green');

    // PASSO 2: MIGRAR MEDICAMENTOS
    header('PASSO 2: MIGRAR MEDICAMENTOS');

    const medicamentos = backup.tables.medicamento || [];
    log(`Migrando ${medicamentos.length} medicamentos...`, 'blue');

    // Limpar medicamentos antigos
    await newClient.query('DELETE FROM medications');

    const medMapping = {};
    let medMigrated = 0;

    for (const med of medicamentos) {
      try {
        const result = await newClient.query(
          `INSERT INTO medications (name, shelter_id, is_active, created_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING id`,
          [
            med.nome,
            med.canil_id || null,
            med.ativo !== false,
          ]
        );

        medMapping[med.id] = result.rows[0].id;
        medMigrated++;
      } catch (error) {
        log(`  ⚠ ${med.nome}: ${error.message}`, 'yellow');
      }
    }

    log(`✓ ${medMigrated}/${medicamentos.length} medicamentos migrados`, 'green');

    // PASSO 3: MIGRAR PRESCRIÇÕES
    header('PASSO 3: MIGRAR PRESCRIÇÕES');

    const prescricoes = backup.tables.prescricao || [];
    const receitas = backup.tables.receita || [];

    const receitaMap = {};
    receitas.forEach(r => {
      receitaMap[r.id] = r;
    });

    log(`Migrando ${prescricoes.length} prescrições...`, 'blue');

    const prescMapping = {};
    let prescMigrated = 0;
    let prescSkipped = 0;

    for (const presc of prescricoes) {
      try {
        const receita = receitaMap[presc.receita];
        const newMedId = medMapping[presc.medicamento];
        const oldAnimalId = receita ? receita.animal : null;
        const newAnimalId = oldAnimalId ? animalMapping[oldAnimalId] : null;

        if (!newMedId || !newAnimalId) {
          prescSkipped++;
          continue;
        }

        const result = await newClient.query(
          `INSERT INTO prescriptions (
            animal_id, medication_id, dosage, route,
            interval_hours, start_date, start_time,
            duration_days, is_continuous, is_completed,
            description, prescribed_by, recipe_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          RETURNING id`,
          [
            newAnimalId,
            newMedId,
            presc.dosagem || presc.descricao || 'Conforme prescrição',
            presc.via || 'Oral',
            presc.intervalo_horas || 24,
            presc.inicio,
            presc.inicio_horario || null,
            presc.duracao_dias || null,
            presc.continuo || false,
            presc.finalizada || false,
            presc.descricao || null,
            receita ? receita.veterinario : null,
            presc.receita || null
          ]
        );

        prescMapping[presc.id] = result.rows[0].id;
        prescMigrated++;
      } catch (error) {
        prescSkipped++;
      }
    }

    log(`✓ ${prescMigrated}/${prescricoes.length} prescrições migradas (${prescSkipped} puladas)`, 'green');

    // PASSO 4: MIGRAR TAREFAS
    header('PASSO 4: MIGRAR TAREFAS DE ADMINISTRAÇÃO');

    const tarefas = backup.tables.prescricao_tarefa || [];
    log(`Migrando ${tarefas.length} tarefas...`, 'blue');

    let taskMigrated = 0;
    let taskSkipped = 0;

    for (const tarefa of tarefas) {
      try {
        const newPrescId = prescMapping[tarefa.prescricao];

        if (!newPrescId) {
          taskSkipped++;
          continue;
        }

        await newClient.query(
          `INSERT INTO prescription_tasks (
            prescription_id, scheduled_date, scheduled_time,
            administered_at, administered_by,
            is_completed, notes, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT DO NOTHING`,
          [
            newPrescId,
            tarefa.prevista,
            tarefa.prevista_horario || '08:00:00',
            tarefa.administrada || null,
            tarefa.usuario || null,
            tarefa.concluida || false,
            tarefa.observacoes || null
          ]
        );

        taskMigrated++;
      } catch (error) {
        taskSkipped++;
      }
    }

    log(`✓ ${taskMigrated}/${tarefas.length} tarefas migradas (${taskSkipped} puladas)`, 'green');

    // VALIDAÇÃO
    header('PASSO 5: VALIDAÇÃO FINAL');

    const counts = await newClient.query(`
      SELECT 'animals' as tabela, COUNT(*) as total FROM animals
      UNION ALL SELECT 'medications', COUNT(*) FROM medications
      UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
      UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks
    `);

    log('Contagens finais:', 'blue');
    counts.rows.forEach(row => {
      const bar = '█'.repeat(Math.min(50, Math.floor(row.total / 10)));
      console.log(`  ${row.tabela.padEnd(25)} ${row.total.toString().padStart(5)} ${bar}`);
    });

    // Integridade
    const orphans = await newClient.query(`
      SELECT COUNT(*) as count
      FROM prescriptions p
      LEFT JOIN medications m ON p.medication_id = m.id
      WHERE m.id IS NULL
    `);

    const orphanCount = parseInt(orphans.rows[0].count);
    console.log();
    if (orphanCount === 0) {
      log('✓ Integridade referencial OK', 'green');
    } else {
      log(`⚠ ${orphanCount} prescrições órfãs`, 'yellow');
    }

    // Taxa de sucesso
    const successRate = ((prescMigrated / prescricoes.length) * 100).toFixed(1);
    const taskSuccessRate = ((taskMigrated / tarefas.length) * 100).toFixed(1);

    console.log();
    log(`Taxa de sucesso:`, 'blue');
    console.log(`  Prescrições: ${successRate}%`);
    console.log(`  Tarefas: ${taskSuccessRate}%`);

    // Salvar mapeamento
    const mappingFile = path.join(__dirname, 'backups', 'id_mapping.json');
    fs.writeFileSync(mappingFile, JSON.stringify({
      animals: animalMapping,
      medications: medMapping,
      prescriptions: prescMapping
    }, null, 2));

    log(`\n✓ Mapeamento de IDs salvo: ${path.basename(mappingFile)}`, 'cyan');

    // FINALIZAR
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('✅ MIGRAÇÃO COMPLETA FINALIZADA!');

    log(`Tempo total: ${duration}s`, 'magenta');
    console.log();
    log('Resumo:', 'cyan');
    console.log(`  ✓ Animais:     ${animalsMigrated}/${animais.length}`);
    console.log(`  ✓ Medicamentos: ${medMigrated}/${medicamentos.length}`);
    console.log(`  ✓ Prescrições:  ${prescMigrated}/${prescricoes.length}`);
    console.log(`  ✓ Tarefas:      ${taskMigrated}/${tarefas.length}`);

    console.log('\nPróximos passos:');
    console.log('1. Validar dados no Supabase Dashboard');
    console.log('2. Testar aplicação');
    console.log('3. Verificar histórico de prescrições\n');

  } catch (error) {
    log('\n✗ ERRO FATAL:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

main();
