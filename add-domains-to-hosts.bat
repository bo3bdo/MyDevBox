@echo off
echo 🌐 إضافة دومينات MyDevBox إلى ملف hosts
echo ========================================

REM نسخ احتياطي من ملف hosts
copy C:\Windows\System32\drivers\etc\hosts C:\Windows\System32\drivers\etc\hosts.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%

echo.
echo 📋 إضافة الدومينات التالية:
echo 127.0.0.1    aaa.test
echo 127.0.0.1    ooo.test  
echo 127.0.0.1    new-site.test
echo 127.0.0.1    car2.test
echo 127.0.0.1    tasks.test

echo.
echo 🔍 تحقق من الدومينات الحالية...
findstr "\.test" C:\Windows\System32\drivers\etc\hosts >nul
if %errorlevel%==0 (
    echo ⚠️  تم العثور على دومينات .test موجودة مسبقاً
    echo لعرضها:
    findstr "\.test" C:\Windows\System32\drivers\etc\hosts
) else (
    echo ✅ لم يتم العثور على دومينات .test
    echo يمكنك إضافتها يدوياً أو تشغيل كـ Administrator
)

echo.
echo 💡 لإضافة الدومينات تلقائياً:
echo 1. شغل هذا الملف كـ Administrator
echo 2. أو أضف يدوياً في ملف: C:\Windows\System32\drivers\etc\hosts
echo.
echo الأسطر المطلوبة:
echo 127.0.0.1    aaa.test
echo 127.0.0.1    ooo.test
echo 127.0.0.1    new-site.test  
echo 127.0.0.1    car2.test
echo 127.0.0.1    tasks.test

REM إذا كان المستخدم Administrator، أضف الدومينات
net session >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo 🔑 تم اكتشاف صلاحيات Administrator - إضافة الدومينات...
    
    echo. >> C:\Windows\System32\drivers\etc\hosts
    echo # MyDevBox Local Domains >> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    aaa.test >> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    ooo.test >> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    new-site.test >> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    car2.test >> C:\Windows\System32\drivers\etc\hosts
    echo 127.0.0.1    tasks.test >> C:\Windows\System32\drivers\etc\hosts
    
    echo ✅ تم إضافة الدومينات بنجاح!
    echo.
    echo 🌐 يمكنك الآن زيارة:
    echo   - http://aaa.test
    echo   - http://ooo.test
    echo   - http://new-site.test
    echo   - http://car2.test/public
    echo   - http://tasks.test
) else (
    echo.
    echo ❌ تحتاج لصلاحيات Administrator لتعديل ملف hosts
    echo انقر بزر الماوس الأيمن على هذا الملف واختر "Run as administrator"
)

echo.
pause 