@echo off
chcp 65001 >nul
echo 🌐 اختبار جميع المواقع في MyDevBox
echo ===============================
echo.

echo 🔍 التحقق من تشغيل Apache...
tasklist | findstr "httpd.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Apache غير متاح - بدء التشغيل...
    start "Apache MyDevBox" /MIN bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
    timeout /t 3 >nul
) else (
    echo ✅ Apache يعمل
)

echo.
echo 🔍 التحقق من Virtual Hosts:
echo --------------------------------

REM Laravel Projects
echo.
echo 📋 مشاريع Laravel:
if exist "config\vhosts\abc.conf" (
    echo ✅ abc.test - Laravel
    curl -s -o nul -w "%%{http_code}" http://abc.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ abc.conf غير موجود
)

if exist "config\vhosts\test5.conf" (
    echo ✅ test5.test - Laravel  
    curl -s -o nul -w "%%{http_code}" http://test5.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ test5.conf غير موجود
)

if exist "config\vhosts\werwer.conf" (
    echo ✅ werwer.test - Laravel
    curl -s -o nul -w "%%{http_code}" http://werwer.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ werwer.conf غير موجود
)

REM Regular PHP Projects
echo.
echo 📋 مشاريع PHP العادية:
if exist "config\vhosts\999.conf" (
    echo ✅ 999.test - Regular PHP
    curl -s -o nul -w "%%{http_code}" http://999.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ 999.conf غير موجود
)

if exist "config\vhosts\hamad.conf" (
    echo ✅ hamad.test - Regular PHP
    curl -s -o nul -w "%%{http_code}" http://hamad.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ hamad.conf غير موجود
)

if exist "config\vhosts\xxxx.conf" (
    echo ✅ xxxx.test - Regular PHP
    curl -s -o nul -w "%%{http_code}" http://xxxx.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ xxxx.conf غير موجود
)

if exist "config\vhosts\tasks.conf" (
    echo ✅ tasks.test - Regular PHP
    curl -s -o nul -w "%%{http_code}" http://tasks.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ tasks.conf غير موجود
)

if exist "config\vhosts\blog.conf" (
    echo ✅ blog.test - Regular PHP  
    curl -s -o nul -w "%%{http_code}" http://blog.test >nul && echo    └─ 🌐 يعمل || echo    └─ ❌ لا يعمل
) else (
    echo ❌ blog.conf غير موجود
)

echo.
echo 🔍 اختبار الوصول المباشر:
echo -------------------------
echo 📁 localhost/999 - 
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/999' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ يعمل (' $response.StatusCode ')' } catch { Write-Host '❌ لا يعمل' }"

echo.
echo 📊 ملخص الاختبار:
echo ================
echo - تأكد من تشغيل Apache
echo - تأكد من وجود ملفات Virtual Host
echo - تأكد من إضافة الدومينات لملف hosts
echo - تأكد من وجود ملفات index.php في المشاريع

echo.
echo 💡 لفتح أي موقع في المتصفح:
echo   start http://999.test
echo   start http://hamad.test  
echo   start http://abc.test
echo.

pause 