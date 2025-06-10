@echo off
echo ⚡ إعادة تحميل سريع لـ Apache
echo ============================

REM فحص إذا كان Apache يعمل
tasklist | findstr httpd >nul
if %errorlevel%==0 (
    echo 📋 Apache يعمل حالياً - إعادة تشغيل...
    
    REM إيقاف سريع
    taskkill /f /im httpd.exe >nul 2>&1
    timeout /t 1 >nul
    
    REM بدء سريع
    start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
    timeout /t 2 >nul
    
    REM فحص النتيجة
    tasklist | findstr httpd >nul
    if %errorlevel%==0 (
        echo ✅ تم إعادة التشغيل بنجاح
    ) else (
        echo ❌ فشل في إعادة التشغيل
    )
) else (
    echo 📋 Apache لا يعمل - بدء جديد...
    start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
    timeout /t 2 >nul
    
    tasklist | findstr httpd >nul
    if %errorlevel%==0 (
        echo ✅ تم بدء Apache بنجاح
    ) else (
        echo ❌ فشل في بدء Apache
    )
)

echo.
echo 🌐 جميع الدومينات جاهزة الآن! 