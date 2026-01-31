@echo off
chcp 65001 > nul
title RenoveJá+ - Rodar no Celular
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║       📱 RenoveJá+ - Rodar no Celular (Expo Go)         ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: 1. Configurar IP no frontend
echo [1] Configurando IP do PC para o celular acessar o backend...
cd /d "%~dp0frontend"
node get-ip.js
if errorlevel 1 (
    echo ERRO: Não foi possível obter o IP. Verifique se Node está instalado.
    pause
    exit /b 1
)
echo.

:: 2. Lembrar de ter o backend rodando
echo [2] Certifique-se de que o BACKEND está rodando em outro terminal:
echo     cd backend
echo     python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
echo.

:: 3. Iniciar Expo
echo [3] Iniciando Expo... Quando aparecer o QR code:
echo.
echo     ANDROID: Abra o app "Expo Go" e escaneie o QR code
echo     iOS:     Abra a câmera e aponte para o QR code
echo.
echo     📲 Se não tiver o Expo Go, instale na Play Store ou App Store
echo     📶 Celular e PC devem estar na MESMA rede Wi-Fi
echo.
timeout /t 5

:: --clear limpa o cache (importante após mudar babel.config.js)
yarn start --clear

pause
