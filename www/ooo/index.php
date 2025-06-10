<?php
session_start();
date_default_timezone_set('Asia/Riyadh');

// معلومات الموقع
$siteName = 'ooo';
$currentTime = date('Y-m-d H:i:s');
$phpVersion = phpversion();
$serverInfo = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OOO - موقع تجريبي</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            margin: 0;
            padding: 50px;
            text-align: center;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.15);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 { font-size: 2.5em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .status { 
            background: rgba(255,255,255,0.2); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0; 
        }
        .info { font-size: 1.2em; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 موقع OOO</h1>
        <div class="status">
            <h3>✅ الموقع يعمل بنجاح!</h3>
            <p class="info">📅 الوقت الحالي: <?php echo date('Y-m-d H:i:s'); ?></p>
            <p class="info">🌐 المسار: /ooo</p>
            <p class="info">⚡ PHP: <?php echo phpversion(); ?></p>
        </div>
        <p>أهلاً وسهلاً في موقع OOO</p>
    </div>
</body>
</html>