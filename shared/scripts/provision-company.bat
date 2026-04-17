@echo off
REM ═══════════════════════════════════════════════════════════
REM  PROVISION NEW COMPANY
REM  Creates a company config with Paperclip orchestration
REM ═══════════════════════════════════════════════════════════

echo.
echo ============================================
echo   Company Provisioning Tool
echo   OpenClaw / Paperclip Architecture
echo ============================================
echo.

if "%~1"=="" (
    echo Usage: provision-company.bat ^<company-id^> [display-name] [port]
    echo.
    echo Example: provision-company.bat acme-corp "Acme Corporation" 3457
    echo.
    exit /b 1
)

set COMPANY_ID=%~1
set COMPANY_NAME=%~2
set DASHBOARD_PORT=%~3

if "%COMPANY_NAME%"=="" set COMPANY_NAME=%COMPANY_ID%
if "%DASHBOARD_PORT%"=="" set DASHBOARD_PORT=3456

cd /d "%~dp0\..\.."

set CONFIG_FILE=shared\configs\companies\%COMPANY_ID%.json

if exist "%CONFIG_FILE%" (
    echo ERROR: Company config already exists: %CONFIG_FILE%
    exit /b 1
)

echo Creating company: %COMPANY_ID%
echo Name: %COMPANY_NAME%
echo Dashboard port: %DASHBOARD_PORT%
echo.

(
echo {
echo   "id": "%COMPANY_ID%",
echo   "name": "%COMPANY_NAME%",
echo   "description": "",
echo   "namespace": "%COMPANY_ID%",
echo   "agents": [],
echo   "paperclip": {
echo     "enabled": true,
echo     "orchestrationMode": "supervisor",
echo     "supervisorAgent": null,
echo     "maxConcurrentAgents": 5
echo   },
echo   "dashboard": {
echo     "port": %DASHBOARD_PORT%,
echo     "title": "Nerve Command Center - %COMPANY_NAME%"
echo   },
echo   "dataPaths": {
echo     "base": "C:\\Users\\Jarvis\\AppData\\Roaming\\memu-bot\\workspace\\services"
echo   }
echo }
) > "%CONFIG_FILE%"

echo.
echo ============================================
echo   Company "%COMPANY_NAME%" provisioned!
echo ============================================
echo.
echo Config: %CONFIG_FILE%
echo.
echo Next steps:
echo   1. Add agents: provision-agent.bat ^<agent-id^> ^<name^> ^<role^>
echo   2. Start dashboard: set COMPANY_ID=%COMPANY_ID% ^&^& node projects\nerve-dashboard\server.js
echo.
