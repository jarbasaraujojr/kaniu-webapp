-- =====================================================
-- Script 17: LIMPEZA E FINALIZAÇÃO
-- =====================================================
-- Descrição: Remove tabelas temporárias e gera relatório final
-- Tempo estimado: < 1 minuto
-- =====================================================

\echo '=================================================='
\echo 'LIMPEZA E FINALIZAÇÃO'
\echo '=================================================='

-- ====================
-- 1. GERAR RELATÓRIO FINAL
-- ====================
\echo ''
\echo '1. Gerando relatório final de migração...'

-- Criar tabela permanente com estatísticas (opcional)
-- Descomente se quiser manter um histórico permanente
/*
CREATE TABLE IF NOT EXISTS public.migration_history (
    id serial PRIMARY KEY,
    migration_date timestamp DEFAULT now(),
    table_name varchar(100),
    old_count integer,
    new_count integer,
    skipped_count integer,
    error_count integer,
    notes text
);

INSERT INTO public.migration_history (table_name, old_count, new_count, skipped_count, error_count, notes)
SELECT table_name, old_count, new_count, skipped_count, error_count, notes
FROM migration_stats;
*/

\echo '=================================================='
\echo 'RELATÓRIO FINAL DE MIGRAÇÃO'
\echo '=================================================='
\echo ''

-- Resumo geral
SELECT
    'Data da Migração' as item,
    now()::text as valor
UNION ALL
SELECT
    'Total de tabelas migradas',
    COUNT(DISTINCT table_name)::text
FROM migration_stats
UNION ALL
SELECT
    'Total de registros na BD antiga',
    SUM(old_count)::text
FROM migration_stats
UNION ALL
SELECT
    'Total de registros na BD nova',
    SUM(new_count)::text
FROM migration_stats
UNION ALL
SELECT
    'Registros não migrados',
    SUM(skipped_count)::text
FROM migration_stats
UNION ALL
SELECT
    'Taxa de migração',
    ROUND(
        SUM(new_count) * 100.0 / NULLIF(SUM(old_count), 0),
        2
    )::text || '%'
FROM migration_stats
WHERE old_count > 0
UNION ALL
SELECT
    'Total de erros',
    COUNT(*)::text
FROM migration_errors;

\echo ''
\echo 'Detalhes por tabela:'
SELECT * FROM migration_stats ORDER BY table_name;

\echo ''
\echo 'Erros (se houver):'
SELECT
    error_type,
    COUNT(*) as total
FROM migration_errors
GROUP BY error_type
ORDER BY COUNT(*) DESC;

-- ====================
-- 2. SALVAR MAPEAMENTOS (OPCIONAL)
-- ====================
\echo ''
\echo '2. Salvando mapeamentos para referência futura...'

-- Você pode criar tabelas permanentes para manter os mapeamentos
-- se precisar fazer consultas cruzadas no futuro

/*
-- Descomentar se quiser manter os mapeamentos
CREATE TABLE IF NOT EXISTS public.migration_shelter_mapping AS
SELECT * FROM shelter_id_mapping;

CREATE TABLE IF NOT EXISTS public.migration_catalog_mapping AS
SELECT * FROM catalog_mappings;

CREATE TABLE IF NOT EXISTS public.migration_veterinarian_mapping AS
SELECT * FROM veterinarian_mapping;

\echo 'Mapeamentos salvos em tabelas permanentes';
*/

-- ====================
-- 3. REMOVER TABELAS TEMPORÁRIAS
-- ====================
\echo ''
\echo '3. Removendo tabelas temporárias...'

DROP TABLE IF EXISTS shelter_id_mapping;
\echo 'shelter_id_mapping removida';

DROP TABLE IF EXISTS catalog_mappings;
\echo 'catalog_mappings removida';

DROP TABLE IF EXISTS veterinarian_mapping;
\echo 'veterinarian_mapping removida';

DROP TABLE IF EXISTS clinic_mapping;
\echo 'clinic_mapping removida';

DROP TABLE IF EXISTS user_role_mapping;
\echo 'user_role_mapping removida';

-- Manter migration_stats e migration_errors por enquanto
-- para análise posterior se necessário
\echo ''
\echo 'NOTA: Tabelas migration_stats e migration_errors foram mantidas';
\echo 'para referência. Execute os comandos abaixo quando não forem mais necessárias:';
\echo '  DROP TABLE migration_stats;';
\echo '  DROP TABLE migration_errors;';

-- ====================
-- 4. VERIFICAÇÕES FINAIS
-- ====================
\echo ''
\echo '4. Verificações finais de integridade...'

-- Contar registros finais
\echo ''
\echo 'Contagem final de registros:'
SELECT 'roles' as tabela, COUNT(*) as registros FROM public.roles
UNION ALL SELECT 'catalogs', COUNT(*) FROM public.catalogs
UNION ALL SELECT 'users', COUNT(*) FROM public.users
UNION ALL SELECT 'shelters', COUNT(*) FROM public.shelters
UNION ALL SELECT 'animals', COUNT(*) FROM public.animals
UNION ALL SELECT 'animal_photos', COUNT(*) FROM public.animal_photos
UNION ALL SELECT 'animal_weights', COUNT(*) FROM public.animal_weights
UNION ALL SELECT 'documents', COUNT(*) FROM public.documents
UNION ALL SELECT 'animal_medical_records', COUNT(*) FROM public.animal_medical_records
UNION ALL SELECT 'adoption_events', COUNT(*) FROM public.adoption_events
UNION ALL SELECT 'animal_events', COUNT(*) FROM public.animal_events
UNION ALL SELECT 'favorites', COUNT(*) FROM public.favorites
UNION ALL SELECT 'reports', COUNT(*) FROM public.reports
UNION ALL SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
ORDER BY tabela;

-- ====================
-- 5. RECOMENDAÇÕES PÓS-MIGRAÇÃO
-- ====================
\echo ''
\echo '=================================================='
\echo 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!'
\echo '=================================================='
\echo ''
\echo 'PRÓXIMOS PASSOS RECOMENDADOS:'
\echo ''
\echo '1. BACKUP: Faça backup da base de dados nova'
\echo '   pg_dump -h <host> -U <user> -d <db_nova> -F c -f backup_pos_migracao.backup'
\echo ''
\echo '2. TESTES: Execute testes completos da aplicação'
\echo '   - Teste de login (todos os usuários precisam resetar senha)'
\echo '   - Teste de visualização de animais'
\echo '   - Teste de criação/edição de registros'
\echo '   - Teste de uploads de fotos'
\echo ''
\echo '3. USUÁRIOS: Notifique todos os usuários sobre reset de senha'
\echo '   - Todos devem receber email com link de reset'
\echo '   - Senha temporária: TempPassword123!'
\echo ''
\echo '4. MONITORAMENTO: Monitore logs de erro nos próximos dias'
\echo '   - Verifique se há queries falhando'
\echo '   - Verifique se dados estão sendo exibidos corretamente'
\echo ''
\echo '5. BASE ANTIGA: Mantenha base antiga em modo read-only por 90 dias'
\echo '   - Use como referência para dados históricos'
\echo '   - Permite comparação em caso de dúvidas'
\echo ''
\echo '6. PERFORMANCE: Analise e otimize índices'
\echo '   - Execute ANALYZE em todas as tabelas'
\echo '   - Considere criar índices adicionais baseado em uso'
\echo ''
\echo '=================================================='
\echo 'ESTATÍSTICAS FINAIS'
\echo '=================================================='

-- Exibir estatísticas finais
SELECT
    SUM(new_count) as total_registros_migrados,
    SUM(skipped_count) as total_registros_pulados,
    (SELECT COUNT(*) FROM migration_errors) as total_erros,
    ROUND(
        SUM(new_count) * 100.0 / NULLIF(SUM(old_count), 0),
        2
    ) as taxa_sucesso_percentual
FROM migration_stats;

\echo ''
\echo '=================================================='
\echo 'FIM DA MIGRAÇÃO'
\echo '=================================================='
