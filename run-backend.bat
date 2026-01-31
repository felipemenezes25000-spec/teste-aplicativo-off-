@echo off
chcp 65001 >nul
echo ========================================
echo   RenoveJa+ - Iniciando BACKEND
echo ========================================
cd /d "%~dp0backend"

if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado em backend\
    echo Copie backend\.env.example para backend\.env e configure.
    pause
    exit /b 1
)

echo Instalando dependencias Python se necessario...
pip install -q -r requirements.txt 2>nul

echo.
echo Iniciando servidor em http://localhost:8001
echo Documentacao: http://localhost:8001/docs
echo.
echo Pressione Ctrl+C para parar.
echo ========================================

python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001

if errorlevel 1 (
    echo.
    echo [ERRO] O servidor encerrou com erro. Verifique a mensagem acima.
    pause
)
