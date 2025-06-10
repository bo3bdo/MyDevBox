# إعداد Apache في MyDevBox

## 🚫 المشكلة الحالية
Apache غير موجود في مجلد `bin/apache/` في MyDevBox.

## 💡 الحلول المتاحة:

### الحل الأول: تحميل Apache Portable
1. اذهب إلى [Apache Lounge](https://www.apachelounge.com/download/)
2. حمل أحدث إصدار من Apache (Win64)
3. فك الضغط في مجلد `C:/MyDevBox/bin/apache/`

### الحل الثاني: استخدام XAMPP
1. ثبت XAMPP من [الموقع الرسمي](https://www.apachefriends.org/)
2. سيتم استخدام Apache من XAMPP مع تكوين MyDevBox

### الحل الثالث: استخدام خدمة ويب أخرى
- يمكن استخدام PHP Built-in Server لتطوير Laravel:
```cmd
cd www/abc/public
php -S localhost:8000
```

## 🔧 إعداد Apache بعد التحميل

### بنية المجلدات المطلوبة:
```
MyDevBox/
├── bin/
│   └── apache/
│       ├── bin/
│       │   └── httpd.exe
│       ├── conf/
│       ├── modules/
│       └── logs/
└── config/
    └── httpd.conf
```

### اختبار Apache:
```cmd
bin\apache\bin\httpd.exe -t -f "C:\MyDevBox\config\httpd.conf"
```

### تشغيل Apache:
```cmd
bin\apache\bin\httpd.exe -f "C:\MyDevBox\config\httpd.conf"
```

## ⚡ حل سريع للتطوير

بينما يتم إعداد Apache، يمكنك استخدام PHP Built-in Server:

```cmd
# للمشروع abc
cd C:\MyDevBox\www\abc\public
php -S abc.test:8000

# للمشروع test5  
cd C:\MyDevBox\www\test5\public
php -S test5.test:8001

# للمشروع werwer
cd C:\MyDevBox\www\werwer\public  
php -S werwer.test:8002
```

ثم اضف هذه الدومينات إلى ملف hosts:
```
127.0.0.1 abc.test
127.0.0.1 test5.test
127.0.0.1 werwer.test
```

## 🎯 النصيحة
الأفضل هو تحميل Apache Portable ووضعه في MyDevBox ليصبح تطبيقاً مستقلاً تماماً. 