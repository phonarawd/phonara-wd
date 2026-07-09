# PHONARA Docker on-demand — one-time operator setup (Windows low-spec)
param(
  [switch]$ApplyWslConfig,
  [switch]$ApplyEnv
)

# bun/npm pass GNU-style flags; normalize for PowerShell switches.
if (-not $ApplyWslConfig -and ($args -contains '--apply-wslconfig')) { $ApplyWslConfig = $true }
if (-not $ApplyEnv -and ($args -contains '--apply-env')) { $ApplyEnv = $true }

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host '=== PHONARA Docker on-demand setup ==='
Write-Host ''

Write-Host '1) Docker Desktop (manual — one time)'
Write-Host '   Settings -> General:'
Write-Host '     [ ] Start Docker Desktop when you sign in to your computer  <- UNCHECK'
Write-Host '   Settings -> Resources -> WSL integration: enabled'
Write-Host ''

$wslConfig = Join-Path $env:USERPROFILE '.wslconfig'
$wslTemplate = Join-Path $PSScriptRoot 'templates\wslconfig.phonara.txt'

Write-Host '2) WSL2 RAM cap (recommended for low-spec PC)'
if (Test-Path $wslTemplate) {
  Write-Host "   Template: $wslTemplate"
  Get-Content $wslTemplate | ForEach-Object { Write-Host "   $_" }
} else {
  Write-Host '   memory=4GB · processors=4 · swap=2GB'
}

if ($ApplyWslConfig) {
  if (Test-Path $wslConfig) {
    $backup = "$wslConfig.phonara-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $wslConfig $backup
    Write-Host "   [backup] $backup"
  }
  Copy-Item $wslTemplate $wslConfig -Force
  Write-Host "   [ok] wrote $wslConfig"
  Write-Host '   Run once: wsl --shutdown  (or reboot) for memory cap to apply'
} else {
  Write-Host '   Dry-run. Apply: bun run stack:docker:setup -- --apply-wslconfig'
}
Write-Host ''

Write-Host '3) Repo env (.env) — on-demand flags (default ON when unset)'
Write-Host '   PHONARA_DOCKER_AUTO_START=1   # pretest:e2e/sql launches Docker if off'
Write-Host '   PHONARA_DOCKER_AUTO_QUIT=1    # posttest stack:stop quits Docker (WSL RAM)'
Write-Host '   PHONARA_KEEP_STACK=1          # back-to-back E2E+SQL — skip stop/quit'
Write-Host ''

$envFile = Join-Path $repoRoot '.env'
$envLines = @(
  '',
  '# Docker on-demand (84-docker-on-demand.mdc)',
  'PHONARA_DOCKER_AUTO_START=1',
  'PHONARA_DOCKER_AUTO_QUIT=1'
)

if ($ApplyEnv) {
  if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $repoRoot '.env.example') $envFile
    Write-Host '   [ok] created .env from .env.example'
  }
  $existing = Get-Content $envFile -Raw
  $needsAppend = $false
  foreach ($key in @('PHONARA_DOCKER_AUTO_START', 'PHONARA_DOCKER_AUTO_QUIT')) {
    if ($existing -notmatch $key) { $needsAppend = $true }
  }
  if ($needsAppend) {
    Add-Content -Path $envFile -Value ($envLines -join "`n")
    Write-Host '   [ok] appended on-demand flags to .env'
  } else {
    Write-Host '   [skip] on-demand flags already in .env'
  }
} else {
  Write-Host '   Dry-run. Apply: bun run stack:docker:setup -- --apply-env'
}

Write-Host ''
Write-Host '4) Flow (automatic after setup)'
Write-Host '   UI/typecheck/lint -> Docker OFF (no RAM use)'
Write-Host '   bun run test:e2e* / test:sql -> pretest auto-starts Docker + Supabase'
Write-Host '   posttest -> stack:stop auto-quits Docker Desktop'
Write-Host ''
Write-Host 'Setup complete.'
