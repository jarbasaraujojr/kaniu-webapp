-- =====================================================
-- Script 20: MIGRAR TAREFAS DE PRESCRIÇÃO
-- =====================================================
-- Descrição: Migra histórico de administração de medicamentos
-- Tempo estimado: 2-4 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO TAREFAS DE PRESCRIÇÃO'
\echo '=================================================='

-- ====================
-- 1. CRIAR TABELA prescription_tasks (se não existir)
-- ====================
\echo ''
\echo '1. Criando tabela prescription_tasks...'

CREATE TABLE IF NOT EXISTS public.prescription_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time NOT NULL,
    administered_at timestamp(6) with time zone,
    administered_by uuid,
    is_completed boolean NOT NULL DEFAULT false,
    notes text,
    created_at timestamp(6) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prescription_tasks_prescription_id_fkey FOREIGN KEY (prescription_id)
        REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT prescription_tasks_administered_by_fkey FOREIGN KEY (administered_by)
        REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prescription_tasks_prescription_id ON public.prescription_tasks(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_tasks_scheduled_date ON public.prescription_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_prescription_tasks_is_completed ON public.prescription_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_prescription_tasks_administered_by ON public.prescription_tasks(administered_by);

\echo 'Tabela prescription_tasks criada'

-- ====================
-- 2. MIGRAR TAREFAS DE PRESCRIÇÃO
-- ====================
\echo ''
\echo '2. Migrando tarefas de prescrição...'

INSERT INTO public.prescription_tasks (
    id,
    prescription_id,
    scheduled_date,
    scheduled_time,
    administered_at,
    administered_by,
    is_completed,
    notes,
    created_at
)
SELECT
    gen_random_uuid() as id,
    -- Buscar prescription_id pela receita
    (SELECT id FROM public.prescriptions WHERE recipe_id = pt.prescricao::text LIMIT 1) as prescription_id,
    -- Data agendada
    COALESCE(pt.dia, CURRENT_DATE) as scheduled_date,
    -- Hora agendada
    COALESCE(pt.hora, '08:00'::time) as scheduled_time,
    -- Data/hora de administração (se concluída)
    CASE
        WHEN pt.concluida = true THEN COALESCE(pt.realizacao, now())
        ELSE NULL
    END as administered_at,
    -- Quem administrou
    CASE
        WHEN pt.concluida = true THEN pt.pessoa
        ELSE NULL
    END as administered_by,
    -- Status
    COALESCE(pt.concluida, false) as is_completed,
    -- Observações
    CASE
        WHEN pt.observacao IS NOT NULL OR pt.tratador IS NOT NULL THEN
            TRIM(COALESCE(pt.observacao, '') || ' ' || COALESCE('Tratador: ' || pt.tratador, ''))
        ELSE NULL
    END as notes,
    -- Data de criação
    pt.realizacao as created_at
FROM public.prescricao_tarefa pt
WHERE pt.prescricao IS NOT NULL
  -- Verificar se a prescrição foi migrada
  AND EXISTS (
      SELECT 1 FROM public.prescriptions p WHERE p.recipe_id = pt.prescricao::text
  )
  -- Verificar se tem data e hora
  AND pt.dia IS NOT NULL
  AND pt.hora IS NOT NULL
ON CONFLICT DO NOTHING;

\echo 'Tarefas de prescrição migradas: ' || (SELECT COUNT(*) FROM public.prescription_tasks);

-- ====================
-- 3. GERAR TAREFAS FUTURAS PARA PRESCRIÇÕES ATIVAS
-- ====================
\echo ''
\echo '3. Gerando tarefas futuras para prescrições ativas...'

-- Para cada prescrição ativa (não finalizada) que não é contínua,
-- gerar tarefas para os próximos dias baseado no intervalo e duração

INSERT INTO public.prescription_tasks (
    id,
    prescription_id,
    scheduled_date,
    scheduled_time,
    administered_at,
    administered_by,
    is_completed,
    notes,
    created_at
)
SELECT
    gen_random_uuid() as id,
    p.id as prescription_id,
    -- Calcular data: start_date + (dia_numero * intervalo/24)
    (p.start_date + (gs.day_number * (p.interval_hours::numeric / 24))::integer)::date as scheduled_date,
    -- Hora: usar start_time ou 08:00 como padrão
    COALESCE(p.start_time, '08:00'::time) as scheduled_time,
    NULL as administered_at,
    NULL as administered_by,
    false as is_completed,
    'Tarefa gerada automaticamente na migração' as notes,
    now() as created_at
FROM public.prescriptions p
CROSS JOIN LATERAL (
    SELECT generate_series(0, COALESCE(p.duration_days - 1, 6)) as day_number
) gs
WHERE p.is_completed = false
  AND p.is_continuous = false
  AND p.duration_days IS NOT NULL
  AND p.duration_days > 0
  AND p.start_date >= CURRENT_DATE - interval '30 days'  -- Últimos 30 dias
  -- Não criar se já existe tarefa para essa data
  AND NOT EXISTS (
      SELECT 1 FROM public.prescription_tasks pt
      WHERE pt.prescription_id = p.id
        AND pt.scheduled_date = (p.start_date + (gs.day_number * (p.interval_hours::numeric / 24))::integer)::date
  )
ON CONFLICT DO NOTHING;

\echo 'Tarefas futuras geradas: ' ||
    (SELECT COUNT(*) FROM public.prescription_tasks WHERE notes LIKE '%gerada automaticamente%');

-- ====================
-- 4. VERIFICAÇÕES
-- ====================
\echo ''
\echo '4. Verificando migração de tarefas...'

-- Total de tarefas
\echo 'Total de tarefas migradas: ' || (SELECT COUNT(*) FROM public.prescription_tasks);
\echo 'Total de tarefas na base antiga: ' || (SELECT COUNT(*) FROM public.prescricao_tarefa);

-- Tarefas por status
\echo ''
\echo 'Tarefas por status:'
SELECT
    CASE
        WHEN is_completed THEN 'Concluídas'
        WHEN scheduled_date < CURRENT_DATE THEN 'Atrasadas'
        WHEN scheduled_date = CURRENT_DATE THEN 'Hoje'
        ELSE 'Futuras'
    END as status,
    COUNT(*) as total
FROM public.prescription_tasks
GROUP BY
    CASE
        WHEN is_completed THEN 'Concluídas'
        WHEN scheduled_date < CURRENT_DATE THEN 'Atrasadas'
        WHEN scheduled_date = CURRENT_DATE THEN 'Hoje'
        ELSE 'Futuras'
    END
ORDER BY COUNT(*) DESC;

-- Taxa de conclusão
\echo ''
\echo 'Taxa de conclusão:'
SELECT
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN is_completed THEN 1 END) as concluidas,
    ROUND(
        COUNT(CASE WHEN is_completed THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
        2
    ) as taxa_conclusao_percentual
FROM public.prescription_tasks
WHERE scheduled_date <= CURRENT_DATE;

-- Prescrições com tarefas
\echo ''
\echo 'Prescrições com tarefas: ' ||
    (SELECT COUNT(DISTINCT prescription_id) FROM public.prescription_tasks);

-- Prescrições sem tarefas (potencialmente problemático)
\echo 'Prescrições sem tarefas: ' ||
    (SELECT COUNT(*) FROM public.prescriptions p
     WHERE NOT EXISTS (SELECT 1 FROM public.prescription_tasks pt WHERE pt.prescription_id = p.id));

-- Top 5 usuários que mais administraram medicações
\echo ''
\echo 'Top 5 usuários que mais administraram medicações:'
SELECT
    u.name as usuario,
    COUNT(pt.id) as total_administracoes
FROM public.prescription_tasks pt
JOIN public.users u ON u.id = pt.administered_by
WHERE pt.is_completed = true
GROUP BY u.id, u.name
ORDER BY COUNT(pt.id) DESC
LIMIT 5;

-- Tarefas nos próximos 7 dias
\echo ''
\echo 'Tarefas agendadas nos próximos 7 dias: ' ||
    (SELECT COUNT(*) FROM public.prescription_tasks
     WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'
       AND is_completed = false);

-- ====================
-- 5. TAREFAS PROBLEMÁTICAS
-- ====================
\echo ''
\echo '5. Verificando tarefas problemáticas...'

-- Tarefas antigas da base que não foram migradas
\echo 'Tarefas não migradas (prescrição não encontrada):'
SELECT COUNT(*) as total
FROM public.prescricao_tarefa pt
WHERE NOT EXISTS (
    SELECT 1 FROM public.prescription_tasks prt
    WHERE prt.prescription_id = (
        SELECT id FROM public.prescriptions p WHERE p.recipe_id = pt.prescricao::text LIMIT 1
    )
);

-- Registrar erros
INSERT INTO migration_errors (script_name, error_type, error_message, affected_record_id)
SELECT
    '20_migrate_prescription_tasks',
    'prescription_not_found',
    'Tarefa não migrada: prescrição ID ' || pt.prescricao || ' não encontrada',
    pt.id::text
FROM public.prescricao_tarefa pt
WHERE NOT EXISTS (
    SELECT 1 FROM public.prescriptions p WHERE p.recipe_id = pt.prescricao::text
);

-- ====================
-- 6. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'prescription_tasks',
    (SELECT COUNT(*) FROM public.prescricao_tarefa),
    (SELECT COUNT(*) FROM public.prescription_tasks),
    (SELECT COUNT(*) FROM public.prescricao_tarefa pt
     WHERE NOT EXISTS (
         SELECT 1 FROM public.prescription_tasks prt
         WHERE prt.prescription_id = (SELECT id FROM public.prescriptions p WHERE p.recipe_id = pt.prescricao::text LIMIT 1)
     )),
    'Tarefas de prescrição migradas + tarefas futuras geradas automaticamente para prescrições ativas.'
);

\echo ''
\echo '=================================================='
\echo 'TAREFAS DE PRESCRIÇÃO MIGRADAS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.prescription_tasks);
\echo 'Concluídas: ' || (SELECT COUNT(*) FROM public.prescription_tasks WHERE is_completed = true);
\echo 'Pendentes: ' || (SELECT COUNT(*) FROM public.prescription_tasks WHERE is_completed = false);
\echo 'Atrasadas: ' ||
    (SELECT COUNT(*) FROM public.prescription_tasks
     WHERE is_completed = false AND scheduled_date < CURRENT_DATE);
\echo 'Hoje: ' ||
    (SELECT COUNT(*) FROM public.prescription_tasks
     WHERE is_completed = false AND scheduled_date = CURRENT_DATE);
\echo ''
\echo 'Prescrições com tarefas: ' || (SELECT COUNT(DISTINCT prescription_id) FROM public.prescription_tasks);
\echo ''
\echo 'MIGRAÇÃO DE MEDICAÇÕES COMPLETA!'
\echo 'Próximo passo: Execute 16_validate_migration.sql'
\echo '  (Scripts de medicação adicionados entre 15 e 16)'
\echo '=================================================='
