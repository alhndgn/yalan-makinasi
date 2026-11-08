$devices = Get-PnpDevice -PresentOnly | Where-Object {
  $_.Class -in @('USB','WPD','AndroidUsbDeviceClass','Ports','Net') -and
  ($_.FriendlyName -match 'Android|ADB|MTP|Phone|Xiaomi|Samsung|Huawei|Oppo|Pixel|Composite|Portable')
}
if (-not $devices) {
  Write-Output 'ESLESEN CIHAZ YOK'
} else {
  $devices | Select-Object Status, Class, FriendlyName | Format-Table -AutoSize | Out-String -Width 140
}

Write-Output '--- tum USB aygitlari (ilk 25):'
Get-PnpDevice -PresentOnly -Class USB | Select-Object Status, FriendlyName | Format-Table -AutoSize | Out-String -Width 140
