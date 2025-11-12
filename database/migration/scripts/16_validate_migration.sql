-- =====================================================
-- Script 16: VALIDAR MIGRAÇÃO
-- =====================================================
-- Descrição: Valida integridade e completude da migração
-- Tempo estimado: 2-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'VALIDANDO MIGRAÇÃO'
\echo '=================================================='

-- ====================
-- 1. COMPARAR CONTAGENS
-- ====================
\echo ''
\echo '1. Comparando contagens de registros...'
\echo '=================================================='

SELECT
    'Usuários' as tabela,
    (SELECT COUNT(*) FROM public.usuarios) as old_count,
    (SELECT COUNT(*) FROM public.users) as new_count,
    CASE
        WHEN (SELECT COUNT(*) FROM public.users) >= (SELECT COUNT(*) FROM public.usuarios WHERE user_email IS NOT NULL)
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END as status
UNION ALL
SELECT
    'Abrigos',
    (SELECT COUNT(*) FROM public.canis),
    (SELECT COUNT(*) FROM public.shelters WHERE name != 'Desconhecido'),
    CASE
        WHEN (SELECT COUNT(*) FROM public.shelters WHERE name != 'Desconhecido') >= (SELECT COUNT(*) FROM public.canis WHERE proprietario IS NOT NULL)
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'Animais',
    (SELECT COUNT(*) FROM public.animais),
    (SELECT COUNT(*) FROM public.animals),
    CASE
        WHEN (SELECT COUNT(*) FROM public.animals) = (SELECT COUNT(*) FROM public.animais)
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'Fotos',
    (SELECT COUNT(*) FROM public.animais WHERE foto IS NOT NULL AND foto != '') +
    (SELECT COUNT(*) FROM public.animais WHERE album IS NOT NULL AND album != ''),
    (SELECT COUNT(*) FROM public.animal_photos),
    'INFO'
UNION ALL
SELECT
    'Pesagens',
    (SELECT COUNT(*) FROM public.pesagens),
    (SELECT COUNT(*) FROM public.animal_weights),
    CASE
        WHEN (SELECT COUNT(*) FROM public.animal_weights) >= (SELECT COUNT(*) FROM public.pesagens)
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'Documentos',
    (SELECT COUNT(*) FROM public.arquivos WHERE apagado = false),
    (SELECT COUNT(*) FROM public.documents),
    CASE
        WHEN (SELECT COUNT(*) FROM public.documents) = (SELECT COUNT(*) FROM public.arquivos WHERE apagado = false)
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'Registros Médicos',
    (SELECT COUNT(*) FROM public.vacinacoes) +
    (SELECT COUNT(*) FROM public.imunizacao) +
    (SELECT COUNT(*) FROM public.anamneses_registros),
    (SELECT COUNT(*) FROM public.animal_medical_records),
    'INFO'
UNION ALL
SELECT
    'Eventos Adoção',
    (SELECT COUNT(*) FROM public.interessado_animal) +
    (SELECT COUNT(*) FROM public.conexao),
    (SELECT COUNT(*) FROM public.adoption_events),
    'INFO'
UNION ALL
SELECT
    'Eventos Animais',
    (SELECT COUNT(*) FROM public.registros),
    (SELECT COUNT(*) FROM public.animal_events),
    CASE
        WHEN (SELECT COUNT(*) FROM public.animal_events) >= (SELECT COUNT(*) FROM public.registros) * 0.9
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'Favoritos',
    (SELECT COALESCE(SUM(array_length(animais, 1)), 0) FROM public.pessoa_likes WHERE animais IS NOT NULL),
    (SELECT COUNT(*) FROM public.favorites),
    'INFO';

-- ====================
-- 2. VERIFICAR INTEGRIDADE REFERENCIAL
-- ====================
\echo ''
\echo '2. Verificando integridade referencial...'
\echo '=================================================='

-- Animais órfãos (sem shelter)
\echo 'Animais sem shelter:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os animais têm shelter'
        ELSE 'ERRO: ' || COUNT(*) || ' animais sem shelter'
    END as resultado
FROM public.animals a
WHERE NOT EXISTS (SELECT 1 FROM public.shelters s WHERE s.id = a.shelter_id);

-- Shelters órfãos (sem owner)
\echo ''
\echo 'Shelters sem owner:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os shelters têm owner'
        ELSE 'ERRO: ' || COUNT(*) || ' shelters sem owner'
    END as resultado
FROM public.shelters s
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = s.owner_id);

-- Users órfãos (sem role)
\echo ''
\echo 'Users sem role:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os usuários têm role'
        ELSE 'ERRO: ' || COUNT(*) || ' usuários sem role'
    END as resultado
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.id = u.role_id);

-- Fotos órfãs (sem animal)
\echo ''
\echo 'Fotos sem animal:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todas as fotos têm animal'
        ELSE 'ERRO: ' || COUNT(*) || ' fotos sem animal'
    END as resultado
FROM public.animal_photos ap
WHERE NOT EXISTS (SELECT 1 FROM public.animals a WHERE a.id = ap.animal_id);

-- Documentos órfãos
\echo ''
\echo 'Documentos sem animal:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os documentos têm animal'
        ELSE 'ERRO: ' || COUNT(*) || ' documentos sem animal'
    END as resultado
FROM public.documents d
WHERE NOT EXISTS (SELECT 1 FROM public.animals a WHERE a.id = d.animal_id);

-- ====================
-- 3. VERIFICAR DADOS CRÍTICOS
-- ====================
\echo ''
\echo '3. Verificando dados críticos...'
\echo '=================================================='

-- Animais sem nome
\echo 'Animais sem nome válido:'
SELECT
    COUNT(*) as total,
    CASE
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'INFO: ' || COUNT(*) || ' animais com nome padrão "Sem nome"'
    END as status
FROM public.animals
WHERE name = 'Sem nome';

-- Users sem email
\echo ''
\echo 'Users sem email:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os usuários têm email'
        ELSE 'ERRO: ' || COUNT(*) || ' usuários sem email'
    END as resultado
FROM public.users
WHERE email IS NULL OR email = '';

-- Animais sem appearance
\echo ''
\echo 'Animais sem dados de aparência:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os animais têm appearance'
        ELSE 'ERRO: ' || COUNT(*) || ' animais sem appearance'
    END as resultado
FROM public.animals
WHERE appearance IS NULL;

-- Animais sem status
\echo ''
\echo 'Animais sem status:'
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Todos os animais têm status'
        ELSE 'ATENÇÃO: ' || COUNT(*) || ' animais sem status'
    END as resultado
FROM public.animals
WHERE status_id IS NULL;

-- ====================
-- 4. ESTATÍSTICAS GERAIS
-- ====================
\echo ''
\echo '4. Estatísticas gerais da migração...'
\echo '=================================================='

SELECT * FROM migration_stats ORDER BY table_name;

-- ====================
-- 5. ERROS REGISTRADOS
-- ====================
\echo ''
\echo '5. Erros registrados durante migração...'
\echo '=================================================='

SELECT
    COUNT(*) as total_erros,
    CASE
        WHEN COUNT(*) = 0 THEN 'OK: Nenhum erro crítico'
        ELSE 'ATENÇÃO: ' || COUNT(*) || ' erros registrados'
    END as status
FROM migration_errors;

\echo ''
\echo 'Erros por tipo:'
SELECT
    error_type,
    COUNT(*) as total
FROM migration_errors
GROUP BY error_type
ORDER BY COUNT(*) DESC;

\echo ''
\echo 'Primeiros 10 erros:'
SELECT
    script_name,
    error_type,
    error_message,
    affected_record_id
FROM migration_errors
ORDER BY occurred_at
LIMIT 10;

-- ====================
-- 6. VERIFICAÇÕES DE QUALIDADE
-- ====================
\echo ''
\echo '6. Verificações de qualidade...'
\echo '=================================================='

-- Distribuição por espécie
\echo 'Distribuição de animais por espécie:'
SELECT
    c.name as especie,
    COUNT(a.id) as total,
    ROUND(COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM public.animals), 2) as percentual
FROM public.animals a
LEFT JOIN public.catalogs c ON c.id = a.species_id
GROUP BY c.name
ORDER BY COUNT(a.id) DESC
LIMIT 5;

-- Distribuição por status
\echo ''
\echo 'Distribuição de animais por status:'
SELECT
    c.name as status,
    COUNT(a.id) as total,
    ROUND(COUNT(a.id) * 100.0 / (SELECT COUNT(*) FROM public.animals), 2) as percentual
FROM public.animals a
LEFT JOIN public.catalogs c ON c.id = a.status_id
GROUP BY c.name
ORDER BY COUNT(a.id) DESC;

-- Abrigos com mais animais
\echo ''
\echo 'Top 5 abrigos com mais animais:'
SELECT
    s.name as abrigo,
    COUNT(a.id) as total_animais,
    COUNT(CASE WHEN a.deleted_at IS NULL THEN 1 END) as ativos
FROM public.shelters s
JOIN public.animals a ON a.shelter_id = s.id
GROUP BY s.id, s.name
ORDER BY COUNT(a.id) DESC
LIMIT 5;

-- ====================
-- 7. RESUMO FINAL
-- ====================
\echo ''
\echo '=================================================='
\echo 'RESUMO DA VALIDAÇÃO'
\echo '=================================================='

SELECT
    'Total de tabelas migradas' as metrica,
    COUNT(DISTINCT table_name)::text as valor
FROM migration_stats
UNION ALL
SELECT
    'Total de registros migrados',
    SUM(new_count)::text
FROM migration_stats
UNION ALL
SELECT
    'Registros não migrados (skipped)',
    SUM(skipped_count)::text
FROM migration_stats
UNION ALL
SELECT
    'Taxa de sucesso',
    ROUND(
        SUM(new_count) * 100.0 /
        NULLIF(SUM(old_count), 0),
        2
    )::text || '%'
FROM migration_stats
WHERE old_count > 0;

\echo ''
\echo '=================================================='
\echo 'VALIDAÇÃO CONCLUÍDA'
\echo ''
\echo 'Revise os resultados acima cuidadosamente.'
\echo 'Se houver ERROs críticos, investigue antes de'
\echo 'prosseguir para produção.'
\echo ''
\echo 'Próximo passo: Execute 17_cleanup.sql'
\echo '=================================================='
