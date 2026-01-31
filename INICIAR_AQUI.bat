cz@echo off
chcp 65001 >nul
title RenoveJa+ - Iniciar Backend e Frontend
cd /d "%~dp0"

echo.
echo ============================================
echo   RenoveJa+ - Iniciando os dois servidores
echo ============================================
echo.

if not exist "backend\.env" (
    echo [AVISO] backend\.env nao encontrado.
    echo Copie backend\.env.example para backend\.env
    echo.
)

echo Verificando dependencias do FRONTEND...
if not exist "frontend\node_modules" (
    echo Instalando node_modules no frontend...
    cd /d "%~dp0frontend"
    call yarn install
    cd /d "%~dp0"
    echo.
)

echo 1. Iniciando BACKEND (porta 8001)...
start "BACKEND - RenoveJa+" cmd /k "cd /d "%~dp0backend" && echo Backend iniciando... && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"
echo    Janela do backend aberta.
echo.
timeout /t 3 /nobreak >nul

echo 2. Iniciando FRONTEND (porta 8081)...
start "FRONTEND - RenoveJa+" cmd /k "cd /d "%~dp0frontend" && (if not exist node_modules yarn install) && echo Aguarde o Metro Bundler... && yarn start"
echo    Janela do frontend aberta.
echo.
echo ============================================
echo   Duas janelas devem ter aberto.
echo   Backend:  http://localhost:8001
echo   Docs:     http://localhost:8001/docs
echo   Frontend: http://localhost:8081
echo ============================================
echo.
echo IMPORTANTE: Espere 15-30 segundos para o frontend subir.
echo Na janela do frontend, pressione W para abrir no navegador.
echo.
echo Se alguma janela fechar sozinha, houve erro.
echo Rode diagnostico.bat para ver o que falta.
echo.
pause
