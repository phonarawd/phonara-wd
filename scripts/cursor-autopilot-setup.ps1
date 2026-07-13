# PHONARA Cursor autopilot — one-shot Day 0 + maintenance setup.
# Automates everything that can be scripted; prints UI-only checklist for the rest.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
. (Join-Path $PSScriptRoot 'lib\Invoke-PhonaraBun.ps1')

Write-Host '=== PHONARA Cursor Autopilot Setup ==='
Write-Host ''

# 1) Render argv (GPU/RAM contract)
Write-Host '[1/7] Render argv contract...'
Invoke-PhonaraBun run cursor:render-fix

# 2) MCP + plugin dedup
Write-Host '[2/7] MCP + plugin fix...'
try {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'fix-cursor-mcp.ps1')
} catch {
  Write-Host "  [warn] MCP fix incomplete (non-fatal): $($_.Exception.Message)"
  Write-Host '  Add SUPABASE_ACCESS_TOKEN to .env then re-run: bun run mcp:fix'
}

# 3) Sync global permissions from project template (merge allow/block)
Write-Host '[3/7] Syncing global permissions...'
$projectPermsPath = Join-Path $repoRoot '.cursor\permissions.json'
$globalPermsPath = Join-Path $env:USERPROFILE '.cursor\permissions.json'
if (Test-Path $projectPermsPath) {
  $projectPerms = Get-Content $projectPermsPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $globalPerms = @{ mcpAllowlist = @(); autoRun = @{ allow_instructions = @(); block_instructions = @() } }
  if (Test-Path $globalPermsPath) {
    try {
      $globalPerms = Get-Content $globalPermsPath -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
      Write-Host '  [warn] could not parse global permissions — rewriting from project'
    }
  }
  $merged = @{
    approvalMode     = $projectPerms.approvalMode
    mcpAllowlist     = @($projectPerms.mcpAllowlist)
    terminalAllowlist = @($projectPerms.terminalAllowlist)
    autoRun          = $projectPerms.autoRun
    autoReview       = $projectPerms.autoReview
  }
  $merged | ConvertTo-Json -Depth 6 | ForEach-Object {
    [System.IO.File]::WriteAllText($globalPermsPath, $_, [System.Text.UTF8Encoding]::new($false))
  }
  Write-Host "  [ok] global permissions -> $globalPermsPath"
} else {
  Write-Host '  [warn] .cursor/permissions.json missing — skip global sync'
}

# 4) Session preflight + git hooks
Write-Host '[4/8] Session preflight + git hooks...'
Invoke-PhonaraBun run git:hooks:install
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'cursor-preflight.ps1')

# 5) Env doctor
Write-Host '[5/7] Environment doctor...'
Invoke-PhonaraBun run cursor:env-doctor

# 6) Audit user settings auto-approve
Write-Host '[6/7] User settings audit...'
$userSettingsPath = Join-Path $env:APPDATA 'Cursor\User\settings.json'
$requiredPatterns = @(
  'cursor:env-doctor',
  'cursor:preflight',
  'gate:ai-impl',
  'check:engine-demolition:packages',
  'mcp:verify'
)
if (Test-Path $userSettingsPath) {
  $raw = Get-Content $userSettingsPath -Raw -Encoding UTF8
  $missing = @()
  foreach ($pat in $requiredPatterns) {
    if ($raw -notmatch [regex]::Escape($pat)) {
      $missing += $pat
    }
  }
  if ($missing.Count -eq 0) {
    Write-Host '  [ok] user settings auto-approve patterns present'
  } else {
    Write-Host "  [action] Add these to chat.tools.terminal.autoApprove in $userSettingsPath :"
    foreach ($m in $missing) { Write-Host "    - $m" }
    Write-Host '  Run: bun run cursor:autopilot-setup:apply-settings  (or ask agent to apply)'
  }
} else {
  Write-Host "  [warn] user settings not found: $userSettingsPath"
}

# 7) Apply Run-Everything terminal auto-approve to user settings.json
Write-Host '[7/8] Apply Run-Everything terminal auto-approve...'
Invoke-PhonaraBun run cursor:autopilot-setup:apply-settings

Write-Host ''
Write-Host '[8/8] UI-only checklist (manual — 1회):'
Write-Host '  Settings -> Cursor Settings -> Agents -> Approvals & Execution:'
Write-Host '    [ ] Run Mode: Run Everything  (YOLO — 클릭 없이 터미널/MCP 자동 실행)'
Write-Host '    [ ] Background Agents (Cloud Agents): OFF'
Write-Host '    [ ] Max Context: 6k (not 200k)'
Write-Host '    [ ] Inline Chat: ON'
Write-Host '  Settings -> Tools & MCP:'
Write-Host '    [ ] Project "supabase" stdio: ON (plugin-supabase OFF)'
Write-Host '  Then: fully quit Cursor (tray icon) and reopen'
Write-Host ''
Write-Host '=== Autopilot setup complete ==='
Write-Host 'Natural commands: start work / implement / session end (see CURSOR_AUTOPILOT.md)'
Write-Host 'Guide: docs/SSOT/CURSOR_AUTOPILOT.md'
