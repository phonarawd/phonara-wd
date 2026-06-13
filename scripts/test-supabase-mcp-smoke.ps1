# Smoke test: MCP launcher loads PAT and stays alive (stdio server).
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$stderr = Join-Path $repoRoot '.cursor\mcp-smoke-stderr.txt'
if (Test-Path $stderr) { Remove-Item $stderr -Force }

$p = Start-Process -FilePath 'powershell' `
  -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $repoRoot 'scripts\run-supabase-mcp.ps1') `
  -WorkingDirectory $repoRoot `
  -PassThru `
  -RedirectStandardError $stderr `
  -NoNewWindow

Start-Sleep -Seconds 4
if ($p.HasExited) {
  Write-Host "[fail] MCP exited early code=$($p.ExitCode)"
  if (Test-Path $stderr) { Get-Content $stderr }
  exit 1
}

Write-Host "[ok] MCP process running pid=$($p.Id)"
Stop-Process -Id $p.Id -Force
Write-Host '[ok] smoke test passed'
exit 0
