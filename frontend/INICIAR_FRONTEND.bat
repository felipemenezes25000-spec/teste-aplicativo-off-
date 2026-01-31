@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   RenoveJa+ - Apenas FRONTEND (porta 8081)
echo ============================================
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    call yarn install
    if errorlevel 1 (
        echo [ERRO] yarn install falhou. Instale Node e Yarn.
        pause
        exit /b 1
    )
    echo.
)

echo Iniciando Expo...
echo Quando aparecer o menu, pressione W para abrir no navegador.
echo Ou acesse: http://localhost:8081
echo.
call yarn start

pause
