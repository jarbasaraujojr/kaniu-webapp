-- =====================================================
-- SCRIPT DE ROLLBACK COMPLETO
-- =====================================================
-- ATENÇÃO: Este script APAGA TODOS OS DADOS MIGRADOS
-- Use apenas se a migração falhou e precisa recomeçar
-- =====================================================

\echo '=================================================='
\echo 'ATENÇÃO: SCRIPT DE ROLLBACK'
\echo '=================================================='
\echo ''
\echo 'Este script irá APAGAR todos os dados migrados.'
\echo 'Use apenas se:'
\echo '  - A migração falhou criticamente'
\echo '  - Você precisa recomeçar do zero'
\echo '  - Você tem BACKUP da base de dados'
\echo ''
\echo 'Aguardando 10 segundos antes de continuar...'
\echo 'Pressione Ctrl+C para cancelar'
\echo ''

-- Dar tempo para cancelar
\! timeout /t 10 /nobreak > nul 2>&1 || sleep 10

\echo '=================================================='
\echo 'INICIANDO ROLLBACK...'
\echo '=================================================='

-- ====================
-- 1. DESABILITAR CONSTRAINTS
-- ====================
\echo ''
\echo '1. Desabilitando constraints temporariamente...'

SET session_replication_role = replica;

-- ====================
-- 2. DELETAR DADOS MIGRADOS
-- ====================
\echo ''
\echo '2. Deletando dados das tabelas na ordem reversa...'

-- Ordem inversa para respeitar foreign keys
\echo 'Deletando audit_logs...'
DELETE FROM public.audit_logs;

\echo 'Deletando reports...'
DELETE FROM public.reports;

\echo 'Deletando favorites...'
DELETE FROM public.favorites;

\echo 'Deletando animal_events...'
DELETE FROM public.animal_events;

\echo 'Deletando adoption_events...'
DELETE FROM public.adoption_events;

\echo 'Deletando animal_medical_records...'
DELETE FROM public.animal_medical_records;

\echo 'Deletando documents...'
DELETE FROM public.documents;

\echo 'Deletando animal_weights...'
DELETE FROM public.animal_weights;

\echo 'Deletando animal_photos...'
DELETE FROM public.animal_photos;

\echo 'Deletando animals...'
DELETE FROM public.animals;

\echo 'Deletando shelters...'
DELETE FROM public.shelters;

\echo 'Deletando users...'
DELETE FROM public.users;

\echo 'Deletando catalogs...'
DELETE FROM public.catalogs;

\echo 'Deletando roles...'
DELETE FROM public.roles;

-- ====================
-- 3. RESETAR SEQUENCES
-- ====================
\echo ''
\echo '3. Resetando sequences...'

ALTER SEQUENCE IF EXISTS public.roles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.catalogs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.animal_weights_id_seq RESTART WITH 1;

-- ====================
-- 4. REABILITAR CONSTRAINTS
-- ====================
\echo ''
\echo '4. Reabilitando constraints...'

SET session_replication_role = DEFAULT;

-- ====================
-- 5. VACUUM E ANALYZE
-- ====================
\echo ''
\echo '5. Limpando e analisando tabelas...'

VACUUM FULL public.roles;
VACUUM FULL public.catalogs;
VACUUM FULL public.users;
VACUUM FULL public.shelters;
VACUUM FULL public.animals;
VACUUM FULL public.animal_photos;
VACUUM FULL public.animal_weights;
VACUUM FULL public.documents;
VACUUM FULL public.animal_medical_records;
VACUUM FULL public.adoption_events;
VACUUM FULL public.animal_events;
VACUUM FULL public.favorites;
VACUUM FULL public.reports;
VACUUM FULL public.audit_logs;

ANALYZE public.roles;
ANALYZE public.catalogs;
ANALYZE public.users;
ANALYZE public.shelters;
ANALYZE public.animals;
ANALYZE public.animal_photos;
ANALYZE public.animal_weights;
ANALYZE public.documents;
ANALYZE public.animal_medical_records;
ANALYZE public.adoption_events;
ANALYZE public.animal_events;
ANALYZE public.favorites;
ANALYZE public.reports;
ANALYZE public.audit_logs;

-- ====================
-- 6. LIMPAR TABELAS TEMPORÁRIAS
-- ====================
\echo ''
\echo '6. Limpando tabelas temporárias...'

DROP TABLE IF EXISTS migration_stats;
DROP TABLE IF EXISTS migration_errors;
DROP TABLE IF EXISTS migration_history;
DROP TABLE IF EXISTS migration_shelter_mapping;
DROP TABLE IF EXISTS migration_catalog_mapping;
DROP TABLE IF EXISTS migration_veterinarian_mapping;

-- ====================
-- 7. VERIFICAÇÃO
-- ====================
\echo ''
\echo '7. Verificando limpeza...'

SELECT
    'roles' as tabela,
    COUNT(*) as registros_restantes
FROM public.roles
UNION ALL
SELECT 'catalogs', COUNT(*) FROM public.catalogs
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'shelters', COUNT(*) FROM public.shelters
UNION ALL
SELECT 'animals', COUNT(*) FROM public.animals
UNION ALL
SELECT 'animal_photos', COUNT(*) FROM public.animal_photos
UNION ALL
SELECT 'animal_weights', COUNT(*) FROM public.animal_weights
UNION ALL
SELECT 'documents', COUNT(*) FROM public.documents
UNION ALL
SELECT 'animal_medical_records', COUNT(*) FROM public.animal_medical_records
UNION ALL
SELECT 'adoption_events', COUNT(*) FROM public.adoption_events
UNION ALL
SELECT 'animal_events', COUNT(*) FROM public.animal_events
UNION ALL
SELECT 'favorites', COUNT(*) FROM public.favorites
ORDER BY tabela;

\echo ''
\echo '=================================================='
\echo 'ROLLBACK CONCLUÍDO'
\echo '=================================================='
\echo ''
\echo 'Todas as tabelas foram esvaziadas.'
\echo 'Você pode agora:'
\echo '  1. Restaurar backup se necessário'
\echo '  2. Executar a migração novamente desde o início'
\echo '  3. Investigar e corrigir problemas da migração anterior'
\echo ''
\echo '=================================================='
