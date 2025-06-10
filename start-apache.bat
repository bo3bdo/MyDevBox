@echo off
echo 🔪 Stopping any existing Apache processes...
taskkill /f /im httpd.exe >nul 2>&1
taskkill /f /im apache.exe >nul 2>&1

echo 🔪 Killing processes using port 80...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":80"') do (
    echo Killing PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo ⏳ Waiting for cleanup...
timeout /t 3 >nul

echo 🧪 Testing Apache configuration...
bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf" -t
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Configuration test failed!
    pause
    exit /b 1
)

echo 🚀 Starting Apache...
bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"

echo ✅ Apache started. Press any key to stop...
pause

echo 🛑 Stopping Apache...
taskkill /f /im httpd.exe >nul 2>&1
echo ✅ Apache stopped. 