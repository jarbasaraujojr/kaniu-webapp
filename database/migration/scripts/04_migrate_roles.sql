-- =====================================================
-- Script 04: MIGRAR ROLES (Papéis de Usuário)
-- =====================================================
-- Descrição: Cria roles padrão no novo sistema
-- Tempo estimado: < 1 minuto
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO ROLES'
\echo '=================================================='

-- Inserir roles padrão
INSERT INTO public.roles (name, description, permissions) VALUES
    ('admin', 'Administrador do Sistema', '{"all": true}'::jsonb),
    ('shelter_owner', 'Proprietário de Abrigo', '{"shelter": "all", "animals": "all", "users": "view", "reports": "all"}'::jsonb),
    ('shelter_staff', 'Equipe do Abrigo', '{"shelter": "view", "animals": "all", "medical_records": "all"}'::jsonb),
    ('veterinarian', 'Veterinário', '{"animals": "view", "medical_records": "all"}'::jsonb),
    ('user', 'Usuário Regular', '{"animals": "view", "favorites": "all", "adoption": "apply"}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

\echo 'Roles criadas com sucesso'

-- Verificar roles criadas
SELECT id, name, description FROM public.roles ORDER BY id;

-- Registrar estatísticas
INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES ('roles', 0, (SELECT COUNT(*) FROM public.roles), 'Roles criadas do zero no novo sistema');

\echo ''
\echo '=================================================='
\echo 'ROLES MIGRADAS COM SUCESSO'
\echo 'Próximo passo: Execute 05_migrate_catalogs.sql'
\echo '=================================================='
