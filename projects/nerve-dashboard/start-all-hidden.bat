@echo off
REM ============================================
REM  Start All Agents FULLY HIDDEN (no windows)
REM  Uses PM2 - install first: npm install -g pm2
REM  Run from: agent-team-hub\projects\nerve-dashboard
REM ============================================

set BASE=%~dp0

where pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 not installed. Installing...
    npm install -g pm2
)

echo Stopping any existing agents...
pm2 delete all 2>nul

echo Starting agents...
pm2 start "%BASE%agent-factory.js" --name hermes -- hermes
pm2 start "%BASE%agent-factory.js" --name mj -- mj
pm2 start "%BASE%agent-factory.js" --name pepper -- pepper
pm2 start "%BASE%agent-factory.js" --name jarvis -- jarvis
pm2 start "%BASE%agent-factory.js" --name alfred -- alfred
pm2 start "%BASE%agent-factory.js" --name max -- max
pm2 start "%BASE%server.js" --name dashboard

echo.
pm2 list
echo.
echo All agents running in background. No windows!
echo.
echo Useful commands:
echo   pm2 list          - see all agents
echo   pm2 logs jarvis   - view Jarvis logs
echo   pm2 logs          - view all logs
echo   pm2 restart mj    - restart MJ
echo   pm2 stop alfred   - stop Alfred
echo   pm2 delete all    - stop everything
echo   pm2 monit         - live monitoring
echo.
pause
