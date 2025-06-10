@echo off
echo Adding car.test to hosts file...
powershell -Command "Start-Process cmd -ArgumentList '/c echo 127.0.0.1 car.test >> C:\Windows\System32\drivers\etc\hosts' -Verb RunAs"
echo car.test added to hosts file
pause 