@echo off
title DocMitra Admin Center v1.4.4
cd /d "%~dp0"

echo =========================================================
echo    Launching DocMitra Admin Center v1.4.4
echo =========================================================
echo.

python admin_server.py

if %ERRORLEVEL% NEQ 0 (
    pause
)
