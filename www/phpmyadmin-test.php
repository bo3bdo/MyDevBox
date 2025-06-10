<?php
// اختبار اتصال MySQL و phpMyAdmin
$host = 'localhost';
$port = 3306;
$username = 'root';
$password = '';

// محاولة الاتصال
try {
    $pdo = new PDO("mysql:host=$host;port=$port", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo '<h1>🎉 نجح الاتصال بـ MySQL!</h1>';
    echo '<h2>معلومات الخادم:</h2>';
    echo '<ul>';
    echo '<li><strong>المضيف:</strong> ' . $host . ':' . $port . '</li>';
    echo '<li><strong>المستخدم:</strong> ' . $username . '</li>';
    echo '<li><strong>حالة الاتصال:</strong> متصل ✅</li>';
    echo '</ul>';
    
    // عرض قواعد البيانات المتاحة
    $stmt = $pdo->query('SHOW DATABASES');
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo '<h2>قواعد البيانات المتاحة:</h2>';
    echo '<ul>';
    foreach ($databases as $db) {
        echo '<li>' . htmlspecialchars($db) . '</li>';
    }
    echo '</ul>';
    
    // عرض معلومات MySQL
    $stmt = $pdo->query('SELECT VERSION() as version');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo '<h2>إصدار MySQL:</h2>';
    echo '<p>' . $result['version'] . '</p>';
    
    echo '<hr>';
    echo '<h2>🔧 إدارة متقدمة مع phpMyAdmin</h2>';
    echo '<p>للحصول على إدارة أكثر تفصيلاً لقواعد البيانات، استخدم phpMyAdmin:</p>';
    echo '<ul>';
    echo '<li>📊 عرض وتحرير البيانات بشكل مرئي</li>';
    echo '<li>🔍 بحث متقدم وفلترة</li>';
    echo '<li>📥 استيراد ملفات SQL و CSV</li>';
    echo '<li>📤 تصدير البيانات بتنسيقات مختلفة</li>';
    echo '<li>👥 إدارة المستخدمين والصلاحيات</li>';
    echo '<li>⚡ تنفيذ استعلامات SQL مخصصة</li>';
    echo '<li>📈 مراقبة الأداء</li>';
    echo '</ul>';
    
    echo '<div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">';
    echo '<h3>🚀 كيفية الوصول لـ phpMyAdmin:</h3>';
    echo '<ol>';
    echo '<li>انقر بالزر الأيمن على أيقونة MyDevBox</li>';
    echo '<li>إذا لم يكن مثبتاً: اختر "⬇️ تحميل وتثبيت phpMyAdmin"</li>';
    echo '<li>بعد التثبيت: اختر "🔧 فتح phpMyAdmin"</li>';
    echo '<li>أو افتح المتصفح واذهب إلى: <a href="http://localhost/phpmyadmin" target="_blank">http://localhost/phpmyadmin</a></li>';
    echo '</ol>';
    echo '</div>';
    
    echo '<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">';
    echo '<h3>💡 نصائح للاستخدام:</h3>';
    echo '<ul>';
    echo '<li>لا تحتاج كلمة مرور للدخول (اتركها فارغة)</li>';
    echo '<li>استخدم UTF-8 (utf8mb4_general_ci) للدعم الكامل للغة العربية</li>';
    echo '<li>قم بعمل نسخة احتياطية قبل التعديلات المهمة</li>';
    echo '<li>استخدم علامة التبويب "SQL" لتنفيذ استعلامات مخصصة</li>';
    echo '</ul>';
    echo '</div>';
    
} catch (PDOException $e) {
    echo '<h1>❌ فشل الاتصال بـ MySQL</h1>';
    echo '<p><strong>رسالة الخطأ:</strong> ' . $e->getMessage() . '</p>';
    echo '<h2>خطوات حل المشكلة:</h2>';
    echo '<ol>';
    echo '<li>تأكد من تشغيل MySQL من أيقونة MyDevBox</li>';
    echo '<li>تحقق من أن المنفذ 3306 غير مستخدم</li>';
    echo '<li>أعد تشغيل MyDevBox بصلاحيات المدير</li>';
    echo '</ol>';
}
?>

<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار اتصال MySQL و phpMyAdmin</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #2c3e50; text-align: center; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        h3 { color: #2980b9; }
        ul, ol { padding-right: 20px; }
        li { margin: 5px 0; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        hr { border: 1px solid #ecf0f1; margin: 30px 0; }
    </style>
</head>
<body>
    <div class="container">
        <!-- محتوى PHP سيظهر هنا -->
    </div>
</body>
</html> 