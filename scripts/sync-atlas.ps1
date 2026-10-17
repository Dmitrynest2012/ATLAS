# ATLAS: безопасное обновление рабочей папки из GitHub.
# Вызывается Планировщиком заданий Windows без npm run dev.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stateDir = Join-Path $env:LOCALAPPDATA 'ATLAS\auto-sync'
$logFile = Join-Path $stateDir 'sync.log'
$pendingFile = Join-Path $stateDir 'npm-ci-pending.flag'
New-Item -Path $stateDir -ItemType Directory -Force | Out-Null
$env:GIT_TERMINAL_PROMPT = '0'

function Write-AtlasLog([string]$message) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $message"
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Output $line
}
function Invoke-AtlasGit([string[]]$gitArgs) {
  $result = & git -C $repo @gitArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "git $($gitArgs -join ' '): $($result -join ' ')"
  }
  return ($result -join "`n").Trim()
}
function Install-AtlasDependencies {
  if (-not (Test-Path $pendingFile)) { return }
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-AtlasLog 'npm не найден: установка зависимостей отложена.'
    return
  }
  Write-AtlasLog 'Обновлён манифест npm: выполняю npm ci --ignore-scripts.'
  Push-Location $repo
  try {
    & npm.cmd ci --ignore-scripts --no-audit --no-fund 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm ci завершился с кодом $LASTEXITCODE" }
    Remove-Item $pendingFile -Force
    Write-AtlasLog 'Зависимости npm синхронизированы.'
  }
  finally { Pop-Location }
}

try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-AtlasLog 'Git не установлен или не найден в PATH.'
    exit 1
  }
  if ((Invoke-AtlasGit @('rev-parse', '--is-inside-work-tree')) -ne 'true') {
    Write-AtlasLog 'Эта папка не является Git-репозиторием.'
    exit 1
  }
  $origin = Invoke-AtlasGit @('remote', 'get-url', 'origin')
  if ($origin -notmatch '^(https://github\.com/|git@github\.com:|ssh://git@github\.com/)(?i:Dmitrynest2012/ATLAS)(\.git)?$') {
    Write-AtlasLog "Неожиданный origin: $origin. Обновление остановлено."
    exit 1
  }
  $branch = Invoke-AtlasGit @('branch', '--show-current')
  if ($branch -ne 'main') {
    Write-AtlasLog "Ветка '$branch' не main: автоматическое обновление пропущено."
    exit 0
  }
  $dirty = Invoke-AtlasGit @('status', '--porcelain', '--untracked-files=normal')
  if ($dirty) {
    Write-AtlasLog 'Есть локальные изменения или новые файлы: обновление пропущено без потери данных.'
    exit 0
  }
  Invoke-AtlasGit @('fetch', '--quiet', 'origin', 'main') | Out-Null
  $local = Invoke-AtlasGit @('rev-parse', 'HEAD')
  $remote = Invoke-AtlasGit @('rev-parse', 'refs/remotes/origin/main')
  if ($local -eq $remote) {
    Install-AtlasDependencies
    exit 0
  }
  $base = Invoke-AtlasGit @('merge-base', 'HEAD', 'refs/remotes/origin/main')
  if ($base -ne $local) {
    Write-AtlasLog 'Локальная и удалённая истории разошлись: автоматическое слияние запрещено.'
    exit 0
  }
  $changed = Invoke-AtlasGit @('diff', '--name-only', 'HEAD', 'refs/remotes/origin/main')
  Invoke-AtlasGit @('merge', '--ff-only', 'refs/remotes/origin/main') | Out-Null
  Write-AtlasLog "ATLAS обновлён: $($local.Substring(0,7)) -> $($remote.Substring(0,7))."
  if ($changed -match '(^|\n)(package\.json|package-lock\.json)(\n|$)') {
    Set-Content $pendingFile 'npm ci required' -Encoding UTF8
  }
  Install-AtlasDependencies
}
catch {
  Write-AtlasLog "ОШИБКА: $($_.Exception.Message)"
  exit 1
}
