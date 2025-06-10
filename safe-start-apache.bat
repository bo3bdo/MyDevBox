@echo off
echo 🚀 Safe Apache Startup

echo 🔪 Killing existing Apache processes...
wmic process where "name='httpd.exe'" delete >nul 2>&1
taskkill /f /im httpd.exe >nul 2>&1

echo 🔪 Killing processes on port 80...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":80"') do (
    echo Killing PID %%a
    wmic process where "ProcessId=%%a" delete >nul 2>&1
    taskkill /f /pid %%a >nul 2>&1
)

echo ⏳ Waiting for cleanup...
timeout /t 3 >nul

echo 🧪 Testing Apache configuration...
bin\apache\bin\httpd.exe -f "config\httpd.conf" -t
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Configuration test failed!
    pause
    exit /b 1
)

echo 🚀 Starting Apache...
bin\apache\bin\httpd.exe -f "config\httpd.conf"

echo ✅ Apache startup complete! 