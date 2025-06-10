# MyDevBox - بيئة التطوير المحلية للمطورين العرب

<div align="center">
  <img src="assets/icon.png" alt="MyDevBox Logo" width="128" height="128">
  
  [![Version](https://img.shields.io/badge/version-1.0.0--beta-orange.svg)](https://github.com/mydevbox/mydevbox)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://github.com/mydevbox/mydevbox)
  [![Contributors](https://img.shields.io/badge/contributors-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Arabic](https://img.shields.io/badge/العربية-supported-blue.svg)](#)
</div>

## 📖 نبذة عن المشروع

**MyDevBox** هو مشروع مفتوح المصدر يهدف لإنشاء بيئة تطوير محلية متكاملة للمطورين العرب، كبديل محلي ومتقدم لبرامج مثل Laragon و XAMPP. المشروع مبني باستخدام **Electron** و **Node.js** ويدعم اللغة العربية بالكامل.

### 🎯 الهدف من المشروع
- توفير بيئة تطوير محلية سهلة الاستخدام
- دعم كامل للغة العربية في الواجهة
- واجهة مستخدم حديثة ومتقدمة
- إدارة مبسطة للخدمات (Apache, MySQL, PHP)
- أتمتة إعداد المواقع والنطاقات المحلية

## 🚧 حالة المشروع

### المرحلة الحالية: **Beta 1.0.0**

#### ✅ الميزات المكتملة
- [x] **واجهة Electron** - تطبيق سطح مكتب بواجهة حديثة
- [x] **System Tray** - إدارة من أيقونة النظام
- [x] **إدارة Apache** - تشغيل وإيقاف خادم الويب
- [x] **إدارة MySQL** - تشغيل وإيقاف قاعدة البيانات
- [x] **دعم PHP** - تشغيل تطبيقات PHP
- [x] **إدارة Virtual Hosts** - إعداد نطاقات محلية
- [x] **تحديث ملف Hosts** - أتمتة إضافة النطاقات
- [x] **نوافذ تقدم العمليات** - متابعة حالة العمليات
- [x] **دعم العربية** - واجهة باللغة العربية

#### 🔄 قيد التطوير
- [ ] **إعدادات التطبيق** - نافذة إعدادات متقدمة
- [ ] **إنشاء مواقع جديدة** - معالج إنشاء المشاريع
- [ ] **إدارة إصدارات PHP** - تبديل بين إصدارات مختلفة
- [ ] **نظام الإشعارات** - تنبيهات النظام
- [ ] **أتمتة التحديثات** - نظام تحديث تلقائي

#### 📋 المخطط للمستقبل
- [ ] **دعم Node.js** - تشغيل تطبيقات Node.js
- [ ] **دعم Python** - بيئة Python للتطوير
- [ ] **Docker Integration** - دعم حاويات Docker
- [ ] **SSL Certificates** - شهادات SSL محلية
- [ ] **Database Tools** - أدوات إدارة قواعد البيانات المتقدمة
- [ ] **Code Editor Integration** - تكامل مع محررات الكود

## 🛠️ التقنيات المستخدمة

### Frontend
- **Electron** - إطار تطبيقات سطح المكتب
- **HTML5/CSS3** - واجهة المستخدم
- **JavaScript** - منطق التطبيق

### Backend Services
- **Apache HTTP Server** - خادم الويب
- **MySQL** - قاعدة البيانات
- **PHP** - لغة البرمجة الخلفية
- **phpMyAdmin** - إدارة قواعد البيانات

### Development Tools
- **Node.js** - بيئة تشغيل JavaScript
- **PowerShell** - إدارة النظام
- **Batch Scripts** - أتمتة المهام

## 📁 هيكل المشروع

```
MyDevBox/
├── 📁 src/                    # ملفات المصدر الرئيسية
│   ├── main.js               # العملية الرئيسية للتطبيق
│   ├── tray.js               # إدارة أيقونة النظام
│   ├── preload.js            # أمان Electron
│   ├── settings.html         # نافذة الإعدادات
│   └── progress.html         # نافذة التقدم
├── 📁 bin/                    # الملفات التنفيذية
│   ├── apache/               # خادم Apache
│   ├── mysql/                # خادم MySQL
│   └── php/                  # مفسر PHP
├── 📁 config/                 # ملفات التكوين
│   ├── httpd.conf            # تكوين Apache
│   ├── my.ini                # تكوين MySQL
│   └── vhosts/               # Virtual Hosts
├── 📁 www/                    # مجلد المواقع
│   ├── index.html            # لوحة التحكم الرئيسية
│   └── [مواقعك]/             # مجلدات المواقع
├── 📁 assets/                 # الموارد والأيقونات
├── 📁 scripts/                # نصوص الأتمتة
└── 📁 docs/                   # الوثائق
```

## 🚀 التثبيت والتشغيل

### متطلبات النظام
- **نظام التشغيل**: Windows 10/11
- **الذاكرة**: 4GB RAM (مستحسن)
- **مساحة التخزين**: 2GB مساحة فارغة
- **الصلاحيات**: صلاحيات مدير النظام

### خطوات التثبيت

#### 1. استنساخ المشروع
```bash
git clone https://github.com/bo3bdo/mydevbox.git
cd mydevbox
```

#### 2. تثبيت التبعيات
```bash
npm install
```

#### 3. إعداد الخدمات
- تحميل Apache, MySQL, PHP وضعها في مجلد `bin/`
- تحديث مسارات التكوين في `config/`

#### 4. تشغيل التطبيق
```bash
npm start
```

### التطوير

#### تشغيل في وضع التطوير
```bash
npm run dev
```

#### بناء التطبيق
```bash
npm run build
```

#### اختبار التطبيق
```bash
npm test
```

## 🤝 المساهمة في المشروع

نرحب بجميع أنواع المساهمات! هذا مشروع مفتوح المصدر ونحتاج مساعدتكم لتطويره.

### 📝 كيفية المساهمة

#### 1. أنواع المساهمات المطلوبة
- **تطوير الكود** - إضافة ميزات جديدة أو إصلاح الأخطاء
- **تصميم الواجهة** - تحسين تجربة المستخدم
- **الترجمة** - دعم لغات جديدة
- **الوثائق** - كتابة وتحسين الوثائق
- **الاختبارات** - اختبار وإبلاغ عن الأخطاء
- **الدعم الفني** - مساعدة المستخدمين الآخرين

#### 2. خطوات المساهمة
1. **Fork** المشروع على GitHub
2. إنشاء **branch** جديد للميزة
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. إجراء التعديلات المطلوبة
4. اختبار التغييرات
5. **Commit** التغييرات
   ```bash
   git commit -m "Add: إضافة ميزة رائعة"
   ```
6. **Push** للـ branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. فتح **Pull Request**

#### 3. معايير الكود
- استخدام أسماء متغيرات وصفية
- كتابة تعليقات باللغة العربية
- اتباع نمط الكود الموجود
- اختبار التغييرات قبل الإرسال

### 🐛 الإبلاغ عن الأخطاء

عند العثور على خطأ، يرجى [فتح issue جديد](https://github.com/bo3bdo/mydevbox/issues/new) مع:
- **وصف الخطأ** - شرح مفصل للمشكلة
- **خطوات الاستنساخ** - كيفية إعادة إنتاج الخطأ
- **البيئة** - نظام التشغيل والإصدار
- **لقطات الشاشة** - إن أمكن
- **ملفات السجلات** - أي رسائل خطأ

### 💡 اقتراح الميزات

لاقتراح ميزة جديدة:
1. تحقق من [قائمة الميزات المخططة](#-قيد-التطوير)
2. ابحث في [Issues المفتوحة](https://github.com/bo3bdo/mydevbox/issues)
3. إذا لم تجد مقترحك، [أفتح issue جديد](https://github.com/bo3bdo/mydevbox/issues/new)

## 📚 الوثائق والموارد

### الوثائق المتاحة
- [دليل المطور](docs/developer-guide.md)
- [دليل المستخدم](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [أسئلة شائعة](docs/faq.md)
- [استكشاف الأخطاء](docs/troubleshooting.md)

### الموارد الخارجية
- [Electron Documentation](https://electronjs.org/docs)
- [Apache Documentation](https://httpd.apache.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PHP Documentation](https://www.php.net/manual/)

## 🗺️ خارطة الطريق

### الإصدار 1.1 (Q1 2024)
- [ ] نافذة إعدادات متكاملة
- [ ] معالج إنشاء المشاريع
- [ ] دعم إصدارات PHP متعددة
- [ ] نظام إشعارات محسن

### الإصدار 1.2 (Q2 2024)
- [ ] دعم Node.js
- [ ] تكامل مع Git
- [ ] أدوات تطوير متقدمة
- [ ] شهادات SSL محلية

### الإصدار 2.0 (Q3 2024)
- [ ] إعادة تصميم الواجهة
- [ ] دعم Docker
- [ ] دعم Linux/macOS
- [ ] نظام إضافات (Plugins)

## 📊 الإحصائيات

![GitHub stars](https://img.shields.io/github/stars/bo3bdo/mydevbox)
![GitHub forks](https://img.shields.io/github/forks/bo3bdo/mydevbox)
![GitHub issues](https://img.shields.io/github/issues/bo3bdo/mydevbox)
![GitHub pull requests](https://img.shields.io/github/issues-pr/bo3bdo/mydevbox)

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة **MIT License** - راجع ملف [LICENSE](LICENSE) للتفاصيل الكاملة.

### ما يعنيه هذا:
- ✅ **الاستخدام التجاري** مسموح
- ✅ **التعديل** مسموح
- ✅ **التوزيع** مسموح
- ✅ **الاستخدام الخاص** مسموح
- ⚠️ **بدون ضمان** - الاستخدام على مسؤوليتك
- 📝 **ذكر المصدر** مطلوب

## 🙏 شكر وتقدير

### شكر خاص لـ:
- **فريق Electron** - لإطار العمل الرائع
- **مجتمع Node.js** - للأدوات والمكتبات
- **Apache Foundation** - لخادم الويب المميز
- **MySQL Team** - لقاعدة البيانات القوية
- **PHP Community** - للغة البرمجة المرنة

### المساهمون
قائمة بجميع من ساهموا في هذا المشروع:

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- يتم تحديث هذا القسم تلقائياً -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## 🔗 روابط مهمة

- [🌐 الموقع الرسمي](https://mydevbox.github.io)
- [📖 الوثائق الكاملة](https://docs.mydevbox.github.io)
- [🐛 الإبلاغ عن الأخطاء](https://github.com/bo3bdo/mydevbox/issues)
- [💬 المجتمع والدعم](https://github.com/bo3bdo/mydevbox/discussions)
- [📧 التواصل](mailto:support@mydevbox.com)

## 📞 التواصل والدعم

### للمطورين
- **GitHub Discussions** - للنقاشات التقنية
- **Discord** - للدردشة المباشرة
- **Telegram** - للمجتمع العربي

### للمستخدمين
- **GitHub Issues** - للمشاكل التقنية
- **Documentation** - للأدلة والشروحات
- **FAQ** - للأسئلة الشائعة

---

<div align="center">
  <h3>🚀 انضم إلينا في بناء أفضل بيئة تطوير للمطورين العرب!</h3>
  <p>
    <a href="https://github.com/bo3bdo/mydevbox/fork">🍴 Fork المشروع</a> •
    <a href="https://github.com/bo3bdo/mydevbox/issues">🐛 الإبلاغ عن خطأ</a> •
    <a href="https://github.com/bo3bdo/mydevbox/discussions">💬 انضم للنقاش</a>
  </p>
  <p>صنع بـ ❤️ من قبل المطورين العرب للمطورين العرب</p>
  <p>© 2024 MyDevBox Project. جميع الحقوق محفوظة.</p>
</div> 