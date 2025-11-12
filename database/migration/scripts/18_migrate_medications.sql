-- =====================================================
-- Script 18: MIGRAR MEDICAMENTOS
-- =====================================================
-- Descrição: Cria tabelas e migra cadastro de medicamentos
-- Tempo estimado: 1-2 minutos
-- =====================================================

\echo '=================================================='
\echo 'MIGRANDO MEDICAMENTOS'
\echo '=================================================='

-- ====================
-- 1. CRIAR TABELA medications (se não existir)
-- ====================
\echo ''
\echo '1. Criando tabela medications...'

CREATE TABLE IF NOT EXISTS public.medications (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name character varying(200) NOT NULL,
    shelter_id uuid,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp(6) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medications_shelter_id_fkey FOREIGN KEY (shelter_id)
        REFERENCES public.shelters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_medications_shelter_id ON public.medications(shelter_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON public.medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON public.medications(is_active);

\echo 'Tabela medications criada'

-- ====================
-- 2. MIGRAR MEDICAMENTOS GLOBAIS
-- ====================
\echo ''
\echo '2. Migrando medicamentos globais (sem abrigo específico)...'

INSERT INTO public.medications (name, shelter_id, is_active, created_at)
SELECT
    m.nome as name,
    NULL as shelter_id,  -- Medicamentos globais
    true as is_active,
    now() as created_at
FROM public.medicamento m
WHERE m.canil_id IS NULL
  AND m.nome IS NOT NULL
  AND TRIM(m.nome) != ''
ON CONFLICT DO NOTHING;

\echo 'Medicamentos globais migrados: ' ||
    (SELECT COUNT(*) FROM public.medications WHERE shelter_id IS NULL);

-- ====================
-- 3. MIGRAR MEDICAMENTOS ESPECÍFICOS DE ABRIGOS
-- ====================
\echo ''
\echo '3. Migrando medicamentos específicos de abrigos...'

INSERT INTO public.medications (name, shelter_id, is_active, created_at)
SELECT
    m.nome as name,
    (SELECT new_id FROM shelter_id_mapping WHERE old_id = m.canil_id) as shelter_id,
    true as is_active,
    now() as created_at
FROM public.medicamento m
WHERE m.canil_id IS NOT NULL
  AND m.nome IS NOT NULL
  AND TRIM(m.nome) != ''
  -- Verificar se shelter existe
  AND EXISTS (SELECT 1 FROM shelter_id_mapping WHERE old_id = m.canil_id)
ON CONFLICT DO NOTHING;

\echo 'Medicamentos de abrigos migrados: ' ||
    (SELECT COUNT(*) FROM public.medications WHERE shelter_id IS NOT NULL);

-- ====================
-- 4. CRIAR TABELA DE MAPEAMENTO
-- ====================
\echo ''
\echo '4. Criando tabela de mapeamento de medicamentos...'

CREATE TEMPORARY TABLE medication_mapping AS
SELECT
    m_old.id as old_id,
    m_new.id as new_id,
    m_old.nome as name
FROM public.medicamento m_old
LEFT JOIN public.medications m_new ON m_new.name = m_old.nome
    AND (
        (m_old.canil_id IS NULL AND m_new.shelter_id IS NULL) OR
        (m_new.shelter_id = (SELECT new_id FROM shelter_id_mapping WHERE old_id = m_old.canil_id))
    )
WHERE m_new.id IS NOT NULL;

CREATE INDEX idx_medication_mapping_old ON medication_mapping(old_id);
CREATE INDEX idx_medication_mapping_new ON medication_mapping(new_id);

\echo 'Mapeamentos criados: ' || (SELECT COUNT(*) FROM medication_mapping);

-- ====================
-- 5. CRIAR CATÁLOGO DE VIAS DE ADMINISTRAÇÃO
-- ====================
\echo ''
\echo '5. Criando catálogo de vias de administração...'

-- Inserir vias comuns se não existirem
INSERT INTO public.catalogs (category, name, description, is_active) VALUES
    ('medication_route', 'oral', 'Via oral - por boca', true),
    ('medication_route', 'IV', 'Intravenosa - na veia', true),
    ('medication_route', 'IM', 'Intramuscular - no músculo', true),
    ('medication_route', 'SC', 'Subcutânea - sob a pele', true),
    ('medication_route', 'topical', 'Tópica - na pele', true),
    ('medication_route', 'ocular', 'Ocular - nos olhos', true),
    ('medication_route', 'otic', 'Ótica - nos ouvidos', true),
    ('medication_route', 'nasal', 'Nasal - no nariz', true),
    ('medication_route', 'rectal', 'Retal - via reto', true)
ON CONFLICT (category, name) DO NOTHING;

-- Migrar vias customizadas do schema antigo
INSERT INTO public.catalogs (category, name, description, is_active)
SELECT
    'medication_route' as category,
    mv.id as name,
    NULL as description,
    true as is_active
FROM public.medicamento_via mv
WHERE mv.id IS NOT NULL
  AND TRIM(mv.id) != ''
ON CONFLICT (category, name) DO NOTHING;

\echo 'Vias de administração cadastradas: ' ||
    (SELECT COUNT(*) FROM public.catalogs WHERE category = 'medication_route');

-- ====================
-- 6. VERIFICAÇÕES
-- ====================
\echo ''
\echo '6. Verificando migração de medicamentos...'

-- Total de medicamentos
\echo 'Total de medicamentos na base nova: ' || (SELECT COUNT(*) FROM public.medications);
\echo 'Total de medicamentos na base antiga: ' || (SELECT COUNT(*) FROM public.medicamento);

-- Medicamentos por tipo
\echo ''
\echo 'Medicamentos por tipo:'
SELECT
    CASE WHEN shelter_id IS NULL THEN 'Global' ELSE 'Específico de Abrigo' END as tipo,
    COUNT(*) as total
FROM public.medications
GROUP BY (shelter_id IS NULL)
ORDER BY COUNT(*) DESC;

-- Top 10 medicamentos
\echo ''
\echo 'Top 10 medicamentos cadastrados:'
SELECT
    m.name as medicamento,
    CASE WHEN m.shelter_id IS NULL THEN 'Global' ELSE s.name END as abrigo,
    m.is_active as ativo
FROM public.medications m
LEFT JOIN public.shelters s ON s.id = m.shelter_id
ORDER BY m.id
LIMIT 10;

-- Medicamentos sem mapeamento
\echo ''
\echo 'Medicamentos sem mapeamento (verificar):' ||
    (SELECT COUNT(*) FROM public.medicamento m
     WHERE NOT EXISTS (SELECT 1 FROM medication_mapping mm WHERE mm.old_id = m.id));

-- ====================
-- 7. REGISTRAR ESTATÍSTICAS
-- ====================

INSERT INTO migration_stats (table_name, old_count, new_count, notes)
VALUES (
    'medications',
    (SELECT COUNT(*) FROM public.medicamento),
    (SELECT COUNT(*) FROM public.medications),
    'Medicamentos migrados. Globais (sem abrigo) e específicos de abrigos preservados.'
);

\echo ''
\echo '=================================================='
\echo 'MEDICAMENTOS MIGRADOS COM SUCESSO'
\echo ''
\echo 'Total: ' || (SELECT COUNT(*) FROM public.medications);
\echo 'Globais: ' || (SELECT COUNT(*) FROM public.medications WHERE shelter_id IS NULL);
\echo 'Por abrigo: ' || (SELECT COUNT(*) FROM public.medications WHERE shelter_id IS NOT NULL);
\echo 'Vias de administração: ' || (SELECT COUNT(*) FROM public.catalogs WHERE category = 'medication_route');
\echo ''
\echo 'Próximo passo: Execute 19_migrate_prescriptions.sql'
\echo '=================================================='
