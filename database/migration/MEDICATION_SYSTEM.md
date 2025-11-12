# Sistema de Medicação - Documentação Técnica

## 📋 Visão Geral

O novo sistema de medicação foi projetado para preservar **TODAS** as informações do sistema antigo, mas de forma mais estruturada e performática.

## 🗄️ Estrutura de Tabelas

### 1. `medications` - Cadastro de Medicamentos

Armazena o catálogo de medicamentos disponíveis.

```sql
CREATE TABLE medications (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    shelter_id      UUID,  -- NULL = medicamento global
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Características:**
- Medicamentos **globais** (acessíveis a todos os abrigos)
- Medicamentos **específicos** de cada abrigo
- Soft delete via `is_active`

**Exemplo:**
```sql
-- Medicamentos globais
INSERT INTO medications (name, shelter_id, is_active) VALUES
    ('Amoxicilina 500mg', NULL, true),
    ('Ivermectina 1%', NULL, true);

-- Medicamento específico de um abrigo
INSERT INTO medications (name, shelter_id, is_active) VALUES
    ('Medicação Customizada XYZ', 'uuid-do-abrigo', true);
```

### 2. `prescriptions` - Prescrições

Registra prescrições de medicamentos para animais.

```sql
CREATE TABLE prescriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id       UUID NOT NULL REFERENCES animals(id),
    medication_id   INT NOT NULL REFERENCES medications(id),
    dosage          VARCHAR(100) NOT NULL,  -- Ex: "500mg", "1 comprimido"
    route           VARCHAR(50) NOT NULL,   -- oral, IV, IM, SC, topical, etc.
    interval_hours  INT NOT NULL,           -- Ex: 8 (a cada 8 horas)
    start_date      DATE NOT NULL,
    start_time      TIME,
    duration_days   INT,                    -- NULL = contínuo
    is_continuous   BOOLEAN DEFAULT false,
    is_completed    BOOLEAN DEFAULT false,
    description     TEXT,
    prescribed_by   UUID REFERENCES users(id),
    recipe_id       VARCHAR(50),            -- Link para receita antiga
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemplo:**
```sql
INSERT INTO prescriptions (
    animal_id,
    medication_id,
    dosage,
    route,
    interval_hours,
    start_date,
    start_time,
    duration_days,
    is_continuous,
    description,
    prescribed_by
) VALUES (
    'uuid-do-animal',
    1,  -- Amoxicilina
    '500mg',
    'oral',
    8,  -- A cada 8 horas
    '2025-01-12',
    '08:00',
    10,  -- Por 10 dias
    false,
    'Tratamento de infecção respiratória',
    'uuid-do-veterinario'
);
```

### 3. `prescription_tasks` - Tarefas de Administração

Controla cada dose que deve ser administrada e seu histórico.

```sql
CREATE TABLE prescription_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    scheduled_date  DATE NOT NULL,
    scheduled_time  TIME NOT NULL,
    administered_at TIMESTAMPTZ,           -- Quando foi administrado
    administered_by UUID REFERENCES users(id),
    is_completed    BOOLEAN DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Exemplo:**
```sql
-- Dose 1: 12/01 08:00
INSERT INTO prescription_tasks (
    prescription_id,
    scheduled_date,
    scheduled_time,
    is_completed
) VALUES (
    'uuid-da-prescricao',
    '2025-01-12',
    '08:00',
    false
);

-- Dose 2: 12/01 16:00
INSERT INTO prescription_tasks (
    prescription_id,
    scheduled_date,
    scheduled_time,
    is_completed
) VALUES (
    'uuid-da-prescricao',
    '2025-01-12',
    '16:00',
    false
);

-- Dose 3: 13/01 00:00
INSERT INTO prescription_tasks (
    prescription_id,
    scheduled_date,
    scheduled_time,
    is_completed
) VALUES (
    'uuid-da-prescricao',
    '2025-01-13',
    '00:00',
    false
);
```

## 🔄 Migração de Dados

### Do Schema Antigo

**Tabelas antigas:**
- `medicamento` → `medications`
- `prescricao` + `receita` → `prescriptions`
- `prescricao_tarefa` → `prescription_tasks`
- `medicamento_via` → `catalogs` (category: 'medication_route')
- `medicamento_dosagem` → Não migrado (info está na prescrição)

### Mapeamento de Campos

#### medications

| Antigo | Novo | Notas |
|--------|------|-------|
| `medicamento.id` | `medications.id` | Auto-increment → novo ID |
| `medicamento.nome` | `medications.name` | Direto |
| `medicamento.canil_id` | `medications.shelter_id` | Mapeado para novo UUID |

#### prescriptions

| Antigo | Novo | Notas |
|--------|------|-------|
| `prescricao.id` | Não usado | Novo UUID gerado |
| `prescricao.medicamento` | `prescriptions.medication_id` | Mapeado |
| `prescricao.dosagem` | `prescriptions.dosage` | Direto |
| `prescricao.via` | `prescriptions.route` | Direto |
| `prescricao.intervalo_horas` | `prescriptions.interval_hours` | Direto |
| `prescricao.inicio` | `prescriptions.start_date` | Direto |
| `prescricao.inicio_horario` | `prescriptions.start_time` | Direto |
| `prescricao.duracao_dias` | `prescriptions.duration_days` | Direto |
| `prescricao.continuo` | `prescriptions.is_continuous` | Direto |
| `prescricao.finalizada` | `prescriptions.is_completed` | Direto |
| `prescricao.descricao` | `prescriptions.description` | Direto |
| `receita.veterinario` | `prescriptions.prescribed_by` | Mapeado para user |
| `receita.animal` | `prescriptions.animal_id` | Direto |

#### prescription_tasks

| Antigo | Novo | Notas |
|--------|------|-------|
| `prescricao_tarefa.prescricao` | `prescription_tasks.prescription_id` | Mapeado |
| `prescricao_tarefa.dia` | `prescription_tasks.scheduled_date` | Direto |
| `prescricao_tarefa.hora` | `prescription_tasks.scheduled_time` | Direto |
| `prescricao_tarefa.realizacao` | `prescription_tasks.administered_at` | Se concluída |
| `prescricao_tarefa.pessoa` | `prescription_tasks.administered_by` | Se concluída |
| `prescricao_tarefa.concluida` | `prescription_tasks.is_completed` | Direto |
| `prescricao_tarefa.observacao` | `prescription_tasks.notes` | Direto |

## 📊 Queries Úteis

### Listar prescrições ativas de um animal

```sql
SELECT
    p.id,
    m.name as medicamento,
    p.dosage,
    p.route as via,
    p.interval_hours,
    p.start_date,
    p.is_continuous,
    COUNT(pt.id) FILTER (WHERE pt.is_completed = false) as doses_pendentes
FROM prescriptions p
JOIN medications m ON m.id = p.medication_id
LEFT JOIN prescription_tasks pt ON pt.prescription_id = p.id
WHERE p.animal_id = 'uuid-do-animal'
  AND p.is_completed = false
GROUP BY p.id, m.name, p.dosage, p.route, p.interval_hours, p.start_date, p.is_continuous;
```

### Listar doses pendentes de hoje

```sql
SELECT
    a.name as animal,
    m.name as medicamento,
    p.dosage,
    p.route as via,
    pt.scheduled_time as horario
FROM prescription_tasks pt
JOIN prescriptions p ON p.id = pt.prescription_id
JOIN animals a ON a.id = p.animal_id
JOIN medications m ON m.id = p.medication_id
WHERE pt.scheduled_date = CURRENT_DATE
  AND pt.is_completed = false
ORDER BY pt.scheduled_time;
```

### Registrar administração de dose

```sql
UPDATE prescription_tasks
SET
    is_completed = true,
    administered_at = NOW(),
    administered_by = 'uuid-do-usuario',
    notes = 'Animal comeu normalmente após medicação'
WHERE id = 'uuid-da-tarefa';
```

### Taxa de adesão ao tratamento

```sql
SELECT
    a.name as animal,
    m.name as medicamento,
    COUNT(pt.id) as total_doses,
    COUNT(pt.id) FILTER (WHERE pt.is_completed = true) as doses_administradas,
    ROUND(
        COUNT(pt.id) FILTER (WHERE pt.is_completed = true) * 100.0 / COUNT(pt.id),
        2
    ) as taxa_adesao_percent
FROM prescriptions p
JOIN animals a ON a.id = p.animal_id
JOIN medications m ON m.id = p.medication_id
LEFT JOIN prescription_tasks pt ON pt.prescription_id = p.id
WHERE pt.scheduled_date <= CURRENT_DATE
GROUP BY a.name, m.name
HAVING COUNT(pt.id) > 0
ORDER BY taxa_adesao_percent DESC;
```

### Medicamentos mais usados

```sql
SELECT
    m.name as medicamento,
    COUNT(DISTINCT p.id) as total_prescricoes,
    COUNT(DISTINCT p.animal_id) as animais_tratados,
    COUNT(pt.id) FILTER (WHERE pt.is_completed = true) as doses_administradas
FROM medications m
LEFT JOIN prescriptions p ON p.medication_id = m.id
LEFT JOIN prescription_tasks pt ON pt.prescription_id = p.id
GROUP BY m.id, m.name
ORDER BY COUNT(DISTINCT p.id) DESC
LIMIT 10;
```

### Alertas de medicação atrasada

```sql
SELECT
    a.name as animal,
    s.name as abrigo,
    m.name as medicamento,
    p.dosage,
    pt.scheduled_date,
    pt.scheduled_time,
    CURRENT_DATE - pt.scheduled_date as dias_atrasado
FROM prescription_tasks pt
JOIN prescriptions p ON p.id = pt.prescription_id
JOIN animals a ON a.id = p.animal_id
JOIN shelters s ON s.id = a.shelter_id
JOIN medications m ON m.id = p.medication_id
WHERE pt.is_completed = false
  AND (pt.scheduled_date < CURRENT_DATE
       OR (pt.scheduled_date = CURRENT_DATE AND pt.scheduled_time < CURRENT_TIME))
ORDER BY pt.scheduled_date, pt.scheduled_time;
```

## 🎯 Benefícios do Novo Sistema

### ✅ Vantagens

1. **Performance**: Queries muito mais rápidas com índices otimizados
2. **Integridade**: Foreign keys garantem consistência
3. **Rastreabilidade**: Histórico completo de administração
4. **Alertas**: Fácil identificar medicações atrasadas
5. **Relatórios**: Queries simples para estatísticas
6. **Escalabilidade**: Suporta milhares de prescrições
7. **Flexibilidade**: Medicamentos globais + específicos de abrigo

### 📈 Comparação

| Aspecto | Sistema Antigo | Sistema Novo |
|---------|----------------|--------------|
| Tabelas | 7 tabelas | 3 tabelas |
| Performance | Lenta (joins complexos) | Rápida (índices otimizados) |
| Consultas | SQL complexo | SQL simples |
| Integridade | Manual | Garantida por FK |
| Relatórios | Difícil | Fácil |
| Manutenção | Complexa | Simples |

## 🚀 Próximos Passos

1. **Executar migração**: Scripts 18, 19 e 20
2. **Validar dados**: Verificar contagens e integridade
3. **Testar queries**: Executar queries de exemplo
4. **Implementar UI**: Interface para gerenciar prescrições
5. **Notificações**: Sistema de alertas para doses pendentes

## 📚 Referências

- [Prisma Schema](../prisma/schema.prisma) - Modelos completos
- [Script 18](scripts/18_migrate_medications.sql) - Migração de medicamentos
- [Script 19](scripts/19_migrate_prescriptions.sql) - Migração de prescrições
- [Script 20](scripts/20_migrate_prescription_tasks.sql) - Migração de tarefas

---

**Última atualização**: 2025-01-12
**Versão**: 1.0.0
