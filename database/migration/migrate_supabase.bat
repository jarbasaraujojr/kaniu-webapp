@echo off
REM =====================================================
REM Migração Remota - Supabase
REM =====================================================

setlocal EnableDelayedExpansion

echo ====================================================
echo MIGRACAO REMOTA - SUPABASE
echo ====================================================
echo.

REM Extrair credenciais do .env
echo Lendo credenciais do .env...
for /f "tokens=1,2 delims==" %%a in ('type ..\..\..\.env ^| findstr "DATABASE_URL"') do (
    set DB_URL=%%b
)

REM Remover aspas
set DB_URL=%DB_URL:"=%

REM Parsear connection string
REM Format: postgresql://USER:PASS@HOST:PORT/DB
for /f "tokens=1,2,3 delims=:/@" %%a in ("%DB_URL%") do (
    set PROTOCOL=%%a
    set USER=%%b
)

REM Extrair host, port, database
echo %DB_URL% | findstr /r "postgresql://.*@.*:.*/" > nul
if errorlevel 1 (
    echo [ERRO] Connection string invalida no .env
    pause
    exit /b 1
)

REM Configuração extraída
set PGHOST=db.hgqhtkgmonshnsuevnoz.supabase.co
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=Tqsd17IeEkIygpZP
set PGDATABASE=postgres

echo Configuracao:
echo - Host: %PGHOST%
echo - Port: %PGPORT%
echo - User: %PGUSER%
echo - Database: %PGDATABASE%
echo.

REM Verificar se psql está disponível
where psql > nul 2>&1
if errorlevel 1 (
    echo [ERRO] psql nao encontrado!
    echo.
    echo Opcoes:
    echo 1. Instalar cliente PostgreSQL: https://www.enterprisedb.com/download-postgresql-binaries
    echo 2. Usar Docker: docker run -it --rm postgres:14 psql -h %PGHOST% -U %PGUSER% -d %PGDATABASE%
    echo 3. Usar SQL Editor no Supabase Dashboard
    echo.
    pause
    exit /b 1
)

echo [OK] psql encontrado
echo.

REM Testar conexão
echo Testando conexao com Supabase...
psql -c "SELECT version();" > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Nao foi possivel conectar ao Supabase
    echo.
    echo Verificacoes:
    echo 1. Connection string no .env esta correta?
    echo 2. Senha esta correta?
    echo 3. IP esta permitido no Supabase? (Settings -^> Database -^> Restrictions)
    echo 4. Tem conexao com internet?
    echo.
    echo Testar manualmente:
    echo   psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE%
    echo.
    pause
    exit /b 1
)
echo [OK] Conectado ao Supabase!
echo.

REM Verificar backup
echo ====================================================
echo VERIFICACAO DE SEGURANCA
echo ====================================================
echo.
echo ATENCAO: Voce esta prestes a modificar a base de PRODUCAO no Supabase!
echo.
set /p BACKUP_OK="Voce fez backup da base de dados? (S/N): "
if /i not "%BACKUP_OK%"=="S" (
    echo.
    echo POR FAVOR, FACA BACKUP PRIMEIRO!
    echo.
    echo Como fazer:
    echo 1. Acesse: https://app.supabase.com
    echo 2. Database -^> Backups -^> Create backup
    echo 3. Aguarde finalizar e download
    echo.
    echo Ou via CLI:
    echo   pg_dump -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -F c -f backup_producao.backup
    echo.
    pause
    exit /b 1
)

echo.
set /p CONFIRM="Tem CERTEZA que deseja continuar com a migracao? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Migracao cancelada.
    pause
    exit /b 0
)

REM Verificar tabelas antigas existem
echo.
echo Verificando tabelas antigas...
psql -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('medicamento', 'prescricao', 'prescricao_tarefa', 'receita');" > temp_count.txt
set /p OLD_TABLES=<temp_count.txt
del temp_count.txt

if "%OLD_TABLES%"=="0" (
    echo [ERRO] Tabelas antigas nao encontradas!
    echo A base de dados parece nao ter os dados para migrar.
    pause
    exit /b 1
)
echo [OK] Tabelas antigas encontradas

REM Verificar tabelas novas existem
echo.
echo Verificando tabelas novas (Prisma)...
psql -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('medications', 'prescriptions', 'prescription_tasks');" > temp_count.txt
set /p NEW_TABLES=<temp_count.txt
del temp_count.txt

if "%NEW_TABLES%"=="3" (
    echo [OK] Tabelas novas existem
) else (
    echo [AVISO] Tabelas novas nao encontradas (encontradas: %NEW_TABLES%/3^)
    echo.
    set /p APPLY_PRISMA="Deseja aplicar migrations do Prisma agora? (S/N): "
    if /i "!APPLY_PRISMA!"=="S" (
        echo.
        echo Aplicando Prisma migrations...
        cd ..\..
        call npx prisma migrate deploy
        if errorlevel 1 (
            echo [ERRO] Falha ao aplicar migrations
            pause
            exit /b 1
        )
        cd database\migration
        echo [OK] Migrations aplicadas
    ) else (
        echo.
        echo Por favor, aplique as migrations Prisma primeiro:
        echo   cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
        echo   npx prisma migrate deploy
        echo.
        pause
        exit /b 1
    )
)

REM Criar diretório de logs
set LOG_DIR=logs\supabase_migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_DIR=%LOG_DIR: =0%
mkdir "%LOG_DIR%" 2>nul

echo.
echo ====================================================
echo EXECUTANDO MIGRACAO
echo ====================================================
echo.
echo Logs serao salvos em: %LOG_DIR%
echo.

REM Script 18: Medicamentos
echo [1/3] Migrando medicamentos...
psql -f scripts\18_migrate_medications.sql > "%LOG_DIR%\18_medications.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 18 falhou!
    echo.
    echo Ver detalhes em: %LOG_DIR%\18_medications.log
    type "%LOG_DIR%\18_medications.log"
    echo.
    pause
    exit /b 1
)
echo [OK] Medicamentos migrados

REM Script 19: Prescrições
echo [2/3] Migrando prescricoes...
psql -f scripts\19_migrate_prescriptions.sql > "%LOG_DIR%\19_prescriptions.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 19 falhou!
    echo.
    echo Ver detalhes em: %LOG_DIR%\19_prescriptions.log
    type "%LOG_DIR%\19_prescriptions.log"
    echo.
    pause
    exit /b 1
)
echo [OK] Prescricoes migradas

REM Script 20: Tarefas
echo [3/3] Migrando tarefas de administracao...
psql -f scripts\20_migrate_prescription_tasks.sql > "%LOG_DIR%\20_tasks.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 20 falhou!
    echo.
    echo Ver detalhes em: %LOG_DIR%\20_tasks.log
    type "%LOG_DIR%\20_tasks.log"
    echo.
    pause
    exit /b 1
)
echo [OK] Tarefas migradas

echo.
echo ====================================================
echo VALIDACAO
echo ====================================================
echo.

echo Contagens:
psql -c "SELECT 'medications' as tabela, COUNT(*) as total FROM medications UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks;"

echo.
echo Verificando integridade referencial:
psql -c "SELECT COUNT(*) as orphan_prescriptions FROM prescriptions p LEFT JOIN medications m ON p.medication_id = m.id WHERE m.id IS NULL;"

echo.
echo ====================================================
echo MIGRACAO CONCLUIDA!
echo ====================================================
echo.
echo Logs salvos em: %LOG_DIR%
echo.
echo Proximo passo:
echo 1. Revisar logs detalhadamente
echo 2. Validar dados no Supabase Dashboard
echo 3. Testar aplicacao com dados migrados
echo.

explorer "%LOG_DIR%"
pause
