@echo off
REM =====================================================
REM Backup Supabase - Base de Produção
REM =====================================================

setlocal EnableDelayedExpansion

echo ====================================================
echo BACKUP SUPABASE - BASE DE PRODUCAO
echo ====================================================
echo.

REM Configuração do Supabase (do .env)
set PGHOST=db.hgqhtkgmonshnsuevnoz.supabase.co
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=Tqsd17IeEkIygpZP
set PGDATABASE=postgres

echo Configuracao:
echo - Host: %PGHOST%
echo - User: %PGUSER%
echo - Database: %PGDATABASE%
echo.

REM Verificar se pg_dump está disponível
where pg_dump > nul 2>&1
if errorlevel 1 (
    echo [ERRO] pg_dump nao encontrado!
    echo.
    echo ALTERNATIVAS PARA FAZER BACKUP:
    echo.
    echo === OPCAO 1: Via Supabase Dashboard (MAIS FACIL) ===
    echo 1. Acesse: https://app.supabase.com
    echo 2. Selecione seu projeto
    echo 3. Va em Database -^> Backups
    echo 4. Clique em "Create backup"
    echo 5. Aguarde finalizar
    echo 6. Download do backup
    echo.
    echo === OPCAO 2: Instalar cliente PostgreSQL ===
    echo 1. Download: https://www.enterprisedb.com/download-postgresql-binaries
    echo 2. Extrair para C:\psql\
    echo 3. Adicionar ao PATH: set PATH=%%PATH%%;C:\psql\bin
    echo 4. Executar este script novamente
    echo.
    echo === OPCAO 3: Via Docker ===
    echo docker run --rm postgres:14 pg_dump -h %PGHOST% -U %PGUSER% -d %PGDATABASE% -F c ^> backup.backup
    echo.
    pause
    exit /b 1
)

echo [OK] pg_dump encontrado
echo.

REM Testar conexão
echo Testando conexao com Supabase...
psql -c "SELECT 1" > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Nao foi possivel conectar ao Supabase
    echo.
    echo Verificacoes:
    echo 1. Connection string esta correta?
    echo 2. IP esta permitido? (Supabase -^> Settings -^> Database -^> Restrictions)
    echo 3. Internet esta funcionando?
    echo.
    pause
    exit /b 1
)
echo [OK] Conectado!
echo.

REM Criar diretório de backups
set BACKUP_DIR=backups
mkdir "%BACKUP_DIR%" 2>nul

REM Nome do arquivo com timestamp
set TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo ====================================================
echo OPCOES DE BACKUP
echo ====================================================
echo.
echo 1. Backup COMPLETO (toda a base de dados)
echo 2. Backup ESSENCIAL (apenas tabelas de medicacao)
echo 3. Backup SCHEMA (apenas estrutura, sem dados)
echo.
set /p BACKUP_TYPE="Escolha uma opcao (1/2/3): "

if "%BACKUP_TYPE%"=="1" (
    echo.
    echo Criando backup COMPLETO...
    set BACKUP_FILE=%BACKUP_DIR%\supabase_full_%TIMESTAMP%.backup
    echo Arquivo: !BACKUP_FILE!
    echo.
    echo Isso pode demorar varios minutos...
    pg_dump -F c -b -v -f "!BACKUP_FILE!"
    if errorlevel 1 (
        echo [ERRO] Backup falhou
        pause
        exit /b 1
    )
    echo [OK] Backup completo criado!

) else if "%BACKUP_TYPE%"=="2" (
    echo.
    echo Criando backup ESSENCIAL (medicacao)...
    set BACKUP_FILE=%BACKUP_DIR%\supabase_medication_%TIMESTAMP%.backup
    echo Arquivo: !BACKUP_FILE!
    echo.
    pg_dump -F c -b -v ^
        --table=medicamento ^
        --table=medicamento_dosagem ^
        --table=medicamento_via ^
        --table=prescricao ^
        --table=prescricao_tarefa ^
        --table=receita ^
        --table=animais ^
        --table=usuarios ^
        -f "!BACKUP_FILE!"
    if errorlevel 1 (
        echo [ERRO] Backup falhou
        pause
        exit /b 1
    )
    echo [OK] Backup essencial criado!

) else if "%BACKUP_TYPE%"=="3" (
    echo.
    echo Criando backup de SCHEMA...
    set BACKUP_FILE=%BACKUP_DIR%\supabase_schema_%TIMESTAMP%.sql
    echo Arquivo: !BACKUP_FILE!
    echo.
    pg_dump -s -f "!BACKUP_FILE!"
    if errorlevel 1 (
        echo [ERRO] Backup falhou
        pause
        exit /b 1
    )
    echo [OK] Backup de schema criado!

) else (
    echo Opcao invalida
    pause
    exit /b 1
)

echo.
echo ====================================================
echo BACKUP CONCLUIDO!
echo ====================================================
echo.
echo Arquivo criado: %BACKUP_FILE%
echo.

REM Mostrar tamanho do arquivo
for %%A in ("%BACKUP_FILE%") do (
    set SIZE=%%~zA
    set /a SIZE_MB=!SIZE! / 1048576
    echo Tamanho: !SIZE_MB! MB
)

echo.
echo IMPORTANTE:
echo 1. Guarde este backup em local seguro
echo 2. Teste se o backup funciona antes de migrar
echo 3. Considere copiar para nuvem (Google Drive, Dropbox, etc.)
echo.

REM Testar backup
set /p TEST_BACKUP="Deseja testar se o backup esta valido? (S/N): "
if /i "%TEST_BACKUP%"=="S" (
    echo.
    echo Testando backup...
    if "%BACKUP_TYPE%"=="3" (
        REM Schema SQL - testar syntax
        psql -d postgres -f "%BACKUP_FILE%" --dry-run > nul 2>&1
    ) else (
        REM Binary backup - listar conteudo
        pg_restore -l "%BACKUP_FILE%" > nul 2>&1
    )

    if errorlevel 1 (
        echo [ERRO] Backup parece estar corrompido!
        echo Tente fazer backup novamente.
    ) else (
        echo [OK] Backup esta valido!
    )
)

echo.
echo Proximo passo:
echo   Execute: migrate_supabase.bat
echo.

explorer "%BACKUP_DIR%"
pause
