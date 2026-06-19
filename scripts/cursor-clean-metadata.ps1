# Safe cleanup of Cursor metadata OUTSIDE the git repo.
# Does NOT touch workspace settings, extensions, or %APPDATA%\Cursor\User (2GB+ state).
param(
  [switch]$Apply,
  [switch]$IncludeCursorLogs,
  [switch]$SkipTranscripts
)

# bun/npm pass GNU-style flags; normalize for PowerShell switches.
if (-not $Apply -and ($args -contains '--apply')) { $Apply = $true }
if (-not $IncludeCursorLogs -and ($args -contains '--include-cursor-logs')) { $IncludeCursorLogs = $true }
if (-not $SkipTranscripts -and ($args -contains '--skip-transcripts')) { $SkipTranscripts = $true }

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$projectSlug = 'c-Users-PC-Desktop-phonara-gb'
$projectMeta = Join-Path $env:USERPROFILE ".cursor\projects\$projectSlug"

function Get-DirStats {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return @{ Files = 0; MB = 0 }
  }
  $files = Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue
  $bytes = ($files | Measure-Object -Property Length -Sum).Sum
  return @{
    Files = $files.Count
    MB    = [math]::Round($bytes / 1MB, 2)
  }
}

function Clear-DirContents {
  param([string]$Path, [string]$Label)
  if (-not (Test-Path $Path)) {
    Write-Host "  [skip] $Label — path absent"
    return 0
  }
  $before = Get-DirStats $Path
  if ($before.Files -eq 0) {
    Write-Host "  [skip] $Label — already empty"
    return 0
  }
  Get-ChildItem $Path -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "  [ok] $Label — removed $($before.Files) file(s), $($before.MB) MB"
  return $before.Files
}

Write-Host '=== PHONARA Cursor metadata cleanup ==='
Write-Host "Project meta: $projectMeta"
Write-Host "Mode: $(if ($Apply) { 'APPLY (deleting)' } else { 'DRY-RUN (preview only)' })"
Write-Host ''

$plan = @(
  @{ Path = Join-Path $projectMeta 'agent-transcripts'; Label = 'AI chat transcripts (agent-transcripts)' },
  @{ Path = Join-Path $projectMeta 'terminals'; Label = 'IDE terminal session logs' }
)

if ($IncludeCursorLogs) {
  $plan += @(
    @{ Path = Join-Path $env:APPDATA 'Cursor\logs'; Label = 'Cursor application logs' },
    @{ Path = Join-Path $env:USERPROFILE '.cursor\ai-tracking'; Label = 'Cursor ai-tracking cache' }
  )
}

Write-Host 'Targets:'
foreach ($item in $plan) {
  $stats = Get-DirStats $item.Path
  Write-Host "  - $($item.Label): $($stats.Files) files, $($stats.MB) MB"
}

$repoSmoke = Join-Path $repoRoot '.cursor\mcp-smoke-stderr.txt'
if (Test-Path $repoSmoke) {
  $kb = [math]::Round((Get-Item $repoSmoke).Length / 1KB, 1)
  Write-Host "  - repo .cursor/mcp-smoke-stderr.txt: ${kb}KB (removed by bun run clean)"
}

Write-Host ''
Write-Host 'NOT touched (keeps your settings, extensions, chat UI state):'
Write-Host '  - %APPDATA%\Cursor\User (~2GB workspace state)'
Write-Host '  - %APPDATA%\Cursor\Partitions, snapshots, Cache'
Write-Host '  - %USERPROFILE%\.cursor\extensions'
Write-Host ''

if (-not $Apply) {
  Write-Host 'Dry-run only. To delete the targets above:'
  Write-Host '  bun run cursor:clean-metadata -- --apply'
  Write-Host '  bun run cursor:clean-metadata -- --apply --include-cursor-logs'
  exit 0
}

Write-Host 'Applying cleanup...'
$removed = 0
foreach ($item in $plan) {
  if ($SkipTranscripts -and ($item.Label -match 'transcripts|terminal session logs')) {
    Write-Host "  [skip] $($item.Label) — SkipTranscripts"
    continue
  }
  $removed += Clear-DirContents -Path $item.Path -Label $item.Label
}

Set-Location $repoRoot
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& bun run clean:artifacts 2>&1 | Out-Null
$cleanExit = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
$ErrorActionPreference = $prevEap

Write-Host ''
Write-Host "Done. Removed $removed top-level metadata target(s)."
if ($cleanExit -ne 0) {
  Write-Host "Note: clean:artifacts exited $cleanExit (non-fatal for metadata cleanup)."
}
Write-Host 'Fully quit and reopen Cursor after large metadata cleanup.'
exit 0
