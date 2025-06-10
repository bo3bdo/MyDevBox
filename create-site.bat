@echo off
echo 🚀 إنشاء موقع جديد
echo اسم الموقع: %1
echo الدومين: %1.test

if "%1"=="" (
    echo خطأ: اكتب اسم الموقع
    echo مثال: create-site.bat my-site
    pause
    exit
)

mkdir www\%1
echo تم إنشاء المجلد: www\%1

echo ^<html^>^<head^>^<title^>%1^</title^>^</head^> > www\%1\index.html
echo ^<body^>^<h1^>%1^</h1^>^<p^>الموقع يعمل!^</p^>^</body^>^</html^> >> www\%1\index.html

echo تم إنشاء index.html

echo 127.0.0.1 %1.test >> C:\Windows\System32\drivers\etc\hosts
echo تم إضافة الدومين (إذا كان لديك صلاحيات)

echo.
echo 🔄 إعادة تشغيل Apache ليتعرف على الدومين الجديد...
taskkill /f /im httpd.exe >nul 2>&1
timeout /t 2 >nul
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
timeout /t 3 >nul

echo ✅ تم إعادة تشغيل Apache

echo.
echo ✅ تم إنشاء الموقع بنجاح!
echo 🌐 الروابط المتاحة:
echo   - http://localhost/%1
echo   - http://%1.test (بعد إضافة hosts)
echo.

echo هل تريد اختبار الموقع؟ (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    start http://localhost/%1
    timeout /t 2 >nul
    if not "%1"=="" start http://%1.test
)

echo.
echo 💡 لإعادة تحميل Apache في المستقبل استخدم:
echo   reload-apache.bat

pause 