-- =====================================================
-- Script 11: MIGRAR DOCUMENTOS
-- =====================================================
-- Descrição: Migra arquivos para documents
-- Tempo estimado: 1-3 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO DOCUMENTOS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR DOCUMENTOS
-- ====================
\echo ''
\echo '1. Migrando documentos...'

INSERT INTO public.documents (
    id,
    animal_id,
    document_type,
    file_url,
    file_name,
    mime_type,
    description,
    issued_date,
    data,
    uploaded_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    arq.animal as animal_id,
    -- Inferir tipo de documento baseado no nome do arquivo
    CASE
        WHEN LOWER(arq.nome) LIKE '%vacin%' THEN 'vaccination'
        WHEN LOWER(arq.nome) LIKE '%atestado%' OR LOWER(arq.nome) LIKE '%laudo%' THEN 'medical_certificate'
        WHEN LOWER(arq.nome) LIKE '%exame%' THEN 'exam_result'
        WHEN LOWER(arq.nome) LIKE '%receita%' OR LOWER(arq.nome) LIKE '%prescri%' THEN 'prescription'
        WHEN LOWER(arq.nome) LIKE '%adoção%' OR LOWER(arq.nome) LIKE '%adocao%' THEN 'adoption'
        ELSE 'general'
    END as document_type,
    arq.aquivo as file_url,  -- Nota: campo tem typo no original
    arq.nome as file_name,
    -- Inferir mime_type pela extensão
    CASE
        WHEN LOWER(arq.aquivo) LIKE '%.pdf' THEN 'application/pdf'
        WHEN LOWER(arq.aquivo) LIKE '%.jpg' OR LOWER(arq.aquivo) LIKE '%.jpeg' THEN 'image/jpeg'
        WHEN LOWER(arq.aquivo) LIKE '%.png' THEN 'image/png'
        WHEN LOWER(arq.aquivo) LIKE '%.doc%' THEN 'application/msword'
        ELSE 'application/octet-stream'
    END as mime_type,
    arq.observacao as description,
    arq.criacao as issued_date,
    -- Armazenar registro_id original em data para referência
    CASE WHEN arq.registro IS NOT NULL THEN
        jsonb_build_object('old_registro_id', arq.registro)
    ELSE NULL
    END as data,
    -- Uploaded_by: tentar pegar do animal ou do shelter owner
    COALESCE(
        a.created_by,
        (SELECT owner_id FROM public.shelters WHERE id = a.shelter_id)
    ) as uploaded_by,
    COALESCE(arq.criacao::timestamp, now()) as created_at
FROM public.arquivos arq
JOIN public.animals a ON a.id = arq.animal
WHERE arq.apagado = false  -- Não migrar arquivos apagados
  AND arq.aquivo IS NOT NULL
  AND arq.aquivo != ''
  AND EXISTS (SELECT 1 FROM public.animals an WHERE an.id = arq.animal)
ON CONFLICT DO NOTHING;

\echo 'Documentos migrados: ' || (SELECT COUNT(*) FROM public.documents);

-- ====================
-- 2. VERIFICAÇÕES
-- ====================
\echo ''
\echo '2. Verificando migração de documentos...'

-- Total de documentos
\echo 'Total de documentos: ' || (SELECT COUNT(*) FROM public.documents);

-- Documentos por tipo
\echo ''
\echo 'Documentos por tipo:'
SELECT
    document_type as tipo,
    COUNT(*) as total
FROM public.documents
GROUP BY document_type
ORDER BY COUNT(*) DESC;

-- Documentos por mime_type
\echo ''
\echo 'Documentos por formato:'
SELECT
    mime_type as formato,
    COUNT(*) as total
FROM public.documents
GROUP BY mime_type
ORDER BY COUNT(*) DESC;

-- Animais com documentos
\echo ''
\echo 'Animais com documentos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.documents);

-- Animais sem documentos
\echo 'Animais sem documentos: ' ||
    (SELECT COUNT(*) FROM public.animals a
     WHERE NOT EXISTS (SELECT 1 FROM public.documents d WHERE d.animal_id = a.id));

-- Top 5 animais com mais documentos
\echo ''
\echo 'Top 5 animais com mais documentos:'
SELECT
    a.name as animal,
    COUNT(d.id) as total_documentos
FROM public.documents d
JOIN public.animals a ON a.id = d.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(d.id) DESC
LIMIT 5;

-- Documentos com descrição
\echo ''
\echo 'Documentos com descrição: ' ||
    (SELECT COUNT(*) FROM public.documents WHERE description IS NOT NULL AND description != '');

-- ====================
-- 3. VERIFICAR ARQUIVOS NÃO MIGRADOS
-- ====================
\echo ''
\echo '3. Arquivos não migrados (apagados):'
SELECT COUNT(*) as total_apagados
FROM public.arquivos
WHERE apagado = true;

-- ====================
-- 4. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'documents',
    (SELECT COUNT(*) FROM public.arquivos),
    (SELECT COUNT(*) FROM public.documents),
    (SELECT COUNT(*) FROM public.arquivos WHERE apagado = true),
    'Documentos migrados de arquivos (excluindo apagados). Tipo e mime_type inferidos do nome/extensão.'
);

\echo ''
\echo '=================================================='
\echo 'DOCUMENTOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.documents);
\echo 'Animais com documentos: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.documents);
\echo 'Arquivos apagados (não migrados): ' || (SELECT COUNT(*) FROM public.arquivos WHERE apagado = true);
\echo ''
\echo 'Próximo passo: Execute 12_migrate_medical_records.sql'
\echo '=================================================='
