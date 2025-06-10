@echo off
echo Setting up local domains for MyDevBox...
echo.

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

:: Backup hosts file
copy "C:\Windows\System32\drivers\etc\hosts" "C:\Windows\System32\drivers\etc\hosts.backup.%date:/=-%_%time::=-%" >nul

:: Add MyDevBox domains
echo # MyDevBox - Local Development Domains >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 blog.test >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 www.blog.test >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 tasks.test >> "C:\Windows\System32\drivers\etc\hosts"
echo 127.0.0.1 www.tasks.test >> "C:\Windows\System32\drivers\etc\hosts"

echo Successfully added local domains to hosts file:
echo - blog.test
echo - tasks.test
echo.
echo You can now access your sites using these domains!
pause 