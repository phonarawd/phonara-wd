# PHONARA bun wrapper — merges stderr so PowerShell does not treat bun script echoes as errors.
$ErrorActionPreference = 'Continue'

function Resolve-PhonaraBunExe {
  if ($env:PHONARA_BUN_EXE -and (Test-Path -LiteralPath $env:PHONARA_BUN_EXE)) {
    return $env:PHONARA_BUN_EXE
  }
  $candidates = @(
    (Join-Path $env:APPDATA 'npm\node_modules\bun\bin\bun.exe'),
    (Join-Path $env:USERPROFILE '.bun\bin\bun.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  throw 'bun.exe not found — install from https://bun.sh'
}

function Invoke-PhonaraBun {
  [CmdletBinding()]
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$BunArgs
  )

  $bunExe = Resolve-PhonaraBunExe
  & $bunExe @BunArgs 2>&1 | ForEach-Object {
    if ($_ -is [System.Management.Automation.ErrorRecord]) {
      Write-Host $_.ToString()
    } else {
      Write-Host $_
    }
  }
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

function Install-PhonaraBunFunction {
  $definition = @'
function global:bun {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  $bunExe = if ($env:PHONARA_BUN_EXE -and (Test-Path -LiteralPath $env:PHONARA_BUN_EXE)) {
    $env:PHONARA_BUN_EXE
  } elseif (Test-Path -LiteralPath (Join-Path $env:APPDATA 'npm\node_modules\bun\bin\bun.exe')) {
    Join-Path $env:APPDATA 'npm\node_modules\bun\bin\bun.exe'
  } elseif (Test-Path -LiteralPath (Join-Path $env:USERPROFILE '.bun\bin\bun.exe')) {
    Join-Path $env:USERPROFILE '.bun\bin\bun.exe'
  } else {
    'bun.exe'
  }
  & $bunExe @Args 2>&1 | ForEach-Object {
    if ($_ -is [System.Management.Automation.ErrorRecord]) { Write-Host $_.ToString() }
    else { Write-Host $_ }
  }
  return
}
'@
  Invoke-Expression $definition
}
