@echo off
echo Starting MySQL for MyDevBox...
echo.

REM Check if MySQL binary exists
if not exist "bin\mysql\bin\mysqld.exe" (
    echo Error: MySQL not found in bin\mysql\bin\mysqld.exe
    echo Please check your MyDevBox installation.
    pause
    exit /b 1
)

REM Check if config file exists
if not exist "config\my.ini" (
    echo Error: MySQL configuration not found in config\my.ini
    pause
    exit /b 1
)

REM Create tmp directory if it doesn't exist
if not exist "tmp" mkdir tmp

REM Stop any existing MySQL process
echo Stopping any existing MySQL processes...
taskkill /F /IM mysqld.exe >nul 2>&1

REM Remove any stale PID file
if exist "bin\mysql\data\mysql.pid" del "bin\mysql\data\mysql.pid"

REM Wait a moment
timeout /t 2 >nul

REM Check if port 3306 is available
echo Checking if port 3306 is available...
netstat -an | findstr ":3306" >nul
if %ERRORLEVEL% EQU 0 (
    echo Warning: Port 3306 is already in use!
    echo Attempting to kill process using port 3306...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3306"') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 3 >nul
)

REM Start MySQL
echo Starting MySQL server...
start "MySQL Server" /MIN bin\mysql\bin\mysqld.exe --defaults-file=config\my.ini --console

REM Wait for MySQL to start
echo Waiting for MySQL to start...
timeout /t 5 >nul

REM Check if MySQL is running
tasklist | findstr "mysqld.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL started successfully!
    echo.
    echo MySQL is running on:
    echo - Host: localhost
    echo - Port: 3306
    echo - Username: root
    echo - Password: (empty)
    echo.
    echo Databases created:
    echo - abc_db
    echo - test5_db
    echo - werwer_db
) else (
    echo ❌ Failed to start MySQL
    echo.
    echo Check the error log: bin\mysql\data\mysql_error.log
    echo.
    echo Common solutions:
    echo 1. Run as Administrator
    echo 2. Check if port 3306 is free
    echo 3. Check MySQL error log for details
)

echo.
echo Press any key to continue...
pause >nul 