@echo off
chcp 65001 > nul
echo ========================================
echo   Testando Frontend RenoveJá+
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1] Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERRO: Node.js não encontrado!
    pause
    exit /b 1
)

echo.
echo [2] Verificando Yarn...
yarn --version
if errorlevel 1 (
    echo ERRO: Yarn não encontrado!
    pause
    exit /b 1
)

echo.
echo [3] Verificando node_modules...
if not exist "node_modules" (
    echo Instalando dependências...
    yarn install
)

echo.
echo [4] Iniciando Expo...
echo    Quando aparecer o menu, pressione W para abrir no navegador
echo    Acesse: http://localhost:8081
echo.
yarn start

pause
