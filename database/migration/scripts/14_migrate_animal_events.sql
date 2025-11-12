-- =====================================================
-- Script 14: MIGRAR EVENTOS DOS ANIMAIS
-- =====================================================
-- Descrição: Migra registros para animal_events
-- Tempo estimado: 2-3 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO EVENTOS DOS ANIMAIS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR REGISTROS
-- ====================
\echo ''
\echo '1. Migrando registros para eventos...'

INSERT INTO public.animal_events (
    id,
    animal_id,
    event_type,
    description,
    details,
    triggered_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    r.animal_id as animal_id,
    COALESCE(r.tipo, 'general') as event_type,
    COALESCE(NULLIF(TRIM(r.descricao), ''), r.tipo, 'Registro') as description,
    -- Consolidar informações extras em details
    jsonb_build_object(
        'veterinarian_id', r.veterinario_id,
        'veterinarian_name', (SELECT vet_name FROM veterinarian_mapping WHERE old_vet_id = r.veterinario_id),
        'clinic', (SELECT clinic_data FROM clinic_mapping WHERE old_clinic_name = r.clinica),
        'is_pending', r.pendente,
        'scheduled_date', r.previsto_data,
        'completed_date', r.realizado_data,
        'old_registro_id', r.registro_id
    ) as details,
    COALESCE(
        r.criado_por,
        -- Fallback: owner do shelter
        (SELECT s.owner_id FROM public.animals a
         JOIN public.shelters s ON s.id = a.shelter_id
         WHERE a.id = r.animal_id
         LIMIT 1)
    ) as triggered_by,
    COALESCE(r.criado_em, r.data::timestamp, now()) as created_at
FROM public.registros r
WHERE r.animal_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = r.animal_id)
  -- Verificar se triggered_by é válido
  AND (
      r.criado_por IS NULL OR
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = r.criado_por) OR
      EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.shelters s ON s.id = a.shelter_id
          WHERE a.id = r.animal_id
      )
  )
ON CONFLICT DO NOTHING;

\echo 'Registros migrados para eventos: ' || (SELECT COUNT(*) FROM public.animal_events);

-- ====================
-- 2. VERIFICAÇÕES
-- ====================
\echo ''
\echo '2. Verificando migração de eventos...'

-- Total de eventos
\echo 'Total de eventos: ' || (SELECT COUNT(*) FROM public.animal_events);

-- Eventos por tipo
\echo ''
\echo 'Top 10 tipos de eventos:'
SELECT
    event_type as tipo,
    COUNT(*) as total
FROM public.animal_events
GROUP BY event_type
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Animais com eventos
\echo ''
\echo 'Animais com eventos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_events);

-- Animais sem eventos
\echo 'Animais sem eventos: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.animal_events ae WHERE ae.animal_id = a.id));

-- Top 5 animais com mais eventos
\echo ''
\echo 'Top 5 animais com mais eventos:'
SELECT
    a.name as animal,
    COUNT(ae.id) as total_eventos
FROM public.animal_events ae
JOIN public.animals a ON a.id = ae.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(ae.id) DESC
LIMIT 5;

-- Eventos pendentes
\echo ''
\echo 'Eventos pendentes: ' ||
    (SELECT COUNT(*) FROM public.animal_events WHERE details->>'is_pending' = 'true');

-- Eventos com veterinário
\echo 'Eventos com veterinário: ' ||
    (SELECT COUNT(*) FROM public.animal_events WHERE details->>'veterinarian_name' IS NOT NULL);

-- Eventos com data agendada
\echo 'Eventos com data agendada: ' ||
    (SELECT COUNT(*) FROM public.animal_events WHERE details->>'scheduled_date' IS NOT NULL);

-- Eventos completados
\echo 'Eventos completados: ' ||
    (SELECT COUNT(*) FROM public.animal_events WHERE details->>'completed_date' IS NOT NULL);

-- ====================
-- 3. ANÁLISE TEMPORAL
-- ====================
\echo ''
\echo '3. Análise temporal dos eventos...'

SELECT
    'Últimos 30 dias' as periodo,
    COUNT(*) as total_eventos
FROM public.animal_events
WHERE created_at >= now() - interval '30 days'
UNION ALL
SELECT
    'Últimos 90 dias',
    COUNT(*)
FROM public.animal_events
WHERE created_at >= now() - interval '90 days'
UNION ALL
SELECT
    'Último ano',
    COUNT(*)
FROM public.animal_events
WHERE created_at >= now() - interval '1 year'
UNION ALL
SELECT
    'Mais de 1 ano',
    COUNT(*)
FROM public.animal_events
WHERE created_at < now() - interval '1 year';

-- ====================
-- 4. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'animal_events',
    (SELECT COUNT(*) FROM public.registros),
    (SELECT COUNT(*) FROM public.animal_events),
    'Eventos migrados de registros. Veterinários mapeados, clínicas linkadas, status de pendente/agendado/completado preservados em details.'
);

\echo ''
\echo '=================================================='
\echo 'EVENTOS DOS ANIMAIS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.animal_events);
\echo 'Animais com eventos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_events);
\echo 'Eventos pendentes: ' || (SELECT COUNT(*) FROM public.animal_events WHERE details->>'is_pending' = 'true');
\echo ''
\echo 'Próximo passo: Execute 15_migrate_favorites.sql'
\echo '=================================================='
