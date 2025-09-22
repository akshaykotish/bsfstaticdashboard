@echo off
title Update Hosts File - BSF Dashboard
color 0A

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Administrator privileges required!
    echo.
    echo Please run this script as Administrator:
    echo 1. Right-click on this file
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

cls
echo ========================================
echo     UPDATE HOSTS FILE FOR BSF DASHBOARD
echo ========================================
echo.

:: Configuration - CHANGE THIS TO YOUR PUBLIC IP
set PUBLIC_IP=YOUR_PUBLIC_IP_HERE
set DOMAIN=dashboard.bsf
set HOSTS=%WINDIR%\System32\drivers\etc\hosts

:: Prompt for IP if not set
if "%PUBLIC_IP%"=="YOUR_PUBLIC_IP_HERE" (
    echo Enter the public IP address for dashboard.bsf:
    set /p PUBLIC_IP=IP Address: 
)

:: Validate IP format (basic check)
echo %PUBLIC_IP% | findstr /R "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if %errorLevel% neq 0 (
    echo [ERROR] Invalid IP address format!
    echo Please enter a valid IP address (e.g., 203.0.113.10)
    pause
    exit /b 1
)

echo.
echo Configuration:
echo - Domain: %DOMAIN%
echo - IP Address: %PUBLIC_IP%
echo - Hosts File: %HOSTS%
echo.

:: Backup hosts file
echo [1/4] Creating backup...
set BACKUP_FILE=%HOSTS%.backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_FILE=%BACKUP_FILE: =0%
copy "%HOSTS%" "%BACKUP_FILE%" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Backup created: %BACKUP_FILE%
) else (
    echo [WARNING] Could not create backup
)

:: Remove old entries
echo [2/4] Removing old entries...
set TEMP_HOSTS=%TEMP%\hosts_temp_%RANDOM%
type nul > "%TEMP_HOSTS%"

:: Filter out old dashboard.bsf entries
for /f "tokens=*" %%i in ('type "%HOSTS%" ^| findstr /V /C:"%DOMAIN%"') do (
    echo %%i >> "%TEMP_HOSTS%"
)

:: Copy filtered content back
copy /Y "%TEMP_HOSTS%" "%HOSTS%" >nul 2>&1
del "%TEMP_HOSTS%" >nul 2>&1
echo [OK] Old entries removed

:: Add new entries
echo [3/4] Adding new entries...
echo. >> "%HOSTS%"
echo # BSF Dashboard - Added %date% %time% >> "%HOSTS%"
echo %PUBLIC_IP%    %DOMAIN% >> "%HOSTS%"
echo %PUBLIC_IP%    www.%DOMAIN% >> "%HOSTS%"
echo [OK] New entries added

:: Flush DNS cache
echo [4/4] Flushing DNS cache...
ipconfig /flushdns >nul 2>&1
echo [OK] DNS cache flushed

echo.
echo ========================================
echo     HOSTS FILE UPDATED SUCCESSFULLY!
echo ========================================
echo.
echo The following entries have been added:
echo   %PUBLIC_IP%    %DOMAIN%
echo   %PUBLIC_IP%    www.%DOMAIN%
echo.
echo You can now access the dashboard at:
echo   http://dashboard.bsf
echo.
echo To remove these entries, run remove-hosts.bat
echo.
pause
exit /b 0