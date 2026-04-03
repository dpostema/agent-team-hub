@echo off
REM ========================================
REM Agent Team - GitHub Push Script
REM ========================================

echo.
echo ========================================
echo    AGENT TEAM - GITHUB PUSH
echo ========================================
echo.

REM Set project name
set PROJECT=%1
if "%PROJECT%"=="" set PROJECT=pepperclaw

echo Project: %PROJECT%
echo.

REM Navigate to project
if "%PROJECT%"=="pepperclaw" (
    set PROJECT_PATH=C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\pepperclaw
) else if "%PROJECT%"=="nerve" (
    set PROJECT_PATH=C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\nerve-dashboard
) else if "%PROJECT%"=="hermes" (
    set PROJECT_PATH=C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\services\hermes-pro-(h2-hermebot)_1775217775837
) else if "%PROJECT%"=="mj" (
    set PROJECT_PATH=C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\services\mj-pro-builder-bot_1775217860196
) else (
    set PROJECT_PATH=C:\Users\Jarvis\AppData\Roaming\memu-bot\workspace\%PROJECT%
)

echo Path: %PROJECT_PATH%
echo.

if not exist "%PROJECT_PATH%" (
    echo [ERROR] Project path not found!
    pause
    exit /b 1
)

cd /d "%PROJECT_PATH%"

echo.
echo [1/3] Checking Git status...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo [ACTION] Initializing Git repo...
    git init
    git add .
    git commit -m "Initial commit"
) else (
    echo [OK] Git repo exists
)

echo.
echo [2/3] Staging changes...
git add .

echo.
echo [3/3] Committing...
set COMMIT_MSG=%2
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update from Agent Team
git commit -m "%COMMIT_MSG%"

echo.
echo ========================================
echo    READY TO PUSH!
echo ========================================
echo.
echo Run this to push:
echo   git push origin main
echo.
echo Or let me push now? (Y/N)
set /p PUSH=
if /i "%PUSH%"=="Y" (
    echo.
    echo Pushing to GitHub...
    git push origin main
    echo.
    echo [DONE] Check your GitHub repo!
)

pause
