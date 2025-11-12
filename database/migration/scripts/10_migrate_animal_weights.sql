-- =====================================================
-- Script 10: MIGRAR PESAGENS DOS ANIMAIS
-- =====================================================
-- Descrição: Migra pesagens + peso do campo animais.peso
-- Tempo estimado: 1-3 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO PESAGENS DOS ANIMAIS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR TABELA pesagens
-- ====================
\echo ''
\echo '1. Migrando pesagens da tabela pesagens...'

INSERT INTO public.animal_weights (
    animal_id,
    value,
    unit,
    recorded_by,
    date_time,
    notes
)
SELECT
    p.animal as animal_id,
    p.peso::numeric(6,2) as value,
    'kg' as unit,
    -- Tentar encontrar quem registrou (shelter owner como fallback)
    COALESCE(
        a.created_by,
        (SELECT owner_id FROM public.shelters WHERE id = a.shelter_id)
    ) as recorded_by,
    -- Converter date para timestamp (usar meio-dia como padrão)
    (p.data::timestamp + interval '12 hours') as date_time,
    NULL as notes
FROM public.pesagens p
JOIN public.animals a ON a.id = p.animal
WHERE p.peso > 0  -- Apenas pesagens válidas
  AND p.peso IS NOT NULL
  AND p.data IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals an WHERE an.id = p.animal)
  -- Verificar se o recorded_by é válido
  AND (
      a.created_by IS NULL OR
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.created_by) OR
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = (SELECT owner_id FROM public.shelters WHERE id = a.shelter_id))
  )
ON CONFLICT DO NOTHING;

\echo 'Pesagens da tabela pesagens migradas: ' || (SELECT COUNT(*) FROM public.animal_weights);

-- ====================
-- 2. MIGRAR animais.peso (se não existe pesagem na mesma data)
-- ====================
\echo ''
\echo '2. Migrando peso do campo animais.peso...'

-- Adicionar peso do campo animais se:
-- - Peso > 0
-- - Não existe pesagem para o animal na data de criação
INSERT INTO public.animal_weights (
    animal_id,
    value,
    unit,
    recorded_by,
    date_time,
    notes
)
SELECT
    a.id as animal_id,
    an.peso::numeric(6,2) as value,
    'kg' as unit,
    COALESCE(
        a.created_by,
        (SELECT owner_id FROM public.shelters WHERE id = a.shelter_id)
    ) as recorded_by,
    a.created_at as date_time,
    'Peso registrado na criação do animal' as notes
FROM public.animais an
JOIN public.animals a ON a.id = an.animal_id
WHERE an.peso > 0
  AND an.peso IS NOT NULL
  -- Não existe pesagem para este animal na data de criação
  AND NOT EXISTS (
      SELECT 1 FROM public.animal_weights aw
      WHERE aw.animal_id = a.id
        AND DATE(aw.date_time) = DATE(a.created_at)
  )
  -- Verificar se o recorded_by é válido
  AND (
      a.created_by IS NULL OR
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.created_by) OR
      EXISTS (SELECT 1 FROM public.users u WHERE u.id = (SELECT owner_id FROM public.shelters WHERE id = a.shelter_id))
  )
ON CONFLICT DO NOTHING;

\echo 'Pesos do campo animais.peso migrados';

-- ====================
-- 3. CORRIGIR recorded_by NULOS (se houver)
-- ====================
\echo ''
\echo '3. Corrigindo recorded_by nulos...'

-- Atualizar recorded_by NULL para o owner do shelter
UPDATE public.animal_weights aw
SET recorded_by = (
    SELECT s.owner_id
    FROM public.animals a
    JOIN public.shelters s ON s.id = a.shelter_id
    WHERE a.id = aw.animal_id
    LIMIT 1
)
WHERE aw.recorded_by IS NULL;

\echo 'Registros corrigidos';

-- ====================
-- 4. VERIFICAÇÕES
-- ====================
\echo ''
\echo '4. Verificando migração de pesagens...'

-- Total de pesagens
\echo 'Total de pesagens migradas: ' || (SELECT COUNT(*) FROM public.animal_weights);

-- Animais com pesagens
\echo 'Animais com pesagens: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_weights);

-- Animais sem pesagens
\echo 'Animais sem pesagens: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.animal_weights aw WHERE aw.animal_id = a.id));

-- Estatísticas de peso
\echo ''
\echo 'Estatísticas de peso:'
SELECT
    'Peso mínimo' as estatistica,
    ROUND(MIN(value::numeric), 2)::text || ' kg' as valor
FROM public.animal_weights
WHERE value > 0
UNION ALL
SELECT
    'Peso máximo',
    ROUND(MAX(value::numeric), 2)::text || ' kg'
FROM public.animal_weights
WHERE value > 0
UNION ALL
SELECT
    'Peso médio',
    ROUND(AVG(value::numeric), 2)::text || ' kg'
FROM public.animal_weights
WHERE value > 0;

-- Top 5 animais com mais pesagens
\echo ''
\echo 'Top 5 animais com mais pesagens:'
SELECT
    a.name as animal,
    COUNT(aw.id) as total_pesagens,
    ROUND(MIN(aw.value::numeric), 2) as peso_min,
    ROUND(MAX(aw.value::numeric), 2) as peso_max,
    ROUND(AVG(aw.value::numeric), 2) as peso_medio
FROM public.animal_weights aw
JOIN public.animals a ON a.id = aw.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(aw.id) DESC
LIMIT 5;

-- Verificar pesagens com datas futuras
\echo ''
\echo 'Pesagens com data futura: ' ||
    (SELECT COUNT(*) FROM public.animal_weights WHERE date_time > now());

-- ====================
-- 5. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'animal_weights',
    (SELECT COUNT(*) FROM public.pesagens) +
    (SELECT COUNT(*) FROM public.animais WHERE peso > 0),
    (SELECT COUNT(*) FROM public.animal_weights),
    'Pesagens migradas de pesagens + animais.peso. Recorded_by definido como owner do shelter quando não identificado.'
);

\echo ''
\echo '=================================================='
\echo 'PESAGENS DOS ANIMAIS MIGRADAS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.animal_weights);
\echo 'Animais com pesagens: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_weights);
\echo ''
\echo 'Próximo passo: Execute 11_migrate_documents.sql'
\echo '=================================================='
