@echo off
echo Finalizando servicos do Kaniu WebApp...
echo.

REM Finalizar Node.js
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Processos Node.js finalizados
) else (
    echo [--] Nenhum processo Node.js encontrado
)

REM Liberar porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Porta 3000 liberada
    )
)

REM Limpar cache
if exist .next (
    rmdir /s /q .next >nul 2>&1
    echo [OK] Cache .next removido
)

echo.
echo Todos os servicos foram finalizados!
echo.
