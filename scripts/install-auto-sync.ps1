# Однократное включение синхронизации ATLAS через Планировщик Windows.
[CmdletBinding()]
param([ValidateRange(1,60)][int]$EveryMinutes = 5)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$syncScript = Join-Path $PSScriptRoot 'sync-atlas.ps1'
$taskName = 'ATLAS-AutoSync'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Установите Git for Windows и повторите установку автообновления.'
}
if (-not (Test-Path (Join-Path $repo '.git'))) {
  throw 'Откройте этот скрипт из клонированной папки ATLAS (требуется .git).'
}
$action = New-ScheduledTaskAction -Execute (Join-Path $PSHOME 'powershell.exe') -Argument "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$syncScript`"" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Description 'ATLAS: безопасная синхронизация GitHub main без запуска npm-сервера' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "ATLAS: автообновление включено (каждые $EveryMinutes минут)." -ForegroundColor Green
Write-Host 'Оно работает отдельно от VS Code и npm run dev, пока активен Windows.'
Write-Host 'Лог: %LOCALAPPDATA%\ATLAS\auto-sync\sync.log'
