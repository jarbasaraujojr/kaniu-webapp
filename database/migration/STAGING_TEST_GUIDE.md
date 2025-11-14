# Guia de Teste em Staging - Sistema de Medicação

## 🎯 Objetivo

Testar a migração do sistema de medicação em ambiente isolado antes de executar em produção.

## 📋 Pré-requisitos

- [ ] PostgreSQL instalado localmente ou em servidor de staging
- [ ] Backup da base de produção
- [ ] Acesso ao código do projeto
- [ ] Pelo menos 2GB de espaço em disco

## 🔍 Diagnóstico Rápido

**ANTES DE COMEÇAR**, execute o script de diagnóstico para verificar se tudo está OK:

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp\database\migration
check_environment.bat
```

Isso irá verificar:
- ✅ Se o PostgreSQL está instalado e rodando
- ✅ Se a conexão funciona
- ✅ Quais databases existem
- ✅ Se as tabelas necessárias estão presentes

**Se o diagnóstico passar → prossiga com o teste**
**Se houver erros → consulte [SETUP_STAGING.md](SETUP_STAGING.md)**

## 🚀 Passo a Passo

### Passo 1: Preparar Base de Staging

#### Opção A: Base Completa (Recomendado)

```bash
# 1. Criar backup da produção
pg_dump -h <prod-host> -U <user> -d kaniu_old \
  -F c -b -v -f backup_prod_$(date +%Y%m%d).backup

# 2. Criar database staging
psql -U postgres -c "CREATE DATABASE kaniu_staging;"

# 3. Restaurar backup no staging
pg_restore -h localhost -U postgres -d kaniu_staging \
  -v backup_prod_*.backup
```

#### Opção B: Apenas Amostra (Teste Rápido)

```bash
# Copiar apenas últimos 100 registros de cada tabela
pg_dump -h <prod-host> -U <user> -d kaniu_old \
  --table=medicamento --table=prescricao --table=prescricao_tarefa \
  --table=receita --table=animais --table=usuarios \
  -F c -f backup_sample.backup

pg_restore -h localhost -U postgres -d kaniu_staging \
  backup_sample.backup
```

### Passo 2: Aplicar Schema Novo

#### 2.1. Verificar Schema Prisma

```bash
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp

# Ver schema
cat prisma/schema.prisma | grep -A 20 "model Medication"
```

#### 2.2. Criar Migration

```bash
# Gerar migration (mas não aplicar ainda)
npx prisma migrate dev --name add_medication_system --create-only

# Ver o SQL gerado
cat prisma/migrations/*/migration.sql
```

#### 2.3. Aplicar no Staging

**Opção 1: Via Prisma**

```bash
DATABASE_URL="postgresql://postgres:senha@localhost:5432/kaniu_staging" \
DIRECT_URL="postgresql://postgres:senha@localhost:5432/kaniu_staging" \
npx prisma migrate deploy
```

**Opção 2: Via psql (Manual)**

```bash
psql -h localhost -U postgres -d kaniu_staging << 'EOF'
-- Criar tabelas
CREATE TABLE IF NOT EXISTS medications (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name character varying(200) NOT NULL,
    shelter_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT medications_shelter_id_fkey FOREIGN KEY (shelter_id)
        REFERENCES shelters(id) ON DELETE SET NULL
);

CREATE INDEX idx_medications_shelter_id ON medications(shelter_id);
CREATE INDEX idx_medications_name ON medications(name);
CREATE INDEX idx_medications_is_active ON medications(is_active);

-- (Continue com prescriptions e prescription_tasks...)
EOF
```

### Passo 3: Executar Scripts de Migração

#### 3.1. Usando Script Automatizado

**Windows:**

```cmd
cd database\migration
test_staging.bat
```

**Linux/Mac:**

```bash
cd database/migration
chmod +x test_staging.sh
./test_staging.sh
```

#### 3.2. Manualmente (Passo a Passo)

```bash
cd database/migration/scripts

# Script 18: Medicamentos
psql -h localhost -U postgres -d kaniu_staging \
  -f 18_migrate_medications.sql 2>&1 | tee logs/18_test.log

# Verificar resultado
grep -i "erro\|error\|fail" logs/18_test.log

# Script 19: Prescrições
psql -h localhost -U postgres -d kaniu_staging \
  -f 19_migrate_prescriptions.sql 2>&1 | tee logs/19_test.log

# Verificar resultado
grep -i "erro\|error\|fail" logs/19_test.log

# Script 20: Tarefas
psql -h localhost -U postgres -d kaniu_staging \
  -f 20_migrate_prescription_tasks.sql 2>&1 | tee logs/20_test.log

# Verificar resultado
grep -i "erro\|error\|fail" logs/20_test.log
```

### Passo 4: Validação de Dados

#### 4.1. Contagens Básicas

```sql
-- Conectar ao staging
psql -h localhost -U postgres -d kaniu_staging

-- Verificar contagens
SELECT
    'medications' as tabela,
    (SELECT COUNT(*) FROM medicamento) as antiga,
    (SELECT COUNT(*) FROM medications) as nova,
    CASE
        WHEN (SELECT COUNT(*) FROM medications) >= (SELECT COUNT(*) FROM medicamento) * 0.9
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END as status
UNION ALL
SELECT
    'prescriptions',
    (SELECT COUNT(*) FROM prescricao),
    (SELECT COUNT(*) FROM prescriptions),
    CASE
        WHEN (SELECT COUNT(*) FROM prescriptions) >= (SELECT COUNT(*) FROM prescricao) * 0.9
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END
UNION ALL
SELECT
    'prescription_tasks',
    (SELECT COUNT(*) FROM prescricao_tarefa),
    (SELECT COUNT(*) FROM prescription_tasks),
    CASE
        WHEN (SELECT COUNT(*) FROM prescription_tasks) >= (SELECT COUNT(*) FROM prescricao_tarefa) * 0.9
        THEN 'OK'
        ELSE 'ATENÇÃO'
    END;
```

#### 4.2. Validar Integridade

```sql
-- Medicamentos órfãos
SELECT COUNT(*) as orphan_medications
FROM medications m
WHERE m.shelter_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM shelters s WHERE s.id = m.shelter_id);
-- Esperado: 0

-- Prescrições órfãs
SELECT COUNT(*) as orphan_prescriptions
FROM prescriptions p
WHERE NOT EXISTS (SELECT 1 FROM animals a WHERE a.id = p.animal_id);
-- Esperado: 0

-- Tarefas órfãs
SELECT COUNT(*) as orphan_tasks
FROM prescription_tasks pt
WHERE NOT EXISTS (SELECT 1 FROM prescriptions p WHERE p.id = pt.prescription_id);
-- Esperado: 0
```

#### 4.3. Validar Mapeamentos

```sql
-- Verificar medicamentos mapeados
SELECT
    COUNT(*) as total_old,
    COUNT(DISTINCT mm.new_id) as total_mapped,
    COUNT(*) - COUNT(DISTINCT mm.new_id) as not_mapped
FROM medicamento m
LEFT JOIN medication_mapping mm ON mm.old_id = m.id;

-- Verificar prescrições com medicamentos válidos
SELECT
    COUNT(*) as total_prescriptions,
    COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END) as with_valid_medication,
    COUNT(CASE WHEN m.id IS NULL THEN 1 END) as without_medication
FROM prescriptions p
LEFT JOIN medications m ON m.id = p.medication_id;
```

#### 4.4. Testar Queries do Sistema

```sql
-- Query 1: Prescrições ativas de um animal
SELECT
    p.id,
    m.name as medicamento,
    p.dosage,
    p.route,
    p.interval_hours,
    COUNT(pt.id) as total_doses,
    COUNT(CASE WHEN pt.is_completed THEN 1 END) as doses_aplicadas
FROM prescriptions p
JOIN medications m ON m.id = p.medication_id
LEFT JOIN prescription_tasks pt ON pt.prescription_id = p.id
WHERE p.is_completed = false
GROUP BY p.id, m.name, p.dosage, p.route, p.interval_hours
LIMIT 5;

-- Query 2: Doses pendentes hoje
SELECT
    a.name as animal,
    m.name as medicamento,
    pt.scheduled_time,
    pt.is_completed
FROM prescription_tasks pt
JOIN prescriptions p ON p.id = pt.prescription_id
JOIN animals a ON a.id = p.animal_id
JOIN medications m ON m.id = p.medication_id
WHERE pt.scheduled_date = CURRENT_DATE
ORDER BY pt.scheduled_time
LIMIT 10;

-- Query 3: Top medicamentos
SELECT
    m.name,
    COUNT(DISTINCT p.id) as total_prescricoes
FROM medications m
JOIN prescriptions p ON p.medication_id = m.id
GROUP BY m.name
ORDER BY COUNT(DISTINCT p.id) DESC
LIMIT 10;
```

### Passo 5: Testes de Performance

```sql
-- Teste 1: Buscar prescrições de um animal (deve ser < 100ms)
EXPLAIN ANALYZE
SELECT * FROM prescriptions WHERE animal_id = (SELECT id FROM animals LIMIT 1);

-- Teste 2: Buscar tarefas pendentes (deve ser < 50ms)
EXPLAIN ANALYZE
SELECT * FROM prescription_tasks
WHERE is_completed = false AND scheduled_date <= CURRENT_DATE
LIMIT 20;

-- Teste 3: Medicamentos mais usados (deve ser < 200ms)
EXPLAIN ANALYZE
SELECT m.name, COUNT(*) FROM prescriptions p
JOIN medications m ON m.id = p.medication_id
GROUP BY m.name
ORDER BY COUNT(*) DESC
LIMIT 10;
```

### Passo 6: Verificar Logs

```bash
# Ver erros nos logs
cd logs/staging_test_*

# Verificar se há erros
grep -i "erro\|error\|fail" *.log

# Ver resumo de cada script
tail -n 50 18_medications.log
tail -n 50 19_prescriptions.log
tail -n 50 20_tasks.log
```

### Passo 7: Checklist de Validação

Marque cada item após validação:

#### Dados

- [ ] Todos os medicamentos migrados (>90% do total)
- [ ] Todas as prescrições migradas (>90% do total)
- [ ] Todas as tarefas migradas (>90% do total)
- [ ] Sem registros órfãos (foreign keys válidas)
- [ ] Medicamentos linkados corretamente
- [ ] Veterinários mapeados corretamente
- [ ] Animais linkados corretamente

#### Funcionalidade

- [ ] Query de prescrições ativas funciona
- [ ] Query de doses pendentes funciona
- [ ] Query de top medicamentos funciona
- [ ] Índices funcionando (EXPLAIN mostra uso de índices)
- [ ] Performance aceitável (< 200ms para queries principais)

#### Integridade

- [ ] Sem erros nos logs
- [ ] Todas as foreign keys válidas
- [ ] Contagens batem com esperado
- [ ] Mapeamentos completos

## ✅ Critérios de Sucesso

Para aprovar a migração em produção, todos devem ser TRUE:

1. **Taxa de migração > 95%**: Pelo menos 95% dos dados migrados
2. **Zero órfãos**: Nenhum registro com FK inválida
3. **Performance OK**: Queries principais < 200ms
4. **Sem erros críticos**: Apenas warnings aceitáveis nos logs
5. **Queries funcionais**: Todas as queries de teste retornam dados

## 🔴 Se Algo Falhar

### Problema: Medicamentos não migrados

```sql
-- Investigar
SELECT * FROM medicamento m
WHERE NOT EXISTS (SELECT 1 FROM medication_mapping mm WHERE mm.old_id = m.id)
LIMIT 10;

-- Solução: Verificar se são medicamentos sem nome ou inválidos
```

### Problema: Prescrições órfãs

```sql
-- Investigar
SELECT p.*, a.animal_id
FROM prescricao p
LEFT JOIN receita r ON r.id = p.receita
LEFT JOIN animais a ON a.animal_id = r.animal
WHERE a.animal_id IS NULL
LIMIT 10;

-- Solução: Corrigir script 19 para tratar esses casos
```

### Problema: Performance lenta

```sql
-- Verificar se índices foram criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('medications', 'prescriptions', 'prescription_tasks');

-- Criar índices faltantes manualmente
CREATE INDEX IF NOT EXISTS idx_prescriptions_animal_id ON prescriptions(animal_id);
```

## 📊 Relatório de Teste

Depois do teste, documente:

```markdown
## Relatório de Teste - Sistema de Medicação

**Data**: YYYY-MM-DD
**Ambiente**: Staging
**Duração**: X horas

### Resultados

| Tabela | Registros Antigos | Migrados | Taxa | Status |
|--------|-------------------|----------|------|--------|
| medications | X | Y | Z% | ✅/❌ |
| prescriptions | X | Y | Z% | ✅/❌ |
| prescription_tasks | X | Y | Z% | ✅/❌ |

### Performance

| Query | Tempo | Status |
|-------|-------|--------|
| Prescrições ativas | Xms | ✅/❌ |
| Doses pendentes | Xms | ✅/❌ |
| Top medicamentos | Xms | ✅/❌ |

### Problemas Encontrados

1. [Descrição do problema]
   - Solução: [Como foi resolvido]

### Aprovação

- [ ] Aprovado para produção
- [ ] Requer ajustes

**Aprovado por**: _______________
```

## 🚀 Próximo Passo

Se todos os testes passaram:

1. ✅ **Documentar resultados** do teste
2. ✅ **Revisar** com equipe
3. ✅ **Agendar** janela de manutenção
4. ✅ **Executar em produção** usando scripts validados

---

**Dica**: Mantenha o ambiente de staging para referência durante a migração de produção!
