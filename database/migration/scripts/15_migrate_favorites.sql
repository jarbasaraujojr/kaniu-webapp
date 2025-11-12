-- =====================================================
-- Script 15: MIGRAR FAVORITOS
-- =====================================================
-- Descrição: Explode array pessoa_likes.animais em favorites
-- Tempo estimado: 1-2 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO FAVORITOS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR FAVORITOS (EXPLODIR ARRAY)
-- ====================
\echo ''
\echo '1. Explodindo array de favoritos...'

INSERT INTO public.favorites (
    user_id,
    animal_id,
    created_at
)
SELECT
    pl.usuario as user_id,
    unnest(pl.animais) as animal_id,
    now() as created_at
FROM public.pessoa_likes pl
WHERE pl.usuario IS NOT NULL
  AND pl.animais IS NOT NULL
  AND array_length(pl.animais, 1) > 0
  -- Verificar se usuário existe
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = pl.usuario)
  -- Verificar se animal existe
  AND EXISTS (
      SELECT 1 FROM public.animals a
      WHERE a.id = ANY(pl.animais)
  )
ON CONFLICT (user_id, animal_id) DO NOTHING;

\echo 'Favoritos migrados: ' || (SELECT COUNT(*) FROM public.favorites);

-- ====================
-- 2. VERIFICAÇÕES
-- ====================
\echo ''
\echo '2. Verificando migração de favoritos...'

-- Total de favoritos
\echo 'Total de favoritos: ' || (SELECT COUNT(*) FROM public.favorites);

-- Usuários com favoritos
\echo 'Usuários com favoritos: ' || (SELECT COUNT(DISTINCT user_id) FROM public.favorites);

-- Animais favoritados
\echo 'Animais favoritados: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.favorites);

-- Top 5 usuários com mais favoritos
\echo ''
\echo 'Top 5 usuários com mais favoritos:'
SELECT
    u.name as usuario,
    u.email,
    COUNT(f.animal_id) as total_favoritos
FROM public.favorites f
JOIN public.users u ON u.id = f.user_id
GROUP BY u.id, u.name, u.email
ORDER BY COUNT(f.animal_id) DESC
LIMIT 5;

-- Top 5 animais mais favoritados
\echo ''
\echo 'Top 5 animais mais favoritados:'
SELECT
    a.name as animal,
    s.name as abrigo,
    COUNT(f.user_id) as total_favoritos
FROM public.favorites f
JOIN public.animals a ON a.id = f.animal_id
JOIN public.shelters s ON s.id = a.shelter_id
GROUP BY a.id, a.name, s.name
ORDER BY COUNT(f.user_id) DESC
LIMIT 5;

-- Média de favoritos por usuário
\echo ''
\echo 'Estatísticas de favoritos:'
SELECT
    'Média por usuário' as metrica,
    ROUND(AVG(total_favoritos), 2)::text as valor
FROM (
    SELECT user_id, COUNT(*) as total_favoritos
    FROM public.favorites
    GROUP BY user_id
) sub
UNION ALL
SELECT
    'Média por animal',
    ROUND(AVG(total_usuarios), 2)::text
FROM (
    SELECT animal_id, COUNT(*) as total_usuarios
    FROM public.favorites
    GROUP BY animal_id
) sub
UNION ALL
SELECT
    'Máximo de favoritos por usuário',
    MAX(total_favoritos)::text
FROM (
    SELECT user_id, COUNT(*) as total_favoritos
    FROM public.favorites
    GROUP BY user_id
) sub;

-- ====================
-- 3. VERIFICAR REGISTROS ÓRFÃOS
-- ====================
\echo ''
\echo '3. Verificando registros não migrados...'

-- Favoritos com animais que não existem mais
\echo 'Favoritos com animais inexistentes (não migrados):'
SELECT COUNT(*) as total
FROM public.pessoa_likes pl,
     unnest(pl.animais) as animal_id
WHERE NOT EXISTS (SELECT 1 FROM public.animals a WHERE a.id = animal_id);

-- Favoritos com usuários que não existem
\echo 'Favoritos com usuários inexistentes (não migrados):'
SELECT COUNT(*) as total
FROM public.pessoa_likes pl
WHERE pl.usuario IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = pl.usuario);

-- ====================
-- 4. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'favorites',
    (SELECT SUM(array_length(animais, 1))
     FROM public.pessoa_likes
     WHERE animais IS NOT NULL),
    (SELECT COUNT(*) FROM public.favorites),
    'Favoritos migrados de pessoa_likes.animais (array explodido em registros individuais).'
);

\echo ''
\echo '=================================================='
\echo 'FAVORITOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.favorites);
\echo 'Usuários: ' || (SELECT COUNT(DISTINCT user_id) FROM public.favorites);
\echo 'Animais: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.favorites);
\echo ''
\echo 'Próximo passo: Execute 16_validate_migration.sql'
\echo '=================================================='
