-- =====================================================
-- Script 06: MIGRAR USUÁRIOS
-- =====================================================
-- Descrição: Migra usuarios + pessoa para users
-- Tempo estimado: 2-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO USUÁRIOS'
\echo '=================================================='

-- Função para gerar senha temporária (hash bcrypt de "TempPassword123!")
-- IMPORTANTE: Todos os usuários precisarão resetar a senha
DO $$
DECLARE
    temp_password_hash TEXT := '$2a$10$rN8KqJ9Z3FvQ8L5xVX7zYeHGqWJZ5vQ8L5xVX7zYeHGqWJZ5vQ8L5'; -- Placeholder
BEGIN
    -- Esta é uma senha temporária que deve ser trocada
    -- Em produção, use: pgcrypto extension e crypt('TempPassword123!', gen_salt('bf'))
    RAISE NOTICE 'ATENÇÃO: Usuários serão criados com senha temporária';
    RAISE NOTICE 'Todos precisarão resetar a senha no primeiro acesso';
END $$;

-- ====================
-- 1. CRIAR MAPEAMENTO DE VETERINÁRIOS
-- ====================
\echo ''
\echo '1. Criando mapeamento de veterinários...'

INSERT INTO veterinarian_mapping (old_vet_id, vet_name, crmv, new_user_id)
SELECT
    vet_id,
    COALESCE(nome, 'Veterinário ' || SUBSTRING(vet_id::text, 1, 8)),
    crmv,
    usuario_id  -- Pode ser NULL se veterinário não for usuário
FROM public.veterinarios;

\echo 'Veterinários mapeados: ' || (SELECT COUNT(*) FROM veterinarian_mapping);

-- ====================
-- 2. CRIAR MAPEAMENTO DE CLÍNICAS
-- ====================
\echo ''
\echo '2. Criando mapeamento de clínicas...'

INSERT INTO clinic_mapping (old_clinic_name, clinic_data)
SELECT
    clinica,
    jsonb_build_object(
        'telefone', telefone,
        'endereco', endereco,
        'logo', logo
    )
FROM public.clinicas;

\echo 'Clínicas mapeadas: ' || (SELECT COUNT(*) FROM clinic_mapping);

-- ====================
-- 3. DETERMINAR ROLE PARA CADA USUÁRIO
-- ====================
\echo ''
\echo '3. Determinando roles dos usuários...'

-- Criar tabela temporária para armazenar o role_id de cada usuário
CREATE TEMPORARY TABLE user_role_mapping AS
SELECT DISTINCT
    u.user_id,
    CASE
        -- Proprietários de abrigos
        WHEN EXISTS (
            SELECT 1 FROM public.canis c WHERE c.proprietario = u.user_id
        ) THEN (SELECT id FROM public.roles WHERE name = 'shelter_owner')

        -- Membros admin de abrigos
        WHEN EXISTS (
            SELECT 1 FROM public.canis_membros cm
            WHERE cm.membro = u.user_id AND cm.admin = true
        ) THEN (SELECT id FROM public.roles WHERE name = 'shelter_owner')

        -- Veterinários
        WHEN EXISTS (
            SELECT 1 FROM public.veterinarios v WHERE v.usuario_id = u.user_id
        ) OR EXISTS (
            SELECT 1 FROM public.canis_membros cm
            WHERE cm.membro = u.user_id AND cm.vet = true
        ) THEN (SELECT id FROM public.roles WHERE name = 'veterinarian')

        -- Membros de equipe (não guest)
        WHEN EXISTS (
            SELECT 1 FROM public.canis_membros cm
            WHERE cm.membro = u.user_id AND cm.guest = false
        ) THEN (SELECT id FROM public.roles WHERE name = 'shelter_staff')

        -- Usuário regular (padrão)
        ELSE (SELECT id FROM public.roles WHERE name = 'user')
    END as role_id
FROM public.usuarios u;

\echo 'Roles determinadas para ' || (SELECT COUNT(*) FROM user_role_mapping) || ' usuários';

-- ====================
-- 4. MIGRAR USUÁRIOS
-- ====================
\echo ''
\echo '4. Migrando usuários para nova tabela...'

INSERT INTO public.users (
    id,
    name,
    email,
    password,
    phone,
    address,
    document_id,
    role_id,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    u.user_id,
    COALESCE(u.user_name, p.nome, 'Usuário ' || SUBSTRING(u.user_id::text, 1, 8)),
    u.user_email,
    -- Senha temporária - TODOS precisarão resetar
    '$2a$10$TempPasswordHashPlaceholder',
    p.telefone,
    -- Consolidar endereço em JSON
    CASE WHEN p.end_logradouro IS NOT NULL THEN
        jsonb_build_object(
            'cep', p.end_cep,
            'logradouro', p.end_logradouro,
            'numero', p.end_numero,
            'complemento', p.end_complemento,
            'bairro', p.end_bairro,
            'cidade', p.end_cidade,
            'uf', p.end_uf
        )
    ELSE NULL
    END as address,
    NULL as document_id,  -- Não há campo equivalente no schema antigo
    urm.role_id,
    u.created as created_at,
    u.created as updated_at,
    NULL as deleted_at
FROM public.usuarios u
LEFT JOIN public.pessoa p ON p.usuario = u.user_id
LEFT JOIN user_role_mapping urm ON urm.user_id = u.user_id
WHERE u.user_email IS NOT NULL
  AND u.user_email != ''
  AND urm.role_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    role_id = EXCLUDED.role_id;

\echo 'Usuários migrados: ' || (SELECT COUNT(*) FROM public.users);

-- ====================
-- 5. VERIFICAÇÕES
-- ====================
\echo ''
\echo '5. Verificando migração de usuários...'

-- Contar usuários por role
\echo 'Distribuição de usuários por role:'
SELECT
    r.name as role,
    COUNT(u.id) as total_usuarios
FROM public.users u
JOIN public.roles r ON r.id = u.role_id
GROUP BY r.name
ORDER BY COUNT(u.id) DESC;

-- Verificar usuários sem endereço
\echo ''
\echo 'Usuários sem endereço: ' || (SELECT COUNT(*) FROM public.users WHERE address IS NULL);

-- Verificar usuários sem telefone
\echo 'Usuários sem telefone: ' || (SELECT COUNT(*) FROM public.users WHERE phone IS NULL);

-- ====================
-- 6. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, skipped_count, notes)
VALUES (
    'users',
    (SELECT COUNT(*) FROM public.usuarios),
    (SELECT COUNT(*) FROM public.users),
    (SELECT COUNT(*) FROM public.usuarios WHERE user_email IS NULL OR user_email = ''),
    'Usuários migrados de usuarios + pessoa. Todos com senha temporária.'
);

\echo ''
\echo '=================================================='
\echo 'USUÁRIOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'IMPORTANTE: Todos os usuários foram criados com'
\echo 'senha temporária e precisarão resetar no primeiro'
\echo 'acesso ao sistema.'
\echo ''
\echo 'Próximo passo: Execute 07_migrate_shelters.sql'
\echo '=================================================='
