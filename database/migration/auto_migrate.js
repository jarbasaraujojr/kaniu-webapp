#!/usr/bin/env node
/**
 * Migração Automática entre Projetos Supabase
 * SEM confirmações interativas
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

  header('MIGRAÇÃO AUTOMÁTICA - PROJETO ANTIGO → PROJETO NOVO');

  const oldClient = new Client(OLD_DB);
  const newClient = new Client(NEW_DB);

  try {
    // Conectar
    log('Conectando aos bancos de dados...', 'blue');
    await oldClient.connect();
    await newClient.connect();
    log('✓ Conectado aos dois projetos!', 'green');

    // BACKUP
    header('PASSO 1: BACKUP DO PROJETO ANTIGO');

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(backupDir, `old_project_full_${timestamp}.json`);

    const backup = {
      timestamp: new Date().toISOString(),
      source: 'db.vhktmkudbxfwgrjfxwpn.supabase.co',
      tables: {}
    };

    log('Exportando dados essenciais...', 'blue');

    const tablesToBackup = [
      'medicamento', 'prescricao', 'prescricao_tarefa', 'receita',
      'medicamento_dosagem', 'medicamento_via',
      'animais', 'usuarios', 'canis', 'veterinarios'
    ];

    for (const table of tablesToBackup) {
      try {
        const result = await oldClient.query(`SELECT * FROM "${table}"`);
        backup.tables[table] = result.rows;
        log(`  ✓ ${table}: ${result.rows.length} registros`, 'green');
      } catch (error) {
        log(`  ⚠ ${table}: ${error.message}`, 'yellow');
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1048576).toFixed(2);
    log(`\n✓ Backup salvo: ${sizeMB} MB`, 'green');
    log(`  Arquivo: ${backupFile}`, 'cyan');

    // MIGRAÇÃO
    header('PASSO 2: MIGRAR MEDICAMENTOS');

    const medicamentos = backup.tables.medicamento || [];
    log(`Migrando ${medicamentos.length} medicamentos...`, 'blue');

    let medMigrated = 0;
    const medMapping = {}; // old_id -> new_id

    for (const med of medicamentos) {
      try {
        const result = await newClient.query(
          `INSERT INTO medications (name, shelter_id, is_active, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [
            med.nome,
            med.canil_id || null,
            med.ativo !== false,
          ]
        );

        if (result.rows.length > 0) {
          medMapping[med.id] = result.rows[0].id;
          medMigrated++;
        }
      } catch (error) {
        log(`  ⚠ Erro ao migrar "${med.nome}": ${error.message}`, 'yellow');
      }
    }

    log(`✓ ${medMigrated} medicamentos migrados`, 'green');

    // MIGRAR PRESCRIÇÕES
    header('PASSO 3: MIGRAR PRESCRIÇÕES');

    const prescricoes = backup.tables.prescricao || [];
    const receitas = backup.tables.receita || [];

    log(`Migrando ${prescricoes.length} prescrições...`, 'blue');

    // Criar map de receitas
    const receitaMap = {};
    receitas.forEach(r => {
      receitaMap[r.id] = r;
    });

    let prescMigrated = 0;
    const prescMapping = {}; // old_id -> new_id

    for (const presc of prescricoes) {
      try {
        // Pegar info da receita relacionada
        const receita = receitaMap[presc.receita];

        // Buscar medication_id no novo banco
        const newMedId = medMapping[presc.medicamento];

        if (!newMedId) {
          continue; // Pular se medicamento não existe
        }

        // Buscar animal_id da receita
        const animalId = receita ? receita.animal : null;

        if (!animalId) {
          continue; // Pular se não tem animal
        }

        const result = await newClient.query(
          `INSERT INTO prescriptions (
            animal_id, medication_id, dosage, route,
            interval_hours, start_date, start_time,
            duration_days, is_continuous, is_completed,
            description, prescribed_by, recipe_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT DO NOTHING
          RETURNING id`,
          [
            animalId,
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

        if (result.rows.length > 0) {
          prescMapping[presc.id] = result.rows[0].id;
          prescMigrated++;
        }
      } catch (error) {
        log(`  ⚠ Erro na prescrição ${presc.id}: ${error.message}`, 'yellow');
      }
    }

    log(`✓ ${prescMigrated} prescrições migradas`, 'green');

    // MIGRAR TAREFAS
    header('PASSO 4: MIGRAR TAREFAS DE ADMINISTRAÇÃO');

    const tarefas = backup.tables.prescricao_tarefa || [];
    log(`Migrando ${tarefas.length} tarefas...`, 'blue');

    let taskMigrated = 0;

    for (const tarefa of tarefas) {
      try {
        const newPrescId = prescMapping[tarefa.prescricao];

        if (!newPrescId) {
          continue; // Prescrição não foi migrada
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
        // Silenciar erros de tarefas individuais
      }
    }

    log(`✓ ${taskMigrated} tarefas migradas`, 'green');

    // VALIDAÇÃO
    header('PASSO 5: VALIDAÇÃO');

    const counts = await newClient.query(`
      SELECT 'medications' as tabela, COUNT(*) as total FROM medications
      UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
      UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks
    `);

    log('Contagens finais:', 'blue');
    counts.rows.forEach(row => {
      console.log(`  ${row.tabela.padEnd(25)} ${row.total} registros`);
    });

    // Verificar integridade
    const orphans = await newClient.query(`
      SELECT COUNT(*) as count
      FROM prescriptions p
      LEFT JOIN medications m ON p.medication_id = m.id
      WHERE m.id IS NULL
    `);

    const orphanCount = parseInt(orphans.rows[0].count);
    if (orphanCount === 0) {
      log('\n✓ Integridade referencial OK (sem órfãos)', 'green');
    } else {
      log(`\n⚠ ${orphanCount} prescrições órfãs encontradas`, 'yellow');
    }

    // FINALIZAR
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    header('MIGRAÇÃO CONCLUÍDA!');

    log(`✓ Tempo total: ${duration} segundos`, 'green');
    log(`✓ Backup: ${backupFile}`, 'cyan');
    log(`✓ Medicamentos: ${medMigrated}/${medicamentos.length}`, 'green');
    log(`✓ Prescrições: ${prescMigrated}/${prescricoes.length}`, 'green');
    log(`✓ Tarefas: ${taskMigrated}/${tarefas.length}`, 'green');

    console.log('\nPróximos passos:');
    console.log('1. Validar dados no Supabase Dashboard');
    console.log('2. Testar aplicação');
    console.log('3. Verificar integridade dos dados\n');

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
