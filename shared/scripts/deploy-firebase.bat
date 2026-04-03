@echo off
REM ========================================
REM Agent Team - Deploy Script
REM ========================================

echo.
echo ========================================
echo    AGENT TEAM DEPLOYMENT
echo ========================================
echo.

REM Check for firebase-tools
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Firebase CLI not found!
    echo Install with: npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking Firebase status...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo [ACTION] Please login to Firebase:
    firebase login
)

echo.
echo [2/3] Deploying to Firebase...
echo.

REM Deploy all Firebase services
firebase deploy

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Firebase deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Check your Firebase console for live URL:
echo https://console.firebase.google.com
echo.
echo Next steps:
echo 1. Copy the hosting URL
echo 2. Update the hub with your live link
echo.
pause
