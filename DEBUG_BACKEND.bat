@echo off
chcp 65001 > nul
title DEBUG Backend RenoveJá+
color 0E

echo.
echo ========================================
echo   DEBUG - Backend RenoveJá+
echo ========================================
echo.

cd /d "%~dp0"

python debug_backend.py

echo.
echo ========================================
echo Pressione qualquer tecla para fechar...
pause > nul
