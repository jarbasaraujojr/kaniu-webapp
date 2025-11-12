@echo off
REM =====================================================
REM Script de Teste em Staging - Windows
REM =====================================================

setlocal EnableDelayedExpansion

echo ====================================================
echo TESTE DE MIGRACAO EM STAGING
echo ====================================================
echo.

REM Configuração
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_OLD=kaniu_staging
set DB_NEW=kaniu_staging

set /p DB_PASSWORD="Senha do PostgreSQL: "

echo.
echo Testando conexão...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NEW% -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo ERRO: Não foi possível conectar
    pause
    exit /b 1
)
echo [OK] Conexão estabelecida
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
psql -d %DB_NEW% -f scripts\18_migrate_medications.sql > "%LOG_DIR%\18_medications.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 18 falhou
    type "%LOG_DIR%\18_medications.log"
    pause
    exit /b 1
)
echo [OK] Medicamentos migrados

echo [19/20] Migrando prescrições...
psql -d %DB_NEW% -f scripts\19_migrate_prescriptions.sql > "%LOG_DIR%\19_prescriptions.log" 2>&1
if errorlevel 1 (
    echo [ERRO] Script 19 falhou
    type "%LOG_DIR%\19_prescriptions.log"
    pause
    exit /b 1
)
echo [OK] Prescrições migradas

echo [20/20] Migrando tarefas...
psql -d %DB_NEW% -f scripts\20_migrate_prescription_tasks.sql > "%LOG_DIR%\20_tasks.log" 2>&1
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
psql -d %DB_NEW% -c "
SELECT 'medications' as tabela, COUNT(*) as total FROM medications
UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks;
"

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
