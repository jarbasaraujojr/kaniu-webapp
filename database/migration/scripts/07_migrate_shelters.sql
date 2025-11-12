-- =====================================================
-- Script 07: MIGRAR ABRIGOS
-- =====================================================
-- Descrição: Migra canis para shelters
-- Tempo estimado: 1-2 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO ABRIGOS'
\echo '=================================================='

-- ====================
-- 1. MIGRAR ABRIGOS
-- ====================
\echo ''
\echo '1. Migrando abrigos para nova tabela...'

INSERT INTO public.shelters (
    id,
    name,
    description,
    owner_id,
    location,
    phone,
    email,
    website,
    is_active,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    gen_random_uuid() as id,  -- Gerar novo UUID
    COALESCE(c.canil, 'Abrigo ' || c.id) as name,
    NULL as description,
    c.proprietario as owner_id,
    -- Consolidar dados de localização em JSON
    CASE WHEN c.logotipo_url IS NOT NULL THEN
        jsonb_build_object('logo_url', c.logotipo_url)
    ELSE NULL
    END as location,
    NULL as phone,  -- Não há no schema antigo
    NULL as email,  -- Não há no schema antigo
    NULL as website,  -- Não há no schema antigo
    CASE WHEN c.excluido = true THEN false ELSE COALESCE(c.aceita_inscricoes, true) END as is_active,
    now() as created_at,
    now() as updated_at,
    CASE WHEN c.excluido = true THEN now() ELSE NULL END as deleted_at
FROM public.canis c
WHERE c.proprietario IS NOT NULL  -- Obrigatório ter proprietário
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = c.proprietario)
ON CONFLICT DO NOTHING;

\echo 'Abrigos migrados: ' || (SELECT COUNT(*) FROM public.shelters);

-- ====================
-- 2. CRIAR MAPEAMENTO DE IDs (bigint -> uuid)
-- ====================
\echo ''
\echo '2. Criando mapeamento de IDs de abrigos...'

INSERT INTO shelter_id_mapping (old_id, new_id)
SELECT
    c.id as old_id,
    s.id as new_id
FROM public.canis c
JOIN public.shelters s ON s.owner_id = c.proprietario AND s.name = COALESCE(c.canil, 'Abrigo ' || c.id)
WHERE c.proprietario IS NOT NULL;

\echo 'Mapeamentos criados: ' || (SELECT COUNT(*) FROM shelter_id_mapping);

-- ====================
-- 3. CRIAR ABRIGO "DESCONHECIDO" PARA ÓRFÃOS
-- ====================
\echo ''
\echo '3. Criando abrigo "Desconhecido" para animais órfãos...'

-- Primeiro, encontrar um usuário admin para ser dono do abrigo desconhecido
DO $$
DECLARE
    admin_user_id uuid;
    unknown_shelter_id uuid;
BEGIN
    -- Pegar primeiro usuário admin ou shelter_owner
    SELECT id INTO admin_user_id
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE r.name IN ('admin', 'shelter_owner')
    LIMIT 1;

    -- Se não houver admin, pegar qualquer usuário
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.users LIMIT 1;
    END IF;

    -- Criar abrigo desconhecido
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.shelters (id, name, description, owner_id, is_active)
        VALUES (
            gen_random_uuid(),
            'Desconhecido',
            'Abrigo temporário para animais sem abrigo identificado',
            admin_user_id,
            false
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO unknown_shelter_id;

        -- Adicionar ao mapeamento com id = 0 (para referências NULL ou inválidas)
        INSERT INTO shelter_id_mapping (old_id, new_id)
        VALUES (0, unknown_shelter_id)
        ON CONFLICT (old_id) DO NOTHING;

        RAISE NOTICE 'Abrigo "Desconhecido" criado com sucesso';
    ELSE
        RAISE WARNING 'Não foi possível criar abrigo "Desconhecido" - nenhum usuário disponível';
    END IF;
END $$;

-- ====================
-- 4. VERIFICAÇÕES
-- ====================
\echo ''
\echo '4. Verificando migração de abrigos...'

-- Contar abrigos ativos vs inativos
\echo 'Abrigos ativos: ' || (SELECT COUNT(*) FROM public.shelters WHERE is_active = true AND deleted_at IS NULL);
\echo 'Abrigos inativos: ' || (SELECT COUNT(*) FROM public.shelters WHERE is_active = false OR deleted_at IS NOT NULL);

-- Verificar abrigos sem localização
\echo 'Abrigos sem localização: ' || (SELECT COUNT(*) FROM public.shelters WHERE location IS NULL);

-- Listar proprietários com múltiplos abrigos
\echo ''
\echo 'Proprietários com múltiplos abrigos:'
SELECT
    u.name as proprietario,
    u.email,
    COUNT(s.id) as total_abrigos
FROM public.shelters s
JOIN public.users u ON u.id = s.owner_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(s.id) > 1
ORDER BY COUNT(s.id) DESC;

-- ====================
-- 5. VERIFICAR ÓRFÃOS DO SCHEMA ANTIGO
-- ====================
\echo ''
\echo '5. Verificando abrigos sem migração...'

SELECT
    COUNT(*) as total_sem_migracao,
    COUNT(CASE WHEN proprietario IS NULL THEN 1 END) as sem_proprietario,
    COUNT(CASE WHEN excluido = true THEN 1 END) as excluidos
FROM public.canis c
WHERE NOT EXISTS (
    SELECT 1 FROM shelter_id_mapping m WHERE m.old_id = c.id
);

-- ====================
-- 6. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'shelters',
    (SELECT COUNT(*) FROM public.canis),
    (SELECT COUNT(*) FROM public.shelters WHERE name != 'Desconhecido'),
    (SELECT COUNT(*) FROM public.canis WHERE proprietario IS NULL OR excluido = true),
    'Abrigos migrados de canis. Mapeamento bigint->uuid criado. Abrigo "Desconhecido" criado para órfãos.'
);

\echo ''
\echo '=================================================='
\echo 'ABRIGOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total de abrigos: ' || (SELECT COUNT(*) FROM public.shelters);
\echo 'Mapeamentos criados: ' || (SELECT COUNT(*) FROM shelter_id_mapping);
\echo ''
\echo 'Próximo passo: Execute 08_migrate_animals.sql'
\echo '=================================================='
