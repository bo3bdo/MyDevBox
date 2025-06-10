@echo off
echo === محتوى ملف hosts الحالي ===
type C:\Windows\System32\drivers\etc\hosts | findstr /V "^#" | findstr /V "^$"

echo.
echo === البحث عن دومينات .test ===
type C:\Windows\System32\drivers\etc\hosts | findstr "\.test"

echo.
echo === إضافة دومينات MyDevBox ===
echo إذا لم تجد دومينات .test أعلاه، فأنت تحتاج لإضافة:
echo 127.0.0.1    aaa.test
echo 127.0.0.1    ooo.test
echo 127.0.0.1    new-site.test
echo 127.0.0.1    car2.test
echo 127.0.0.1    tasks.test

pause 