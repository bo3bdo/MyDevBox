@echo off
echo 🚀 إنشاء موقع Laravel مع دومين تلقائي
echo ========================================

if "%1"=="" (
    echo ❌ يرجى تحديد اسم مشروع Laravel
    echo الاستخدام: laravel-site.bat اسم-المشروع
    echo مثال: laravel-site.bat my-blog
    echo.
    echo 💡 تأكد من وجود مشروع Laravel في: www\%1
    pause
    exit /b 1
)

set PROJECT_NAME=%1
set DOMAIN=%PROJECT_NAME%.test

echo 📋 مشروع Laravel: %PROJECT_NAME%
echo 🌐 الدومين: %DOMAIN%
echo 📁 مجلد الـ public: www\%PROJECT_NAME%\public
echo.

REM التحقق من وجود مشروع Laravel
if not exist "www\%PROJECT_NAME%\public" (
    echo ⚠️ لم يتم العثور على مجلد public في: www\%PROJECT_NAME%\public
    echo.
    echo 💡 هل تريد إنشاء مشروع Laravel جديد؟ (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo 📦 إنشاء مشروع Laravel أساسي...
        mkdir "www\%PROJECT_NAME%\public" 2>nul
        mkdir "www\%PROJECT_NAME%\app" 2>nul
        mkdir "www\%PROJECT_NAME%\config" 2>nul
        mkdir "www\%PROJECT_NAME%\resources\views" 2>nul
        
        REM إنشاء index.php للـ public
        (
        echo ^<?php
        echo // Laravel Entry Point
        echo echo "^<!DOCTYPE html^>";
        echo echo "^<html lang='ar' dir='rtl'^>";
        echo echo "^<head^>";
        echo echo "    ^<meta charset='UTF-8'^>";
        echo echo "    ^<meta name='viewport' content='width=device-width, initial-scale=1.0'^>";
        echo echo "    ^<title^>%PROJECT_NAME% - Laravel^</title^>";
        echo echo "    ^<style^>";
        echo echo "        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); margin: 0; padding: 50px; text-align: center; color: white; }";
        echo echo "        .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 600px; margin: 0 auto; }";
        echo echo "        h1 { font-size: 2.5em; margin-bottom: 20px; }";
        echo echo "        .laravel { background: rgba(255,69,0,0.8); padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 10px; }";
        echo echo "    ^</style^>";
        echo echo "^</head^>";
        echo echo "^<body^>";
        echo echo "    ^<div class='container'^>";
        echo echo "        ^<h1^>🚀 %PROJECT_NAME%^</h1^>";
        echo echo "        ^<div class='laravel'^>Laravel Project^</div^>";
        echo echo "        ^<p^>مشروع Laravel يعمل بنجاح!^</p^>";
        echo echo "        ^<p^>الدومين: %DOMAIN%^</p^>";
        echo echo "        ^<p^>الوقت: " . date('Y-m-d H:i:s'^) . "^</p^>";
        echo echo "        ^<p^>إصدار PHP: " . phpversion(^) . "^</p^>";
        echo echo "    ^</div^>";
        echo echo "^</body^>";
        echo echo "^</html^>";
        echo ?^>
        ) > "www\%PROJECT_NAME%\public\index.php"
        
        echo ✅ تم إنشاء مشروع Laravel أساسي
    ) else (
        echo ❌ لا يمكن المتابعة بدون مجلد public
        pause
        exit /b 1
    )
)

REM إنشاء Virtual Host خاص بـ Laravel
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

echo ✅ تم إنشاء Virtual Host للارavel

REM إنشاء .htaccess للارavel
echo 📄 إنشاء .htaccess للارavel...
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

echo ✅ تم إنشاء .htaccess للارavel

REM إضافة الدومين لـ hosts
echo 🔗 إضافة الدومين لملف hosts...
echo # %PROJECT_NAME% Laravel Domain - %date% %time% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    %DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    www.%DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul

if %errorlevel%==0 (
    echo ✅ تم إضافة الدومين للـ hosts بنجاح
) else (
    echo ⚠️ لم يتم إضافة الدومين - أضف يدوياً:
    echo 127.0.0.1    %DOMAIN%
    echo 127.0.0.1    www.%DOMAIN%
)

REM إعادة تشغيل Apache للارavel
echo.
echo 🔄 إعادة تشغيل Apache للتعرف على مشروع Laravel...
echo ⏹️ إيقاف Apache...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 3 >nul

echo 🚀 بدء Apache مع تكوين Laravel...
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 5 >nul

REM فحص النتيجة
echo 🔍 فحص حالة Apache...
tasklist | findstr httpd >nul
if %errorlevel%==0 (
    echo ✅ Apache يعمل بنجاح مع تكوين Laravel!
    
    echo.
    echo 🎉 مشروع Laravel جاهز!
    echo ========================
    echo.
    echo 📋 معلومات المشروع:
    echo   📁 المجلد: www\%PROJECT_NAME%
    echo   🌐 الدومين: %DOMAIN%
    echo   📂 Public: www\%PROJECT_NAME%\public
    echo   ⚙️ Virtual Host: config\vhosts\%PROJECT_NAME%.conf
    echo.
    echo 🔗 الروابط المتاحة:
    echo   ✅ http://localhost/%PROJECT_NAME%/public
    echo   ✅ http://%DOMAIN% (الدومين الرئيسي)
    echo   ✅ http://www.%DOMAIN%
    echo.
    
    echo هل تريد فتح مشروع Laravel للاختبار؟ (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo 🌐 فتح مشروع Laravel...
        start http://%DOMAIN%
        timeout /t 2 >nul
        start http://localhost/%PROJECT_NAME%/public
    )
) else (
    echo ❌ خطأ في إعادة تشغيل Apache
    echo راجع ملف الأخطاء: bin\apache\logs\error.log
)

echo.
echo 🛠️ للمستقبل:
echo   - لإعادة تحميل Apache: quick-reload.bat
echo   - لإنشاء مشروع Laravel آخر: laravel-site.bat اسم-جديد
echo.
echo ✅ مبروك! مشروع Laravel جاهز للتطوير

pause 