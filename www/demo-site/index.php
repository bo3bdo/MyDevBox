<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Site - موقع تجريبي</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            margin: 0;
            padding: 50px;
            text-align: center;
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 600px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 { 
            font-size: 2.5em; 
            margin-bottom: 20px; 
        }
        .status { 
            background: rgba(0,255,0,0.2); 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .info {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: right;
        }
        .domain {
            background: rgba(255,193,7,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            border: 2px solid rgba(255,193,7,0.5);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Demo Site</h1>
        <p style="font-size: 1.2em;">موقع تجريبي لاختبار النظام</p>
        
        <div class="status">
            ✅ الموقع يعمل بنجاح!
        </div>
        
        <div class="info">
            <h3>📊 معلومات الموقع</h3>
            <p><strong>اسم الموقع:</strong> demo-site</p>
            <p><strong>تاريخ الإنشاء:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
            <p><strong>إصدار PHP:</strong> <?php echo phpversion(); ?></p>
            <p><strong>الخادم:</strong> <?php echo $_SERVER['SERVER_NAME']; ?></p>
        </div>
        
        <div class="domain">
            <h3>🌐 الدومين المطلوب</h3>
            <p>أضف هذا السطر لملف hosts:</p>
            <code style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 5px;">
                127.0.0.1 demo-site.test
            </code>
        </div>
        
        <div class="info">
            <h3>🔗 طرق الوصول</h3>
            <p>✅ http://localhost/demo-site</p>
            <p>⏳ http://demo-site.test (بعد إضافة hosts)</p>
        </div>
    </div>
</body>
</html> 