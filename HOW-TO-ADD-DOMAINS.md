# 🌐 دليل إضافة الدومينات التلقائية للمواقع الجديدة

## 📋 الوضع الحالي
تم إنشاء أدوات تلقائية لإضافة دومين `.test` لأي موقع جديد تنشئه.

## 🛠️ الأدوات المتاحة

### 1. أداة إنشاء موقع جديد (مبسطة)
```bash
create-site.bat اسم-الموقع
```

**مثال:**
```bash
create-site.bat my-blog
```

**ما تفعله الأداة:**
- ✅ تنشئ مجلد الموقع في `www/`
- ✅ تنشئ ملف `index.html` أساسي
- ✅ تضيف الدومين تلقائياً لملف hosts
- ✅ تعطيك الروابط للاختبار

### 2. أداة إضافة الدومينات (شاملة)
```powershell
powershell -ExecutionPolicy Bypass -File add-hosts.ps1
```

**ما تفعله:**
- ✅ تضيف جميع دومينات المواقع الموجودة
- ✅ تعمل نسخة احتياطية من hosts
- ✅ تتحقق من الصلاحيات تلقائياً

## 🎯 كيفية إنشاء موقع جديد مع دومين تلقائي

### الطريقة السريعة:
```bash
# 1. انتقل لمجلد MyDevBox
cd C:\MyDevBox

# 2. أنشئ الموقع
create-site.bat متجري

# 3. النتيجة:
# - www/متجري/ (مجلد الموقع)
# - http://localhost/متجري
# - http://متجري.test (إذا كان لديك صلاحيات)
```

### الطريقة اليدوية:
```bash
# 1. إنشاء المجلد
mkdir www\اسم-الموقع

# 2. إنشاء index.php
echo "<!DOCTYPE html><html><head><title>موقعي</title></head><body><h1>مرحباً!</h1></body></html>" > www\اسم-الموقع\index.php

# 3. إضافة الدومين (تحتاج صلاحيات Administrator)
echo 127.0.0.1 اسم-الموقع.test >> C:\Windows\System32\drivers\etc\hosts
```

## 📝 قائمة الدومينات الحالية

بعد إضافة الدومينات، ستستطيع زيارة:

### 🌐 المواقع الموجودة:
- `http://aaa.test` → موقع AAA
- `http://ooo.test` → موقع OOO  
- `http://new-site.test` → الموقع الجديد
- `http://car2.test/public` → مشروع Laravel
- `http://demo-site.test` → الموقع التجريبي

### 📋 الأسطر في ملف hosts:
```
# MyDevBox Local Domains
127.0.0.1    aaa.test
127.0.0.1    ooo.test
127.0.0.1    new-site.test
127.0.0.1    car2.test
127.0.0.1    demo-site.test
127.0.0.1    tasks.test
```

## 🔧 إضافة دومين لموقع موجود

إذا كان لديك موقع موجود وتريد إضافة دومين له:

### 1. إضافة الدومين لـ hosts:
```bash
# افتح Command Prompt كـ Administrator
echo 127.0.0.1 اسم-الموقع.test >> C:\Windows\System32\drivers\etc\hosts
```

### 2. إضافة Virtual Host (اختياري):
أنشئ ملف `config/vhosts/اسم-الموقع.conf`:
```apache
<VirtualHost *:80>
    DocumentRoot "C:/MyDevBox/www/اسم-الموقع"
    ServerName اسم-الموقع.test
    ServerAlias www.اسم-الموقع.test
    
    <Directory "C:/MyDevBox/www/اسم-الموقع">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html
    </Directory>
</VirtualHost>
```

### 3. إعادة تشغيل Apache:
```bash
taskkill /f /im httpd.exe
bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
```

## 🚨 حل المشاكل الشائعة

### المشكلة: الدومين لا يعمل
**الحل:**
1. تأكد من إضافة السطر لملف hosts
2. أعد تشغيل المتصفح
3. جرب `ipconfig /flushdns`

### المشكلة: لا يمكن تعديل ملف hosts
**الحل:**
1. افتح Command Prompt كـ Administrator
2. أو عدل الملف يدوياً بـ Notepad (Run as Administrator)

### المشكلة: Apache لا يتعرف على Virtual Host
**الحل:**
1. تأكد من وجود الملف في `config/vhosts/`
2. أعد تشغيل Apache
3. تحقق من ملف الأخطاء `bin/apache/logs/error.log`

## 💡 نصائح مهمة

### ✅ افعل:
- استخدم أسماء مواقع بالإنجليزية (بدون مسافات)
- احفظ نسخة احتياطية من ملف hosts
- اختبر الموقع بعد الإنشاء مباشرة
- استخدم `.test` للمواقع المحلية

### ❌ لا تفعل:
- لا تستخدم دومينات حقيقية مثل `.com` محلياً
- لا تنس إعادة تشغيل Apache بعد التغييرات
- لا تحذف المواقع بدون نسخ احتياطية

## 🎯 أمثلة عملية

### إنشاء متجر إلكتروني:
```bash
create-site.bat shop
# النتيجة: http://shop.test
```

### إنشاء مدونة:
```bash
create-site.bat blog
# النتيجة: http://blog.test
```

### إنشاء موقع شركة:
```bash
create-site.bat company
# النتيجة: http://company.test
```

## 📞 الملفات المساعدة

- `create-site.bat` - إنشاء موقع جديد
- `add-hosts.ps1` - إضافة جميع الدومينات
- `WEBSITE-GUIDE.md` - الدليل الشامل
- `safe-start-apache.bat` - تشغيل Apache

---

## ✅ الخلاصة

الآن أصبح لديك نظام تلقائي لإضافة دومينات `.test` لأي موقع جديد تنشئه. 

**لإنشاء موقع جديد:**
```bash
create-site.bat اسم-الموقع
```

**لإضافة الدومينات لجميع المواقع:**
```powershell
powershell -ExecutionPolicy Bypass -File add-hosts.ps1
```

🎉 **استمتع بالتطوير مع MyDevBox!** 