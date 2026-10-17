# Отключение планировщика ATLAS без изменения файлов проекта.
[CmdletBinding()]
param()
$taskName = 'ATLAS-AutoSync'
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host 'Автоматическая синхронизация ATLAS отключена.' -ForegroundColor Yellow
} else {
  Write-Host 'Задание ATLAS-AutoSync не найдено.'
}
