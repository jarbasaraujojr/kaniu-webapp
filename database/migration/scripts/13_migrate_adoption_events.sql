-- =====================================================
-- Script 13: MIGRAR EVENTOS DE ADOÇÃO
-- =====================================================
-- Descrição: Consolida interessado_animal, pessoa, questionario, conexao
-- Tempo estimado: 3-5 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO EVENTOS DE ADOÇÃO'
\echo '=================================================='

-- ====================
-- 1. MIGRAR INTERESSADOS COM QUESTIONÁRIO
-- ====================
\echo ''
\echo '1. Migrando interessados com questionário...'

INSERT INTO public.adoption_events (
    id,
    animal_id,
    adopter_id,
    status,
    information,
    triggered_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    ia.animal as animal_id,
    -- Buscar usuário vinculado à pessoa
    COALESCE(
        p.usuario,
        -- Se não tem usuário, tentar pegar do owner do shelter do animal
        (SELECT s.owner_id FROM public.animals a
         JOIN public.shelters s ON s.id = a.shelter_id
         WHERE a.id = ia.animal
         LIMIT 1)
    ) as adopter_id,
    'application_submitted' as status,
    -- Serializar questionário completo em JSON
    jsonb_build_object(
        'pessoa', jsonb_build_object(
            'nome', p.nome,
            'nascimento', p.nascimento,
            'telefone', p.telefone,
            'email', p.email,
            'sexo', p.sexo,
            'renda_sm', p.renda_sm,
            'escolaridade', p.escolaridade,
            'profissao', p.profissao,
            'endereco', jsonb_build_object(
                'cep', p.end_cep,
                'uf', p.end_uf,
                'cidade', p.end_cidade,
                'bairro', p.end_bairro,
                'numero', p.end_numero,
                'complemento', p.end_complemento,
                'logradouro', p.end_logradouro
            )
        ),
        'questionario', jsonb_build_object(
            'profissao', q.profissao,
            'renda', q.renda,
            'endereco', q.endereco,
            'rede_social', q.rede_social,
            'moradia_tipo', q.moradia_tipo,
            'moradia_propria', q.moradia_propria,
            'moradores_quantidade', q.moradores_quantidade,
            'moradores_favoraveis', q.moradores_favoraveis,
            'moradores_alergia', q.moradores_alergia,
            'caes_qtd', q.caes_qtd,
            'gatos_qtd', q.gatos_qtd,
            'animais_castrados', q.animais_castrados,
            'animais_vacinados', q.animais_vacinados,
            'animais_falecimento', q.animais_falecimento,
            'janelas_teladas', q.janelas_teladas,
            'animal_dormir', q.animal_dormir,
            'animais_responsavel', q.animais_responsavel,
            'acesso_casa', q.acesso_casa,
            'acesso_rua', q.acesso_rua,
            'sozinho_horas', q.sozinho_horas,
            'passeios_mes', q.passeios_mes,
            'passeios', q.passeios,
            'racao_tipo', q.racao_tipo,
            'animal_incomodo', q.animal_incomodo,
            'outros_animais', q.outros_animais,
            'animais_permitidos', q.animais_permitidos,
            'concordancias', jsonb_build_object(
                'vacinar', q.vacinar_concorda,
                'castrar', q.castrar_concorda,
                'educar', q.educar_concorda,
                'passear', q.passear_concorda,
                'informar', q.informar_concorda,
                'buscar', q.buscar_concorda,
                'contribuir', q.contribuir_concorda
            )
        )
    )::text as information,
    -- Triggered by: owner do shelter ou o próprio usuário
    COALESCE(
        p.usuario,
        (SELECT s.owner_id FROM public.animals a
         JOIN public.shelters s ON s.id = a.shelter_id
         WHERE a.id = ia.animal
         LIMIT 1)
    ) as triggered_by,
    ia.data as created_at
FROM public.interessado_animal ia
JOIN public.questionario q ON q.id = ia.pessoa
LEFT JOIN public.pessoa p ON p.id = q.pessoa_id
WHERE ia.animal IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = ia.animal)
  -- Verificar se adopter_id é válido
  AND (
      p.usuario IS NOT NULL OR
      EXISTS (
          SELECT 1 FROM public.animals a
          JOIN public.shelters s ON s.id = a.shelter_id
          WHERE a.id = ia.animal
      )
  )
ON CONFLICT DO NOTHING;

\echo 'Interessados com questionário migrados: ' ||
    (SELECT COUNT(*) FROM public.adoption_events WHERE status = 'application_submitted');

-- ====================
-- 2. MIGRAR CONEXÕES (histórico de adoção)
-- ====================
\echo ''
\echo '2. Migrando conexões de adoção...'

INSERT INTO public.adoption_events (
    id,
    animal_id,
    adopter_id,
    status,
    information,
    triggered_by,
    created_at
)
SELECT
    gen_random_uuid() as id,
    c.animal as animal_id,
    -- Buscar usuário da pessoa
    COALESCE(
        p.usuario,
        (SELECT s.owner_id FROM public.animals a
         JOIN public.shelters s ON s.id = a.shelter_id
         WHERE a.id = c.animal
         LIMIT 1)
    ) as adopter_id,
    -- Determinar status baseado em se está encerrada
    CASE
        WHEN c.encerrada = true THEN 'adopted'
        ELSE 'under_review'
    END as status,
    -- Informação básica da pessoa
    CASE WHEN p.id IS NOT NULL THEN
        jsonb_build_object(
            'pessoa', jsonb_build_object(
                'nome', p.nome,
                'telefone', p.telefone,
                'email', p.email
            ),
            'encerrada', c.encerrada
        )::text
    ELSE NULL
    END as information,
    COALESCE(
        p.usuario,
        (SELECT s.owner_id FROM public.animals a
         JOIN public.shelters s ON s.id = a.shelter_id
         WHERE a.id = c.animal
         LIMIT 1)
    ) as triggered_by,
    c.data::timestamp as created_at
FROM public.conexao c
LEFT JOIN public.pessoa p ON p.id = c.pessoa
WHERE c.animal IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.animals a WHERE a.id = c.animal)
  -- Não duplicar se já existe evento para mesmo animal e pessoa
  AND NOT EXISTS (
      SELECT 1 FROM public.adoption_events ae
      WHERE ae.animal_id = c.animal
        AND ae.adopter_id = p.usuario
  )
ON CONFLICT DO NOTHING;

\echo 'Conexões de adoção migradas: ' ||
    (SELECT COUNT(*) FROM public.adoption_events WHERE status IN ('adopted', 'under_review'));

-- ====================
-- 3. VERIFICAÇÕES
-- ====================
\echo ''
\echo '3. Verificando migração de eventos de adoção...'

-- Total de eventos
\echo 'Total de eventos de adoção: ' || (SELECT COUNT(*) FROM public.adoption_events);

-- Eventos por status
\echo ''
\echo 'Eventos por status:'
SELECT
    status,
    COUNT(*) as total
FROM public.adoption_events
GROUP BY status
ORDER BY COUNT(*) DESC;

-- Animais com eventos de adoção
\echo ''
\echo 'Animais com eventos de adoção: ' || (SELECT COUNT(DISTINCT animal_id) FROM public.adoption_events);

-- Adotantes únicos
\echo 'Adotantes únicos: ' || (SELECT COUNT(DISTINCT adopter_id) FROM public.adoption_events);

-- Top 5 animais com mais interesse
\echo ''
\echo 'Top 5 animais com mais interesse:'
SELECT
    a.name as animal,
    COUNT(ae.id) as total_interessados,
    COUNT(CASE WHEN ae.status = 'adopted' THEN 1 END) as adotados
FROM public.adoption_events ae
JOIN public.animals a ON a.id = ae.animal_id
GROUP BY a.id, a.name
ORDER BY COUNT(ae.id) DESC
LIMIT 5;

-- Usuários que manifestaram interesse em múltiplos animais
\echo ''
\echo 'Top 5 usuários com mais interesses:'
SELECT
    u.name as usuario,
    u.email,
    COUNT(ae.id) as total_interesses
FROM public.adoption_events ae
JOIN public.users u ON u.id = ae.adopter_id
GROUP BY u.id, u.name, u.email
ORDER BY COUNT(ae.id) DESC
LIMIT 5;

-- ====================
-- 4. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'adoption_events',
    (SELECT COUNT(*) FROM public.interessado_animal) +
    (SELECT COUNT(*) FROM public.conexao),
    (SELECT COUNT(*) FROM public.adoption_events),
    'Eventos de adoção consolidados de: interessado_animal (com questionário completo), conexao (histórico). Questionários serializados em JSON.'
);

\echo ''
\echo '=================================================='
\echo 'EVENTOS DE ADOÇÃO MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.adoption_events);
\echo 'Applications: ' || (SELECT COUNT(*) FROM public.adoption_events WHERE status = 'application_submitted');
\echo 'Adotados: ' || (SELECT COUNT(*) FROM public.adoption_events WHERE status = 'adopted');
\echo 'Em análise: ' || (SELECT COUNT(*) FROM public.adoption_events WHERE status = 'under_review');
\echo ''
\echo 'Próximo passo: Execute 14_migrate_animal_events.sql'
\echo '=================================================='
