-- =====================================================
-- Script 09: MIGRAR FOTOS DOS ANIMAIS
-- =====================================================
-- Descrição: Extrai fotos de animais.foto e animais.album
-- Tempo estimado: 2-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO FOTOS DOS ANIMAIS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR FOTOS DE PERFIL (campo 'foto')
-- ====================
\echo ''
\echo '1. Migrando fotos de perfil...'

INSERT INTO public.animal_photos (
    id,
    animal_id,
    image_url,
    is_profile_pic,
    photo_order,
    uploaded_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    a.animal_id,
    a.foto as image_url,
    true as is_profile_pic,
    0 as photo_order,
    a.created_by as uploaded_by,  -- Pode ser NULL
    a.criado as created_at
FROM public.animais a
WHERE a.foto IS NOT NULL
  AND a.foto != ''
  AND LENGTH(a.foto) > 5  -- Validação mínima de URL
  AND EXISTS (SELECT 1 FROM public.animals an WHERE an.id = a.animal_id)
ON CONFLICT DO NOTHING;

\echo 'Fotos de perfil migradas: ' || (SELECT COUNT(*) FROM public.animal_photos WHERE is_profile_pic = true);

-- ====================
-- 2. MIGRAR ÁLBUNS (campo 'album')
-- ====================
\echo ''
\echo '2. Migrando álbuns de fotos...'

-- O campo album pode conter:
-- - Uma única URL
-- - Múltiplas URLs separadas por vírgula
-- - Um array JSON
-- Vamos tentar processar todos os formatos

-- 2.1: Album com URL única (não é JSON, não tem vírgula)
INSERT INTO public.animal_photos (
    id,
    animal_id,
    image_url,
    is_profile_pic,
    photo_order,
    uploaded_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    a.animal_id,
    TRIM(a.album) as image_url,
    false as is_profile_pic,
    1 as photo_order,
    NULL as uploaded_by,
    a.criado as created_at
FROM public.animais a
WHERE a.album IS NOT NULL
  AND a.album != ''
  AND LENGTH(a.album) > 5
  AND a.album NOT LIKE '%,%'  -- Não tem vírgulas
  AND a.album NOT LIKE '[%'   -- Não é JSON array
  AND a.album NOT LIKE '{%'   -- Não é JSON object
  AND EXISTS (SELECT 1 FROM public.animals an WHERE an.id = a.animal_id)
  -- Não duplicar se já existe foto de perfil com mesma URL
  AND NOT EXISTS (
      SELECT 1 FROM public.animal_photos ap
      WHERE ap.animal_id = a.animal_id AND ap.image_url = TRIM(a.album)
  )
ON CONFLICT DO NOTHING;

\echo 'Álbuns com URL única migrados';

-- 2.2: Album com múltiplas URLs separadas por vírgula
INSERT INTO public.animal_photos (
    id,
    animal_id,
    image_url,
    is_profile_pic,
    photo_order,
    uploaded_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    a.animal_id,
    TRIM(url) as image_url,
    false as is_profile_pic,
    row_number as photo_order,
    NULL as uploaded_by,
    a.criado as created_at
FROM public.animais a,
     LATERAL (
         SELECT
             TRIM(regexp_split_to_table(a.album, ',')) as url,
             generate_series(1, array_length(string_to_array(a.album, ','), 1)) as row_number
     ) urls
WHERE a.album IS NOT NULL
  AND a.album != ''
  AND a.album LIKE '%,%'  -- Tem vírgulas
  AND LENGTH(TRIM(url)) > 5
  AND EXISTS (SELECT 1 FROM public.animals an WHERE an.id = a.animal_id)
  -- Não duplicar se já existe
  AND NOT EXISTS (
      SELECT 1 FROM public.animal_photos ap
      WHERE ap.animal_id = a.animal_id AND ap.image_url = TRIM(url)
  )
ON CONFLICT DO NOTHING;

\echo 'Álbuns com múltiplas URLs migrados';

-- 2.3: Album com JSON array (se houver)
-- Nota: Isso depende de como o JSON está estruturado
-- Exemplo: ["url1", "url2", "url3"]
DO $$
DECLARE
    animal_record RECORD;
    photo_url TEXT;
    idx INT;
BEGIN
    FOR animal_record IN
        SELECT animal_id, album, criado
        FROM public.animais
        WHERE album IS NOT NULL
          AND album != ''
          AND (album LIKE '[%' OR album LIKE '{%')
    LOOP
        BEGIN
            -- Tentar parsear como JSON array
            IF jsonb_typeof(album::jsonb) = 'array' THEN
                idx := 1;
                FOR photo_url IN
                    SELECT jsonb_array_elements_text(album::jsonb)
                LOOP
                    IF LENGTH(TRIM(photo_url)) > 5 THEN
                        INSERT INTO public.animal_photos (
                            id, animal_id, image_url, is_profile_pic,
                            photo_order, uploaded_by, created_at
                        )
                        VALUES (
                            gen_random_uuid(),
                            animal_record.animal_id,
                            TRIM(photo_url),
                            false,
                            idx + 10,  -- Offset para não colidir com outras fotos
                            NULL,
                            animal_record.criado
                        )
                        ON CONFLICT DO NOTHING;
                        idx := idx + 1;
                    END IF;
                END LOOP;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Se não for JSON válido, ignorar silenciosamente
                INSERT INTO migration_errors (script_name, error_type, error_message, affected_record_id)
                VALUES (
                    '09_migrate_animal_photos',
                    'invalid_json_album',
                    'Não foi possível parsear album como JSON: ' || SUBSTRING(animal_record.album, 1, 100),
                    animal_record.animal_id::text
                );
        END;
    END LOOP;
END $$;

\echo 'Álbuns JSON processados';

-- ====================
-- 3. VERIFICAÇÕES
-- ====================
\echo ''
\echo '3. Verificando migração de fotos...'

-- Total de fotos
\echo 'Total de fotos migradas: ' || (SELECT COUNT(*) FROM public.animal_photos);

-- Fotos de perfil
\echo 'Fotos de perfil: ' || (SELECT COUNT(*) FROM public.animal_photos WHERE is_profile_pic = true);

-- Fotos de álbum
\echo 'Fotos de álbum: ' || (SELECT COUNT(*) FROM public.animal_photos WHERE is_profile_pic = false);

-- Animais com fotos
\echo 'Animais com fotos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_photos);

-- Animais sem fotos
\echo 'Animais sem fotos: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.animal_photos ap WHERE ap.animal_id = a.id));

-- Top 5 animais com mais fotos
\echo ''
\echo 'Top 5 animais com mais fotos:'
SELECT
    a.name,
    COUNT(ap.id) as total_fotos
FROM public.animal_photos ap
JOIN public.animals a ON a.id = ap.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(ap.id) DESC
LIMIT 5;

-- ====================
-- 4. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'animal_photos',
    (SELECT COUNT(*) FROM public.animais WHERE foto IS NOT NULL AND foto != '') +
    (SELECT COUNT(*) FROM public.animais WHERE album IS NOT NULL AND album != ''),
    (SELECT COUNT(*) FROM public.animal_photos),
    'Fotos extraídas de animais.foto (perfil) e animais.album (múltiplas). Suporta URLs únicas, CSV e JSON.'
);

\echo ''
\echo '=================================================='
\echo 'FOTOS DOS ANIMAIS MIGRADAS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.animal_photos);
\echo 'Animais com fotos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.animal_photos);
\echo 'Erros: ' || (SELECT COUNT(*) FROM migration_errors WHERE script_name = '09_migrate_animal_photos');
\echo ''
\echo 'Próximo passo: Execute 10_migrate_animal_weights.sql'
\echo '=================================================='
