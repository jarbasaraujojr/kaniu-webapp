@echo off
REM =====================================================
REM Script de Teste em Staging - Windows
REM =====================================================

setlocal EnableDelayedExpansion

echo ====================================================
echo TESTE DE MIGRACAO EM STAGING
echo ====================================================
echo.

REM Configuração (pode ser sobrescrito por variáveis de ambiente)
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432
if not defined DB_USER set DB_USER=postgres
if not defined DB_NAME set DB_NAME=kaniu_staging

REM Exibir configuração
echo Configuracao:
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo - User: %DB_USER%
echo - Database: %DB_NAME%
echo.

REM Solicitar senha se não estiver em PGPASSWORD
if not defined PGPASSWORD (
    set /p DB_PASSWORD="Senha do PostgreSQL: "
    set PGPASSWORD=!DB_PASSWORD!
) else (
    echo Usando senha de PGPASSWORD
)

REM Definir variáveis de ambiente do PostgreSQL
set PGHOST=%DB_HOST%
set PGPORT=%DB_PORT%
set PGUSER=%DB_USER%

echo.
echo Testando conexao com postgres...
psql -d postgres -c "SELECT version();" > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Nao foi possivel conectar ao PostgreSQL
    echo.
    echo Verificacoes:
    echo 1. PostgreSQL esta rodando? Tente: sc query postgresql-x64-14
    echo 2. Senha esta correta?
    echo 3. Usuario tem permissoes?
    echo 4. Firewall bloqueando porta %DB_PORT%?
    echo.
    echo Para testar manualmente:
    echo   psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres
    echo.
    pause
    exit /b 1
)
echo [OK] Conexao com PostgreSQL estabelecida

echo.
echo Verificando se database %DB_NAME% existe...
psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" | findstr /r "1" > nul
if errorlevel 1 (
    echo [AVISO] Database %DB_NAME% nao existe
    echo.
    set /p CREATE_DB="Deseja criar o database agora? (S/N): "
    if /i "!CREATE_DB!"=="S" (
        echo Criando database %DB_NAME%...
        psql -d postgres -c "CREATE DATABASE %DB_NAME%;"
        if errorlevel 1 (
            echo [ERRO] Falha ao criar database
            pause
            exit /b 1
        )
        echo [OK] Database criado
    ) else (
        echo.
        echo Por favor, crie o database primeiro:
        echo   psql -d postgres -c "CREATE DATABASE %DB_NAME%;"
        echo.
        echo Ou restaure um backup:
        echo   pg_restore -h %DB_HOST% -U %DB_USER% -d %DB_NAME% backup.backup
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Database %DB_NAME% existe

echo.
echo Testando conexao com %DB_NAME%...
psql -d %DB_NAME% -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Nao foi possivel conectar ao database %DB_NAME%
    pause
    exit /b 1
)
echo [OK] Conexao estabelecida
echo.

REM Criar diretório de logs
set LOG_DIR=logs\staging_test_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_DIR=%LOG_DIR: =0%
mkdir "%LOG_DIR%" 2>nul

set PGPASSWORD=%DB_PASSWORD%
set PGHOST=%DB_HOST%
set PGPORT=%DB_PORT%
set PGUSER=%DB_USER%

REM Executar apenas scripts de medicação para teste
echo ====================================================
echo EXECUTANDO SCRIPTS DE MEDICACAO
echo ====================================================
echo.

echo [18/20] Migrando medicamentos...
psql -d %DB_NAME% -f scripts\18_migrate_medications.sql > "%LOG_DIR%\18_medications.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 18 falhou
    type "%LOG_DIR%\18_medications.log"
    pause
    exit /b 1
)
echo [OK] Medicamentos migrados

echo [19/20] Migrando prescrições...
psql -d %DB_NAME% -f scripts\19_migrate_prescriptions.sql > "%LOG_DIR%\19_prescriptions.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 19 falhou
    type "%LOG_DIR%\19_prescriptions.log"
    pause
    exit /b 1
)
echo [OK] Prescrições migradas

echo [20/20] Migrando tarefas...
psql -d %DB_NAME% -f scripts\20_migrate_prescription_tasks.sql > "%LOG_DIR%\20_tasks.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 20 falhou
    type "%LOG_DIR%\20_tasks.log"
    pause
    exit /b 1
)
echo [OK] Tarefas migradas

echo.
echo ====================================================
echo VALIDACAO
echo ====================================================
echo.

REM Validar contagens
echo Validando contagens...
psql -d %DB_NAME% -c "SELECT 'medications' as tabela, COUNT(*) as total FROM medications UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks;"

echo.
echo ====================================================
echo TESTE CONCLUIDO
echo ====================================================
echo Logs salvos em: %LOG_DIR%
echo.
echo Revise os logs e valide os resultados.
echo Se tudo estiver OK, execute a migração em produção.
echo.

explorer "%LOG_DIR%"
pause
