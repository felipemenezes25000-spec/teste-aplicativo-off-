@echo off
chcp 65001 > nul
echo ========================================
echo   Testando Backend RenoveJá+
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1] Verificando Python...
python --version
if errorlevel 1 (
    echo ERRO: Python não encontrado!
    pause
    exit /b 1
)

echo.
echo [2] Verificando dependências...
python -c "import fastapi, uvicorn, httpx, bcrypt; print('OK: Dependências instaladas')"
if errorlevel 1 (
    echo Instalando dependências...
    pip install -r requirements.txt
)

echo.
echo [3] Testando importação do servidor...
python -c "from server import app; print('OK: Servidor carregado -', app.title)"
if errorlevel 1 (
    echo ERRO: Falha ao carregar servidor!
    pause
    exit /b 1
)

echo.
echo [4] Iniciando servidor na porta 8001...
echo    Acesse: http://localhost:8001/docs
echo    Pressione Ctrl+C para parar
echo.
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001

pause
