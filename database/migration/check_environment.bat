@echo off
REM =====================================================
REM Script de Diagnóstico de Ambiente - Windows
REM =====================================================

echo ====================================================
echo DIAGNOSTICO DO AMBIENTE DE STAGING
echo ====================================================
echo.

REM Configuração
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432
if not defined DB_USER set DB_USER=postgres

echo Configuracao atual:
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo - User: %DB_USER%
echo.

REM 1. Verificar se psql está disponível
echo [1/7] Verificando psql...
where psql > nul 2>&1
if errorlevel 1 (
    echo [ERRO] psql nao encontrado no PATH
    echo.
    echo Solucoes:
    echo 1. Adicionar ao PATH: set PATH=%%PATH%%;C:\Program Files\PostgreSQL\14\bin
    echo 2. Ou usar caminho completo: "C:\Program Files\PostgreSQL\14\bin\psql.exe"
    echo.
    goto :end
) else (
    for /f "tokens=*" %%i in ('where psql') do echo [OK] psql encontrado: %%i
)

REM 2. Verificar versão do PostgreSQL
echo.
echo [2/7] Verificando versao do PostgreSQL...
for /f "tokens=3" %%i in ('psql --version') do (
    echo [OK] Versao: %%i
    goto :version_ok
)
:version_ok

REM 3. Verificar se o serviço está rodando
echo.
echo [3/7] Verificando servico PostgreSQL...
sc query | findstr /i "postgresql" > nul
if errorlevel 1 (
    echo [AVISO] Servico PostgreSQL nao encontrado
    echo Tentando nomes comuns...
    sc query postgresql-x64-14 > nul 2>&1
    if not errorlevel 1 (
        echo [OK] Encontrado: postgresql-x64-14
        sc query postgresql-x64-14 | findstr "RUNNING"
        if errorlevel 1 (
            echo [ERRO] Servico nao esta rodando
            echo Para iniciar: sc start postgresql-x64-14
            goto :end
        ) else (
            echo [OK] Servico esta rodando
        )
    )
) else (
    echo [OK] Servico PostgreSQL encontrado
)

REM 4. Verificar porta
echo.
echo [4/7] Verificando porta %DB_PORT%...
netstat -an | findstr ":%DB_PORT% " | findstr "LISTENING" > nul
if errorlevel 1 (
    echo [AVISO] Porta %DB_PORT% nao esta escutando
    echo PostgreSQL pode estar em outra porta
) else (
    echo [OK] Porta %DB_PORT% esta escutando
)

REM 5. Testar conexão
echo.
echo [5/7] Testando conexao...
if not defined PGPASSWORD (
    set /p PGPASSWORD="Senha do PostgreSQL: "
)
set PGHOST=%DB_HOST%
set PGPORT=%DB_PORT%
set PGUSER=%DB_USER%

psql -d postgres -c "SELECT version();" > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Nao foi possivel conectar
    echo.
    echo Verificacoes:
    echo 1. Senha correta?
    echo 2. Usuario existe?
    echo 3. pg_hba.conf permite conexao?
    echo.
    echo Teste manual: psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres
    goto :end
) else (
    echo [OK] Conexao estabelecida
)

REM 6. Listar databases
echo.
echo [6/7] Listando databases disponiveis...
echo.
psql -d postgres -tc "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
echo.

REM 7. Verificar tabelas antigas (se database especificado)
if defined DB_NAME (
    echo [7/7] Verificando database %DB_NAME%...
    psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" | findstr /r "1" > nul
    if errorlevel 1 (
        echo [AVISO] Database %DB_NAME% nao existe
        echo.
        echo Para criar: psql -d postgres -c "CREATE DATABASE %DB_NAME%;"
    ) else (
        echo [OK] Database %DB_NAME% existe
        echo.
        echo Verificando tabelas antigas...
        psql -d %DB_NAME% -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('medicamento', 'prescricao', 'prescricao_tarefa', 'receita', 'animais');" 2> nul
        if errorlevel 1 (
            echo [AVISO] Nao foi possivel verificar tabelas (database vazio?)
        )

        echo.
        echo Verificando tabelas novas...
        psql -d %DB_NAME% -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('medications', 'prescriptions', 'prescription_tasks');" 2> nul
        if errorlevel 1 (
            echo [AVISO] Nao foi possivel verificar tabelas novas
            echo.
            echo Aplique o schema Prisma primeiro:
            echo   cd c:\Users\Caramelo\Documents\GitHub\kaniu-webapp
            echo   set DATABASE_URL=postgresql://%DB_USER%:senha@%DB_HOST%:%DB_PORT%/%DB_NAME%
            echo   npx prisma migrate deploy
        )
    )
) else (
    echo [7/7] Pulando verificacao de database (DB_NAME nao definido)
    echo.
    echo Para verificar um database especifico:
    echo   set DB_NAME=nome_do_database
    echo   check_environment.bat
)

echo.
echo ====================================================
echo DIAGNOSTICO CONCLUIDO
echo ====================================================
echo.
echo Proximo passo:
echo 1. Se tudo OK: execute test_staging.bat
echo 2. Se houver problemas: consulte SETUP_STAGING.md
echo.

:end
pause
