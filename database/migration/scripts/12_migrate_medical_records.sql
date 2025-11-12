-- =====================================================
-- Script 12: MIGRAR REGISTROS MÉDICOS
-- =====================================================
-- Descrição: Consolida vacinacoes, imunizacao, anamneses_registros
-- Tempo estimado: 5-10 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO REGISTROS MÉDICOS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR VACINAÇÕES
-- ====================
\echo ''
\echo '1. Migrando vacinações...'

INSERT INTO public.animal_medical_records (
    id,
    animal_id,
    record_type,
    description,
    veterinarian,
    record_date,
    next_due_date,
    details,
    document_id,
    created_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    v.animal as animal_id,
    'vaccination' as record_type,
    COALESCE(v.tipo, 'Vacinação') as description,
    NULL as veterinarian,  -- Não tem veterinário nas vacinações
    v.data as record_date,
    -- Calcular próxima dose (1 ano depois se aplicada)
    CASE WHEN v.aplicada = true THEN
        v.data + interval '1 year'
    ELSE NULL
    END as next_due_date,
    jsonb_build_object(
        'vaccine_type', v.tipo,
        'applied', v.aplicada,
        'old_vacina_id', v.vacina_id
    ) as details,
    NULL as document_id,
    NULL as created_by,
    v.data::timestamp as created_at
FROM public.vacinacoes v
WHERE v.animal IS NOT NULL
  AND v.data IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = v.animal)
ON CONFLICT DO NOTHING;

\echo 'Vacinações migradas: ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type = 'vaccination');

-- ====================
-- 2. MIGRAR IMUNIZAÇÕES
-- ====================
\echo ''
\echo '2. Migrando imunizações...'

INSERT INTO public.animal_medical_records (
    id,
    animal_id,
    record_type,
    description,
    veterinarian,
    record_date,
    next_due_date,
    details,
    document_id,
    created_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    i.animal as animal_id,
    -- Determinar tipo baseado em imunizacao_tipo
    COALESCE(i.tipo, 'immunization') as record_type,
    COALESCE(i.observacao, 'Imunização - ' || i.tipo) as description,
    -- Buscar nome do veterinário
    (SELECT vet_name FROM veterinarian_mapping WHERE old_vet_id = i.veterinario) as veterinarian,
    i.criacao::date as record_date,
    NULL as next_due_date,
    -- Consolidar dados extras em details
    jsonb_build_object(
        'immunization_type', i.tipo,
        'veterinarian_id', i.veterinario,
        'clinic', (SELECT clinic_data FROM clinic_mapping WHERE old_clinic_name = i.clinica),
        'immunizer_id', i.imunizante,
        'old_registro_id', i.registro
    ) as details,
    -- Tentar linkar com documento
    (SELECT id FROM public.documents WHERE data->>'old_registro_id' = i.registro::text LIMIT 1) as document_id,
    -- Buscar user_id do veterinário se existir
    (SELECT new_user_id FROM veterinarian_mapping WHERE old_vet_id = i.veterinario) as created_by,
    i.criacao as created_at
FROM public.imunizacao i
WHERE i.animal IS NOT NULL
  AND i.criacao IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = i.animal)
ON CONFLICT DO NOTHING;

\echo 'Imunizações migradas: ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type != 'vaccination' AND record_type != 'anamnesis');

-- ====================
-- 3. MIGRAR ANAMNESES
-- ====================
\echo ''
\echo '3. Migrando anamneses...'

INSERT INTO public.animal_medical_records (
    id,
    animal_id,
    record_type,
    description,
    veterinarian,
    record_date,
    next_due_date,
    details,
    document_id,
    created_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    ar.animal as animal_id,
    'anamnesis' as record_type,
    COALESCE(ar.observacao, 'Anamnese') as description,
    (SELECT vet_name FROM veterinarian_mapping WHERE old_vet_id = ar.veterinario) as veterinarian,
    ar.data as record_date,
    NULL as next_due_date,
    -- Consolidar dados vitais e condições
    jsonb_build_object(
        'temperature', ar.temperatura,
        'health_score', ar.score,
        'conditions', ar.condicoes,
        'weight_id', ar.pesagem,
        'veterinarian_id', ar.veterinario
    ) as details,
    NULL as document_id,
    (SELECT new_user_id FROM veterinarian_mapping WHERE old_vet_id = ar.veterinario) as created_by,
    ar.data::timestamp as created_at
FROM public.anamneses_registros ar
WHERE ar.animal IS NOT NULL
  AND ar.data IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = ar.animal)
ON CONFLICT DO NOTHING;

\echo 'Anamneses migradas: ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type = 'anamnesis');

-- ====================
-- 4. VERIFICAÇÕES
-- ====================
\echo ''
\echo '4. Verificando migração de registros médicos...'

-- Total de registros
\echo 'Total de registros médicos: ' || (SELECT COUNT(*) FROM public.animal_medical_records);

-- Registros por tipo
\echo ''
\echo 'Registros médicos por tipo:'
SELECT
    record_type as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN veterinarian IS NOT NULL THEN 1 END) as com_veterinario,
    COUNT(CASE WHEN document_id IS NOT NULL THEN 1 END) as com_documento
FROM public.animal_medical_records
GROUP BY record_type
ORDER BY COUNT(*) DESC;

-- Animais com registros médicos
\echo ''
\echo 'Animais com registros médicos: ' ||
    (SELECT COUNT(DISTINCT animal_id) FROM public.animal_medical_records);

-- Animais sem registros médicos
\echo 'Animais sem registros médicos: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.animal_medical_records mr WHERE mr.animal_id = a.id));

-- Top 5 animais com mais registros médicos
\echo ''
\echo 'Top 5 animais com mais registros médicos:'
SELECT
    a.name as animal,
    COUNT(mr.id) as total_registros,
    COUNT(CASE WHEN mr.record_type = 'vaccination' THEN 1 END) as vacinacoes,
    COUNT(CASE WHEN mr.record_type = 'anamnesis' THEN 1 END) as anamneses
FROM public.animal_medical_records mr
JOIN public.animals a ON a.id = mr.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(mr.id) DESC
LIMIT 5;

-- Veterinários mais ativos
\echo ''
\echo 'Top 5 veterinários mais ativos:'
SELECT
    veterinarian,
    COUNT(*) as total_registros
FROM public.animal_medical_records
WHERE veterinarian IS NOT NULL
GROUP BY veterinarian
ORDER BY COUNT(*) DESC
LIMIT 5;

-- Registros com próxima dose agendada
\echo ''
\echo 'Registros com próxima dose agendada: ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records WHERE next_due_date IS NOT NULL);

-- Doses vencidas
\echo 'Doses vencidas (próxima data < hoje): ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records WHERE next_due_date < CURRENT_DATE);

-- Doses próximas (30 dias)
\echo 'Doses próximas (30 dias): ' ||
    (SELECT COUNT(*) FROM public.animal_medical_records
     WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '30 days');

-- ====================
-- 5. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'animal_medical_records',
    (SELECT COUNT(*) FROM public.vacinacoes) +
    (SELECT COUNT(*) FROM public.imunizacao) +
    (SELECT COUNT(*) FROM public.anamneses_registros),
    (SELECT COUNT(*) FROM public.animal_medical_records),
    'Registros médicos consolidados de: vacinacoes, imunizacao, anamneses_registros. Veterinários mapeados, documentos linkados quando possível.'
);

\echo ''
\echo '=================================================='
\echo 'REGISTROS MÉDICOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.animal_medical_records);
\echo 'Vacinações: ' || (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type = 'vaccination');
\echo 'Anamneses: ' || (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type = 'anamnesis');
\echo 'Outros: ' || (SELECT COUNT(*) FROM public.animal_medical_records WHERE record_type NOT IN ('vaccination', 'anamnesis'));
\echo 'Animais com registros: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_medical_records);
\echo ''
\echo 'Próximo passo: Execute 13_migrate_adoption_events.sql'
\echo '=================================================='
