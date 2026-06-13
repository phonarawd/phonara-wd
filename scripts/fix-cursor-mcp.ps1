# Sync Cursor MCP + fix GPU argv (run once after clone or MCP errors).
# Does NOT print secrets.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot '.env'
$argvPath = Join-Path $env:APPDATA 'Cursor\argv.json'
$mcpPath = Join-Path $repoRoot '.cursor\mcp.json'
$globalMcpPath = Join-Path $env:USERPROFILE '.cursor\mcp.json'
$cursorSettingsPath = Join-Path $repoRoot '.cursor\settings.json'
$vscodeSupabaseExt = Join-Path $env:USERPROFILE '.vscode\extensions\supabase.vscode-supabase-extension-0.0.13'

Write-Host '=== PHONARA Cursor MCP fix ==='

# 1) argv.json — aggressive GPU off breaks Electron MessagePort / McpProcess IPC on Windows.
$argv = @{
  'enable-low-end-device-mode' = $true
  'max-memory'                 = 4096
}
$argv | ConvertTo-Json | Set-Content -Path $argvPath -Encoding UTF8
Write-Host "[ok] argv.json updated (removed disable-gpu*) -> $argvPath"

# 2) Global MCP — empty (HTTP OAuth hits MessagePort races on Windows; no duplicate server).
@{ mcpServers = @{} } | ConvertTo-Json | Set-Content -Path $globalMcpPath -Encoding UTF8
Write-Host "[ok] global mcp.json cleared -> $globalMcpPath"

# 3) Project MCP — stdio launcher reads PAT from repo .env (no secrets in JSON).
$projectMcp = @{
  mcpServers = @{
    supabase = @{
      command = 'cmd'
      args    = @('/c', 'scripts\run-supabase-mcp.cmd')
    }
  }
}
$projectMcp | ConvertTo-Json -Depth 5 | Set-Content -Path $mcpPath -Encoding UTF8
Write-Host "[ok] project stdio MCP -> $mcpPath"

# 4) Disable Cursor Supabase plugin (HTTP OAuth duplicate; separate from VS Code extension).
$cursorSettings = @{ plugins = @{ linear = @{ enabled = $true }; supabase = @{ enabled = $false } } }
if (Test-Path $cursorSettingsPath) {
  try {
    $existing = Get-Content $cursorSettingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($existing.plugins.linear) {
      $cursorSettings.plugins.linear.enabled = [bool]$existing.plugins.linear.enabled
    }
  } catch {
    Write-Host '[warn] could not parse existing .cursor/settings.json — writing defaults'
  }
}
$cursorSettings | ConvertTo-Json -Depth 5 | Set-Content -Path $cursorSettingsPath -Encoding UTF8
Write-Host "[ok] Cursor Supabase plugin disabled -> $cursorSettingsPath"

# 5) Remove VS Code Supabase extension (Cursor uses project stdio MCP only).
if (Test-Path $vscodeSupabaseExt) {
  Remove-Item $vscodeSupabaseExt -Recurse -Force
  Write-Host "[ok] removed VS Code Supabase extension -> $vscodeSupabaseExt"
} else {
  Write-Host '[ok] VS Code Supabase extension not installed'
}

# 6) Preflight PAT (.env or .env.local, else sync from Supabase CLI credential)
function Test-SupabasePatFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $false }
  foreach ($line in Get-Content $Path -Encoding UTF8) {
    if ($line -match '^\s*SUPABASE_ACCESS_TOKEN=(.+)$') { return $true }
  }
  return $false
}

$envFile = Join-Path $repoRoot '.env'
$envLocalFile = Join-Path $repoRoot '.env.local'
$hasToken = (Test-SupabasePatFile $envFile) -or (Test-SupabasePatFile $envLocalFile)

if (-not $hasToken) {
  $syncScript = Join-Path $repoRoot 'scripts\sync-supabase-pat.ps1'
  if (Test-Path $syncScript) {
    Write-Host '[info] PAT missing — trying sync from Supabase CLI credential...'
    try {
      & powershell -NoProfile -ExecutionPolicy Bypass -File $syncScript
      $hasToken = Test-SupabasePatFile $envFile
    } catch {
      Write-Host "[warn] sync-supabase-pat failed: $($_.Exception.Message)"
    }
  }
}

if (-not $hasToken) {
  Write-Host '[warn] SUPABASE_ACCESS_TOKEN not in .env / .env.local'
  Write-Host '       Run: supabase login'
  Write-Host '       Then: powershell -File scripts/sync-supabase-pat.ps1'
  exit 1
}
Write-Host '[ok] SUPABASE_ACCESS_TOKEN present (.env or .env.local)'

# 7) Warm global MCP binary (avoids npx cold start when Cursor spawns the server).
$npx = Join-Path $env:ProgramFiles 'nodejs\npx.cmd'
if (-not (Test-Path $npx)) {
  $npx = (Get-Command npx -ErrorAction SilentlyContinue).Source
}
if ($npx) {
  & $npx '-y' '@supabase/mcp-server-supabase@0.8.2' '--version' 2>$null | Out-Null
  Write-Host '[ok] @supabase/mcp-server-supabase@0.8.2 cached'
} else {
  Write-Host '[warn] npx not found — install Node.js 18+'
}

Write-Host ''
Write-Host 'NEXT:'
Write-Host '  1. Quit Cursor completely (tray icon too)'
Write-Host '  2. Reopen phonara-gb folder'
Write-Host '  3. Settings -> Tools & MCP -> enable project "supabase" only (NOT plugin-supabase)'
Write-Host '  4. Status should become Connected (green) within ~30s'
Write-Host ''
Write-Host 'If Error persists: run this script again, then reload window (Ctrl+Shift+P -> Reload Window).'
