@echo off
echo ============================================
echo  Finalizando Servicos do Kaniu WebApp
echo ============================================
echo.

echo [1/4] Finalizando processos Next.js...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *next dev*" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Next.js finalizado
) else (
    echo - Nenhum processo Next.js encontrado
)
echo.

echo [2/4] Finalizando todos os processos Node.js...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Node.js finalizado
) else (
    echo - Nenhum processo Node.js encontrado
)
echo.

echo [3/4] Liberando portas 3000, 5432 e outras comuns...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Porta 3000 liberada (PID: %%a)
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5432" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Porta 5432 liberada (PID: %%a)
    )
)
echo.

echo [4/4] Limpando cache do Next.js...
if exist .next (
    rmdir /s /q .next 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Cache .next removido
    )
) else (
    echo - Sem cache .next para limpar
)
echo.

echo ============================================
echo  Todos os servicos foram finalizados!
echo ============================================
echo.
echo Processos Node.js restantes:
tasklist | findstr "node.exe" || echo - Nenhum processo Node.js em execucao
echo.

echo Portas em uso:
netstat -ano | findstr ":3000" || echo - Porta 3000 livre
netstat -ano | findstr ":5432" || echo - Porta 5432 livre
echo.

pause
