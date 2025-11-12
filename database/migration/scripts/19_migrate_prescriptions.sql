-- =====================================================
-- Script 19: MIGRAR PRESCRIÇÕES
-- =====================================================
-- Descrição: Cria tabela e migra prescrições de medicamentos
-- Tempo estimado: 3-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO PRESCRIÇÕES'
\echo '=================================================='

-- ====================
-- 1. CRIAR TABELA prescriptions (se não existir)
-- ====================
\echo ''
\echo '1. Criando tabela prescriptions...'

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id uuid NOT NULL,
    medication_id integer NOT NULL,
    dosage character varying(100) NOT NULL,
    route character varying(50) NOT NULL,
    interval_hours integer NOT NULL,
    start_date date NOT NULL,
    start_time time,
    duration_days integer,
    is_continuous boolean NOT NULL DEFAULT false,
    is_completed boolean NOT NULL DEFAULT false,
    description text,
    prescribed_by uuid,
    recipe_id character varying(50),  -- Referência ao ID antigo da receita
    created_at timestamp(6) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prescriptions_animal_id_fkey FOREIGN KEY (animal_id)
        REFERENCES public.animals(id) ON DELETE CASCADE,
    CONSTRAINT prescriptions_medication_id_fkey FOREIGN KEY (medication_id)
        REFERENCES public.medications(id) ON DELETE RESTRICT,
    CONSTRAINT prescriptions_prescribed_by_fkey FOREIGN KEY (prescribed_by)
        REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_animal_id ON public.prescriptions(animal_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medication_id ON public.prescriptions(medication_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_start_date ON public.prescriptions(start_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_is_completed ON public.prescriptions(is_completed);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by ON public.prescriptions(prescribed_by);

\echo 'Tabela prescriptions criada'

-- ====================
-- 2. MIGRAR PRESCRIÇÕES
-- ====================
\echo ''
\echo '2. Migrando prescrições...'

INSERT INTO public.prescriptions (
    id,
    animal_id,
    medication_id,
    dosage,
    route,
    interval_hours,
    start_date,
    start_time,
    duration_days,
    is_continuous,
    is_completed,
    description,
    prescribed_by,
    recipe_id,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid() as id,
    r.animal as animal_id,
    -- Mapear medication_id
    COALESCE(
        (SELECT new_id FROM medication_mapping WHERE old_id = p.medicamento),
        -- Se não encontrar, tentar por nome
        (SELECT id FROM public.medications WHERE name = (SELECT nome FROM public.medicamento WHERE id = p.medicamento) LIMIT 1)
    ) as medication_id,
    -- Dosagem: tentar pegar dose ou dosagem
    COALESCE(
        NULLIF(TRIM(p.dose), ''),
        NULLIF(TRIM(p.dosagem), ''),
        'Conforme prescrição'
    ) as dosage,
    -- Via de administração
    COALESCE(
        NULLIF(TRIM(p.via), ''),
        'oral'  -- Default
    ) as route,
    -- Intervalo em horas
    COALESCE(p.intervalo_horas, 24) as interval_hours,
    -- Data de início
    COALESCE(p.inicio, r.data, CURRENT_DATE) as start_date,
    -- Hora de início
    p.inicio_horario as start_time,
    -- Duração em dias
    p.duracao_dias as duration_days,
    -- Contínuo
    COALESCE(p.continuo, false) as is_continuous,
    -- Finalizada
    COALESCE(p.finalizada, false) as is_completed,
    -- Descrição
    NULLIF(TRIM(p.descricao), '') as description,
    -- Prescrito por (veterinário da receita)
    (SELECT new_user_id FROM veterinarian_mapping WHERE old_vet_id = r.veterinario) as prescribed_by,
    -- ID da receita antiga (para referência)
    p.receita::text as recipe_id,
    -- Timestamps
    COALESCE(p.criacao, r.data::timestamp, now()) as created_at,
    COALESCE(p.criacao, r.data::timestamp, now()) as updated_at
FROM public.prescricao p
JOIN public.receita r ON r.id = p.receita
WHERE p.medicamento IS NOT NULL
  AND r.animal IS NOT NULL
  -- Verificar se animal existe
  AND EXISTS (SELECT 1 FROM public.animals WHERE id = r.animal)
  -- Verificar se medicamento foi mapeado ou existe
  AND (
      EXISTS (SELECT 1 FROM medication_mapping WHERE old_id = p.medicamento) OR
      EXISTS (SELECT 1 FROM public.medications WHERE name = (SELECT nome FROM public.medicamento WHERE id = p.medicamento))
  )
ON CONFLICT DO NOTHING;

\echo 'Prescrições migradas: ' || (SELECT COUNT(*) FROM public.prescriptions);

-- ====================
-- 3. VERIFICAÇÕES
-- ====================
\echo ''
\echo '3. Verificando migração de prescrições...'

-- Total de prescrições
\echo 'Total de prescrições migradas: ' || (SELECT COUNT(*) FROM public.prescriptions);
\echo 'Total de prescrições na base antiga: ' || (SELECT COUNT(*) FROM public.prescricao);

-- Prescrições por status
\echo ''
\echo 'Prescrições por status:'
SELECT
    CASE
        WHEN is_completed THEN 'Finalizadas'
        WHEN is_continuous THEN 'Contínuas (ativas)'
        ELSE 'Em andamento'
    END as status,
    COUNT(*) as total
FROM public.prescriptions
GROUP BY is_completed, is_continuous
ORDER BY COUNT(*) DESC;

-- Prescrições por via de administração
\echo ''
\echo 'Top 5 vias de administração:'
SELECT
    route as via,
    COUNT(*) as total
FROM public.prescriptions
GROUP BY route
ORDER BY COUNT(*) DESC
LIMIT 5;

-- Prescrições por intervalo
\echo ''
\echo 'Distribuição por intervalo (horas):'
SELECT
    interval_hours as intervalo_horas,
    COUNT(*) as total,
    CASE
        WHEN interval_hours <= 6 THEN 'Alta frequência'
        WHEN interval_hours <= 12 THEN 'Frequência moderada'
        WHEN interval_hours <= 24 THEN 'Uma vez ao dia'
        ELSE 'Baixa frequência'
    END as frequencia
FROM public.prescriptions
GROUP BY interval_hours
ORDER BY interval_hours;

-- Top 10 medicamentos mais prescritos
\echo ''
\echo 'Top 10 medicamentos mais prescritos:'
SELECT
    m.name as medicamento,
    COUNT(p.id) as total_prescricoes,
    COUNT(CASE WHEN p.is_completed = false THEN 1 END) as ativas
FROM public.prescriptions p
JOIN public.medications m ON m.id = p.medication_id
GROUP BY m.id, m.name
ORDER BY COUNT(p.id) DESC
LIMIT 10;

-- Animais com prescrições
\echo ''
\echo 'Animais com prescrições: ' ||
    (SELECT COUNT(DISTINCT animal_id) FROM public.prescriptions);

-- Animais sem prescrições
\echo 'Animais sem prescrições: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.animal_id = a.id));

-- Prescrições sem veterinário
\echo 'Prescrições sem veterinário identificado: ' ||
    (SELECT COUNT(*) FROM public.prescriptions WHERE prescribed_by IS NULL);

-- Prescrições contínuas ativas
\echo 'Prescrições contínuas ativas: ' ||
    (SELECT COUNT(*) FROM public.prescriptions WHERE is_continuous = true AND is_completed = false);

-- ====================
-- 4. PRESCRIÇÕES PROBLEMÁTICAS
-- ====================
\echo ''
\echo '4. Verificando prescrições problemáticas...'

-- Prescrições antigas da base antiga que não foram migradas
\echo 'Prescrições não migradas (sem medicamento válido):'
SELECT COUNT(*) as total
FROM public.prescricao p
WHERE NOT EXISTS (
    SELECT 1 FROM public.prescriptions pr WHERE pr.recipe_id = p.receita::text
);

-- Registrar erros se houver
INSERT INTO migration_errors (script_name, error_type, error_message, affected_record_id)
SELECT
    '19_migrate_prescriptions',
    'medication_not_found',
    'Prescrição não migrada: medicamento ID ' || p.medicamento || ' não encontrado',
    p.id::text
FROM public.prescricao p
WHERE p.medicamento IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM medication_mapping WHERE old_id = p.medicamento)
  AND NOT EXISTS (
      SELECT 1 FROM public.medications
      WHERE name = (SELECT nome FROM public.medicamento WHERE id = p.medicamento)
  );

-- ====================
-- 5. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'prescriptions',
    (SELECT COUNT(*) FROM public.prescricao),
    (SELECT COUNT(*) FROM public.prescriptions),
    (SELECT COUNT(*) FROM public.prescricao p
     WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions pr WHERE pr.recipe_id = p.receita::text)),
    'Prescrições migradas de prescricao + receita. Medicamentos linkados, veterinários mapeados.'
);

\echo ''
\echo '=================================================='
\echo 'PRESCRIÇÕES MIGRADAS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.prescriptions);
\echo 'Ativas: ' || (SELECT COUNT(*) FROM public.prescriptions WHERE is_completed = false);
\echo 'Finalizadas: ' || (SELECT COUNT(*) FROM public.prescriptions WHERE is_completed = true);
\echo 'Contínuas: ' || (SELECT COUNT(*) FROM public.prescriptions WHERE is_continuous = true);
\echo 'Animais com prescrições: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.prescriptions);
\echo ''
\echo 'Próximo passo: Execute 20_migrate_prescription_tasks.sql'
\echo '=================================================='
