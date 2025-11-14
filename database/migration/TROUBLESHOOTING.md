# Troubleshooting - Problemas Comuns

## 🔴 Erro: "Não foi possível conectar"

Este é o erro mais comum ao executar `test_staging.bat`.

### Causas Possíveis

1. **Database não existe**
2. **PostgreSQL não está rodando**
3. **Senha incorreta**
4. **psql não está no PATH**
5. **Porta incorreta**

### Diagnóstico

Execute o script de diagnóstico:

```cmd
check_environment.bat
```

Ele irá identificar exatamente qual é o problema.

### Soluções

#### 1. Database não existe

**Sintoma**: Script diz "Database kaniu_staging não existe"

**Solução A - Criar database vazio:**
```cmd
psql -U postgres -c "CREATE DATABASE kaniu_staging;"
```

**Solução B - Usar database existente:**
```cmd
# Se você já tem a base de produção
set DB_NAME=kaniu_prod
test_staging.bat
```

**Solução C - Restaurar backup:**
```cmd
# Se você tem um backup
pg_restore -U postgres -d kaniu_staging backup.backup
```

#### 2. PostgreSQL não está rodando

**Sintoma**: "could not connect to server"

**Verificar:**
```cmd
sc query postgresql-x64-14
```

**Iniciar serviço:**
```cmd
sc start postgresql-x64-14
```

**Ou:**
```cmd
net start postgresql-x64-14
```

**Se o nome do serviço for diferente:**
```cmd
# Listar todos serviços PostgreSQL
sc query | findstr /i postgresql
```

#### 3. Senha incorreta

**Sintoma**: "password authentication failed"

**Solução A - Resetar senha:**
```cmd
# Conectar como superuser (pode estar sem senha por padrão)
psql -U postgres

# Dentro do psql
ALTER USER postgres PASSWORD 'nova_senha';
\q
```

**Solução B - Usar pgpass:**

Crie o arquivo `%APPDATA%\postgresql\pgpass.conf`:
```
localhost:5432:*:postgres:sua_senha
```

**Solução C - Variável de ambiente:**
```cmd
set PGPASSWORD=sua_senha
test_staging.bat
```

#### 4. psql não está no PATH

**Sintoma**: "'psql' não é reconhecido como comando interno"

**Solução A - Adicionar ao PATH temporariamente:**
```cmd
set PATH=%PATH%;C:\Program Files\PostgreSQL\14\bin
test_staging.bat
```

**Solução B - Adicionar ao PATH permanentemente:**
1. Painel de Controle → Sistema → Configurações avançadas
2. Variáveis de ambiente
3. Editar PATH do usuário
4. Adicionar: `C:\Program Files\PostgreSQL\14\bin`
5. Reiniciar terminal

**Solução C - Usar caminho completo:**
```cmd
# Editar test_staging.bat e substituir psql por:
"C:\Program Files\PostgreSQL\14\bin\psql.exe"
```

#### 5. Porta incorreta

**Sintoma**: "could not connect to server: Connection refused"

**Verificar porta:**
```cmd
netstat -an | findstr :5432
```

**Se PostgreSQL está em outra porta:**
```cmd
set DB_PORT=5433
test_staging.bat
```

**Ver porta configurada no PostgreSQL:**
```cmd
psql -U postgres -c "SHOW port;"
```

---

## 🟡 Erro: "Tabela não existe"

### Sintoma

Script falha com:
```
ERROR:  relation "medications" does not exist
```

### Causa

O schema Prisma não foi aplicado no database.

### Solução

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp

# Configurar connection string
set DATABASE_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging
set DIRECT_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging

# Aplicar migrations
npx prisma migrate deploy
```

---

## 🟡 Erro: "permission denied"

### Sintoma

```
ERROR:  permission denied for table medications
```

### Causa

Usuário não tem permissões no database.

### Solução

```sql
-- Conectar como postgres (superuser)
psql -U postgres

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE kaniu_staging TO seu_usuario;
\c kaniu_staging
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON SCHEMA public TO seu_usuario;
\q
```

---

## 🟡 Erro: Scripts falhando

### Sintoma

```
[ERRO] Script 18 falhou
```

### Diagnóstico

Verificar logs:
```cmd
type logs\staging_test_*\18_medications.log
```

### Causas Comuns

#### A. Tabelas antigas não existem

**Erro**: `relation "medicamento" does not exist`

**Causa**: Você está testando em um database vazio

**Solução**: Restaure dados da base antiga primeiro:
```cmd
pg_restore -U postgres -d kaniu_staging backup_producao.backup
```

#### B. Mapping tables não existem

**Erro**: `relation "medication_mapping" does not exist`

**Causa**: Tabelas temporárias de mapeamento não foram criadas

**Solução**: Execute script 02 primeiro:
```cmd
psql -U postgres -d kaniu_staging -f scripts\02_create_mapping_tables.sql
```

#### C. Foreign keys inválidas

**Erro**: `violates foreign key constraint`

**Causa**: Dados referenciam registros que não existem

**Solução**: Execute todos os scripts na ordem correta:
1. Scripts 01-17 (base completa)
2. Scripts 18-20 (medicação)

---

## 🟢 Fluxo Completo de Resolução

### Passo 1: Diagnóstico

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp\database\migration
check_environment.bat
```

### Passo 2: Resolver problemas identificados

Seguir soluções acima baseado no diagnóstico.

### Passo 3: Verificar database tem dados antigos

```cmd
psql -U postgres -d kaniu_staging -c "SELECT COUNT(*) FROM medicamento;"
```

Se retornar 0 ou erro → precisa restaurar dados

### Passo 4: Verificar schema novo foi aplicado

```cmd
psql -U postgres -d kaniu_staging -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('medications', 'prescriptions', 'prescription_tasks');"
```

Deve retornar 3. Se não → aplicar Prisma migrations.

### Passo 5: Executar teste

```cmd
test_staging.bat
```

---

## 📞 Ajuda Adicional

### Ver configuração do PostgreSQL

```sql
psql -U postgres

-- Ver todas configurações
SHOW ALL;

-- Ver porta
SHOW port;

-- Ver arquivos de configuração
SHOW config_file;
SHOW hba_file;

-- Ver databases
\l

-- Ver usuários
\du
```

### Testar conexão manualmente

```cmd
# Teste básico
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;"

# Teste com database específico
psql -h localhost -p 5432 -U postgres -d kaniu_staging -c "SELECT COUNT(*) FROM pg_tables;"
```

### Logs do PostgreSQL

Localização típica:
```
C:\Program Files\PostgreSQL\14\data\log\
```

Ver último log:
```cmd
type "C:\Program Files\PostgreSQL\14\data\log\postgresql-*.log" | more
```

---

## 🆘 Último Recurso

Se nada funcionar, siga este processo completo:

```cmd
# 1. Parar PostgreSQL
sc stop postgresql-x64-14

# 2. Iniciar PostgreSQL
sc start postgresql-x64-14

# 3. Esperar 10 segundos
timeout /t 10

# 4. Testar conexão
psql -U postgres -c "SELECT version();"

# 5. Criar database limpo
psql -U postgres -c "DROP DATABASE IF EXISTS kaniu_test;"
psql -U postgres -c "CREATE DATABASE kaniu_test;"

# 6. Aplicar schema
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
set DATABASE_URL=postgresql://postgres:senha@localhost:5432/kaniu_test
npx prisma migrate deploy

# 7. Testar migração
cd database\migration
set DB_NAME=kaniu_test
test_staging.bat
```

---

**Última atualização**: 2025-01-12
