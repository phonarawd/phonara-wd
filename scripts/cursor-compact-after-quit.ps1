# Track C — disk hygiene. Run AFTER fully quitting Cursor (tray icon too).
# Does NOT reduce RAM. Double-click or:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/cursor-compact-after-quit.ps1
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
. (Join-Path $PSScriptRoot 'lib\Invoke-PhonaraBun.ps1')

$cursor = Get-Process Cursor -ErrorAction SilentlyContinue
if ($cursor) {
  Write-Host '[FAIL] Cursor still running — quit Cursor completely (tray icon), then rerun this script.' -ForegroundColor Red
  exit 1
}

Write-Host '=== PHONARA Track C: compact global state + purge (disk only) ===' -ForegroundColor Cyan
Invoke-PhonaraBun run cursor:compact-global-state
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Invoke-PhonaraBun run cursor:purge
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Invoke-PhonaraBun run cursor:clean-stale-workspaces -- --apply
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Done. Reopen Cursor — disk space reclaimed (state.vscdb + stale workspaces); RAM unchanged.' -ForegroundColor Green
