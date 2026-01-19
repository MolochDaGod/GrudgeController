@echo off
echo ========================================
echo  Three.js Combat System - Quick Start
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server...
echo.
echo ========================================
echo  Server will open in your browser
echo  Press Ctrl+C to stop the server
echo ========================================
echo.

start "" "http://localhost:5173"
call npm run dev

pause
