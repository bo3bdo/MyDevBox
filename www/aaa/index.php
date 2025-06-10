<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AAA - موقع تجريبي</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 50px;
            text-align: center;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
            margin: 0 auto;
        }
        h1 { font-size: 2.5em; margin-bottom: 20px; }
        .status { 
            background: rgba(0,255,0,0.2); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0; 
        }
        .info { font-size: 1.2em; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 موقع AAA</h1>
        <div class="status">
            <h3>✅ Apache يعمل بنجاح!</h3>
            <p class="info">📅 الوقت الحالي: <?php echo date('Y-m-d H:i:s'); ?></p>
            <p class="info">🌐 المسار: /aaa</p>
            <p class="info">⚡ PHP: <?php echo phpversion(); ?></p>
        </div>
        <p>مرحباً بك في موقع AAA التجريبي</p>
    </div>
</body>
</html> 