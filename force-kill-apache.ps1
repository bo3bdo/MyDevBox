# Force Kill Apache Script
Write-Host "🔪 Force killing all Apache processes..." -ForegroundColor Red

# Kill by process name
Write-Host "Killing httpd.exe processes..." -ForegroundColor Yellow
Get-Process httpd -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process apache -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill specific PIDs on port 80
Write-Host "Killing processes on port 80..." -ForegroundColor Yellow
$port80Processes = netstat -ano | findstr ":80" | ForEach-Object {
    if ($_ -match '\s+(\d+)$') {
        $matches[1]
    }
} | Select-Object -Unique

foreach ($pid in $port80Processes) {
    if ($pid -and $pid -ne "0") {
        Write-Host "Killing PID: $pid" -ForegroundColor Cyan
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Could not kill PID $pid" -ForegroundColor Red
        }
    }
}

# Final check
Start-Sleep -Seconds 2
$remainingApache = Get-Process httpd -ErrorAction SilentlyContinue
if ($remainingApache) {
    Write-Host "⚠️ Some Apache processes still running:" -ForegroundColor Red
    $remainingApache | Format-Table Name, Id, CPU
} else {
    Write-Host "✅ All Apache processes killed successfully!" -ForegroundColor Green
}

# Check port 80
$port80Check = netstat -ano | findstr ":80"
if ($port80Check) {
    Write-Host "⚠️ Port 80 still in use:" -ForegroundColor Red
    Write-Host $port80Check
} else {
    Write-Host "✅ Port 80 is now free!" -ForegroundColor Green
} 