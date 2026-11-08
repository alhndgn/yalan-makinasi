Write-Output '--- eslesmis Bluetooth aygitlari:'
$bt = Get-PnpDevice -PresentOnly -Class Bluetooth | Where-Object { $_.FriendlyName -notmatch 'Radio|Adapter|Enumerator|Service|Protocol|Dongle|HID|Microsoft' }
if (-not $bt) { Write-Output 'telefon gorunmuyor' } else {
  $bt | Select-Object Status, FriendlyName | Format-Table -AutoSize | Out-String -Width 120
}
