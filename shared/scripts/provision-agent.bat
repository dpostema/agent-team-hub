@echo off
REM ═══════════════════════════════════════════════════════════
REM  PROVISION NEW AGENT
REM  Creates agent config and registers it with a company
REM ═══════════════════════════════════════════════════════════

echo.
echo ============================================
echo   Agent Provisioning Tool
echo   OpenClaw / Paperclip Architecture
echo ============================================
echo.

if "%~1"=="" (
    echo Usage: provision-agent.bat ^<agent-id^> [agent-name] [role]
    echo.
    echo Example: provision-agent.bat analyst "Data Analyst" "Analysis"
    echo.
    exit /b 1
)

set AGENT_ID=%~1
set AGENT_NAME=%~2
set AGENT_ROLE=%~3

if "%AGENT_NAME%"=="" set AGENT_NAME=%AGENT_ID%
if "%AGENT_ROLE%"=="" set AGENT_ROLE=Agent

echo Creating agent: %AGENT_ID%
echo Name: %AGENT_NAME%
echo Role: %AGENT_ROLE%
echo.

REM Navigate to repo root
cd /d "%~dp0\..\.."

REM Create the agent config
node shared\scripts\create-agent-config.js %AGENT_ID% --name "%AGENT_NAME%" --role "%AGENT_ROLE%" --company pilot-company

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create agent config.
    exit /b 1
)

echo.
echo ============================================
echo   Agent "%AGENT_NAME%" provisioned!
echo ============================================
echo.
echo Next steps:
echo   1. Edit: shared\configs\agents\%AGENT_ID%.json
echo   2. Add token to: shared\configs\secrets.local.json
echo   3. Start: node projects\nerve-dashboard\agent-factory.js %AGENT_ID%
echo.
