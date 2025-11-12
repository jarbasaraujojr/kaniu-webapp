@echo off
REM =====================================================
REM Script de Execução da Migração - Windows
REM =====================================================
REM Execute este script para rodar toda a migração
REM =====================================================

setlocal EnableDelayedExpansion

echo ====================================================
echo MIGRAÇÃO DE BASE DE DADOS - KANIU
echo ====================================================
echo.

REM ==================
REM CONFIGURAÇÕES
REM ==================
echo Por favor, configure as variáveis de conexão:
echo.

set /p DB_HOST="Host da base de dados (localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Porta (5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="Usuário PostgreSQL: "
if "%DB_USER%"=="" (
    echo ERRO: Usuário é obrigatório
    pause
    exit /b 1
)

set /p DB_OLD="Nome da base ANTIGA: "
if "%DB_OLD%"=="" (
    echo ERRO: Nome da base antiga é obrigatório
    pause
    exit /b 1
)

set /p DB_NEW="Nome da base NOVA: "
if "%DB_NEW%"=="" (
    echo ERRO: Nome da base nova é obrigatório
    pause
    exit /b 1
)

echo.
echo ====================================================
echo CONFIGURAÇÃO
echo ====================================================
echo Host: %DB_HOST%:%DB_PORT%
echo Usuário: %DB_USER%
echo Base Antiga: %DB_OLD%
echo Base Nova: %DB_NEW%
echo ====================================================
echo.

set /p CONFIRM="Confirmar configuração? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Migração cancelada pelo usuário.
    pause
    exit /b 0
)

REM ==================
REM TESTAR CONEXÕES
REM ==================
echo.
echo Testando conexões...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_OLD% -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo ERRO: Não foi possível conectar à base antiga
    pause
    exit /b 1
)
echo [OK] Conexão com base antiga

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NEW% -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo ERRO: Não foi possível conectar à base nova
    pause
    exit /b 1
)
echo [OK] Conexão com base nova

REM ==================
REM CRIAR DIRETÓRIO DE LOGS
REM ==================
if not exist "logs" mkdir logs
set LOG_DIR=logs\migration_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set LOG_DIR=%LOG_DIR: =0%
mkdir "%LOG_DIR%"

echo.
echo Logs serão salvos em: %LOG_DIR%
echo.

REM ==================
REM AVISOS
REM ==================
echo ====================================================
echo AVISOS IMPORTANTES
echo ====================================================
echo.
echo - A migração pode demorar 7-12 horas
echo - Recomenda-se executar em horário de baixo uso
echo - Um backup será criado antes da migração
echo - Todos os usuários precisarão resetar senhas
echo.
echo ====================================================
echo.

set /p CONTINUE="Deseja continuar? (S/N): "
if /i not "%CONTINUE%"=="S" (
    echo Migração cancelada pelo usuário.
    pause
    exit /b 0
)

REM ==================
REM INÍCIO DA MIGRAÇÃO
REM ==================
echo.
echo ====================================================
echo INICIANDO MIGRAÇÃO
echo ====================================================
echo Horário de início: %date% %time%
echo ====================================================
echo.

REM Definir variáveis de ambiente para psql
set PGHOST=%DB_HOST%
set PGPORT=%DB_PORT%
set PGUSER=%DB_USER%
set PGDATABASE=%DB_NEW%

REM Array de scripts
set SCRIPTS[1]=01_backup.sql
set SCRIPTS[2]=02_create_mapping_tables.sql
set SCRIPTS[3]=03_data_quality_check.sql
set SCRIPTS[4]=04_migrate_roles.sql
set SCRIPTS[5]=05_migrate_catalogs.sql
set SCRIPTS[6]=06_migrate_users.sql
set SCRIPTS[7]=07_migrate_shelters.sql
set SCRIPTS[8]=08_migrate_animals.sql
set SCRIPTS[9]=09_migrate_animal_photos.sql
set SCRIPTS[10]=10_migrate_animal_weights.sql
set SCRIPTS[11]=11_migrate_documents.sql
set SCRIPTS[12]=12_migrate_medical_records.sql
set SCRIPTS[13]=13_migrate_adoption_events.sql
set SCRIPTS[14]=14_migrate_animal_events.sql
set SCRIPTS[15]=15_migrate_favorites.sql
set SCRIPTS[16]=16_validate_migration.sql
set SCRIPTS[17]=17_cleanup.sql

REM Executar cada script
for /L %%i in (1,1,17) do (
    set SCRIPT=!SCRIPTS[%%i]!
    set SCRIPT_PATH=scripts\!SCRIPT!
    set LOG_FILE=%LOG_DIR%\!SCRIPT:.sql=.log!

    echo.
    echo [%%i/17] Executando !SCRIPT!...
    echo ----------------------------------------------------

    REM Script 01 e 03 executam na base antiga
    if %%i==1 (
        psql -d %DB_OLD% -f "!SCRIPT_PATH!" > "!LOG_FILE!" 2>&1
    ) else if %%i==3 (
        psql -d %DB_OLD% -f "!SCRIPT_PATH!" > "!LOG_FILE!" 2>&1
    ) else (
        psql -d %DB_NEW% -f "!SCRIPT_PATH!" > "!LOG_FILE!" 2>&1
    )

    if errorlevel 1 (
        echo [ERRO] Falha ao executar !SCRIPT!
        echo Verifique o log: !LOG_FILE!
        echo.
        echo ====================================================
        echo MIGRAÇÃO FALHOU
        echo ====================================================
        echo Script com erro: !SCRIPT!
        echo Log: !LOG_FILE!
        echo.
        set /p ROLLBACK="Deseja executar rollback? (S/N): "
        if /i "!ROLLBACK!"=="S" (
            echo Executando rollback...
            psql -d %DB_NEW% -f scripts\rollback\rollback_all.sql
        )
        pause
        exit /b 1
    )

    echo [OK] !SCRIPT! concluído

    REM Pausas estratégicas para revisão
    if %%i==3 (
        echo.
        echo ====================================================
        echo PONTO DE VERIFICAÇÃO: Análise de Qualidade
        echo ====================================================
        echo Revise o arquivo: !LOG_FILE!
        echo Verifique se há problemas críticos antes de continuar.
        echo.
        set /p CONTINUE_AFTER_QC="Continuar? (S/N): "
        if /i not "!CONTINUE_AFTER_QC!"=="S" (
            echo Migração interrompida pelo usuário.
            pause
            exit /b 0
        )
    )

    if %%i==16 (
        echo.
        echo ====================================================
        echo PONTO DE VERIFICAÇÃO: Validação
        echo ====================================================
        echo Revise o arquivo: !LOG_FILE!
        echo Verifique se há erros na validação.
        echo.
        set /p CONTINUE_AFTER_VAL="Continuar? (S/N): "
        if /i not "!CONTINUE_AFTER_VAL!"=="S" (
            echo Migração interrompida pelo usuário.
            pause
            exit /b 0
        )
    )
)

REM ==================
REM FINALIZAÇÃO
REM ==================
echo.
echo ====================================================
echo MIGRAÇÃO CONCLUÍDA COM SUCESSO!
echo ====================================================
echo Horário de término: %date% %time%
echo.
echo Logs salvos em: %LOG_DIR%
echo.
echo PRÓXIMOS PASSOS:
echo 1. Revise os logs de validação
echo 2. Execute testes da aplicação
echo 3. Configure sistema de reset de senha
echo 4. Notifique usuários sobre a migração
echo 5. Mantenha base antiga em modo read-only por 90 dias
echo.
echo ====================================================

REM Abrir diretório de logs
explorer "%LOG_DIR%"

pause
exit /b 0
