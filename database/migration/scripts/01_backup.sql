-- =====================================================
-- Script 01: BACKUP DA BASE DE DADOS ANTIGA
-- =====================================================
-- Descrição: Cria backup completo da base antiga antes da migração
-- Tempo estimado: Varia conforme tamanho (geralmente 5-15 min)
-- =====================================================

-- IMPORTANTE: Execute este comando via pg_dump no terminal, não diretamente no PostgreSQL
--
-- Comando para executar:
-- pg_dump -h <host> -U <usuario> -d <database_antiga> -F c -b -v -f backup_kaniu_antiga_$(date +%Y%m%d_%H%M%S).backup
--
-- Exemplo:
-- pg_dump -h localhost -U postgres -d kaniu_old -F c -b -v -f backup_kaniu_antiga_20250112_120000.backup
--
-- Parâmetros:
-- -F c   : Formato custom (comprimido)
-- -b     : Incluir large objects
-- -v     : Modo verbose
-- -f     : Arquivo de saída

-- Verificação do backup (após criação):
-- pg_restore --list backup_kaniu_antiga_*.backup | head -50

-- ALTERNATIVA: Backup via SQL (menos recomendado, mas funciona dentro do PostgreSQL)
-- Não é possível fazer via SQL direto, mas podemos validar os dados antes:

\echo '=================================================='
\echo 'VALIDAÇÃO DOS DADOS ANTES DO BACKUP'
\echo '=================================================='

-- Contar registros em cada tabela principal
SELECT 'animais' as tabela, COUNT(*) as registros FROM public.animais
UNION ALL
SELECT 'usuarios', COUNT(*) FROM public.usuarios
UNION ALL
SELECT 'canis', COUNT(*) FROM public.canis
UNION ALL
SELECT 'pesagens', COUNT(*) FROM public.pesagens
UNION ALL
SELECT 'vacinacoes', COUNT(*) FROM public.vacinacoes
UNION ALL
SELECT 'imunizacao', COUNT(*) FROM public.imunizacao
UNION ALL
SELECT 'arquivos', COUNT(*) FROM public.arquivos WHERE apagado = false
UNION ALL
SELECT 'registros', COUNT(*) FROM public.registros
UNION ALL
SELECT 'interessado_animal', COUNT(*) FROM public.interessado_animal
UNION ALL
SELECT 'conexao', COUNT(*) FROM public.conexao
UNION ALL
SELECT 'pessoa', COUNT(*) FROM public.pessoa
UNION ALL
SELECT 'questionario', COUNT(*) FROM public.questionario
UNION ALL
SELECT 'pessoa_likes', COUNT(*) FROM public.pessoa_likes
UNION ALL
SELECT 'anamneses_registros', COUNT(*) FROM public.anamneses_registros
ORDER BY tabela;

\echo ''
\echo '=================================================='
\echo 'BACKUP CRIADO COM SUCESSO'
\echo 'Próximo passo: Execute 02_create_mapping_tables.sql'
\echo '=================================================='
