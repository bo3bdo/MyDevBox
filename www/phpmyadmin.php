<?php
// Simple MySQL Administration Interface
// This is a basic database management interface for MyDevBox

$host = 'localhost';
$port = 3306;
$username = 'root';
$password = ''; // Default empty password

$error_msg = '';
$success_msg = '';
$databases = [];
$connection = null;

// Try to connect to MySQL
try {
    $connection = new PDO("mysql:host=$host;port=$port", $username, $password);
    $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get list of databases
    $stmt = $connection->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $success_msg = "اتصال ناجح بقاعدة البيانات!";
} catch(PDOException $e) {
    $error_msg = "خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage();
}

// Handle database creation
if (isset($_POST['create_db']) && !empty($_POST['db_name'])) {
    try {
        $db_name = $_POST['db_name'];
        $connection->exec("CREATE DATABASE `$db_name`");
        $success_msg = "تم إنشاء قاعدة البيانات '$db_name' بنجاح!";
        header("Location: " . $_SERVER['PHP_SELF']);
        exit;
    } catch(PDOException $e) {
        $error_msg = "خطأ في إنشاء قاعدة البيانات: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة قواعد البيانات - MyDevBox</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(45deg, #2196F3, #21CBF3);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .status-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-right: 5px solid #28a745;
        }
        
        .error-card {
            background: #fff5f5;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-right: 5px solid #dc3545;
            color: #721c24;
        }
        
        .success-card {
            background: #f0fff4;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-right: 5px solid #28a745;
            color: #155724;
        }
        
        .db-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .db-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #e9ecef;
            transition: all 0.3s ease;
        }
        
        .db-card:hover {
            border-color: #2196F3;
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .db-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .form-card {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 10px;
            border: 2px dashed #2196F3;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }
        
        .btn {
            background: linear-gradient(45deg, #2196F3, #21CBF3);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(33, 150, 243, 0.3);
        }
        
        .connection-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #2196F3;
        }
        
        .info-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ إدارة قواعد البيانات</h1>
            <p>واجهة إدارة MySQL - MyDevBox</p>
        </div>
        
        <div class="content">
            <?php if ($error_msg): ?>
                <div class="error-card">
                    <strong>❌ خطأ:</strong> <?php echo htmlspecialchars($error_msg); ?>
                </div>
            <?php endif; ?>
            
            <?php if ($success_msg && empty($error_msg)): ?>
                <div class="success-card">
                    <strong>✅ نجح:</strong> <?php echo htmlspecialchars($success_msg); ?>
                </div>
            <?php endif; ?>
            
            <?php if ($connection): ?>
                <div class="status-card">
                    <h3>📊 معلومات الاتصال</h3>
                    <div class="connection-info">
                        <div class="info-item">
                            <div class="info-label">الخادم</div>
                            <div class="info-value"><?php echo $host; ?></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">المنفذ</div>
                            <div class="info-value"><?php echo $port; ?></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">المستخدم</div>
                            <div class="info-value"><?php echo $username; ?></div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">عدد قواعد البيانات</div>
                            <div class="info-value"><?php echo count($databases); ?></div>
                        </div>
                    </div>
                </div>
                
                <h3>📂 قواعد البيانات المتاحة</h3>
                <div class="db-grid">
                    <?php foreach ($databases as $db): ?>
                        <div class="db-card">
                            <div class="db-name">🗃️ <?php echo htmlspecialchars($db); ?></div>
                            <small>قاعدة بيانات MySQL</small>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <div class="form-card">
                    <h3>➕ إنشاء قاعدة بيانات جديدة</h3>
                    <form method="post">
                        <div class="form-group">
                            <label>اسم قاعدة البيانات:</label>
                            <input type="text" name="db_name" required placeholder="أدخل اسم قاعدة البيانات...">
                        </div>
                        <button type="submit" name="create_db" class="btn">إنشاء قاعدة البيانات</button>
                    </form>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html> 