@echo off
title Build DocMitra-Admin.exe
cd /d "%~dp0"

echo =========================================================
echo    Compiling DocMitra-Admin.exe (PyInstaller Standalone)
echo =========================================================
echo.

pyinstaller --clean --distpath . DocMitra-Admin.spec

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================
    echo [SUCCESS] DocMitra-Admin.exe compiled successfully!
    echo Output: %~dp0DocMitra-Admin.exe
    echo =========================================================
) else (
    echo.
    echo [ERROR] PyInstaller compilation failed with error code %ERRORLEVEL%.
)

pause
