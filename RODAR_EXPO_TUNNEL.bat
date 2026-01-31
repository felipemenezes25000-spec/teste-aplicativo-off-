@echo off
chcp 65001 > nul
title RenoveJá+ - Expo TUNNEL (celular)
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   📱 Expo em modo TUNNEL - evita erro de download        ║
echo  ║   (celular baixa o app pela internet, não pela rede)    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0frontend"

echo [1] Configurando IP do PC para a API...
node get-ip.js
echo.

echo [2] Iniciando Expo com TUNNEL...
echo     Aguarde o QR code (pode demorar 1-2 min na primeira vez)
echo     Celular e PC podem estar em redes diferentes
echo.

yarn start --tunnel

pause
