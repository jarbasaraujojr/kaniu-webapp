-- =====================================================
-- Script 02: CRIAR TABELAS DE MAPEAMENTO
-- =====================================================
-- Descrição: Cria tabelas temporárias para mapear IDs antigos -> novos
-- Tempo estimado: < 1 minuto
-- =====================================================

\echo '=================================================='
\echo 'CRIANDO TABELAS DE MAPEAMENTO'
\echo '=================================================='

-- Tabela para mapear IDs de abrigos (bigint -> uuid)
CREATE TEMPORARY TABLE IF NOT EXISTS shelter_id_mapping (
    old_id bigint PRIMARY KEY,
    new_id uuid NOT NULL UNIQUE
);

CREATE INDEX idx_shelter_mapping_new_id ON shelter_id_mapping(new_id);

\echo 'Tabela shelter_id_mapping criada'

-- Tabela para mapear catálogos (text -> integer)
CREATE TEMPORARY TABLE IF NOT EXISTS catalog_mappings (
    category varchar(50) NOT NULL,
    old_value text NOT NULL,
    new_id integer NOT NULL,
    PRIMARY KEY (category, old_value)
);

CREATE INDEX idx_catalog_mapping_new_id ON catalog_mappings(category, new_id);

\echo 'Tabela catalog_mappings criada'

-- Tabela para mapear veterinários (uuid -> nome como texto)
CREATE TEMPORARY TABLE IF NOT EXISTS veterinarian_mapping (
    old_vet_id uuid PRIMARY KEY,
    vet_name text NOT NULL,
    crmv bigint,
    new_user_id uuid  -- Se o veterinário também for usuário
);

\echo 'Tabela veterinarian_mapping criada'

-- Tabela para mapear clínicas
CREATE TEMPORARY TABLE IF NOT EXISTS clinic_mapping (
    old_clinic_name text PRIMARY KEY,
    clinic_data jsonb  -- Armazena telefone, endereço, logo
);

\echo 'Tabela clinic_mapping criada'

-- Tabela para rastrear erros durante migração
CREATE TEMPORARY TABLE IF NOT EXISTS migration_errors (
    id serial PRIMARY KEY,
    script_name varchar(100),
    error_type varchar(100),
    error_message text,
    affected_record_id text,
    occurred_at timestamp DEFAULT now()
);

\echo 'Tabela migration_errors criada'

-- Tabela para rastrear estatísticas de migração
CREATE TEMPORARY TABLE IF NOT EXISTS migration_stats (
    table_name varchar(100) PRIMARY KEY,
    old_count integer,
    new_count integer,
    skipped_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    notes text
);

\echo 'Tabela migration_stats criada'

\echo ''
\echo '=================================================='
\echo 'TABELAS DE MAPEAMENTO CRIADAS COM SUCESSO'
\echo 'Próximo passo: Execute 03_data_quality_check.sql'
\echo '=================================================='
