# إضافة دومينات MyDevBox إلى ملف hosts
Write-Host "🌐 إضافة دومينات MyDevBox إلى ملف hosts" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$domains = @(
    "127.0.0.1    aaa.test",
    "127.0.0.1    ooo.test", 
    "127.0.0.1    new-site.test",
    "127.0.0.1    car2.test",
    "127.0.0.1    tasks.test"
)

Write-Host "`n📋 الدومينات المطلوب إضافتها:" -ForegroundColor Yellow
foreach ($domain in $domains) {
    Write-Host "  $domain" -ForegroundColor White
}

# تحقق من الصلاحيات
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "`n❌ تحتاج لصلاحيات Administrator لتعديل ملف hosts" -ForegroundColor Red
    Write-Host "انقر بزر الماوس الأيمن على PowerShell واختر 'Run as administrator'" -ForegroundColor Yellow
    Write-Host "`nأو أضف هذه الأسطر يدوياً إلى الملف:" -ForegroundColor Yellow
    Write-Host $hostsPath -ForegroundColor Gray
    Write-Host "`nالأسطر المطلوبة:" -ForegroundColor Yellow
    foreach ($domain in $domains) {
        Write-Host $domain -ForegroundColor White
    }
    pause
    return
}

# نسخ احتياطي
$backupPath = "$hostsPath.backup.$(Get-Date -Format 'yyyyMMdd')"
try {
    Copy-Item $hostsPath $backupPath -Force
    Write-Host "`n💾 تم عمل نسخة احتياطية: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "`n⚠️ تعذر عمل نسخة احتياطية: $($_.Exception.Message)" -ForegroundColor Yellow
}

# قراءة ملف hosts الحالي
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

# تحقق من وجود الدومينات مسبقاً
$existingDomains = @()
foreach ($domain in $domains) {
    $domainName = $domain.Split()[1]
    if ($hostsContent -match $domainName) {
        $existingDomains += $domainName
    }
}

if ($existingDomains.Count -gt 0) {
    Write-Host "`n⚠️ هذه الدومينات موجودة مسبقاً:" -ForegroundColor Yellow
    foreach ($existing in $existingDomains) {
        Write-Host "  $existing" -ForegroundColor White
    }
    $choice = Read-Host "`nهل تريد إعادة كتابتها؟ (y/n)"
    if ($choice -ne 'y' -and $choice -ne 'Y') {
        Write-Host "تم إلغاء العملية." -ForegroundColor Yellow
        pause
        return
    }
}

# إضافة الدومينات
try {
    # إضافة تعليق وخط فاصل
    Add-Content $hostsPath "`n# MyDevBox Local Domains - $(Get-Date)" 
    
    foreach ($domain in $domains) {
        Add-Content $hostsPath $domain
    }
    
    Write-Host "`n✅ تم إضافة الدومينات بنجاح!" -ForegroundColor Green
    Write-Host "`n🌐 يمكنك الآن زيارة المواقع باستخدام:" -ForegroundColor Cyan
    Write-Host "  - http://aaa.test" -ForegroundColor White
    Write-Host "  - http://ooo.test" -ForegroundColor White  
    Write-Host "  - http://new-site.test" -ForegroundColor White
    Write-Host "  - http://car2.test/public" -ForegroundColor White
    Write-Host "  - http://tasks.test" -ForegroundColor White
    
    Write-Host "`n💡 ملاحظة: قد تحتاج لإعادة تشغيل المتصفح لرؤية التغييرات" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ خطأ في إضافة الدومينات: $($_.Exception.Message)" -ForegroundColor Red
}

pause 