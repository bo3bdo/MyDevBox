@echo off
setlocal enabledelayedexpansion

if "%1"=="" (
    echo ❌ يرجى تحديد اسم الموقع
    echo الاستخدام: quick-new-site.bat اسم-الموقع
    echo مثال: quick-new-site.bat my-blog
    pause
    exit /b 1
)

set SITE_NAME=%1
set DOMAIN=%SITE_NAME%.test

echo 🚀 إنشاء موقع: %SITE_NAME%
echo الدومين: %DOMAIN%
echo.

REM إنشاء المجلد
mkdir "www\%SITE_NAME%" 2>nul

REM إنشاء index.php بسيط
echo ^<!DOCTYPE html^> > "www\%SITE_NAME%\index.php"
echo ^<html lang="ar" dir="rtl"^> >> "www\%SITE_NAME%\index.php"
echo ^<head^>^<meta charset="UTF-8"^>^<title^>%SITE_NAME%^</title^>^</head^> >> "www\%SITE_NAME%\index.php"
echo ^<body style="font-family:Arial;text-align:center;padding:50px;background:#f0f0f0"^> >> "www\%SITE_NAME%\index.php"
echo ^<h1^>🎉 %SITE_NAME%^</h1^> >> "www\%SITE_NAME%\index.php"
echo ^<p^>الموقع يعمل بنجاح!^</p^> >> "www\%SITE_NAME%\index.php"
echo ^<p^>الدومين: %DOMAIN%^</p^> >> "www\%SITE_NAME%\index.php"
echo ^<p^>الوقت: ^<?php echo date('Y-m-d H:i:s'); ?^>^</p^> >> "www\%SITE_NAME%\index.php"
echo ^</body^>^</html^> >> "www\%SITE_NAME%\index.php"

echo ✅ تم إنشاء الموقع في: www\%SITE_NAME%

REM إضافة الدومين لـ hosts
echo 127.0.0.1    %DOMAIN% >> C:\Windows\System32\drivers\etc\hosts 2>nul

if %errorlevel%==0 (
    echo ✅ تم إضافة الدومين: %DOMAIN%
) else (
    echo ⚠️ لم يتم إضافة الدومين - أضف يدوياً:
    echo 127.0.0.1    %DOMAIN%
)

echo.
echo 🌐 الروابط المتاحة:
echo - http://%DOMAIN%
echo - http://localhost/%SITE_NAME%
echo.

echo هل تريد فتح الموقع؟ (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    start http://localhost/%SITE_NAME%
    start http://%DOMAIN%
)

echo ✅ تم الانتهاء!
pause 