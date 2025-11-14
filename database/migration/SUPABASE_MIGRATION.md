# Migração Remota - Supabase

## 🎯 Situação

- Base de produção está no Supabase
- Não há PostgreSQL local instalado
- Não há backup existente
- Estrutura atual: `old schema.sql`

## ⚠️ PASSO 1: BACKUP URGENTE (FAÇA AGORA!)

### Opção A: Via Supabase Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Database** → **Backups**
4. Clique em **Create backup**
5. Aguarde finalizar e **Download** o backup

### Opção B: Via pg_dump remoto (Requer psql)

Se você tem `psql` instalado (mesmo sem servidor local):

```cmd
# Obter connection string no Supabase:
# Settings → Database → Connection string → Direct connection

# Fazer backup
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" -F c -f backup_supabase_producao_%date:~-4,4%%date:~-7,2%%date:~-10,2%.backup

# Ou apenas schema + dados essenciais
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres" ^
  --table=medicamento --table=prescricao --table=prescricao_tarefa ^
  --table=receita --table=animais --table=usuarios --table=canis ^
  -F c -f backup_supabase_essential.backup
```

### Opção C: Via Supabase CLI

```cmd
# Instalar Supabase CLI (se ainda não tem)
npm install -g supabase

# Login
supabase login

# Fazer backup
supabase db dump -f backup_producao.sql
```

## 📝 PASSO 2: Obter Credenciais Supabase

No dashboard do Supabase:

1. **Settings** → **Database**
2. Copie as informações de **Connection string**:
   - Host: `db.[seu-projeto].supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (clique em reveal)

3. Ou copie a **Direct connection string** completa:
   ```
   postgresql://postgres:[PASSWORD]@db.[projeto].supabase.co:5432/postgres
   ```

## 🚀 PASSO 3: Executar Migração Remota

### Opção A: Usar psql remoto (SEM precisar PostgreSQL local)

Você **NÃO** precisa de servidor PostgreSQL local! Apenas o cliente `psql`.

**Instalar apenas o cliente psql:**

1. Download: https://www.enterprisedb.com/download-postgresql-binaries
2. Extrair para: `C:\psql\`
3. Adicionar ao PATH:
   ```cmd
   set PATH=%PATH%;C:\psql\bin
   ```

**Executar migração:**

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp\database\migration

# Definir variáveis de ambiente
set PGHOST=db.seu-projeto.supabase.co
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=sua_senha_supabase
set PGDATABASE=postgres

# Testar conexão
psql -c "SELECT version();"

# Executar script de medicação 18
psql -f scripts\18_migrate_medications.sql

# Se sucesso, executar 19
psql -f scripts\19_migrate_prescriptions.sql

# Se sucesso, executar 20
psql -f scripts\20_migrate_prescription_tasks.sql
```

### Opção B: Modificar test_staging.bat para usar Supabase

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp\database\migration

# Configurar para Supabase
set DB_HOST=db.seu-projeto.supabase.co
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=postgres
set PGPASSWORD=sua_senha_supabase

# Executar teste (que agora vai rodar no Supabase!)
test_staging.bat
```

### Opção C: Via Supabase SQL Editor

1. Acesse Supabase Dashboard
2. **SQL Editor**
3. Copiar e colar conteúdo de cada script:
   - `scripts\18_migrate_medications.sql`
   - `scripts\19_migrate_prescriptions.sql`
   - `scripts\20_migrate_prescription_tasks.sql`
4. Executar um por vez
5. Verificar resultados

## 🔧 PASSO 4: Aplicar Schema Prisma no Supabase

Antes de migrar dados, certifique-se que as tabelas novas existem:

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp

# Configurar connection string do Supabase no .env
# Adicionar ao .env:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[projeto].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[projeto].supabase.co:5432/postgres"

# Aplicar migrations Prisma
npx prisma migrate deploy

# Verificar
npx prisma db pull
```

## ✅ PASSO 5: Validar Migração

```sql
-- Conectar ao Supabase via SQL Editor ou psql

-- Ver contagens
SELECT 'medications' as tabela, COUNT(*) as total FROM medications
UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks;

-- Verificar integridade
SELECT COUNT(*) as orfaos
FROM prescriptions p
LEFT JOIN medications m ON p.medication_id = m.id
WHERE m.id IS NULL;

-- Verificar dados migrados
SELECT * FROM medications LIMIT 5;
SELECT * FROM prescriptions LIMIT 5;
```

## 🎬 FLUXO COMPLETO RECOMENDADO

```cmd
# 1. BACKUP (CRÍTICO!)
# Fazer via Dashboard do Supabase ou pg_dump remoto

# 2. INSTALAR APENAS CLIENTE psql
# Download: https://www.enterprisedb.com/download-postgresql-binaries
# Extrair e adicionar ao PATH

# 3. APLICAR SCHEMA PRISMA
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
# Configurar DATABASE_URL no .env com connection string do Supabase
npx prisma migrate deploy

# 4. CONFIGURAR VARIÁVEIS
cd database\migration
set PGHOST=db.seu-projeto.supabase.co
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=sua_senha
set PGDATABASE=postgres

# 5. TESTAR CONEXÃO
psql -c "SELECT COUNT(*) FROM medicamento;"

# 6. EXECUTAR MIGRAÇÃO
psql -f scripts\18_migrate_medications.sql > logs\18.log 2>&1
psql -f scripts\19_migrate_prescriptions.sql > logs\19.log 2>&1
psql -f scripts\20_migrate_prescription_tasks.sql > logs\20.log 2>&1

# 7. VALIDAR
psql -c "SELECT 'medications', COUNT(*) FROM medications UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions;"
```

## 🆘 Se NÃO conseguir instalar psql

### Alternativa 1: Usar Docker

```cmd
# Instalar Docker Desktop

# Executar psql via container
docker run -it --rm postgres:14 psql -h db.seu-projeto.supabase.co -U postgres -d postgres
```

### Alternativa 2: Via Node.js

Posso criar um script Node.js que execute os SQLs remotamente usando o driver `pg`:

```cmd
npm install pg

# Criar script executor
node execute_migration.js
```

### Alternativa 3: Copiar e Colar no SQL Editor

Mais manual, mas funciona:
1. Abrir cada arquivo .sql
2. Copiar conteúdo
3. Colar no SQL Editor do Supabase
4. Executar

## ⚠️ IMPORTANTE

1. **SEMPRE fazer backup antes** (não pule isso!)
2. **Testar em horário de baixo uso** (madrugada?)
3. **Ter rollback preparado** (backup recente)
4. **Monitorar logs** durante execução
5. **Validar dados** após migração

## 🔍 Checklist Pré-Migração

- [ ] Backup feito e baixado
- [ ] Connection string do Supabase copiada
- [ ] psql instalado (ou alternativa escolhida)
- [ ] Conexão testada com Supabase
- [ ] Schema Prisma aplicado (tabelas medications, prescriptions existem)
- [ ] Tabelas antigas existem (medicamento, prescricao)
- [ ] Scripts 18-20 prontos
- [ ] Horário apropriado escolhido
- [ ] Equipe avisada (se aplicável)

---

**Próximo passo**: Me confirme quando tiver o backup feito!
