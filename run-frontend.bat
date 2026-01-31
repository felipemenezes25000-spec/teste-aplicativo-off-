@echo off
chcp 65001 >nul
echo ========================================
echo   RenoveJa+ - Iniciando FRONTEND
echo ========================================
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Instalando dependencias...
    call yarn install
)

echo.
echo Iniciando Expo em http://localhost:8081
echo.
echo Teclas: a=Android  w=Web  i=iOS
echo Pressione Ctrl+C para parar.
echo ========================================

call yarn start

if errorlevel 1 (
    echo.
    echo [ERRO] O frontend encerrou com erro. Verifique a mensagem acima.
    pause
)
