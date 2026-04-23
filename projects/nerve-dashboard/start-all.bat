@echo off
REM ============================================
REM  Start All Agents + Dashboard (minimized)
REM  Run from: agent-team-hub\projects\nerve-dashboard
REM ============================================

set BASE=%~dp0

echo Starting all agents minimized...

REM Start each agent in a minimized window
start /min "Hermes" node "%BASE%agent-factory.js" hermes
start /min "MJ" node "%BASE%agent-factory.js" mj
start /min "Pepper" node "%BASE%agent-factory.js" pepper
start /min "Jarvis" node "%BASE%agent-factory.js" jarvis
start /min "Alfred" node "%BASE%agent-factory.js" alfred
start /min "Max" node "%BASE%agent-factory.js" max

REM Start the dashboard (also minimized)
start /min "Nerve Dashboard" node "%BASE%server.js"

echo.
echo All agents started (minimized). Dashboard at http://localhost:3456
echo To stop all: taskkill /F /IM node.exe
echo.
pause
