-- ========================================
-- SCHEMA HÍBRIDO OTIMIZADO V3
-- Sistema de Adoção de Animais
-- Implementações finais
-- ========================================

-- ========================================
-- 1. TABELAS DE REFERÊNCIA (CATÁLOGOS)
-- ========================================

CREATE TABLE catalogs (
  id serial PRIMARY KEY,
  category varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category, name)
);

CREATE INDEX idx_catalogs_category ON catalogs(category);
CREATE INDEX idx_catalogs_name ON catalogs(name);

-- ========================================
-- 2. ROLES/PAPÉIS
-- ========================================

CREATE TABLE roles (
  id serial PRIMARY KEY,
  name varchar(50) NOT NULL UNIQUE,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador do sistema'),
  ('shelter_manager', 'Gerenciador de abrigo'),
  ('veterinarian', 'Veterinário'),
  ('adopter', 'Adotante'),
  ('volunteer', 'Voluntário');

-- ========================================
-- 3. TABELAS PRINCIPAIS
-- ========================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  email varchar UNIQUE NOT NULL,
  phone varchar,
  address jsonb,
  document_id varchar UNIQUE,
  role_id integer NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role_id);

-- ----

CREATE TABLE shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  location jsonb,
  phone varchar,
  email varchar,
  website varchar,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shelters_owner ON shelters(owner_id);
CREATE INDEX idx_shelters_active ON shelters(is_active);

-- ----

CREATE TABLE animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  shelter_id uuid NOT NULL REFERENCES shelters(id) ON DELETE RESTRICT,
  
  species_id int REFERENCES catalogs(id),
  breed_id int REFERENCES catalogs(id),
  gender varchar(15) CHECK (gender IN ('Macho', 'Fêmea', 'Indefinido')),
  size varchar(20),
  
  birth_date date,
  microchip_id varchar UNIQUE,
  
  status varchar(30) DEFAULT 'available' CHECK (status IN (
    'available',      -- Disponível para adoção
    'adopted',        -- Já foi adotado
    'hospitalized',   -- Em tratamento
    'lost',           -- Desaparecido
    'deceased',       -- Falecido
    'unavailable'     -- Indisponível
  )),
  
  castrated boolean,
  health_status jsonb,
  
  -- ✅ OTIMIZADO: behavior com arrays e nomes claros
  behavior jsonb,
  
  -- ✅ OTIMIZADO: appearance com fur_length direto
  appearance jsonb NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

CREATE INDEX idx_animals_shelter ON animals(shelter_id);
CREATE INDEX idx_animals_species ON animals(species_id);
CREATE INDEX idx_animals_breed ON animals(breed_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_name ON animals(name);
CREATE INDEX idx_appearance_colors ON animals USING GIN (appearance);
CREATE INDEX idx_behavior ON animals USING GIN (behavior);
CREATE INDEX idx_animals_microchip ON animals(microchip_id);

-- ========================================
-- 4. FOTOS DO ANIMAL
-- ========================================

CREATE TABLE animal_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_profile_pic boolean DEFAULT false,
  photo_order integer DEFAULT 0,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_animal_photos_animal ON animal_photos(animal_id);
CREATE INDEX idx_animal_photos_profile ON animal_photos(animal_id, is_profile_pic);

-- ========================================
-- 5. DOCUMENTOS (SIMPLIFICADO)
-- ========================================

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  -- ✅ SUGESTÃO 2: Removido adoption_id (não precisa)
  -- ✅ SUGESTÃO 2: Removido file_size e expiration_date
  
  document_type varchar(50) NOT NULL CHECK (document_type IN (
    'medical_exam',         -- Exame médico
    'vaccine_certificate',  -- Certificado de vacinação
    'health_report',        -- Relatório de saúde
    'adoption_contract',    -- Contrato de adoção
    'photo_evidence',       -- Prova fotográfica
    'other'                 -- Outro
  )),
  
  file_url text NOT NULL,
  file_name varchar(255),
  mime_type varchar(50),
  
  description text,
  issued_date date,
  
  -- ✅ SUGESTÃO 3: Campo JSON para armazenar informações adicionais
  -- Exemplo para exame médico:
  -- {
  --   "parameters": {
  --     "heart_rate": "82 bpm",
  --     "temperature": "38.5°C",
  --     "weight": "28.5 kg",
  --     "observations": "Animal em perfeito estado"
  --   },
  --   "veterinarian_notes": "...",
  --   "next_checkup": "2025-07-15"
  -- }
  data jsonb,
  
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_documents_animal ON documents(animal_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_date ON documents(created_at DESC);

-- ========================================
-- 6. ADOÇÕES COMO EVENTOS (✅ SUGESTÃO 1)
-- Tabela de eventos de adoção, não mais um simples status
-- ========================================

CREATE TABLE adoption_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE RESTRICT,
  adopter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- ✅ SUGESTÃO 1: Status agora é um evento
  -- O "status atual" da adoção é determinado pelo último evento
  status varchar(30) NOT NULL CHECK (status IN (
    'inquiry',      -- Consulta inicial (novo!)
    'pending',      -- Aguardando aprovação
    'approved',     -- Aprovada
    'rejected',     -- Rejeitada
    'cancelled',    -- Cancelada
    'finalized',    -- Finalizada/Concluída
    'undone'        -- Desfeita/Devolvida
  )),
  
  -- ✅ SUGESTÃO 1: Campo único para descrever a etapa
  -- Substitui os 3 campos anteriores (return_reason, return_date, return_notes)
  -- Exemplo: "Devolvido. Motivo: Não se adaptou à rotina da família. Devolvido em 2025-01-20."
  -- Ou JSON com mais estrutura se necessário
  information text,  -- Descrição texto da etapa
  
  -- ✅ ALTERNATIVA: Se preferir mais estrutura, pode usar JSON
  -- details jsonb (comentado para usar information texto simples)
  -- details jsonb,  -- {
                     --   "reason": "Não se adaptou",
                     --   "notes": "Muito energia",
                     --   "date": "2025-01-20",
                     --   "veterinarian_report": "..."
                     -- }
  
  triggered_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_adoption_events_animal ON adoption_events(animal_id);
CREATE INDEX idx_adoption_events_adopter ON adoption_events(adopter_id);
CREATE INDEX idx_adoption_events_status ON adoption_events(status);
CREATE INDEX idx_adoption_events_date ON adoption_events(created_at DESC);

-- ========================================
-- 7. PESOS DO ANIMAL
-- ========================================

CREATE TABLE animal_weights (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  value numeric(6, 2) NOT NULL CHECK (value > 0),
  unit varchar(10) DEFAULT 'kg' CHECK (unit IN ('kg', 'lb')),
  recorded_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  date_time timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX idx_animal_weights_animal ON animal_weights(animal_id, date_time DESC);

-- ========================================
-- 8. REGISTROS MÉDICOS
-- ========================================

CREATE TABLE animal_medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_type varchar(50) NOT NULL,
  description text NOT NULL,
  veterinarian varchar,
  record_date date NOT NULL,
  next_due_date date,
  details jsonb,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_medical_records_animal ON animal_medical_records(animal_id);
CREATE INDEX idx_medical_records_type ON animal_medical_records(record_type);
CREATE INDEX idx_medical_records_date ON animal_medical_records(record_date DESC);

-- ========================================
-- 9. RELATÓRIOS (PERDIDOS/ENCONTRADOS)
-- ========================================

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  
  report_type varchar(20) NOT NULL CHECK (report_type IN ('lost', 'found')),
  
  location jsonb NOT NULL,
  description text NOT NULL,
  
  matched_report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  matched_by uuid REFERENCES users(id) ON DELETE SET NULL,
  matched_at timestamptz,
  
  resolved boolean DEFAULT false,
  resolved_date timestamptz,
  resolution_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_resolved ON reports(resolved);
CREATE INDEX idx_reports_animal ON reports(animal_id);
CREATE INDEX idx_reports_date ON reports(created_at DESC);

-- ========================================
-- 10. FAVORITOS
-- ========================================

CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, animal_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_animal ON favorites(animal_id);

-- ========================================
-- 11. EVENTOS DO ANIMAL
-- ========================================

CREATE TABLE animal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  
  event_type varchar(50) NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'photo_added', 'document_added',
    'weight_recorded', 'medical_record', 'note_added', 'lost_reported',
    'found_reported', 'health_updated', 'behavior_updated', 'other'
  )),
  
  description text NOT NULL,
  details jsonb,
  triggered_by uuid NOT NULL REFERENCES users(id),
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX idx_animal_events_type ON animal_events(event_type);
CREATE INDEX idx_animal_events_date ON animal_events(created_at DESC);

-- ========================================
-- 12. AUDITORIA E LOGS
-- ========================================

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(50) NOT NULL,
  table_name varchar(100) NOT NULL,
  record_id uuid NOT NULL,
  
  old_values jsonb,
  new_values jsonb,
  details jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);

-- ========================================
-- 13. DADOS INICIAIS - CATÁLOGOS
-- ========================================

INSERT INTO catalogs (category, name, description) VALUES
('species', 'Cachorro', 'Canis familiaris'),
('species', 'Gato', 'Felis catus'),
('species', 'Coelho', 'Oryctolagus cuniculus'),
('species', 'Pássaro', 'Aves'),
('species', 'Roedor', 'Rodentia'),
('breed', 'Poodle', 'Raça de cachorro'),
('breed', 'Labrador', 'Raça de cachorro'),
('breed', 'Pastor Alemão', 'Raça de cachorro'),
('breed', 'Bulldog', 'Raça de cachorro'),
('breed', 'SRD', 'Sem Raça Definida'),
('breed', 'Persa', 'Raça de gato'),
('breed', 'Siamês', 'Raça de gato'),
('breed', 'Maine Coon', 'Raça de gato'),
('breed', 'Gato Doméstico', 'Gato comum/SRD'),
('size', 'Pequeno', 'Até 10 kg'),
('size', 'Médio', 'De 10 a 25 kg'),
('size', 'Grande', 'De 25 a 45 kg'),
('size', 'Gigante', 'Acima de 45 kg');

-- ========================================
-- 14. VIEWS ÚTEIS
-- ========================================

-- Animais disponíveis
CREATE VIEW available_animals AS
SELECT 
  a.id,
  a.name,
  a.description,
  c1.name as species,
  c2.name as breed,
  a.gender,
  c3.name as size,
  a.appearance,
  a.behavior,
  s.name as shelter_name,
  a.created_at
FROM animals a
LEFT JOIN catalogs c1 ON a.species_id = c1.id
LEFT JOIN catalogs c2 ON a.breed_id = c2.id
LEFT JOIN catalogs c3 ON a.size = c3.id
LEFT JOIN shelters s ON a.shelter_id = s.id
WHERE a.status = 'available'
ORDER BY a.created_at DESC;

-- Histórico de adoções (últimas na sequência)
CREATE VIEW adoption_history AS
SELECT 
  ae.id as event_id,
  a.name as animal_name,
  u.name as adopter_name,
  u.email as adopter_email,
  s.name as shelter_name,
  ae.status,
  ae.information,
  ae.triggered_by as approved_by_id,
  ae.created_at as event_date
FROM adoption_events ae
JOIN animals a ON ae.animal_id = a.id
JOIN users u ON ae.adopter_id = u.id
JOIN shelters s ON a.shelter_id = s.id
ORDER BY ae.created_at DESC;

-- Animais por abrigo
CREATE VIEW animals_by_shelter AS
SELECT 
  s.id,
  s.name as shelter_name,
  COUNT(a.id) as total_animals,
  COUNT(CASE WHEN a.status = 'available' THEN 1 END) as available_count,
  COUNT(CASE WHEN a.status = 'adopted' THEN 1 END) as adopted_count,
  COUNT(CASE WHEN a.status = 'lost' THEN 1 END) as lost_count,
  COUNT(CASE WHEN a.status = 'deceased' THEN 1 END) as deceased_count
FROM shelters s
LEFT JOIN animals a ON s.id = a.shelter_id
GROUP BY s.id, s.name;

-- Timeline de eventos de um animal
CREATE VIEW animal_event_timeline AS
SELECT 
  ae.animal_id,
  a.name as animal_name,
  ae.event_type,
  ae.description,
  u.name as triggered_by_name,
  ae.created_at
FROM animal_events ae
JOIN animals a ON ae.animal_id = a.id
JOIN users u ON ae.triggered_by = u.id
ORDER BY ae.created_at DESC;

-- Status atual de uma adoção (último evento)
CREATE VIEW adoption_current_status AS
SELECT DISTINCT ON (ae.animal_id, ae.adopter_id)
  ae.animal_id,
  ae.adopter_id,
  a.name as animal_name,
  u.name as adopter_name,
  ae.status as current_status,
  ae.information,
  ae.created_at as last_updated
FROM adoption_events ae
JOIN animals a ON ae.animal_id = a.id
JOIN users u ON ae.adopter_id = u.id
ORDER BY ae.animal_id, ae.adopter_id, ae.created_at DESC;

-- ========================================
-- 15. TRIGGERS PARA AUDITORIA
-- ========================================

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER animal_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON animals
FOR EACH ROW
EXECUTE FUNCTION log_changes();

CREATE TRIGGER adoption_events_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON adoption_events
FOR EACH ROW
EXECUTE FUNCTION log_changes();

-- ========================================
-- 16. FUNCTIONS ÚTEIS
-- ========================================

-- Function para criar evento de animal
CREATE OR REPLACE FUNCTION create_animal_event(
  p_animal_id uuid,
  p_event_type varchar,
  p_description text,
  p_triggered_by uuid,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO animal_events (animal_id, event_type, description, triggered_by, details)
  VALUES (p_animal_id, p_event_type, p_description, p_triggered_by, p_details)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function para criar evento de adoção
CREATE OR REPLACE FUNCTION create_adoption_event(
  p_animal_id uuid,
  p_adopter_id uuid,
  p_status varchar,
  p_information text,
  p_triggered_by uuid
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO adoption_events (
    animal_id, adopter_id, status, information, triggered_by
  )
  VALUES (p_animal_id, p_adopter_id, p_status, p_information, p_triggered_by)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function para obter status atual de uma adoção
CREATE OR REPLACE FUNCTION get_adoption_current_status(
  p_animal_id uuid,
  p_adopter_id uuid
)
RETURNS TABLE (
  current_status varchar,
  information text,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.status, ae.information, ae.created_at
  FROM adoption_events ae
  WHERE ae.animal_id = p_animal_id
    AND ae.adopter_id = p_adopter_id
  ORDER BY ae.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 17. CONSTRAINTS AVANÇADAS
-- ========================================

-- Garantir que um animal não possa ter dois status de adoção ativos simultaneamente
-- (isso é controlado pela lógica de aplicação, mas pode adicionar constraint se necessário)

-- Garantir que inquiry vem antes de pending
-- (controlado pela lógica da aplicação)
