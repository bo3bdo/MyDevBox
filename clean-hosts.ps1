# Clean duplicate entries from hosts file
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$content = Get-Content $hostsPath
$uniqueLines = $content | Sort-Object | Get-Unique
$uniqueLines | Set-Content $hostsPath -Force
Write-Host "Hosts file cleaned of duplicates" 