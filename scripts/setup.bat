@echo off
echo.
echo ============================
echo    RenoveJa - Setup Script
echo ============================
echo.

:: Backend Setup
echo [1/3] Configurando Backend...
cd backend

if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt -q

if not exist .env (
    echo Criando .env a partir do exemplo...
    copy .env.example .env
    echo.
    echo ATENCAO: Edite backend\.env com suas credenciais!
    echo.
)

cd ..

:: Frontend Setup
echo.
echo [2/3] Configurando Frontend...
cd frontend

echo Instalando dependencias...
call yarn install

if not exist .env (
    echo Criando .env a partir do exemplo...
    copy .env.example .env
)

cd ..

:: Done
echo.
echo [3/3] Setup completo!
echo.
echo Para rodar o projeto:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn server:app --reload --port 8001
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   yarn start
echo.
echo Boa sorte!
pause
