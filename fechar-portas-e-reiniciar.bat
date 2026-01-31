@echo off
chcp 65001 >nul
echo ========================================
echo   Fechando portas e reiniciando
echo ========================================

echo Fechando processos nas portas 8001, 8081, 19000...
powershell -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; 8001,8081,19000,19001 | ForEach-Object { $p=$_; Get-NetTCPConnection -LocalPort $p -State Listen -EA 0 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA 0; Write-Host 'Porta' $p 'liberada' } }"
timeout /t 2 /nobreak >nul

echo.
echo Abrindo BACKEND (janela 1)...
start "RenoveJa+ BACKEND" cmd /k "cd /d "%~dp0backend" && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"
timeout /t 4 /nobreak >nul

echo Abrindo FRONTEND (janela 2)...
start "RenoveJa+ FRONTEND" cmd /k "cd /d "%~dp0frontend" && yarn start"

echo.
echo ========================================
echo   Duas janelas foram abertas.
echo   Backend:  http://localhost:8001
echo   Docs:    http://localhost:8001/docs
echo   Frontend: http://localhost:8081
echo   Aguarde ~10 segundos para subirem.
echo ========================================
pause
