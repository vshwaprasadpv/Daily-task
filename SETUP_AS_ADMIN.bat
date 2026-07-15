@echo off
:: ============================================================
::  Creative Task Manager - MySQL Setup Script
::  Run this as Administrator (Right-click -> Run as administrator)
:: ============================================================

echo =============================================
echo  MySQL 8.4 Setup - Running as Administrator
echo =============================================
echo.

set MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.4\bin
set MYSQL_DATA=C:\MySQLData

:: Step 1: Check if already running
echo [1/5] Checking existing MySQL service...
sc query MySQL84 >nul 2>&1
if %errorlevel% == 0 (
    echo MySQL84 service already exists. Starting it...
    net start MySQL84 2>nul
    goto :setup_db
)

:: Step 2: Initialize data directory if needed
echo [2/5] Checking data directory...
if not exist "%MYSQL_DATA%\mysql" (
    echo Initializing MySQL data directory...
    "%MYSQL_BIN%\mysqld.exe" --initialize-insecure --user=root --datadir="%MYSQL_DATA%"
    echo Data directory initialized.
)

:: Step 3: Copy config
echo [3/5] Setting up MySQL config...
copy /y "%~dp0my.ini" "%MYSQL_DATA%\my.ini" >nul 2>&1

:: Step 4: Register Windows service
echo [4/5] Installing MySQL as Windows service...
"%MYSQL_BIN%\mysqld.exe" --install MySQL84 --defaults-file="%MYSQL_DATA%\my.ini"

:: Step 5: Start service
echo [5/5] Starting MySQL service...
net start MySQL84

:setup_db
echo.
echo =============================================
echo  Setting up database...
echo =============================================

:: Wait for MySQL to fully start
timeout /t 5 /nobreak >nul

:: Run schema.sql
echo Running schema setup...
"%MYSQL_BIN%\mysql.exe" -u root -h 127.0.0.1 -P 3306 --connect-timeout=30 < "%~dp0sql\schema.sql"

if %errorlevel% == 0 (
    echo.
    echo =============================================
    echo  SUCCESS! Database created with seed data!
    echo =============================================
    echo.
    echo Now run the Node.js server:
    echo   cd /d g:\Vishwa\creative-task-manager-nodejs
    echo   npm start
    echo.
    echo Then open: http://localhost:3000
    echo Login: admin@creative.com / Admin@123
) else (
    echo.
    echo WARNING: Database setup failed. Check MySQL is running.
    echo Try running: mysql -u root -h 127.0.0.1 -P 3306 ^< sql\schema.sql
)

echo.
pause
