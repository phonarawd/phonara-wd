# PHONARA operator RC gate - Windows PowerShell 5.1+
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\operator-check-full.ps1

$ErrorActionPreference = 'Continue'

$Root = 'c:\Users\PC\Desktop\phonara-gb'
$ReportDir = 'c:\Users\PC\Desktop\phonara-gate-report'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogFile = Join-Path $ReportDir ('check-full-' + $Stamp + '.log')
$Summary = Join-Path $ReportDir ('summary-' + $Stamp + '.txt')

Set-Location $Root
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

Write-Host ''
Write-Host '[1/5] Preflight...'
bun run cursor:status
if (-not $?) {
    Write-Host 'cursor:status failed. Run: bun run cursor:emergency-reset'
    exit 1
}

Write-Host ''
Write-Host '[2/5] RAM / Docker check...'
bun run cursor:env-doctor

Write-Host ''
Write-Host '[3/5] Orphan / port cleanup...'
bun run cursor:emergency-reset

Write-Host ''
Write-Host '[4/5] check:full start (about 45-90 min)...'
Write-Host ('Log file: ' + $LogFile)
Write-Host ''

$Started = Get-Date
$ExitCode = 0

Start-Transcript -Path $LogFile -Force
try {
    bun run check:full
    if ($?) {
        $ExitCode = 0
    } else {
        $ExitCode = 1
    }
} catch {
    $ExitCode = 1
    Write-Host ('ERROR: ' + $_.Exception.Message)
} finally {
    Stop-Transcript
}

Write-Host ''
Write-Host '[5/5] Session cleanup...'
bun run cursor:session-end
bun run check:hygiene
bun run e2e:kill

$Finished = Get-Date
$Duration = $Finished - $Started
$Branch = 'unknown'
$Commit = 'unknown'
try { $Branch = git rev-parse --abbrev-ref HEAD 2>$null } catch {}
try { $Commit = git rev-parse --short HEAD 2>$null } catch {}

$Manifest = Join-Path $Root 'gate-manifest\phase-r-manifest.json'
$ManifestText = '(no manifest - check:full may have failed early)'
if (Test-Path $Manifest) {
    $ManifestText = Get-Content $Manifest -Raw -Encoding UTF8
}

if ($ExitCode -eq 0) {
    $ResultLabel = 'GREEN'
} else {
    $ResultLabel = 'RED'
}

$SummaryLines = @(
    'PHONARA check:full RC Report'
    '============================'
    ('Started  : ' + $Started)
    ('Finished : ' + $Finished)
    ('Duration : ' + $Duration.ToString('hh\:mm\:ss'))
    ('ExitCode : ' + $ExitCode + ' ' + $ResultLabel)
    ('Branch   : ' + $Branch)
    ('Commit   : ' + $Commit)
    ('LogFile  : ' + $LogFile)
    ''
    '--- gate-manifest ---'
    $ManifestText
    ''
    '--- send to agent ---'
    '1) Paste this summary file'
    '2) Attach or @ the log file path above'
    ('3) ExitCode ' + $ExitCode + ' = ' + $ResultLabel)
)

Set-Content -Path $Summary -Value $SummaryLines -Encoding UTF8

Write-Host ''
Write-Host '========================================'
if ($ExitCode -eq 0) {
    Write-Host ' RESULT : GREEN'
} else {
    Write-Host ' RESULT : RED'
}
Write-Host (' Summary: ' + $Summary)
Write-Host (' Log    : ' + $LogFile)
Write-Host '========================================'
Write-Host ''

exit $ExitCode
