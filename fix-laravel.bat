@echo off
echo 🔧 إصلاح مواقع Laravel الموجودة
echo ================================

if "%1"=="" (
    echo ❌ يرجى تحديد اسم مشروع Laravel
    echo الاستخدام: fix-laravel.bat اسم-المشروع
    echo مثال: fix-laravel.bat car2
    pause
    exit /b 1
)

set PROJECT_NAME=%1
set DOMAIN=%PROJECT_NAME%.test

echo 📋 إصلاح مشروع: %PROJECT_NAME%
echo 🌐 الدومين: %DOMAIN%
echo.

REM التحقق من وجود مجلد public
if not exist "www\%PROJECT_NAME%\public" (
    echo ❌ لم يتم العثور على مجلد public في: www\%PROJECT_NAME%\public
    echo 💡 تأكد من أن المشروع موجود في المكان الصحيح
    pause
    exit /b 1
)

echo ✅ تم العثور على مشروع Laravel

REM إنشاء/تحديث Virtual Host
echo 🌐 إنشاء Virtual Host للارavel...
(
echo # Virtual Host for Laravel Project: %PROJECT_NAME%
echo ^<VirtualHost *:80^>
echo     DocumentRoot "C:/MyDevBox/www/%PROJECT_NAME%/public"
echo     ServerName %DOMAIN%
echo     ServerAlias www.%DOMAIN%
echo     
echo     # Laravel Public Directory
echo     ^<Directory "C:/MyDevBox/www/%PROJECT_NAME%/public"^>
echo         Options Indexes FollowSymLinks
echo         AllowOverride All
echo         Require all granted
echo         DirectoryIndex index.php
echo         
echo         # Laravel URL Rewriting
echo         RewriteEngine On
echo         RewriteCond %%{REQUEST_FILENAME} !-f
echo         RewriteCond %%{REQUEST_FILENAME} !-d
echo         RewriteRule . /index.php [L]
echo     ^</Directory^>
echo     
echo     # Laravel Logs
echo     ErrorLog "logs/%PROJECT_NAME%_laravel_error.log"
echo     CustomLog "logs/%PROJECT_NAME%_laravel_access.log" combined
echo     
echo     # PHP Configuration for Laravel
echo     php_admin_flag log_errors on
echo     php_admin_value error_log "C:/MyDevBox/logs/%PROJECT_NAME%_php_errors.log"
echo     php_admin_value memory_limit "256M"
echo     php_admin_value max_execution_time "60"
echo ^</VirtualHost^>
) > "config\vhosts\%PROJECT_NAME%.conf"

echo ✅ تم إنشاء Virtual Host

REM تحديث/إنشاء .htaccess
echo 📄 تحديث .htaccess...
(
echo # Laravel .htaccess
echo ^<IfModule mod_rewrite.c^>
echo     ^<IfModule mod_negotiation.c^>
echo         Options -MultiViews -Indexes
echo     ^</IfModule^>
echo 
echo     RewriteEngine On
echo 
echo     # Handle Authorization Header
echo     RewriteCond %%{HTTP:Authorization} .
echo     RewriteRule .* - [E=HTTP_AUTHORIZATION:%%{HTTP:Authorization}]
echo 
echo     # Redirect Trailing Slashes If Not A Folder...
echo     RewriteCond %%{REQUEST_FILENAME} !-d
echo     RewriteCond %%{REQUEST_URI} (./+)$
echo     RewriteRule ^ %%1 [R=301,L]
echo 
echo     # Send Requests To Front Controller...
echo     RewriteCond %%{REQUEST_FILENAME} !-d
echo     RewriteCond %%{REQUEST_FILENAME} !-f
echo     RewriteRule ^ index.php [L]
echo ^</IfModule^>
) > "www\%PROJECT_NAME%\public\.htaccess"

echo ✅ تم تحديث .htaccess

REM إضافة الدومين لـ hosts
echo 🔗 إضافة الدومين لملف hosts...
echo # %PROJECT_NAME% Laravel Domain - %date% %time% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    %DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul

if %errorlevel%==0 (
    echo ✅ تم إضافة الدومين
) else (
    echo ⚠️ أضف يدوياً: 127.0.0.1 %DOMAIN%
)

REM إعادة تشغيل Apache
echo.
echo 🔄 إعادة تشغيل Apache...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 2 >nul
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 4 >nul

tasklist | findstr httpd >nul
if %errorlevel%==0 (
    echo ✅ Apache يعمل بنجاح!
    echo.
    echo 🎉 تم إصلاح مشروع Laravel!
    echo ============================
    echo.
    echo 🔗 الروابط المتاحة الآن:
    echo   ✅ http://%DOMAIN% (الرابط الجديد المباشر)
    echo   ✅ http://localhost/%PROJECT_NAME%/public (الرابط القديم)
    echo.
    
    echo هل تريد فتح المشروع للاختبار؟ (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        start http://%DOMAIN%
    )
) else (
    echo ❌ خطأ في Apache
)

echo.
echo ✅ انتهى الإصلاح!
pause 