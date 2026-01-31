@echo off
chcp 65001 >nul
echo ========================================
echo   RenoveJa+ - Iniciando BACKEND e FRONTEND
echo ========================================
echo.
echo Abrindo 2 janelas: Backend e Frontend.
echo Feche as janelas ou pressione Ctrl+C em cada uma para parar.
echo.

start "RenoveJa+ BACKEND" cmd /k "cd /d "%~dp0" && run-backend.bat"
timeout /t 3 /nobreak >nul
start "RenoveJa+ FRONTEND" cmd /k "cd /d "%~dp0" && run-frontend.bat"

echo.
echo Janelas abertas. Backend: http://localhost:8001  Frontend: http://localhost:8081
echo.
pause
