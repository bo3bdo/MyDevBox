@echo off
echo 🔪 Killing all Apache and Node processes...

echo Stopping Node.js processes...
wmic process where "name='node.exe'" delete >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo Stopping Apache processes...
wmic process where "name='httpd.exe'" delete >nul 2>&1
taskkill /f /im httpd.exe >nul 2>&1

echo Killing all processes on port 80...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":80"') do (
    echo Killing PID %%a
    wmic process where "ProcessId=%%a" delete >nul 2>&1
    taskkill /f /pid %%a >nul 2>&1
)

echo Killing all processes on port 3306...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3306"') do (
    echo Killing MySQL PID %%a
    wmic process where "ProcessId=%%a" delete >nul 2>&1
    taskkill /f /pid %%a >nul 2>&1
)

echo ✅ All processes killed
timeout /t 2 >nul
echo Ready to start fresh! 