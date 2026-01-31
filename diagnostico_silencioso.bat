@echo off
chcp 65001 >nul
set LOG=%~dp0diagnostico_log.txt
echo Diagnostico RenoveJa+ > "%LOG%"
echo ==================== >> "%LOG%"
echo Data: %date% %time% >> "%LOG%"
echo. >> "%LOG%"

echo Verificando Python... >> "%LOG%"
python --version >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo Verificando backend\.env... >> "%LOG%"
if exist "%~dp0backend\.env" (echo backend\.env EXISTE >> "%LOG%") else (echo backend\.env NAO EXISTE >> "%LOG%")

echo. >> "%LOG%"
echo Testando import do server (backend)... >> "%LOG%"
cd /d "%~dp0backend"
python -c "import server; print('Import OK')" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo Verificando Yarn... >> "%LOG%"
cd /d "%~dp0frontend"
call yarn --version >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo Fim. >> "%LOG%"
