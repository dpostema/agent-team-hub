@echo off
REM ═══════════════════════════════════════════════════════════
REM  START COMPANY
REM  Launches Nerve Dashboard for a specific company
REM ═══════════════════════════════════════════════════════════

echo.
echo ============================================
echo   Company Startup
echo   OpenClaw / Paperclip Architecture
echo ============================================
echo.

if "%~1"=="" (
    set COMPANY_ID=pilot-company
) else (
    set COMPANY_ID=%~1
)

cd /d "%~dp0\..\.."

echo Starting Nerve Dashboard for: %COMPANY_ID%
echo.

set COMPANY_ID=%COMPANY_ID%

if "%~2"=="--with-agents" (
    echo Starting agent bots...
    echo.

    REM Parse agent list from company config and start each
    for /f "tokens=*" %%a in ('node -e "const c=require('./shared/configs/companies/%COMPANY_ID%.json');const p=require('./projects/nerve-dashboard/paperclip');const pc=new p('%COMPANY_ID%');pc.listBotAgents().forEach(a=>console.log(a))"') do (
        echo   Starting agent: %%a
        start "Agent-%%a" node projects\nerve-dashboard\agent-factory.js %%a
    )
    echo.
)

echo Starting dashboard...
node projects\nerve-dashboard\server.js
