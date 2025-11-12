-- =====================================================
-- Script 05: MIGRAR CATÁLOGOS
-- =====================================================
-- Descrição: Consolida tabelas de referência em catalogs
-- Tempo estimado: 1-2 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO CATÁLOGOS'
\echo '=================================================='

-- ====================
-- 1. ESPÉCIES
-- ====================
\echo ''
\echo '1. Migrando espécies...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'species' as category,
    especie as name,
    NULL as description,
    true as is_active
FROM public.especies
WHERE canil_id IS NULL  -- Apenas espécies globais
  AND especie IS NOT NULL
  AND especie != ''
ON CONFLICT (category, name) DO NOTHING;

-- Adicionar espécie "Desconhecida" para órfãos
INSERT INTO public.catalogs (category, name, description, is_active)
VALUES ('species', 'Desconhecido', 'Espécie não identificada', true)
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'species', e.especie, c.id
FROM public.especies e
JOIN public.catalogs c ON c.category = 'species' AND c.name = e.especie
WHERE e.canil_id IS NULL;

-- Adicionar mapeamento para desconhecido
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'species', '', c.id
FROM public.catalogs c
WHERE c.category = 'species' AND c.name = 'Desconhecido'
ON CONFLICT DO NOTHING;

\echo 'Espécies migradas: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'species');

-- ====================
-- 2. RAÇAS
-- ====================
\echo ''
\echo '2. Migrando raças...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'breed' as category,
    raca as name,
    NULL as description,
    true as is_active
FROM public.racas
WHERE canil_id IS NULL  -- Apenas raças globais
  AND raca IS NOT NULL
  AND raca != ''
ON CONFLICT (category, name) DO NOTHING;

-- Adicionar raça "Desconhecida" para órfãos
INSERT INTO public.catalogs (category, name, description, is_active)
VALUES ('breed', 'Desconhecida', 'Raça não identificada', true)
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'breed', r.raca, c.id
FROM public.racas r
JOIN public.catalogs c ON c.category = 'breed' AND c.name = r.raca
WHERE r.canil_id IS NULL;

-- Adicionar mapeamento para desconhecida
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'breed', '', c.id
FROM public.catalogs c
WHERE c.category = 'breed' AND c.name = 'Desconhecida'
ON CONFLICT DO NOTHING;

\echo 'Raças migradas: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'breed');

-- ====================
-- 3. GÊNEROS
-- ====================
\echo ''
\echo '3. Migrando gêneros...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'gender' as category,
    genero as name,
    NULL as description,
    true as is_active
FROM public.generos
WHERE genero IS NOT NULL AND genero != ''
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'gender', g.genero, c.id
FROM public.generos g
JOIN public.catalogs c ON c.category = 'gender' AND c.name = g.genero;

\echo 'Gêneros migrados: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'gender');

-- ====================
-- 4. CORES
-- ====================
\echo ''
\echo '4. Migrando cores...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'color' as category,
    cor as name,
    NULL as description,
    true as is_active
FROM public.cores
WHERE canil_id IS NULL  -- Apenas cores globais
  AND cor IS NOT NULL
  AND cor != ''
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'color', co.cor, c.id
FROM public.cores co
JOIN public.catalogs c ON c.category = 'color' AND c.name = co.cor
WHERE co.canil_id IS NULL;

\echo 'Cores migradas: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'color');

-- ====================
-- 5. PORTES (TAMANHOS)
-- ====================
\echo ''
\echo '5. Migrando portes...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'size' as category,
    porte as name,
    descritivo as description,
    true as is_active
FROM public.portes
WHERE porte IS NOT NULL AND porte != ''
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'size', p.porte, c.id
FROM public.portes p
JOIN public.catalogs c ON c.category = 'size' AND c.name = p.porte;

\echo 'Portes migrados: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'size');

-- ====================
-- 6. PELAGENS
-- ====================
\echo ''
\echo '6. Migrando pelagens...'

INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'coat_type' as category,
    pelagem as name,
    NULL as description,
    true as is_active
FROM public.pelagens
WHERE pelagem IS NOT NULL AND pelagem != ''
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'coat_type', pel.pelagem, c.id
FROM public.pelagens pel
JOIN public.catalogs c ON c.category = 'coat_type' AND c.name = pel.pelagem;

\echo 'Pelagens migradas: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'coat_type');

-- ====================
-- 7. STATUS DE ANIMAIS (NOVO)
-- ====================
\echo ''
\echo '7. Criando status de animais...'

INSERT INTO public.catalogs (category, name, description, is_active) VALUES
    ('animal_status', 'available', 'Disponível para adoção', true),
    ('animal_status', 'adopted', 'Adotado com sucesso', true),
    ('animal_status', 'deceased', 'Falecido', false),
    ('animal_status', 'missing', 'Desaparecido', false),
    ('animal_status', 'quarantine', 'Em quarentena', true),
    ('animal_status', 'medical_hold', 'Em tratamento médico', true),
    ('animal_status', 'unavailable', 'Indisponível', false)
ON CONFLICT (category, name) DO NOTHING;

-- Preencher tabela de mapeamento para status
INSERT INTO catalog_mappings (category, old_value, new_id)
SELECT 'animal_status', 'available', id FROM public.catalogs WHERE category = 'animal_status' AND name = 'available'
UNION ALL
SELECT 'animal_status', 'adopted', id FROM public.catalogs WHERE category = 'animal_status' AND name = 'adopted'
UNION ALL
SELECT 'animal_status', 'deceased', id FROM public.catalogs WHERE category = 'animal_status' AND name = 'deceased'
UNION ALL
SELECT 'animal_status', 'missing', id FROM public.catalogs WHERE category = 'animal_status' AND name = 'missing'
UNION ALL
SELECT 'animal_status', 'quarantine', id FROM public.catalogs WHERE category = 'animal_status' AND name = 'quarantine';

\echo 'Status de animais criados: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'animal_status');

-- ====================
-- RESUMO DOS CATÁLOGOS
-- ====================
\echo ''
\echo '=================================================='
\echo 'RESUMO DOS CATÁLOGOS MIGRADOS'
\echo '=================================================='

SELECT
    category as categoria,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN is_active THEN 1 END) as ativos,
    COUNT(CASE WHEN NOT is_active THEN 1 END) as inativos
FROM public.catalogs
GROUP BY category
ORDER BY category;

-- Registrar estatísticas
INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'catalogs',
    (SELECT SUM(cnt) FROM (
        SELECT COUNT(*) as cnt FROM public.especies WHERE canil_id IS NULL
        UNION ALL SELECT COUNT(*) FROM public.racas WHERE canil_id IS NULL
        UNION ALL SELECT COUNT(*) FROM public.generos
        UNION ALL SELECT COUNT(*) FROM public.cores WHERE canil_id IS NULL
        UNION ALL SELECT COUNT(*) FROM public.portes
        UNION ALL SELECT COUNT(*) FROM public.pelagens
    ) x),
    (SELECT COUNT(*) FROM public.catalogs),
    'Consolidação de múltiplas tabelas de referência'
);

\echo ''
\echo '=================================================='
\echo 'CATÁLOGOS MIGRADOS COM SUCESSO'
\echo 'Próximo passo: Execute 06_migrate_users.sql'
\echo '=================================================='
