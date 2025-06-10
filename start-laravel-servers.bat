@echo off
echo Starting Laravel Development Servers...
echo.

REM Set PHP path
set PHP_PATH=C:\MyDevBox\bin\php\php-8.4.8-Win32-vs17-x64\php.exe

REM Check if PHP exists
if not exist "%PHP_PATH%" (
    echo Error: PHP not found at %PHP_PATH%
    echo Please check your MyDevBox PHP installation
    pause
    exit /b 1
)

REM Test PHP
echo Testing PHP...
"%PHP_PATH%" --version
if %ERRORLEVEL% NEQ 0 (
    echo Error: PHP is not working properly
    pause
    exit /b 1
)

REM Add domains to hosts file if not exists (requires admin rights)
echo Adding domains to hosts file...
echo 127.0.0.1 abc.test >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1 test5.test >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1 werwer.test >> C:\Windows\System32\drivers\etc\hosts 2>nul

echo.
echo Starting Laravel servers...
echo.

REM Start servers in background
echo Starting abc.test on port 8000...
start "ABC Laravel Server" cmd /k "cd /d C:\MyDevBox\www\abc\public && %PHP_PATH% -S abc.test:8000"

timeout /t 2 >nul

echo Starting test5.test on port 8001...  
start "Test5 Laravel Server" cmd /k "cd /d C:\MyDevBox\www\test5\public && %PHP_PATH% -S test5.test:8001"

timeout /t 2 >nul

echo Starting werwer.test on port 8002...
start "Werwer Laravel Server" cmd /k "cd /d C:\MyDevBox\www\werwer\public && %PHP_PATH% -S werwer.test:8002"

echo.
echo ✅ Laravel development servers started!
echo.
echo You can now access your sites at:
echo - http://abc.test:8000
echo - http://test5.test:8001  
echo - http://werwer.test:8002
echo.
echo Note: To stop servers, close their respective command windows
echo.
echo Press any key to close this window...
pause >nul 