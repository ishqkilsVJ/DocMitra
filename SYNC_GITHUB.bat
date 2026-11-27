@echo off
title DocMitra GitHub Cloud Sync
echo ======================================================================
echo           DocMitra - GitHub Cloud Sync ^& Auto-Backup Setup
echo ======================================================================
echo.
echo [1/2] Connecting to GitHub (https://github.com/ishqkilsVJ/DocMitra.git)...
echo [2/2] Pushing all 59 checkpoints and main branch to GitHub...
echo.
git push -u origin main --tags
echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo  [SUCCESS] All 59 Checkpoints ^& Code successfully backed up to GitHub!
    echo ======================================================================
) else (
    echo ======================================================================
    echo  [NOTICE] If GitHub login popup appeared, please complete authorization.
    echo ======================================================================
)
echo.
pause
