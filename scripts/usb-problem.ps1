Write-Output '--- sorunlu / bilinmeyen aygitlar:'
$bad = Get-PnpDevice -PresentOnly | Where-Object { $_.Status -ne 'OK' }
if (-not $bad) { Write-Output 'yok' } else {
  $bad | Select-Object Status, Class, FriendlyName, InstanceId | Format-Table -AutoSize | Out-String -Width 160
}
