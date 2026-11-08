$root = 'C:\Users\alhndgn\AppData\Local\hermes\cache\browser'
$src = Join-Path $root 'chromium'
$dst = Join-Path $root 'chromium-broken'
try { Rename-Item -LiteralPath $src -NewName 'chromium-broken' -ErrorAction Stop; Write-Output 'RENAME OK' }
catch { Write-Output ('RENAME FAIL: ' + $_.Exception.Message) }

# eski klasörü silmeyi dene (admin yoksa sessiz kalır)
try { Remove-Item -LiteralPath $dst -Recurse -Force -ErrorAction Stop; Write-Output 'SILINDI' } catch { Write-Output ('SILME FAIL: ' + $_.Exception.Message) }
