# أداة إنشاء موقع جديد مع إضافة الدومين تلقائياً
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteName,
    
    [Parameter(Mandatory=$false)]
    [string]$SiteType = "php"
)

Write-Host "🚀 إنشاء موقع جديد: $SiteName" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# التحقق من الصلاحيات
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

# مسارات المشروع
$siteDir = "C:\MyDevBox\www\$SiteName"
$domain = "$SiteName.test"
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$vhostPath = "C:\MyDevBox\config\vhosts\$SiteName.conf"

Write-Host "`n📁 إنشاء مجلد الموقع..." -ForegroundColor Yellow

# إنشاء مجلد الموقع
if (Test-Path $siteDir) {
    Write-Host "⚠️ المجلد موجود مسبقاً: $siteDir" -ForegroundColor Yellow
    $choice = Read-Host "هل تريد المتابعة؟ (y/n)"
    if ($choice -ne 'y' -and $choice -ne 'Y') {
        Write-Host "تم إلغاء العملية." -ForegroundColor Red
        exit
    }
} else {
    New-Item -ItemType Directory -Path $siteDir -Force | Out-Null
    Write-Host "✅ تم إنشاء المجلد: $siteDir" -ForegroundColor Green
}

Write-Host "`n📄 إنشاء ملفات الموقع..." -ForegroundColor Yellow

# إنشاء ملف index.php
$indexContent = @"
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$SiteName - موقع جديد</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            margin: 0;
            padding: 50px;
            text-align: center;
            color: #333;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255,255,255,0.9);
            padding: 50px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            max-width: 800px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        h1 { 
            font-size: 3em; 
            margin-bottom: 20px; 
            color: #e91e63;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 5px solid #e91e63;
        }
        .status { 
            background: rgba(76, 175, 80, 0.1); 
            color: #4caf50; 
            padding: 15px; 
            border-radius: 10px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .feature {
            display: inline-block;
            background: #e91e63;
            color: white;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 25px;
            font-size: 0.9em;
        }
        .links {
            margin-top: 30px;
        }
        .links a {
            display: inline-block;
            background: #2196f3;
            color: white;
            padding: 12px 25px;
            margin: 5px;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
        }
        .links a:hover {
            background: #0d7ef0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 $SiteName</h1>
        <p style="font-size: 1.2em; color: #666;">موقع جديد في MyDevBox</p>
        
        <div class="status">
            ✅ الموقع يعمل بنجاح!
        </div>
        
        <div class="info-box">
            <h3>📊 معلومات الموقع</h3>
            <p><strong>اسم الموقع:</strong> $SiteName</p>
            <p><strong>الدومين:</strong> <a href="http://$domain" target="_blank">$domain</a></p>
            <p><strong>المسار:</strong> $siteDir</p>
            <p><strong>تاريخ الإنشاء:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
            <p><strong>إصدار PHP:</strong> <?php echo phpversion(); ?></p>
        </div>
        
        <div class="info-box">
            <h3>🛠️ الميزات المتاحة</h3>
            <div class="feature">PHP <?php echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION; ?></div>
            <div class="feature">Apache</div>
            <div class="feature">MySQL</div>
            <div class="feature">Custom Domain</div>
        </div>
        
        <div class="links">
            <h3>🔗 روابط مفيدة</h3>
            <a href="http://localhost">🏠 الصفحة الرئيسية</a>
            <a href="http://localhost/phpmyadmin" target="_blank">🗄️ phpMyAdmin</a>
            <a href="http://localhost/info.php" target="_blank">ℹ️ معلومات PHP</a>
        </div>
        
        <div class="info-box">
            <h3>📝 بدء التطوير</h3>
            <p>يمكنك الآن البدء بتطوير موقعك:</p>
            <ul style="text-align: right;">
                <li>عدل ملف <code>index.php</code> هذا</li>
                <li>أضف ملفات CSS في مجلد <code>css/</code></li>
                <li>أضف ملفات JavaScript في مجلد <code>js/</code></li>
                <li>أضف الصور في مجلد <code>images/</code></li>
            </ul>
        </div>
    </div>
</body>
</html>
"@

$indexContent | Out-File -FilePath "$siteDir\index.php" -Encoding UTF8
Write-Host "✅ تم إنشاء ملف: index.php" -ForegroundColor Green

# إنشاء ملف .htaccess للتحكم في التوجيه
$htaccessContent = @"
# Apache Configuration for $SiteName
RewriteEngine On

# إعادة توجيه المجلدات
DirectoryIndex index.php index.html

# أمان إضافي
Options -Indexes
ServerSignature Off

# ضغط الملفات
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
</IfModule>
"@

$htaccessContent | Out-File -FilePath "$siteDir\.htaccess" -Encoding UTF8
Write-Host "✅ تم إنشاء ملف: .htaccess" -ForegroundColor Green

# إنشاء مجلدات فرعية
$subDirs = @("css", "js", "images", "includes")
foreach ($dir in $subDirs) {
    $fullPath = "$siteDir\$dir"
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "✅ تم إنشاء مجلد: $dir" -ForegroundColor Green
    }
}

# إنشاء ملف CSS أساسي
$cssContent = @"
/* CSS للموقع $SiteName */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    direction: rtl;
    text-align: right;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background: #2c3e50;
    color: white;
    padding: 1rem 0;
}

main {
    padding: 2rem 0;
}

footer {
    background: #34495e;
    color: white;
    text-align: center;
    padding: 1rem 0;
    margin-top: 2rem;
}

/* إضافة المزيد من الأنماط حسب الحاجة */
"@

$cssContent | Out-File -FilePath "$siteDir\css\style.css" -Encoding UTF8
Write-Host "✅ تم إنشاء ملف: css/style.css" -ForegroundColor Green

Write-Host "`n🌐 إنشاء Virtual Host..." -ForegroundColor Yellow

# إنشاء Virtual Host
$vhostContent = @"
# Virtual Host for $SiteName
<VirtualHost *:80>
    DocumentRoot "C:/MyDevBox/www/$SiteName"
    ServerName $domain
    ServerAlias www.$domain
    
    <Directory "C:/MyDevBox/www/$SiteName">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.php index.html
    </Directory>
    
    # تسجيل الأخطاء والوصول
    ErrorLog "logs/$SiteName`_error.log"
    CustomLog "logs/$SiteName`_access.log" combined
    
    # تخصيص أخطاء PHP
    php_admin_flag log_errors on
    php_admin_value error_log "C:/MyDevBox/logs/$SiteName`_php_errors.log"
</VirtualHost>
"@

$vhostContent | Out-File -FilePath $vhostPath -Encoding UTF8
Write-Host "✅ تم إنشاء Virtual Host: $vhostPath" -ForegroundColor Green

Write-Host "`n🔗 إضافة الدومين إلى ملف hosts..." -ForegroundColor Yellow

# إضافة الدومين إلى ملف hosts
if ($isAdmin) {
    try {
        # تحقق من وجود الدومين مسبقاً
        $hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
        if ($hostsContent -notmatch $domain) {
            Add-Content $hostsPath "`n# $SiteName Domain - $(Get-Date)"
            Add-Content $hostsPath "127.0.0.1    $domain"
            Add-Content $hostsPath "127.0.0.1    www.$domain"
            Write-Host "✅ تم إضافة الدومين: $domain" -ForegroundColor Green
        } else {
            Write-Host "⚠️ الدومين موجود مسبقاً في ملف hosts" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ خطأ في إضافة الدومين: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ تحتاج صلاحيات Administrator لإضافة الدومين تلقائياً" -ForegroundColor Yellow
    Write-Host "أضف هذا السطر يدوياً إلى ملف hosts:" -ForegroundColor Yellow
    Write-Host "127.0.0.1    $domain" -ForegroundColor White
}

Write-Host "`n🔄 إعادة تشغيل Apache..." -ForegroundColor Yellow

# إعادة تشغيل Apache لتحديث التكوين
try {
    # إيقاف Apache
    Stop-Process -Name "httpd" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # بدء Apache
    Start-Process -FilePath "C:\MyDevBox\bin\apache\bin\httpd.exe" -ArgumentList '-f "C:\MyDevBox\config\httpd.conf"' -WindowStyle Hidden
    Start-Sleep -Seconds 3
    
    Write-Host "✅ تم إعادة تشغيل Apache" -ForegroundColor Green
} catch {
    Write-Host "⚠️ قد تحتاج لإعادة تشغيل Apache يدوياً" -ForegroundColor Yellow
}

Write-Host "`n🎉 تم إنشاء الموقع بنجاح!" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

Write-Host "📋 معلومات الموقع الجديد:" -ForegroundColor Cyan
Write-Host "  🌐 الدومين: http://$domain" -ForegroundColor White
Write-Host "  📁 المجلد: $siteDir" -ForegroundColor White
Write-Host "  ⚙️ Virtual Host: $vhostPath" -ForegroundColor White

Write-Host "`n🔗 الروابط المتاحة:" -ForegroundColor Cyan
Write-Host "  - http://$domain" -ForegroundColor White
Write-Host "  - http://localhost/$SiteName" -ForegroundColor White
Write-Host "  - http://www.$domain" -ForegroundColor White

Write-Host "`n🛠️ الخطوات التالية:" -ForegroundColor Yellow
Write-Host "  1. قم بزيارة http://$domain للتأكد من عمل الموقع" -ForegroundColor White
Write-Host "  2. ابدأ في تطوير موقعك بتعديل ملف index.php" -ForegroundColor White
Write-Host "  3. أضف ملفات CSS في مجلد css/" -ForegroundColor White
Write-Host "  4. أضف ملفات JavaScript في مجلد js/" -ForegroundColor White

if (-not $isAdmin) {
    Write-Host "`n⚠️ لاستخدام الدومين $domain:" -ForegroundColor Yellow
    Write-Host "  أضف هذا السطر إلى ملف hosts:" -ForegroundColor White
    Write-Host "  127.0.0.1    $domain" -ForegroundColor Green
}

# فتح الموقع في المتصفح
$choice = Read-Host "`nهل تريد فتح الموقع في المتصفح؟ (y/n)"
if ($choice -eq 'y' -or $choice -eq 'Y') {
    Start-Process "http://$domain"
}

Write-Host "`n✅ انتهى إنشاء الموقع بنجاح!" -ForegroundColor Green 