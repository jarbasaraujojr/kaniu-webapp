# Setup Rápido - Ambiente de Staging

## 🎯 Objetivo

Preparar ambiente de staging para testar a migração do sistema de medicação.

## 📋 Opções de Setup

### Opção 1: Usar Base de Produção Existente (Recomendado)

Se você já tem acesso à base de produção e ela já está rodando:

```cmd
# Defina qual database usar
set DB_NAME=kaniu_prod_db_name

# Execute o teste
test_staging.bat
```

### Opção 2: Criar Nova Base de Staging

#### Passo 1: Criar Database Vazio

```cmd
# Conectar ao PostgreSQL
psql -U postgres

# Criar database
CREATE DATABASE kaniu_staging;
\q
```

#### Passo 2: Restaurar Backup da Produção

```cmd
# Se você tem um backup .backup
pg_restore -U postgres -d kaniu_staging backup_producao.backup

# Se você tem um backup .sql
psql -U postgres -d kaniu_staging -f backup_producao.sql
```

#### Passo 3: Aplicar Schema Novo (Prisma)

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp

# Configurar connection string para staging
set DATABASE_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging
set DIRECT_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging

# Aplicar migrations
npx prisma migrate deploy
```

#### Passo 4: Executar Teste

```cmd
cd database\migration
set DB_NAME=kaniu_staging
test_staging.bat
```

### Opção 3: Teste com Amostra de Dados

Se a base de produção é muito grande, crie uma amostra:

```cmd
# Exportar apenas últimos 100 registros de cada tabela relevante
pg_dump -h prod-host -U postgres -d kaniu_prod ^
  --table=medicamento ^
  --table=prescricao ^
  --table=prescricao_tarefa ^
  --table=receita ^
  --table=animais ^
  --table=usuarios ^
  -F c -f backup_sample.backup

# Criar database staging
psql -U postgres -c "CREATE DATABASE kaniu_staging_sample;"

# Restaurar amostra
pg_restore -U postgres -d kaniu_staging_sample backup_sample.backup

# Aplicar schema novo
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
set DATABASE_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging_sample
npx prisma migrate deploy

# Executar teste
cd database\migration
set DB_NAME=kaniu_staging_sample
test_staging.bat
```

## 🔧 Configuração Avançada

### Usar Variáveis de Ambiente

Crie um arquivo `.env.staging` no diretório `database/migration`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=kaniu_staging
PGPASSWORD=sua_senha_aqui
```

Carregue antes de executar:

```cmd
# Carregar variáveis (PowerShell)
Get-Content .env.staging | ForEach-Object {
    if ($_ -match '^([^=]+)=(.+)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# Executar teste
.\test_staging.bat
```

### Teste com Host Remoto

```cmd
set DB_HOST=staging-server.example.com
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=kaniu_staging
set PGPASSWORD=senha_remota

test_staging.bat
```

## ❓ Troubleshooting

### Erro: "psql não é reconhecido"

PostgreSQL não está no PATH. Adicione:

```cmd
# Adicionar ao PATH temporariamente
set PATH=%PATH%;C:\Program Files\PostgreSQL\14\bin

# Ou use caminho completo
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres
```

### Erro: "não foi possível conectar"

**Verificações:**

1. **PostgreSQL está rodando?**
   ```cmd
   sc query postgresql-x64-14
   # Se não estiver rodando:
   sc start postgresql-x64-14
   ```

2. **Senha correta?**
   ```cmd
   # Testar manualmente
   psql -U postgres -d postgres
   ```

3. **Porta correta?**
   ```cmd
   netstat -an | findstr :5432
   ```

4. **Firewall bloqueando?**
   ```cmd
   # Verificar regras do firewall
   netsh advfirewall firewall show rule name=PostgreSQL
   ```

### Erro: "database não existe"

O script irá perguntar se deseja criar. Responda **S** (Sim).

Ou crie manualmente:

```cmd
psql -U postgres -c "CREATE DATABASE kaniu_staging;"
```

### Erro: "tabela não existe"

Você precisa aplicar o schema Prisma primeiro:

```cmd
cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
set DATABASE_URL=postgresql://postgres:senha@localhost:5432/kaniu_staging
npx prisma migrate deploy
```

### Erro: "permission denied"

O usuário não tem permissões no database:

```sql
-- Conectar como superuser
psql -U postgres

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE kaniu_staging TO seu_usuario;
\c kaniu_staging
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
```

## ✅ Checklist Pré-Teste

Antes de executar `test_staging.bat`, certifique-se:

- [ ] PostgreSQL está rodando
- [ ] Database de staging existe
- [ ] Schema novo (Prisma) foi aplicado no staging
- [ ] Dados antigos existem no staging (medicamento, prescricao, etc.)
- [ ] Você tem as credenciais corretas
- [ ] psql está disponível no PATH

## 📝 Comandos Úteis

```cmd
# Ver databases existentes
psql -U postgres -l

# Conectar ao database
psql -U postgres -d kaniu_staging

# Ver tabelas
\dt

# Ver schema de uma tabela
\d medications

# Contar registros
SELECT COUNT(*) FROM medicamento;  -- Tabela antiga
SELECT COUNT(*) FROM medications;  -- Tabela nova

# Sair
\q
```

## 🚀 Próximos Passos

Depois do setup:

1. ✅ Execute `test_staging.bat`
2. ✅ Revise os logs em `logs/staging_test_*/`
3. ✅ Valide os resultados
4. ✅ Se tudo OK → planejar migração em produção
5. ✅ Se houver problemas → consultar [STAGING_TEST_GUIDE.md](STAGING_TEST_GUIDE.md)

---

**Dica**: Mantenha o ambiente de staging para referência durante a migração de produção!
