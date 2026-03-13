@echo off
REM Build script for ChromeGenie Client - Windows
REM This script builds the application for Windows

echo ==========================================
echo ChromeGenie Client - Windows Build
echo ==========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version

REM Install dependencies
echo.
echo Installing dependencies...
call npm install

REM Build frontend
echo.
echo Building frontend...
call npm run build:frontend

REM Build for Windows
echo.
echo Building for Windows...
call npm run build:win

echo.
echo Windows build completed!
echo Check the 'dist' folder for built applications.
pause
