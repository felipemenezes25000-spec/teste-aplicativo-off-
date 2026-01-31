@echo off
chcp 65001 >nul
echo Verificando se Backend e Frontend estao rodando...
echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8001/docs' -UseBasicParsing -TimeoutSec 3; Write-Host 'BACKEND: OK (porta 8001)' -ForegroundColor Green } catch { Write-Host 'BACKEND: NAO respondeu em :8001' -ForegroundColor Red }"
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:8081' -UseBasicParsing -TimeoutSec 3; Write-Host 'FRONTEND: OK (porta 8081)' -ForegroundColor Green } catch { Write-Host 'FRONTEND: NAO respondeu em :8081' -ForegroundColor Red }"

echo.
echo Se ambos OK, acesse: http://localhost:8081 (app) e http://localhost:8001/docs (API)
pause
