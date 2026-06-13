# Verifies Supabase PAT + project lock without printing secrets.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$projectRef = 'yocjhjsdwoijfdrehzoq'

function Get-PatFromFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $null }
  foreach ($line in Get-Content $Path -Encoding UTF8) {
    if ($line -match '^\s*SUPABASE_ACCESS_TOKEN=(.+)$') {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$token = Get-PatFromFile (Join-Path $repoRoot '.env')
if (-not $token) {
  $token = Get-PatFromFile (Join-Path $repoRoot '.env.local')
}
if (-not $token) {
  Write-Host '[fail] SUPABASE_ACCESS_TOKEN missing in .env / .env.local'
  exit 1
}
Write-Host '[ok] PAT loaded from env file'

$headers = @{ Authorization = "Bearer $token" }
try {
  $project = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef" -Headers $headers -Method Get
} catch {
  Write-Host "[fail] Management API: $($_.Exception.Message)"
  exit 1
}

if ($project.id -ne $projectRef) {
  Write-Host "[fail] project ref mismatch (got $($project.id))"
  exit 1
}
Write-Host "[ok] Management API project=$($project.name) ref=$($project.id) status=$($project.status)"

try {
  $migs = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$projectRef/database/migrations" -Headers $headers -Method Get
  $count = @($migs).Count
  if ($migs.PSObject.Properties.Name -contains 'migrations') {
    $count = @($migs.migrations).Count
  }
  Write-Host "[ok] Remote migrations readable (count=$count)"
} catch {
  Write-Host "[warn] migrations list: $($_.Exception.Message)"
}

Write-Host '[ok] Supabase MCP prerequisites verified'
exit 0
