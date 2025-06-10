# MyDevBox - Setup Local Domains
# PowerShell script to add local domains to hosts file

Write-Host "MyDevBox - إعداد الدومينات المحلية" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  هذا السكريبت يتطلب صلاحيات المدير" -ForegroundColor Yellow
    Write-Host "سيتم إعادة تشغيله بصلاحيات المدير..." -ForegroundColor Yellow
    Write-Host ""
    
    # Restart with admin privileges
    Start-Process PowerShell -ArgumentList "-File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "✅ يتم التشغيل بصلاحيات المدير" -ForegroundColor Green
Write-Host ""

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$backupFile = "C:\Windows\System32\drivers\etc\hosts.backup.$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"

# Create backup
try {
    Copy-Item $hostsFile $backupFile
    Write-Host "✅ تم إنشاء نسخة احتياطية: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "❌ فشل في إنشاء نسخة احتياطية: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "اضغط Enter للمتابعة..."
    exit 1
}

# Define domains to add
$domains = @(
    "blog.test",
    "www.blog.test", 
    "tasks.test",
    "www.tasks.test"
)

# Read current hosts file
$hostsContent = Get-Content $hostsFile

# Check which domains need to be added
$domainsToAdd = @()
foreach ($domain in $domains) {
    if (-not ($hostsContent | Select-String -Pattern $domain -Quiet)) {
        $domainsToAdd += $domain
    }
}

if ($domainsToAdd.Count -eq 0) {
    Write-Host "✅ جميع الدومينات موجودة بالفعل في ملف hosts" -ForegroundColor Green
} else {
    # Add new domains
    try {
        Add-Content $hostsFile "`n# MyDevBox - Local Development Domains"
        foreach ($domain in $domainsToAdd) {
            Add-Content $hostsFile "127.0.0.1 $domain"
            Write-Host "✅ تم إضافة: $domain" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "🎉 تم إعداد الدومينات بنجاح!" -ForegroundColor Green
        Write-Host ""
        Write-Host "يمكنك الآن الوصول للمواقع عبر:" -ForegroundColor Cyan
        Write-Host "- http://blog.test" -ForegroundColor White
        Write-Host "- http://tasks.test" -ForegroundColor White
        
    } catch {
        Write-Host "❌ فشل في تحديث ملف hosts: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "اضغط أي مفتاح للإغلاق..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 