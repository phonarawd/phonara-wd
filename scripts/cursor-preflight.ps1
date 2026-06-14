# PHONARA Cursor preflight — run at session start or when IDE feels sluggish.
# Cleans session residue, verifies watcher/index config, prints quick stats.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

Write-Host '=== PHONARA Cursor preflight ==='

# 1) Remove session residue (dist intentionally kept — valid mid-build)
Write-Host '[1/4] Cleaning session artifacts...'
bun run clean:artifacts

# 2) Config gate
Write-Host '[2/4] Verifying hygiene config...'
bun run check:hygiene

# 3) Quick file-count snapshot (node_modules excluded from mental model)
Write-Host '[3/4] Workspace file snapshot...'
$total = (Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
$nm = if (Test-Path node_modules) {
  (Get-ChildItem node_modules -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
} else { 0 }
Write-Host "  total files: $total (node_modules: $nm)"

# 4) Heavy dev processes (informational)
Write-Host '[4/5] Dev process snapshot...'
Get-Process node, bun, eslint, tsc, vite -ErrorAction SilentlyContinue |
  Select-Object ProcessName, Id, @{ N = 'MB'; E = { [math]::Round($_.WorkingSet64 / 1MB, 1) } } |
  Sort-Object MB -Descending |
  Format-Table -AutoSize

Write-Host '[5/5] Cursor metadata outside repo (dry-run)...'
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'cursor-clean-metadata.ps1')

Write-Host ''
Write-Host 'Preflight complete.'
Write-Host 'If Cursor still lags after .cursorignore / .vscode changes: fully quit Cursor (tray too) and reopen.'
Write-Host 'When not using local Supabase: stop Docker Desktop to free CPU/watcher load.'
