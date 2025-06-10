@echo off
echo MySQL Diagnostic Tool for MyDevBox
echo ===================================
echo.

echo 1. Checking MySQL executable...
if exist "bin\mysql\bin\mysqld.exe" (
    echo ✅ MySQL executable found
) else (
    echo ❌ MySQL executable NOT found
    goto :end
)

echo.
echo 2. Checking MySQL configuration...
if exist "config\my.ini" (
    echo ✅ MySQL configuration found
) else (
    echo ❌ MySQL configuration NOT found
    goto :end
)

echo.
echo 3. Checking data directory...
if exist "bin\mysql\data" (
    echo ✅ MySQL data directory found
    dir "bin\mysql\data" | findstr "ibdata1" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ InnoDB data file exists
    ) else (
        echo ❌ InnoDB data file missing
    )
) else (
    echo ❌ MySQL data directory NOT found
    goto :end
)

echo.
echo 4. Checking tmp directory...
if exist "tmp" (
    echo ✅ tmp directory exists
) else (
    echo ⚠️ tmp directory missing - creating...
    mkdir tmp
    echo ✅ tmp directory created
)

echo.
echo 5. Checking port 3306...
netstat -an | findstr ":3306" >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️ Port 3306 is already in use
    echo Processes using port 3306:
    netstat -ano | findstr ":3306"
) else (
    echo ✅ Port 3306 is available
)

echo.
echo 6. Checking MySQL process...
tasklist | findstr "mysqld.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL is running
    tasklist | findstr "mysqld.exe"
) else (
    echo ❌ MySQL is not running
)

echo.
echo 7. Testing MySQL configuration...
bin\mysql\bin\mysqld.exe --defaults-file=config\my.ini --help --verbose >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL configuration is valid
) else (
    echo ❌ MySQL configuration has errors
)

echo.
echo 8. Checking recent MySQL errors...
if exist "bin\mysql\data\mysql_error.log" (
    echo Last 10 lines of error log:
    echo ----------------------------------------
    powershell "Get-Content bin\mysql\data\mysql_error.log | Select-Object -Last 10"
    echo ----------------------------------------
) else (
    echo ⚠️ No error log found
)

echo.
echo 9. Attempting to start MySQL...
echo Starting MySQL in test mode...
start "MySQL Test" /MIN bin\mysql\bin\mysqld.exe --defaults-file=config\my.ini --console

echo Waiting 5 seconds...
timeout /t 5 >nul

tasklist | findstr "mysqld.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL started successfully!
    echo.
    echo You can now:
    echo - Connect using: mysql -u root -h localhost
    echo - Access phpMyAdmin (if installed)
    echo - Use MySQL in your applications
) else (
    echo ❌ MySQL failed to start
    echo.
    echo Troubleshooting steps:
    echo 1. Run as Administrator
    echo 2. Check Windows Firewall
    echo 3. Check antivirus software
    echo 4. Verify file permissions
)

:end
echo.
echo Press any key to exit...
pause >nul 