@echo off
echo 🔧 إصلاح وتشغيل MySQL لـ MyDevBox
echo ================================
echo.

REM تشغيل كـ Administrator
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo ⚠️ هذا الملف يحتاج صلاحيات Administrator...
    echo 🔄 إعادة تشغيل كـ Administrator...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
"%temp%\getadmin.vbs"
del "%temp%\getadmin.vbs"
exit /B

:gotAdmin
cd /d "%~dp0"

echo ✅ تم الحصول على صلاحيات Administrator
echo.

echo 🛑 إيقاف أي عمليات MySQL موجودة...
taskkill /F /IM mysqld.exe >nul 2>&1

echo 📁 إنشاء مجلد tmp إذا لم يكن موجوداً...
if not exist "tmp" mkdir tmp

echo 🔑 إصلاح صلاحيات مجلد البيانات...
takeown /f "bin\mysql\data" /r /d y >nul 2>&1
icacls "bin\mysql\data" /grant Everyone:F /T >nul 2>&1
icacls "bin\mysql\data\ibdata1" /grant Everyone:F >nul 2>&1

echo 🗑️ حذف ملف PID القديم...
if exist "bin\mysql\data\mysql.pid" del "bin\mysql\data\mysql.pid" >nul 2>&1

echo 🔍 التحقق من وجود ملفات MySQL...
if not exist "bin\mysql\bin\mysqld.exe" (
    echo ❌ MySQL غير موجود!
    pause
    exit /b 1
)

echo ⚙️ استخدام تكوين MySQL مبسط...
if not exist "config\my-simple.ini" (
    echo ❌ ملف التكوين المبسط غير موجود!
    pause
    exit /b 1
)

echo 🚀 بدء تشغيل MySQL...
start "MySQL Server - MyDevBox" /MIN bin\mysql\bin\mysqld.exe --defaults-file=config\my-simple.ini --console

echo ⏳ انتظار 5 ثوانٍ...
timeout /t 5 >nul

echo 🔍 التحقق من نجاح التشغيل...
tasklist | findstr "mysqld.exe" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ تم تشغيل MySQL بنجاح!
    echo.
    echo 📊 معلومات الاتصال:
    echo - Host: localhost
    echo - Port: 3306  
    echo - Username: root
    echo - Password: (فارغ)
    echo - Storage Engine: MyISAM (بدلاً من InnoDB)
    echo.
    echo 🎯 اختبار الاتصال...
    bin\mysql\bin\mysql.exe -u root -h localhost -e "SHOW DATABASES;" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ الاتصال بقاعدة البيانات ناجح!
        echo.
        echo 🗃️ قواعد البيانات الموجودة:
        bin\mysql\bin\mysql.exe -u root -h localhost -e "SHOW DATABASES;"
    ) else (
        echo ⚠️ تم تشغيل MySQL ولكن هناك مشكلة في الاتصال
    )
) else (
    echo.
    echo ❌ فشل في تشغيل MySQL
    echo.
    echo 🔍 تحقق من ملف الأخطاء:
    if exist "bin\mysql\data\mysql_error.log" (
        echo آخر 5 أسطر من ملف الأخطاء:
        echo ----------------------------------------
        powershell "Get-Content bin\mysql\data\mysql_error.log | Select-Object -Last 5"
        echo ----------------------------------------
    )
    echo.
    echo 💡 نصائح لحل المشكلة:
    echo 1. تأكد من أن MyDevBox في مجلد C:\MyDevBox
    echo 2. أغلق أي برامج antivirus مؤقتاً
    echo 3. تأكد من عدم وجود MySQL آخر يعمل
    echo 4. أعد تشغيل الكمبيوتر وجرب مرة أخرى
)

echo.
echo 📝 ملاحظة: تم استخدام MyISAM بدلاً من InnoDB لتجنب مشاكل الصلاحيات
echo للحصول على InnoDB، ستحتاج لإعداد صلاحيات أكثر تعقيداً
echo.
pause 