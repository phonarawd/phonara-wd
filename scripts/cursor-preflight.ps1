# PHONARA Cursor preflight — run at session start or when IDE feels sluggish.
# Cleans session residue, verifies watcher/index config, prints quick stats.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
. (Join-Path $PSScriptRoot 'lib\Invoke-PhonaraBun.ps1')

Write-Host '=== PHONARA Cursor preflight ==='

# 0) Stop hung vitest/playwright from prior sessions
Write-Host '[0/8] Orphan dev process sweep...'
Invoke-PhonaraBun run cursor:kill-orphans

# 1) Free E2E/dev ports (orphan Vite)
Write-Host '[1/8] E2E port sweep...'
Invoke-PhonaraBun run e2e:kill

# 2) Remove session residue (dist intentionally kept — valid mid-build)
Write-Host '[2/8] Cleaning session artifacts...'
Invoke-PhonaraBun run clean:artifacts

# 3) Git hooks (block main push) + Cursor excludes + hygiene gate
Write-Host '[3/8] Git hooks + Cursor excludes + hygiene gate...'
Invoke-PhonaraBun run git:hooks:install
Invoke-PhonaraBun x tsx scripts/sync-cursor-archival-excludes.ts
Invoke-PhonaraBun run check:hygiene

# 4) Dev port listeners (informational)
Write-Host '[4/8] Port listeners (3000-3002)...'
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
Write-Host '[5/8] Dev process snapshot (>40MB)...'
Get-Process node, bun, eslint, tsc, vite -ErrorAction SilentlyContinue |
  Where-Object { $_.WorkingSet64 -gt 40MB } |
  Select-Object ProcessName, Id, @{ N = 'MB'; E = { [math]::Round($_.WorkingSet64 / 1MB, 1) } } |
  Sort-Object MB -Descending |
  Format-Table -AutoSize

# 6) Cursor metadata outside repo (dry-run)
Write-Host '[6/8] Cursor metadata outside repo (dry-run)...'
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'cursor-clean-metadata.ps1') --include-cursor-logs

# 7) Docker ON + Supabase stopped — stack:stop (8GB RAM)
Write-Host '[7/8] Docker / Supabase idle check...'
try {
  $dockerProc = Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue
  if ($dockerProc) {
    Write-Host '  Docker Desktop: RUNNING'
    $supabaseRunning = $false
    $dockerNames = docker ps --format '{{.Names}}' 2>$null
    if ($dockerNames -match 'supabase_db_') { $supabaseRunning = $true }
    if (-not $supabaseRunning) {
      Write-Host '  Supabase local: stopped'
      Write-Host '  >>> 8GB tip: Docker ON + Supabase idle wastes ~600-900MB RAM.'
      Write-Host '  >>> Run: bun run stack:stop  (quits Docker when PHONARA_DOCKER_AUTO_QUIT=1)'
    } else {
      Write-Host '  Supabase local: RUNNING (OK for E2E/SQL gates)'
    }
  } else {
    Write-Host '  Docker Desktop: not running (OK for UI-only work)'
  }
} catch {
  Write-Host '  Docker check skipped (non-fatal)'
}

# 8) Day 0 reminder (informational)
Write-Host '[8/8] Day 0 reminder (once): Settings Context 6k + Background Agents Off → bun run cursor:render-fix'

Write-Host ''
Write-Host 'Preflight complete.'
Write-Host 'Full report: bun run cursor:env-doctor'
Write-Host 'Day 0 once: Settings Context 6k + Background Agents Off → bun run cursor:render-fix → restart Cursor'
Write-Host 'If metadata > 50MB: bun run cursor:clean-metadata -- --apply --include-cursor-logs'
Write-Host 'If Cursor still lags after .cursorignore / .vscode changes: fully quit Cursor (tray too) and reopen.'
Write-Host 'When not using local Supabase: bun run stack:stop (not just tray quit — frees vmmem RAM).'
