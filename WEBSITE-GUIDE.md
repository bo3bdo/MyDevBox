# 🚀 دليل إدارة المواقع في MyDevBox

## 📋 الوضع الحالي
تم إصلاح جميع المشاكل! Apache يعمل الآن بشكل صحيح من MyDevBox (وليس من XAMPP).

## ✅ المواقع التي تعمل الآن

### 🌐 الوصول عبر localhost
- **الصفحة الرئيسية**: http://localhost
- **موقع AAA**: http://localhost/aaa
- **موقع OOO**: http://localhost/ooo  
- **موقع New Site**: http://localhost/new-site
- **مشروع Car2 Laravel**: http://localhost/car2/public
- **phpMyAdmin**: http://localhost/phpmyadmin

### 🛠️ أدوات الاختبار
- **معلومات PHP**: http://localhost/info.php
- **اختبار MySQL**: http://localhost/mysql-test.php
- **صفحة اختبار**: http://localhost/test.html

## 🌐 إضافة دومينات .test (مستحسن)

لاستخدام دومينات مثل `aaa.test` بدلاً من `localhost/aaa`:

### 📋 الدومينات المطلوبة
```
127.0.0.1    aaa.test
127.0.0.1    ooo.test
127.0.0.1    new-site.test
127.0.0.1    car2.test
127.0.0.1    tasks.test
```

### 🔧 طريقة الإضافة

#### الطريقة الأولى: يدوياً
1. افتح Notepad كـ Administrator
2. اذهب إلى: `C:\Windows\System32\drivers\etc\hosts`
3. أضف الأسطر أعلاه في نهاية الملف
4. احفظ الملف

#### الطريقة الثانية: تلقائياً
1. افتح PowerShell كـ Administrator
2. شغل الأمر:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\MyDevBox\add-hosts.ps1"
```

### 🌐 بعد إضافة الدومينات ستستطيع زيارة:
- **http://aaa.test** - موقع AAA
- **http://ooo.test** - موقع OOO  
- **http://new-site.test** - الموقع الجديد
- **http://car2.test/public** - مشروع Laravel
- **http://tasks.test** - موقع المهام

## 🔧 كيفية تشغيل Apache

### البدء السريع
```bash
# انتقل إلى مجلد MyDevBox
cd C:\MyDevBox

# شغل Apache
bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
```

### أو استخدم الملفات المساعدة
```bash
# تشغيل آمن
.\safe-start-apache.bat

# أو
.\start-apache.bat
```

## 🔍 اختبار المواقع
```bash
# اختبار جميع المواقع
.\test-all-websites.bat
```

## 📁 هيكل المجلدات
```
MyDevBox/
├── www/                 # مجلد المواقع
│   ├── aaa/            # موقع AAA
│   ├── ooo/            # موقع OOO
│   ├── new-site/       # الموقع الجديد
│   ├── car2/           # مشروع Laravel
│   └── index.html      # الصفحة الرئيسية
├── bin/                # برامج Apache & PHP
├── config/             # ملفات التكوين
├── logs/               # ملفات السجلات
└── *.bat              # ملفات التشغيل
```

## 🚨 استكشاف الأخطاء

### Apache لا يعمل؟
1. تأكد من عدم تشغيل XAMPP أو IIS
2. تحقق من ملف الأخطاء: `bin\apache\logs\error.log`
3. أوقف Apache: `taskkill /f /im httpd.exe`

### موقع لا يعمل؟
1. تأكد من وجود ملف `index.php` أو `index.html`
2. تحقق من صلاحيات المجلد
3. راجع ملف الأخطاء

### PHP لا يعمل؟
1. تأكد من تحميل PHP module في `config\httpd.conf`
2. تحقق من مسار PHP الصحيح
3. اختبر: http://localhost/info.php

## 📞 ملفات مساعدة
- `start-apache.bat` - تشغيل Apache
- `safe-start-apache.bat` - تشغيل آمن
- `test-all-websites.bat` - اختبار المواقع
- `add-hosts.ps1` - إضافة دومينات .test
- `force-kill-apache.ps1` - إيقاف قسري

## 💡 نصائح
- استخدم دائماً MyDevBox وليس XAMPP
- احفظ ملفات نسخ احتياطية من التكوين
- اختبر المواقع بعد أي تغيير
- استخدم دومينات .test للتطوير المحلي

---
✅ **جميع المواقع تعمل بنجاح الآن!**

للمساعدة أو الأسئلة، راجع ملفات Log أو ابدأ Apache من جديد. 