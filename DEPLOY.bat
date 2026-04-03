@echo off
REM ========================================
REM Agent Team - Firebase Deploy
REM ========================================

echo.
echo ========================================
echo    FIREBASE DEPLOYMENT
echo ========================================
echo.

cd /d "%~dp0"

echo.
echo [1/4] Checking Firebase CLI...
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Firebase CLI not found!
    echo Install with: npm install -g firebase-tools
    pause
    exit /b 1
)
echo [OK] Firebase CLI found

echo.
echo [2/4] Checking login status...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ACTION REQUIRED] Please login to Firebase:
    echo 1. A browser will open
    echo 2. Login to your Google account
    echo 3. Come back here
    echo.
    pause
    firebase login
)

echo.
echo [3/4] Checking Firebase project...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ACTION REQUIRED] Create a Firebase project:
    echo 1. Go to: https://console.firebase.google.com
    echo 2. Create new project: "agent-team-hub"
    echo 3. Enable Hosting
    echo 4. Come back here and run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Deploying to Firebase...
echo.

REM Deploy just hosting for now
firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deployment failed!
    echo.
    echo Try these steps:
    echo 1. firebase logout
    echo 2. firebase login
    echo 3. firebase projects:list
    echo 4. Run this script again
    pause
    exit /b 1
)

echo.
echo ========================================
echo    DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Check Firebase Console for your live URL:
echo https://console.firebase.google.com
echo.
echo Or check the Firebase hosting URL in your project settings.
echo.
pause
