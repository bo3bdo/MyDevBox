@echo off
if "%1"=="" (
    echo استخدام: simple-new-site.bat اسم-الموقع
    pause
    exit
)

echo إنشاء موقع: %1
echo دومين: %1.test

REM إنشاء المجلد
mkdir www\%1

REM إنشاء صفحة بسيطة
echo ^<!DOCTYPE html^> > www\%1\index.php
echo ^<html^>^<head^>^<title^>%1^</title^>^</head^> >> www\%1\index.php
echo ^<body style="text-align:center;padding:50px;font-family:Arial"^> >> www\%1\index.php
echo ^<h1^>%1^</h1^> >> www\%1\index.php
echo ^<p^>الموقع يعمل! الوقت: ^<?php echo date('Y-m-d H:i:s'); ?^>^</p^> >> www\%1\index.php
echo ^<p^>زر: ^<a href="http://%1.test"^>%1.test^</a^>^</p^> >> www\%1\index.php
echo ^</body^>^</html^> >> www\%1\index.php

REM إضافة للـ hosts
echo 127.0.0.1 %1.test >> C:\Windows\System32\drivers\etc\hosts

REM إعادة تشغيل Apache
echo إعادة تشغيل Apache...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 2 >nul
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 3 >nul

echo ✅ تم الانتهاء!
echo روابط الموقع:
echo - http://localhost/%1
echo - http://%1.test

pause 