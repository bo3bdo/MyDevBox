@echo off
echo 🚀 إنشاء موقع كامل مع دومين تلقائي
echo =====================================

if "%1"=="" (
    echo ❌ يرجى تحديد اسم الموقع
    echo الاستخدام: auto-site.bat اسم-الموقع
    echo مثال: auto-site.bat my-portfolio
    pause
    exit /b 1
)

set SITE_NAME=%1
set DOMAIN=%SITE_NAME%.test

echo 📋 إنشاء الموقع: %SITE_NAME%
echo 🌐 الدومين: %DOMAIN%
echo.

REM 1. إنشاء مجلد الموقع
echo 📁 إنشاء مجلد الموقع...
mkdir "www\%SITE_NAME%" 2>nul
mkdir "www\%SITE_NAME%\css" 2>nul
mkdir "www\%SITE_NAME%\js" 2>nul
mkdir "www\%SITE_NAME%\images" 2>nul

REM 2. إنشاء index.php متطور
echo 📄 إنشاء ملفات الموقع...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="ar" dir="rtl"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>%SITE_NAME% - موقع جديد^</title^>
echo     ^<link rel="stylesheet" href="css/style.css"^>
echo     ^<style^>
echo         body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); margin: 0; padding: 50px; text-align: center; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
echo         .container { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 700px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
echo         h1 { font-size: 2.5em; margin-bottom: 20px; }
echo         .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: bold; }
echo         .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
echo         .domain { background: rgba(255,193,7,0.2); padding: 15px; border-radius: 10px; margin: 15px 0; border: 2px solid rgba(255,193,7,0.5); }
echo         a { color: #fff; text-decoration: none; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 5px; margin: 5px; display: inline-block; }
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
echo             ^<p^>^<strong^>الخادم:^</strong^> ^<?php echo $_SERVER['SERVER_NAME'^]; ?^>^</p^>
echo         ^</div^>
echo         ^<div class="domain"^>
echo             ^<h3^>🌐 طرق الوصول^</h3^>
echo             ^<a href="http://localhost/%SITE_NAME%"^>localhost/%SITE_NAME%^</a^>
echo             ^<a href="http://%DOMAIN%"^>%DOMAIN%^</a^>
echo         ^</div^>
echo         ^<div class="info"^>
echo             ^<h3^>🔗 روابط مفيدة^</h3^>
echo             ^<a href="http://localhost"^>🏠 الرئيسية^</a^>
echo             ^<a href="http://localhost/phpmyadmin"^>🗄️ phpMyAdmin^</a^>
echo         ^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "www\%SITE_NAME%\index.php"

REM 3. إنشاء ملف CSS
(
echo /* CSS للموقع %SITE_NAME% */
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; }
echo .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
echo h1 { color: #333; }
echo .section { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; }
) > "www\%SITE_NAME%\css\style.css"

echo ✅ تم إنشاء ملفات الموقع

REM 4. إنشاء Virtual Host
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

REM 5. إضافة الدومين لـ hosts
echo 🔗 إضافة الدومين لملف hosts...
echo # %SITE_NAME% Domain - %date% %time% >> C:\Windows\System32\drivers\etc\hosts 2>nul
echo 127.0.0.1    %DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul

if %errorlevel%==0 (
    echo ✅ تم إضافة الدومين بنجاح
) else (
    echo ⚠️ لم يتم إضافة الدومين - أضف يدوياً: 127.0.0.1 %DOMAIN%
)

REM 6. إعادة تشغيل Apache تلقائياً
echo.
echo 🔄 إعادة تشغيل Apache للتعرف على الدومين الجديد...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 2 >nul
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 3 >nul

REM 7. فحص النتيجة
tasklist | findstr httpd >nul
if %errorlevel%==0 (
    echo ✅ Apache يعمل بنجاح مع التكوين الجديد!
) else (
    echo ❌ خطأ في إعادة تشغيل Apache
)

echo.
echo 🎉 تم إنشاء الموقع بنجاح!
echo =============================
echo.
echo 📋 معلومات الموقع:
echo   📁 المجلد: www\%SITE_NAME%
echo   🌐 الدومين: %DOMAIN%
echo   ⚙️ Virtual Host: config\vhosts\%SITE_NAME%.conf
echo.
echo 🔗 الروابط المتاحة:
echo   ✅ http://localhost/%SITE_NAME%
echo   ✅ http://%DOMAIN% (إذا تمت إضافة hosts)
echo   ✅ http://www.%DOMAIN%
echo.

echo هل تريد فتح الموقع للاختبار؟ (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo 🌐 فتح الموقع...
    start http://localhost/%SITE_NAME%
    timeout /t 2 >nul
    start http://%DOMAIN%
)

echo.
echo 🛠️ للمستقبل:
echo   - لإعادة تحميل Apache: quick-reload.bat
echo   - لإنشاء موقع آخر: auto-site.bat اسم-جديد
echo.
echo ✅ مبروك! موقعك جاهز للتطوير
pause 