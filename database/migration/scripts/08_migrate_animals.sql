-- =====================================================
-- Script 08: MIGRAR ANIMAIS
-- =====================================================
-- Descrição: Migra animais com transformações complexas
-- Tempo estimado: 5-15 minutos (dependendo do volume)
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO ANIMAIS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR ANIMAIS PRINCIPAL
-- ====================
\echo ''
\echo '1. Migrando dados principais dos animais...'
\echo '   (Isso pode demorar alguns minutos...)'

INSERT INTO public.animals (
    id,
    name,
    description,
    shelter_id,
    species_id,
    breed_id,
    gender,
    size,
    birth_date,
    microchip_id,
    status_id,
    castrated,
    health_status,
    behavior,
    appearance,
    created_at,
    updated_at,
    created_by,
    updated_by,
    deleted_at
)
SELECT
    a.animal_id as id,
    COALESCE(NULLIF(TRIM(a.nome), ''), 'Sem nome') as name,
    -- Buscar descrição da tabela animais_descricao
    (SELECT ad.descricao FROM public.animais_descricao ad WHERE ad.animal = a.animal_id LIMIT 1) as description,
    -- Mapear shelter_id de bigint para uuid
    COALESCE(
        (SELECT new_id FROM shelter_id_mapping WHERE old_id = a.canil),
        (SELECT new_id FROM shelter_id_mapping WHERE old_id = 0)  -- Abrigo "Desconhecido"
    ) as shelter_id,
    -- Mapear species_id
    COALESCE(
        (SELECT new_id FROM catalog_mappings WHERE category = 'species' AND old_value = a.especie),
        (SELECT new_id FROM catalog_mappings WHERE category = 'species' AND old_value = '')
    ) as species_id,
    -- Mapear breed_id
    COALESCE(
        (SELECT new_id FROM catalog_mappings WHERE category = 'breed' AND old_value = a.raça),
        (SELECT new_id FROM catalog_mappings WHERE category = 'breed' AND old_value = '')
    ) as breed_id,
    -- Gender: armazenar diretamente como string
    NULLIF(TRIM(a.genero), '') as gender,
    -- Size: armazenar diretamente como string
    NULLIF(TRIM(a.porte), '') as size,
    a.nascimento as birth_date,
    NULL as microchip_id,  -- Não existe no schema antigo
    -- Determinar status baseado em flags booleanas (prioridade)
    CASE
        WHEN a.falecido = true THEN
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'deceased')
        WHEN a.desaparecido = true THEN
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'missing')
        WHEN a.adotado = true THEN
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'adopted')
        WHEN a.internado = true THEN
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'medical_hold')
        WHEN a.disponivel = true THEN
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'available')
        ELSE
            (SELECT id FROM public.catalogs WHERE category = 'animal_status' AND name = 'unavailable')
    END as status_id,
    a.castrado as castrated,
    -- Consolidar status de saúde em JSONB
    jsonb_build_object(
        'vaccinated', COALESCE(a.vacinado, false),
        'dewormed', COALESCE(a.vermifugado, false),
        'deparasitized', COALESCE(a.desparasitado, false),
        'hospitalized', COALESCE(a.internado, false),
        'diagnoses', COALESCE(a.diagnosticos, ARRAY[]::text[])
    ) as health_status,
    -- Behavior: placeholder vazio
    jsonb_build_object('notes', NULL::text) as behavior,
    -- Consolidar aparência em JSONB
    jsonb_build_object(
        'color', NULLIF(TRIM(a.cor), ''),
        'coat', NULLIF(TRIM(a.pelagem), ''),
        'chest', CASE WHEN a.torax > 0 THEN a.torax ELSE NULL END,
        'length', CASE WHEN a.comprimento > 0 THEN a.comprimento ELSE NULL END,
        'neck', CASE WHEN a.pescoço > 0 THEN a.pescoço ELSE NULL END,
        'height', CASE WHEN a.altura > 0 THEN a.altura ELSE NULL END
    ) as appearance,
    a.criado as created_at,
    a.criado as updated_at,
    NULL as created_by,  -- Não há no schema antigo
    NULL as updated_by,
    NULL as deleted_at
FROM public.animais a
WHERE a.animal_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    shelter_id = EXCLUDED.shelter_id,
    species_id = EXCLUDED.species_id,
    breed_id = EXCLUDED.breed_id,
    gender = EXCLUDED.gender,
    size = EXCLUDED.size,
    birth_date = EXCLUDED.birth_date,
    status_id = EXCLUDED.status_id,
    castrated = EXCLUDED.castrated,
    health_status = EXCLUDED.health_status,
    appearance = EXCLUDED.appearance;

\echo 'Animais migrados: ' || (SELECT COUNT(*) FROM public.animals);

-- ====================
-- 2. VERIFICAÇÕES PÓS-MIGRAÇÃO
-- ====================
\echo ''
\echo '2. Verificando dados migrados...'

-- Distribuição por status
\echo ''
\echo 'Distribuição de animais por status:'
SELECT
    c.name as status,
    COUNT(a.id) as total
FROM public.animals a
LEFT JOIN public.catalogs c ON c.id = a.status_id
GROUP BY c.name
ORDER BY COUNT(a.id) DESC;

-- Distribuição por espécie
\echo ''
\echo 'Distribuição de animais por espécie:'
SELECT
    c.name as especie,
    COUNT(a.id) as total
FROM public.animals a
LEFT JOIN public.catalogs c ON c.id = a.species_id
GROUP BY c.name
ORDER BY COUNT(a.id) DESC
LIMIT 10;

-- Animais sem abrigo válido
\echo ''
\echo 'Animais no abrigo "Desconhecido": ' ||
    (SELECT COUNT(*) FROM public.animals a
     JOIN public.shelters s ON s.id = a.shelter_id
     WHERE s.name = 'Desconhecido');

-- Animais sem nome válido
\echo 'Animais sem nome original: ' ||
    (SELECT COUNT(*) FROM public.animals WHERE name = 'Sem nome');

-- Animais com descrição
\echo 'Animais com descrição: ' ||
    (SELECT COUNT(*) FROM public.animals WHERE description IS NOT NULL);

-- Animais castrados
\echo 'Animais castrados: ' ||
    (SELECT COUNT(*) FROM public.animals WHERE castrated = true);

-- ====================
-- 3. ANÁLISE DE HEALTH_STATUS
-- ====================
\echo ''
\echo '3. Análise de status de saúde...'

SELECT
    'Vacinados' as status,
    COUNT(*) as total
FROM public.animals
WHERE health_status->>'vaccinated' = 'true'
UNION ALL
SELECT
    'Vermifugados',
    COUNT(*)
FROM public.animals
WHERE health_status->>'dewormed' = 'true'
UNION ALL
SELECT
    'Desparasitados',
    COUNT(*)
FROM public.animals
WHERE health_status->>'deparasitized' = 'true'
UNION ALL
SELECT
    'Hospitalizados',
    COUNT(*)
FROM public.animals
WHERE health_status->>'hospitalized' = 'true';

-- ====================
-- 4. ANÁLISE DE APPEARANCE
-- ====================
\echo ''
\echo '4. Análise de aparência física...'

SELECT
    'Com medida de tórax' as medida,
    COUNT(*) as total
FROM public.animals
WHERE appearance->>'chest' IS NOT NULL
UNION ALL
SELECT
    'Com comprimento',
    COUNT(*)
FROM public.animals
WHERE appearance->>'length' IS NOT NULL
UNION ALL
SELECT
    'Com medida de pescoço',
    COUNT(*)
FROM public.animals
WHERE appearance->>'neck' IS NOT NULL
UNION ALL
SELECT
    'Com altura',
    COUNT(*)
FROM public.animals
WHERE appearance->>'height' IS NOT NULL;

-- ====================
-- 5. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'animals',
    (SELECT COUNT(*) FROM public.animais),
    (SELECT COUNT(*) FROM public.animals),
    0,
    'Animais migrados com transformação de status booleanos para catalog, consolidação de health_status e appearance em JSONB'
);

-- ====================
-- 6. REGISTRAR ERROS (se houver)
-- ====================

-- Verificar animais que não puderam ser migrados
INSERT INTO migration_errors (script_name, error_type, error_message, affected_record_id)
SELECT
    '08_migrate_animals',
    'shelter_not_found',
    'Animal tinha canil inválido: ' || a.canil || ', atribuído a "Desconhecido"',
    a.animal_id::text
FROM public.animais a
LEFT JOIN shelter_id_mapping m ON m.old_id = a.canil
WHERE a.canil IS NOT NULL AND m.old_id IS NULL;

\echo ''
\echo '=================================================='
\echo 'ANIMAIS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.animals);
\echo 'Erros registrados: ' || (SELECT COUNT(*) FROM migration_errors WHERE script_name = '08_migrate_animals');
\echo ''
\echo 'Próximo passo: Execute 09_migrate_animal_photos.sql'
\echo '=================================================='
