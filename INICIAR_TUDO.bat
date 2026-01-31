@echo off
chcp 65001 > nul
title RenoveJá+ - Iniciando Sistema
color 0B

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║          🏥 RenoveJá+ - Sistema Completo              ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

:: Verificar se estamos no diretório correto
if not exist "backend\server.py" (
    echo [ERRO] Execute este script na pasta raiz do projeto!
    pause
    exit /b 1
)

echo [1/4] Verificando Python...
python --version > nul 2>&1
if errorlevel 1 (
    echo      ❌ Python não encontrado! Instale em python.org
    pause
    exit /b 1
)
echo      ✓ Python OK

echo.
echo [2/4] Verificando Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo      ❌ Node.js não encontrado! Instale em nodejs.org
    pause
    exit /b 1
)
echo      ✓ Node.js OK

echo.
echo [3/4] Iniciando Backend (porta 8001)...
start "BACKEND - RenoveJa+" cmd /k "cd /d %~dp0backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"
timeout /t 3 > nul

echo.
echo [4/4] Iniciando Frontend (porta 8081)...
start "FRONTEND - RenoveJa+" cmd /k "cd /d %~dp0frontend && if not exist node_modules (yarn install) && yarn start"

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║                   ✅ SISTEMA INICIADO                 ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║                                                       ║
echo  ║  Backend API:  http://localhost:8001/docs             ║
echo  ║  Frontend App: http://localhost:8081                  ║
echo  ║                                                       ║
echo  ║  Usuários de teste:                                   ║
echo  ║    📧 teste@renoveja.com / Teste123!                  ║
echo  ║    👨‍⚕️ medico@renoveja.com / Teste123!                 ║
echo  ║                                                       ║
echo  ║  ⚠️  Na janela do Frontend, pressione W para abrir    ║
echo  ║      o app no navegador web                           ║
echo  ║                                                       ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

:: Aguardar e abrir navegador
echo Abrindo documentação da API em 5 segundos...
timeout /t 5 > nul
start http://localhost:8001/docs

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
