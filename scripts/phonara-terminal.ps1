# PHONARA integrated terminal bootstrap — suppress bun.ps1 false PowerShell errors.
. (Join-Path $PSScriptRoot 'lib\Invoke-PhonaraBun.ps1')
Install-PhonaraBunFunction

$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

if (-not $env:PHONARA_BUN_EXE) {
  try {
    $env:PHONARA_BUN_EXE = Resolve-PhonaraBunExe
  } catch {
    Write-Host "[phonara-terminal] $($_.Exception.Message)"
  }
}

Write-Host '[phonara-terminal] bun wrapper active — stderr noise suppressed' -ForegroundColor DarkGray
Write-Host '[phonara-terminal] dev servers (bun run dev) cause port 3000 lag — use test:e2e* only' -ForegroundColor DarkYellow
