@echo off
title BSF Dashboard Server - Production
color 0A

cls
echo ========================================
echo     BSF DASHBOARD PRODUCTION SERVER
echo ========================================
echo.

:: Check admin rights (required for port 80)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Administrator privileges required for port 80!
    echo.
    echo Please run this script as Administrator:
    echo 1. Right-click on this file
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: Configuration
set DOMAIN=dashboard.bsf
set PORT=80
set HOSTS=%WINDIR%\System32\drivers\etc\hosts
set PROJECT_DIR=%~dp0
set BUILD_DIR=%PROJECT_DIR%build

echo [1/5] Checking build directory...
echo Project Directory: %PROJECT_DIR%
echo Build Directory: %BUILD_DIR%
echo.

if not exist "%BUILD_DIR%" (
    echo [ERROR] Build folder not found at: %BUILD_DIR%
    echo.
    echo Please build the application first:
    echo Run: npm run build
    echo.
    pause
    exit /b 1
)

:: Check if index.html exists in build
if not exist "%BUILD_DIR%\index.html" (
    echo [ERROR] index.html not found in build folder!
    echo Build folder exists but appears to be incomplete.
    echo.
    echo Please rebuild the application:
    echo Run: npm run build
    echo.
    pause
    exit /b 1
)

echo [OK] Build directory found with index.html
echo.

echo [2/5] Configuring hosts file...
:: Backup hosts file on first run
if not exist "%HOSTS%.backup" (
    copy "%HOSTS%" "%HOSTS%.backup" >nul 2>&1
)

:: Check if domain already exists
findstr /C:"%DOMAIN%" "%HOSTS%" >nul 2>&1
if %errorLevel% neq 0 (
    :: Add entries if not exist
    echo. >> "%HOSTS%"
    echo # BSF Dashboard >> "%HOSTS%"
    echo 127.0.0.1    %DOMAIN% >> "%HOSTS%"
    echo 127.0.0.1    www.%DOMAIN% >> "%HOSTS%"
    echo [OK] Added %DOMAIN% to hosts file
) else (
    echo [OK] %DOMAIN% already in hosts file
)
echo.

echo [3/5] Clearing port %PORT%...
:: Kill all processes on port 80
set KILLED=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    set KILLED=1
    echo Killing process PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
if %KILLED%==1 (
    echo [OK] Port %PORT% cleared
    :: Wait a moment for port to be fully released
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] Port %PORT% was already free
)
echo.

echo [4/5] Installing dependencies...
:: Check if serve is installed
where serve >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing serve globally...
    call npm install -g serve
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install serve
        echo Please run: npm install -g serve
        pause
        exit /b 1
    )
    echo [OK] Serve installed
) else (
    echo [OK] Serve already installed
)
echo.

:: Run node edit.js in a new terminal window
echo Running edit.js in a new terminal...
if exist "%PROJECT_DIR%edit.js" (
    start "BSF Edit Script" cmd /k "cd /d %PROJECT_DIR% && node edit.js && echo. && echo Edit script completed. && pause"
    echo [OK] edit.js launched in new terminal
) else if exist "%BUILD_DIR%\edit.js" (
    start "BSF Edit Script" cmd /k "cd /d %BUILD_DIR% && node edit.js && echo. && echo Edit script completed. && pause"
    echo [OK] edit.js launched in new terminal
) else (
    echo [INFO] edit.js not found, skipping...
)
echo.

echo [5/5] Starting production server...
echo.

:: Change to project directory
cd /d "%PROJECT_DIR%"

:: Clear console and show our custom message
cls
echo ========================================
echo     BSF DASHBOARD - STARTING SERVER
echo ========================================
echo.

:: Start server and show custom domain info
echo Starting server...
echo.
echo    ┌────────────────────────────────────────┐
echo    │                                        │
echo    │   BSF Dashboard Serving!               │
echo    │                                        │
echo    │   - Domain:   http://dashboard.bsf     │
echo    │   - Local:    http://localhost         │
echo    │   - Network:  http://192.168.80.1      │
echo    │                                        │
echo    └────────────────────────────────────────┘
echo.
echo ========================================
echo.
echo Opening http://dashboard.bsf in browser...
start http://dashboard.bsf
echo.
echo Server is RUNNING at http://dashboard.bsf
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

:: Run serve directly (not in background) to show its output
npx serve -s build -l %PORT% --no-clipboard

:: This part will only execute after Ctrl+C is pressed
echo.
echo Server stopped.
pause
exit /b 0