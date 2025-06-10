@echo off
echo 🚀 إنشاء موقع جديد مع دومين تلقائي
echo =====================================

if "%1"=="" (
    echo.
    echo ❌ يرجى تحديد اسم الموقع
    echo الاستخدام: new-site.bat اسم-الموقع
    echo مثال: new-site.bat my-blog
    echo.
    pause
    exit /b 1
)

set SITE_NAME=%1
set SITE_DIR=C:\MyDevBox\www\%SITE_NAME%
set DOMAIN=%SITE_NAME%.test

echo.
echo 📋 معلومات الموقع الجديد:
echo   📁 اسم الموقع: %SITE_NAME%
echo   🌐 الدومين: %DOMAIN%
echo   📂 المجلد: %SITE_DIR%
echo.

REM إنشاء مجلد الموقع
if exist "%SITE_DIR%" (
    echo ⚠️ الموقع موجود مسبقاً. هل تريد المتابعة؟ (Y/N)
    set /p choice=
    if /i not "%choice%"=="Y" exit /b 0
)

echo 📁 إنشاء مجلد الموقع...
mkdir "%SITE_DIR%" 2>nul
mkdir "%SITE_DIR%\css" 2>nul
mkdir "%SITE_DIR%\js" 2>nul
mkdir "%SITE_DIR%\images" 2>nul
mkdir "%SITE_DIR%\includes" 2>nul

echo ✅ تم إنشاء المجلدات

echo.
echo 📄 إنشاء ملفات الموقع...

REM إنشاء index.php
(
echo ^<!DOCTYPE html^>
echo ^<html lang="ar" dir="rtl"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>%SITE_NAME% - موقع جديد^</title^>
echo     ^<style^>
echo         body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); margin: 0; padding: 50px; text-align: center; color: white; }
echo         .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 600px; margin: 0 auto; }
echo         h1 { font-size: 2.5em; margin-bottom: 20px; }
echo         .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; }
echo         .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
echo         a { color: #fff; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 5px; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<h1^>🎉 %SITE_NAME%^</h1^>
echo         ^<div class="status"^>✅ الموقع يعمل بنجاح!^</div^>
echo         ^<div class="info"^>
echo             ^<h3^>📊 معلومات الموقع^</h3^>
echo             ^<p^>^<strong^>اسم الموقع:^</strong^> %SITE_NAME%^</p^>
echo             ^<p^>^<strong^>الدومين:^</strong^> %DOMAIN%^</p^>
echo             ^<p^>^<strong^>تاريخ الإنشاء:^</strong^> ^<?php echo date('Y-m-d H:i:s'^); ?^>^</p^>
echo             ^<p^>^<strong^>إصدار PHP:^</strong^> ^<?php echo phpversion(^); ?^>^</p^>
echo         ^</div^>
echo         ^<div class="info"^>
echo             ^<h3^>🔗 روابط مفيدة^</h3^>
echo             ^<a href="http://localhost"^>🏠 الرئيسية^</a^>
echo             ^<a href="http://localhost/phpmyadmin"^>🗄️ phpMyAdmin^</a^>
echo         ^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "%SITE_DIR%\index.php"

echo ✅ تم إنشاء index.php

REM إنشاء ملف CSS
(
echo /* CSS للموقع %SITE_NAME% */
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; }
echo .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
) > "%SITE_DIR%\css\style.css"

echo ✅ تم إنشاء style.css

REM إنشاء Virtual Host
echo.
echo 🌐 إنشاء Virtual Host...
(
echo # Virtual Host for %SITE_NAME%
echo ^<VirtualHost *:80^>
echo     DocumentRoot "C:/MyDevBox/www/%SITE_NAME%"
echo     ServerName %DOMAIN%
echo     ServerAlias www.%DOMAIN%
echo     
echo     ^<Directory "C:/MyDevBox/www/%SITE_NAME%"^>
echo         Options Indexes FollowSymLinks
echo         AllowOverride All
echo         Require all granted
echo         DirectoryIndex index.php index.html
echo     ^</Directory^>
echo     
echo     ErrorLog "logs/%SITE_NAME%_error.log"
echo     CustomLog "logs/%SITE_NAME%_access.log" combined
echo ^</VirtualHost^>
) > "config\vhosts\%SITE_NAME%.conf"

echo ✅ تم إنشاء Virtual Host

REM إضافة الدومين إلى hosts
echo.
echo 🔗 إضافة الدومين إلى ملف hosts...
echo.
echo # %SITE_NAME% Domain - %date% %time% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    %DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    www.%DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul

if %errorlevel%==0 (
    echo ✅ تم إضافة الدومين للـ hosts بنجاح
) else (
    echo ⚠️ لم يتم إضافة الدومين - تحتاج صلاحيات Administrator
    echo أضف هذه الأسطر يدوياً إلى: C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    %DOMAIN%
    echo 127.0.0.1    www.%DOMAIN%
)

REM إعادة تشغيل Apache
echo.
echo 🔄 إعادة تشغيل Apache...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 2 >nul
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 3 >nul

echo.
echo 🎉 تم إنشاء الموقع بنجاح!
echo ============================
echo.
echo 📋 معلومات الموقع:
echo   🌐 الدومين: http://%DOMAIN%
echo   📁 المجلد: %SITE_DIR%
echo.
echo 🔗 الروابط المتاحة:
echo   - http://%DOMAIN%
echo   - http://localhost/%SITE_NAME%
echo   - http://www.%DOMAIN%
echo.
echo 🛠️ الخطوات التالية:
echo   1. زر http://%DOMAIN% للتأكد من عمل الموقع
echo   2. ابدأ تطوير موقعك بتعديل index.php
echo   3. أضف ملفات CSS في مجلد css/
echo.

echo هل تريد فتح الموقع في المتصفح؟ (Y/N)
set /p choice=
if /i "%choice%"=="Y" start http://%DOMAIN%

echo.
echo ✅ انتهى إنشاء الموقع!
pause 