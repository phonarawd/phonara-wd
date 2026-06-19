# PHONARA Cursor preflight — run at session start or when IDE feels sluggish.
# Cleans session residue, verifies watcher/index config, prints quick stats.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host '=== PHONARA Cursor preflight ==='

# 0) Stop hung vitest/playwright from prior sessions
Write-Host '[0/7] Orphan dev process sweep...'
bun run cursor:kill-orphans | Out-Host

# 1) Free E2E/dev ports (orphan Vite)
Write-Host '[1/7] E2E port sweep...'
bun run e2e:kill | Out-Host

# 2) Remove session residue (dist intentionally kept — valid mid-build)
Write-Host '[2/7] Cleaning session artifacts...'
bun run clean:artifacts | Out-Host

# 3) Sync archival doc watcher excludes + config gate
Write-Host '[3/7] Syncing Cursor excludes + hygiene gate...'
bun run tsx scripts/sync-cursor-archival-excludes.ts | Out-Host
bun run check:hygiene | Out-Host

# 4) Dev port listeners (informational)
Write-Host '[4/7] Port listeners (3000-3002)...'
foreach ($port in 3000, 3001, 3002) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    $pid = $listener.OwningProcess
    $name = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
    Write-Host "  PORT $port BUSY — pid=$pid ($name). Run: bun run e2e:kill"
  } else {
    Write-Host "  PORT $port free"
  }
}

# 5) Heavy dev processes (informational)
Write-Host '[5/7] Dev process snapshot (>40MB)...'
Get-Process node, bun, eslint, tsc, vite -ErrorAction SilentlyContinue |
  Where-Object { $_.WorkingSet64 -gt 40MB } |
  Select-Object ProcessName, Id, @{ N = 'MB'; E = { [math]::Round($_.WorkingSet64 / 1MB, 1) } } |
  Sort-Object MB -Descending |
  Format-Table -AutoSize

# 6) Cursor metadata outside repo (dry-run)
Write-Host '[6/7] Cursor metadata outside repo (dry-run)...'
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'cursor-clean-metadata.ps1') --include-cursor-logs

Write-Host ''
Write-Host 'Preflight complete.'
Write-Host 'If metadata > 50MB: bun run cursor:clean-metadata -- --apply --include-cursor-logs'
Write-Host 'If Cursor still lags after .cursorignore / .vscode changes: fully quit Cursor (tray too) and reopen.'
Write-Host 'When not using local Supabase: stop Docker Desktop to free CPU/watcher load.'
