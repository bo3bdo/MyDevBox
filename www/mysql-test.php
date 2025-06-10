<?php
// Simple MySQL Connection Test
echo "<h1>اختبار اتصال MySQL</h1>";

$host = '127.0.0.1';
$port = 3306;
$username = 'root';
$password = '';

try {
    // Test PDO connection
    $pdo = new PDO("mysql:host=$host;port=$port", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ اتصال PDO ناجح!</p>";
    
    // Get MySQL version
    $stmt = $pdo->query("SELECT VERSION() as version");
    $version = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>إصدار MySQL: " . $version['version'] . "</p>";
    
    // Show databases
    $stmt = $pdo->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>قواعد البيانات المتاحة:</p><ul>";
    foreach ($databases as $db) {
        echo "<li>$db</li>";
    }
    echo "</ul>";
    
} catch(PDOException $e) {
    echo "<p style='color: red;'>❌ خطأ في اتصال PDO: " . $e->getMessage() . "</p>";
}

// Test MySQLi connection
try {
    $mysqli = new mysqli($host, $username, $password, '', $port);
    
    if ($mysqli->connect_error) {
        throw new Exception("Connection failed: " . $mysqli->connect_error);
    }
    
    echo "<p style='color: green;'>✅ اتصال MySQLi ناجح!</p>";
    
    $result = $mysqli->query("SELECT VERSION() as version");
    if ($result) {
        $row = $result->fetch_assoc();
        echo "<p>إصدار MySQL (MySQLi): " . $row['version'] . "</p>";
    }
    
    $mysqli->close();
    
} catch(Exception $e) {
    echo "<p style='color: red;'>❌ خطأ في اتصال MySQLi: " . $e->getMessage() . "</p>";
}

// Show PHP MySQL extensions
echo "<h2>إضافات PHP المتاحة:</h2>";
echo "<ul>";
if (extension_loaded('pdo_mysql')) {
    echo "<li>✅ PDO MySQL</li>";
} else {
    echo "<li>❌ PDO MySQL غير متاح</li>";
}

if (extension_loaded('mysqli')) {
    echo "<li>✅ MySQLi</li>";
} else {
    echo "<li>❌ MySQLi غير متاح</li>";
}

if (extension_loaded('mysql')) {
    echo "<li>✅ MySQL (deprecated)</li>";
} else {
    echo "<li>❌ MySQL (deprecated) غير متاح</li>";
}
echo "</ul>";

// Show connection info
echo "<h2>معلومات الاتصال:</h2>";
echo "<p>الخادم: $host</p>";
echo "<p>المنفذ: $port</p>";
echo "<p>المستخدم: $username</p>";
echo "<p>كلمة المرور: " . (empty($password) ? 'فارغة' : 'محددة') . "</p>";
?> 