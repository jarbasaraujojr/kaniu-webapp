# Árvore de Decisão - Teste de Staging

```
                          INÍCIO
                            |
                            v
                    +----------------+
                    | Executou       |
                    | check_         |---NÃO---> Execute primeiro:
                    | environment    |           check_environment.bat
                    | .bat?          |
                    +----------------+
                            |
                           SIM
                            |
                            v
                    +----------------+
                    | Todos checks   |
                    | passaram?      |---NÃO---> Vá para o problema
                    +----------------+           específico abaixo
                            |
                           SIM
                            |
                            v
                    +----------------+
                    | Database de    |
                    | staging        |---NÃO---> Escolha uma opção:
                    | existe?        |           A) Criar vazio
                    +----------------+           B) Restaurar backup
                            |                    C) Usar prod
                           SIM
                            |
                            v
                    +----------------+
                    | Tem dados      |
                    | antigos?       |---NÃO---> Restaure backup ou
                    | (medicamento,  |           copie dados de prod
                    | prescricao)    |
                    +----------------+
                            |
                           SIM
                            |
                            v
                    +----------------+
                    | Schema Prisma  |
                    | aplicado?      |---NÃO---> Execute:
                    | (medications,  |           npx prisma migrate
                    | prescriptions) |           deploy
                    +----------------+
                            |
                           SIM
                            |
                            v
                    +----------------+
                    | Execute:       |
                    | test_staging   |
                    | .bat           |
                    +----------------+
                            |
                            v
                    +----------------+
                    | Teste passou?  |---NÃO---> Ver logs em:
                    +----------------+           logs/staging_test_*/
                            |                    Consultar
                           SIM                   TROUBLESHOOTING.md
                            |
                            v
                    +----------------+
                    | Validar        |
                    | resultados:    |
                    | - Taxa >95%    |
                    | - Zero órfãos  |---NÃO---> Investigar erros
                    | - Queries OK   |           específicos
                    +----------------+
                            |
                           SIM
                            |
                            v
                    +----------------+
                    | ✅ SUCESSO!    |
                    | Pronto para    |
                    | produção       |
                    +----------------+
```

## Problemas Específicos

### ❌ psql não encontrado

```
"psql não é reconhecido como comando"
    |
    v
Adicionar ao PATH:
set PATH=%PATH%;C:\Program Files\PostgreSQL\14\bin
    |
    v
Testar: psql --version
    |
    v
Se funcionar → Prosseguir
Se não → Verificar instalação PostgreSQL
```

### ❌ Não consegue conectar

```
"Não foi possível conectar"
    |
    v
PostgreSQL está rodando?
    |
    +--NÃO--> sc start postgresql-x64-14
    |             |
    |             v
   SIM        Aguardar 10s → Testar novamente
    |
    v
Senha correta?
    |
    +--NÃO--> set PGPASSWORD=senha_correta
    |             |
    |             v
   SIM        Testar novamente
    |
    v
Database existe?
    |
    +--NÃO--> Criar: psql -U postgres -c "CREATE DATABASE kaniu_staging;"
    |
   SIM
    |
    v
Conectado!
```

### ❌ Tabela não existe

```
"relation 'medications' does not exist"
    |
    v
É tabela NOVA (medications, prescriptions)?
    |
    +--SIM--> Aplicar schema Prisma:
    |         npx prisma migrate deploy
    |
    +--NÃO--> É tabela ANTIGA (medicamento, prescricao)?
              |
              v
              Restaurar dados antigos:
              pg_restore -d kaniu_staging backup.backup
```

### ❌ Script falhou

```
"[ERRO] Script 18/19/20 falhou"
    |
    v
Ver log específico:
type logs\staging_test_*\18_medications.log
    |
    v
Identificar erro:
    |
    +--"medicamento does not exist"
    |      |
    |      v
    |  Faltam dados antigos → Restaurar backup
    |
    +--"foreign key constraint"
    |      |
    |      v
    |  Faltam dados base → Executar scripts 01-17 primeiro
    |
    +--"permission denied"
           |
           v
       Conceder permissões → Ver TROUBLESHOOTING.md
```

## Fluxograma de Setup Completo

```
CENÁRIO 1: Tenho backup de produção
    |
    v
1. Criar database: CREATE DATABASE kaniu_staging;
2. Restaurar backup: pg_restore -d kaniu_staging backup.backup
3. Aplicar schema novo: npx prisma migrate deploy
4. Executar teste: test_staging.bat
    |
    v
SUCESSO


CENÁRIO 2: Quero testar sem dados reais
    |
    v
1. Criar database: CREATE DATABASE kaniu_test;
2. Aplicar schema Prisma: npx prisma migrate deploy
3. Inserir dados de teste manualmente
4. Executar teste: test_staging.bat
    |
    v
SUCESSO (mas sem dados reais para validar)


CENÁRIO 3: Tenho acesso direto à produção
    |
    v
1. Usar database de produção diretamente (cuidado!)
2. set DB_NAME=kaniu_prod
3. Executar teste: test_staging.bat
    |
    v
⚠️ ATENÇÃO: Teste modifica dados!
   Recomendado: Fazer em cópia/staging


CENÁRIO 4: Primeira vez, sem nada configurado
    |
    v
1. Diagnóstico: check_environment.bat
2. Resolver problemas identificados
3. Seguir SETUP_STAGING.md
4. Executar teste: test_staging.bat
    |
    v
SUCESSO
```

## Quick Decision Matrix

| Situação | Ação Imediata | Documento |
|----------|---------------|-----------|
| Nunca executei antes | `check_environment.bat` | SETUP_STAGING.md |
| Erro de conexão | Verificar serviço PostgreSQL | TROUBLESHOOTING.md #1 |
| Erro "psql não encontrado" | Adicionar ao PATH | TROUBLESHOOTING.md #4 |
| Erro "database não existe" | Criar database | SETUP_STAGING.md Opção 2 |
| Erro "tabela não existe" | Aplicar Prisma migrations | SETUP_STAGING.md Passo 3 |
| Script falhou | Ver logs | TROUBLESHOOTING.md #scripts |
| Validação falhou | Ver critérios específicos | STAGING_TEST_GUIDE.md Passo 4 |
| Tudo funcionou | Prosseguir para produção | README.md |

## Comandos por Problema

### Setup Inicial
```cmd
check_environment.bat                    # Diagnóstico
```

### Problemas de Conexão
```cmd
sc query postgresql-x64-14               # Ver status do serviço
sc start postgresql-x64-14               # Iniciar serviço
psql -U postgres -c "SELECT 1;"          # Testar conexão
```

### Problemas de Database
```cmd
psql -U postgres -l                      # Listar databases
psql -U postgres -c "CREATE DATABASE x;" # Criar database
pg_restore -U postgres -d x backup.backup # Restaurar
```

### Problemas de Schema
```cmd
npx prisma migrate deploy                # Aplicar migrations
psql -d x -c "\dt"                       # Ver tabelas
```

### Execução de Teste
```cmd
test_staging.bat                         # Teste completo
type logs\staging_test_*\*.log           # Ver logs
```

---

## Em Caso de Dúvida

1. **Primeiro**: `check_environment.bat`
2. **Se conecta mas falha**: Ver logs em `logs/staging_test_*/`
3. **Se não conecta**: `TROUBLESHOOTING.md`
4. **Setup inicial**: `SETUP_STAGING.md`
5. **Validação detalhada**: `STAGING_TEST_GUIDE.md`

---

**Última atualização**: 2025-01-12
