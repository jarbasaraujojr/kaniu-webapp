-- =====================================================
-- Script 03: ANÁLISE DE QUALIDADE DE DADOS
-- =====================================================
-- Descrição: Verifica qualidade dos dados antes da migração
-- Tempo estimado: 2-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'ANÁLISE DE QUALIDADE DE DADOS'
\echo '=================================================='

\echo ''
\echo '1. VERIFICANDO REGISTROS ÓRFÃOS (Foreign Keys inválidas)'
\echo '---------------------------------------------------'

-- Animais sem abrigo válido
\echo 'Animais sem abrigo válido:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Serão associados a abrigo "Desconhecido"'
            ELSE 'OK'
       END as status
FROM public.animais a
LEFT JOIN public.canis c ON a.canil = c.id
WHERE a.canil IS NOT NULL AND c.id IS NULL;

-- Animais com espécie inválida
\echo 'Animais com espécie inválida:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Serão marcados como espécie "Desconhecida"'
            ELSE 'OK'
       END as status
FROM public.animais a
LEFT JOIN public.especies e ON a.especie = e.especie
WHERE a.especie IS NOT NULL AND a.especie != '' AND e.especie IS NULL;

-- Animais com raça inválida
\echo 'Animais com raça inválida:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Serão marcados como raça "Desconhecida"'
            ELSE 'OK'
       END as status
FROM public.animais a
LEFT JOIN public.racas r ON a.raça = r.raca
WHERE a.raça IS NOT NULL AND a.raça != '' AND r.raca IS NULL;

-- Usuários sem registro em auth.users
\echo 'Usuários sem registro em auth.users:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Usuários serão criados com senha temporária'
            ELSE 'OK'
       END as status
FROM public.usuarios u
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.user_id);

\echo ''
\echo '2. VERIFICANDO DUPLICATAS'
\echo '---------------------------------------------------'

-- Emails duplicados em usuários
\echo 'Emails duplicados em usuários:'
SELECT user_email, COUNT(*) as occurrences
FROM public.usuarios
WHERE user_email IS NOT NULL AND user_email != ''
GROUP BY user_email
HAVING COUNT(*) > 1;

-- Nomes de abrigos duplicados
\echo 'Nomes de abrigos duplicados:'
SELECT canil, COUNT(*) as occurrences
FROM public.canis
WHERE canil IS NOT NULL AND canil != ''
GROUP BY canil
HAVING COUNT(*) > 1;

\echo ''
\echo '3. VERIFICANDO CAMPOS OBRIGATÓRIOS VAZIOS'
\echo '---------------------------------------------------'

-- Animais sem nome
\echo 'Animais sem nome:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Serão nomeados como "Sem nome"'
            ELSE 'OK'
       END as status
FROM public.animais
WHERE nome IS NULL OR nome = '';

-- Usuários sem email
\echo 'Usuários sem email:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ERRO: Usuários sem email serão ignorados'
            ELSE 'OK'
       END as status
FROM public.usuarios
WHERE user_email IS NULL OR user_email = '';

-- Abrigos sem proprietário
\echo 'Abrigos sem proprietário:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ERRO: Abrigos sem proprietário serão ignorados'
            ELSE 'OK'
       END as status
FROM public.canis
WHERE proprietario IS NULL;

\echo ''
\echo '4. VERIFICANDO CONSISTÊNCIA DE DADOS'
\echo '---------------------------------------------------'

-- Animais com múltiplos status booleanos ativos
\echo 'Animais com múltiplos status conflitantes:'
SELECT COUNT(*) as count
FROM public.animais
WHERE (adotado::int + falecido::int + desaparecido::int) > 1;

-- Pesagens com peso zero ou negativo
\echo 'Pesagens com peso inválido:'
SELECT COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Pesagens inválidas serão ignoradas'
            ELSE 'OK'
       END as status
FROM public.pesagens
WHERE peso <= 0 OR peso IS NULL;

-- Arquivos marcados como apagados
\echo 'Documentos marcados como apagados (não migrados):'
SELECT COUNT(*) as count
FROM public.arquivos
WHERE apagado = true;

\echo ''
\echo '5. ESTATÍSTICAS GERAIS'
\echo '---------------------------------------------------'

-- Total de registros por tabela principal
SELECT
    'Total Animais' as metrica,
    COUNT(*) as valor
FROM public.animais
UNION ALL
SELECT
    'Animais Disponíveis',
    COUNT(*)
FROM public.animais
WHERE disponivel = true
UNION ALL
SELECT
    'Animais Adotados',
    COUNT(*)
FROM public.animais
WHERE adotado = true
UNION ALL
SELECT
    'Animais Falecidos',
    COUNT(*)
FROM public.animais
WHERE falecido = true
UNION ALL
SELECT
    'Total Usuários',
    COUNT(*)
FROM public.usuarios
UNION ALL
SELECT
    'Total Abrigos',
    COUNT(*)
FROM public.canis
UNION ALL
SELECT
    'Total Fotos (foto)',
    COUNT(*)
FROM public.animais
WHERE foto IS NOT NULL AND foto != ''
UNION ALL
SELECT
    'Total Álbuns (album)',
    COUNT(*)
FROM public.animais
WHERE album IS NOT NULL AND album != ''
UNION ALL
SELECT
    'Total Pesagens',
    COUNT(*)
FROM public.pesagens
UNION ALL
SELECT
    'Total Vacinações',
    COUNT(*)
FROM public.vacinacoes
UNION ALL
SELECT
    'Total Imunizações',
    COUNT(*)
FROM public.imunizacao
UNION ALL
SELECT
    'Total Documentos',
    COUNT(*)
FROM public.arquivos
WHERE apagado = false
UNION ALL
SELECT
    'Total Registros Médicos',
    COUNT(*)
FROM public.registros
UNION ALL
SELECT
    'Total Interessados',
    COUNT(*)
FROM public.interessado_animal
UNION ALL
SELECT
    'Total Conexões Adoção',
    COUNT(*)
FROM public.conexao
UNION ALL
SELECT
    'Total Favoritos',
    COUNT(*)
FROM public.pessoa_likes
WHERE animais IS NOT NULL;

\echo ''
\echo '6. ANÁLISE DE CATÁLOGOS'
\echo '---------------------------------------------------'

-- Espécies únicas
\echo 'Espécies cadastradas:'
SELECT COUNT(DISTINCT especie) as count FROM public.especies WHERE canil_id IS NULL;

-- Raças únicas
\echo 'Raças cadastradas (globais):'
SELECT COUNT(DISTINCT raca) as count FROM public.racas WHERE canil_id IS NULL;

-- Cores únicas
\echo 'Cores cadastradas:'
SELECT COUNT(DISTINCT cor) as count FROM public.cores WHERE canil_id IS NULL;

-- Portes únicos
\echo 'Portes cadastrados:'
SELECT COUNT(DISTINCT porte) as count FROM public.portes;

\echo ''
\echo '=================================================='
\echo 'ANÁLISE DE QUALIDADE CONCLUÍDA'
\echo 'Revise os resultados antes de prosseguir'
\echo 'Próximo passo: Execute 04_migrate_roles.sql'
\echo '=================================================='
