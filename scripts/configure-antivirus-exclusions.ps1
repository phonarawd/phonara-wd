# Configure antivirus scan exclusions for PHONARA dev paths.
# - Microsoft Defender: automated when active (may need elevation).
# - AhnLab V3 Lite: no public CLI — opens UI + prints exact folders to add.
param(
  [switch]$Elevated,
  [switch]$OpenV3Lite,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

$exclusionPaths = @(
  (Join-Path $repoRoot 'node_modules'),
  (Join-Path $env:USERPROFILE '.bun')
)

function Write-Info([string]$Message) {
  if (-not $Quiet) { Write-Host $Message }
}

function Test-DefenderActive {
  try {
    $status = Get-MpComputerStatus -ErrorAction Stop
    return [bool]($status.RealTimeProtectionEnabled -or $status.AntivirusEnabled -or $status.AMServiceEnabled)
  } catch {
    return $false
  }
}

function Test-AhnLabV3Lite {
  return Test-Path 'C:\Program Files\AhnLab\V3Lite40\v3lite4.exe'
}

function Get-ExistingDefenderExclusions {
  try {
  return @(Get-MpPreference -ErrorAction Stop).ExclusionPath
  } catch {
    return @()
  }
}

function Add-DefenderExclusions {
  param([string[]]$Paths)

  $existing = Get-ExistingDefenderExclusions
  $added = 0
  foreach ($path in $Paths) {
    if ($existing -contains $path) {
      Write-Info "[skip] Defender already excludes: $path"
      continue
    }
    try {
      Add-MpPreference -ExclusionPath $path -ErrorAction Stop
      Write-Info "[ok] Defender exclusion added: $path"
      $added += 1
    } catch {
      Write-Host "[fail] Defender could not add: $path"
      Write-Host "       $($_.Exception.Message)"
      return $false
    }
  }
  return $true
}

function Show-V3LiteManualSteps {
  param([string[]]$Paths)

  Write-Host ''
  Write-Host '=== AhnLab V3 Lite — manual scan exclusion (required on this PC) ==='
  Write-Host 'Microsoft Defender is OFF; V3 Lite is handling real-time scanning.'
  Write-Host 'V3 Lite has no supported CLI for exclusions — add these folders in the UI:'
  Write-Host ''
  Write-Host '  1. V3 Lite main window -> bottom-left gear icon'
  Write-Host '  2. PC Security -> Scan exception settings (검사 예외 설정)'
  Write-Host '  3. Enable "Use scan exceptions" (검사 예외 사용)'
  Write-Host '  4. Folder add (폴더 추가) -> pick each path below -> OK'
  Write-Host ''
  foreach ($path in $Paths) {
    if (Test-Path $path) {
      Write-Host "  [exists] $path"
    } else {
      Write-Host "  [create later] $path  (run bun install first if node_modules missing)"
    }
  }
  Write-Host ''
  Write-Host 'Docs: https://help.ahnlab.com/V3Lite4.0/ko_kr/set_scan_excp.htm'
}

function Open-V3LiteApp {
  $exe = 'C:\Program Files\AhnLab\V3Lite40\v3lite4.exe'
  if (-not (Test-Path $exe)) { return }
  try {
    Start-Process -FilePath $exe
    Write-Info '[ok] Opened AhnLab V3 Lite — follow the manual steps above.'
  } catch {
    Write-Host "[warn] Could not open V3 Lite: $($_.Exception.Message)"
  }
}

Write-Info '=== PHONARA antivirus exclusion setup ==='
Write-Info "Repo: $repoRoot"
Write-Info ''

$defenderActive = Test-DefenderActive
$v3Lite = Test-AhnLabV3Lite

Write-Info "Defender active: $defenderActive"
Write-Info "AhnLab V3 Lite installed: $v3Lite"
Write-Info ''

if ($defenderActive) {
  Write-Info 'Configuring Microsoft Defender exclusions...'
  $ok = Add-DefenderExclusions -Paths $exclusionPaths
  if (-not $ok -and -not $Elevated) {
    Write-Host ''
    Write-Host 'Retrying with elevation (UAC prompt)...'
    $argList = @(
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', (Join-Path $PSScriptRoot 'configure-antivirus-exclusions.ps1'),
      '-Elevated'
    )
    Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argList
    exit 0
  }
  if ($ok) {
    Write-Info 'Defender exclusions configured.'
  }
} else {
  Write-Info 'Microsoft Defender real-time protection is not active on this PC.'
}

if ($v3Lite) {
  Show-V3LiteManualSteps -Paths $exclusionPaths
  if ($OpenV3Lite -or -not $defenderActive) {
    Open-V3LiteApp
  }
} elseif (-not $defenderActive) {
  Write-Host '[warn] No supported active antivirus detected for automated exclusion.'
  Write-Host '       If another AV is installed, add the paths above manually in that product.'
}

Write-Info ''
Write-Info 'Paths targeted:'
foreach ($path in $exclusionPaths) {
  Write-Info "  - $path"
}
