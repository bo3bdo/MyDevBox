@echo off
echo 🔄 إعادة تحميل تكوين Apache
echo ============================

echo 📋 إيقاف Apache الحالي...
taskkill /f /im httpd.exe >nul 2>&1
if %errorlevel%==0 (
    echo ✅ تم إيقاف Apache
) else (
    echo ⚠️ Apache لم يكن يعمل
)

echo.
echo ⏳ انتظار 2 ثانية...
timeout /t 2 >nul

echo.
echo 🚀 بدء Apache مع التكوين الجديد...
start /b bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"

echo.
echo ⏳ انتظار 3 ثواني للتأكد من البدء...
timeout /t 3 >nul

echo.
echo 🔍 فحص حالة Apache...
tasklist | findstr httpd >nul
if %errorlevel%==0 (
    echo ✅ Apache يعمل بنجاح!
    echo.
    echo 🌐 يمكنك الآن زيارة جميع الدومينات الجديدة
) else (
    echo ❌ خطأ في تشغيل Apache
    echo راجع ملف الأخطاء: bin\apache\logs\error.log
)

echo.
echo 📊 عرض العمليات الحالية:
tasklist | findstr httpd

echo.
echo 🔗 الدومينات المتاحة:
echo - http://localhost
echo - http://aaa.test
echo - http://ooo.test  
echo - http://new-site.test
echo - http://demo-site.test
echo + أي دومينات جديدة أضفتها

echo.
echo ✅ انتهت عملية إعادة التحميل
pause 