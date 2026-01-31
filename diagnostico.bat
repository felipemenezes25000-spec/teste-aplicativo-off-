@echo off
chcp 65001 >nul
set LOG=%~dp0diagnostico_log.txt
echo Diagnostico RenoveJa+ > "%LOG%"
echo ==================== >> "%LOG%"
echo Data: %date% %time% >> "%LOG%"
echo. >> "%LOG%"

echo Verificando Python... >> "%LOG%"
python --version >> "%LOG%" 2>&1
if errorlevel 1 echo [ERRO] Python nao encontrado >> "%LOG%"

echo. >> "%LOG%"
echo Verificando backend\.env... >> "%LOG%"
if exist "%~dp0backend\.env" (echo backend\.env EXISTE >> "%LOG%") else (echo [ERRO] backend\.env NAO EXISTE >> "%LOG%")

echo. >> "%LOG%"
echo Testando import do server... >> "%LOG%"
cd /d "%~dp0backend"
python -c "import server; print('OK')" >> "%LOG%" 2>&1
if errorlevel 1 echo [ERRO] Falha ao importar server >> "%LOG%"

echo. >> "%LOG%"
echo Verificando Yarn no frontend... >> "%LOG%"
cd /d "%~dp0frontend"
yarn --version >> "%LOG%" 2>&1
if errorlevel 1 echo [ERRO] Yarn nao encontrado >> "%LOG%"

echo. >> "%LOG%"
echo Fim do diagnostico. >> "%LOG%"
echo.
echo Resultado salvo em: %LOG%
type "%LOG%"
pause
