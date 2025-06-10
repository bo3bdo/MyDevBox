# إعداد Laravel في MyDevBox

## 🚀 المتطلبات
- MyDevBox مثبت في `C:/MyDevBox`
- مشاريع Laravel في مجلد `www/`
- Apache و MySQL يعملان

## 📁 بنية المشروع
```
MyDevBox/
├── www/
│   ├── abc/              # مشروع Laravel
│   │   ├── public/       # نقطة الدخول (مهم!)
│   │   ├── .env          # إعدادات قاعدة البيانات
│   │   └── ...
│   ├── test5/            # مشروع Laravel آخر
│   └── werwer/           # مشروع Laravel ثالث
├── config/
│   ├── httpd.conf        # تكوين Apache
│   └── vhosts/           # Virtual Hosts
└── bin/
    ├── apache/
    └── mysql/
```

## ⚙️ إعداد Virtual Hosts لـ Laravel

تم تكوين Virtual Hosts لتشير إلى مجلد `/public` مباشرة:

```apache
DocumentRoot "C:/MyDevBox/www/abc/public"
<Directory "C:/MyDevBox/www/abc/public">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

## 🗄️ إعداد قواعد البيانات

تم إنشاء قواعد البيانات التالية:
- `abc_db` لمشروع abc
- `test5_db` لمشروع test5  
- `werwer_db` لمشروع werwer

## 🔧 ملفات .env

تم إعداد ملفات .env لكل مشروع مع:
```env
APP_URL=http://abc.test
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abc_db
DB_USERNAME=root
DB_PASSWORD=
```

## 🌐 الدومينات المحلية

المشاريع متاحة على:
- http://abc.test
- http://test5.test
- http://werwer.test
- http://localhost (الصفحة الرئيسية)

## 🛠️ استكشاف الأخطاء

### إذا لم يعمل الموقع:
1. تأكد من أن Apache يعمل
2. تحقق من وجود مجلد `/public` في المشروع
3. تأكد من صحة ملف .env
4. اختبر قاعدة البيانات

### لإعادة تشغيل Apache:
```cmd
taskkill /F /IM httpd.exe
bin/apache/bin/httpd.exe -f config/httpd.conf
```

### لاختبار التكوين:
```cmd
bin/apache/bin/httpd.exe -t -f config/httpd.conf
```

## ✅ التحقق من نجاح الإعداد

- [ ] Apache يعمل على المنفذ 80
- [ ] MySQL يعمل على المنفذ 3306
- [ ] Virtual Hosts تشير إلى `/public`
- [ ] ملفات .env تحتوي على إعدادات صحيحة
- [ ] قواعد البيانات تم إنشاؤها
- [ ] الدومينات المحلية تعمل

🎉 **تم إعداد Laravel بنجاح في MyDevBox!** 