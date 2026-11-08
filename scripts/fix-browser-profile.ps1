$root = 'C:\Users\alhndgn\AppData\Local\hermes\cache\browser'
if (-not (Test-Path $root)) { Write-Output 'yol yok'; exit 0 }
Write-Output '--- once:'
Get-ChildItem $root -Force -ErrorAction SilentlyContinue | Select-Object Name, Attributes | Format-Table -AutoSize | Out-String -Width 100

$target = Join-Path $root 'chromium'
try {
  icacls $target /grant "$($env:USERNAME):(OI)(CI)F" /T /C | Select-Object -Last 1
} catch { Write-Output ("icacls hata: " + $_.Exception.Message) }

Write-Output '--- sonra (ilk 5):'
Get-ChildItem $target -Force -ErrorAction SilentlyContinue | Select-Object -First 5 Name | Format-Table -AutoSize | Out-String
