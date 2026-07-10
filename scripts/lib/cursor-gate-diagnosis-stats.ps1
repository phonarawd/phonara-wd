$ErrorActionPreference = 'SilentlyContinue'

function Round-Mb([int64]$bytes) {
  if ($bytes -le 0) { return 0 }
  return [math]::Round($bytes / 1MB, 0)
}

$cursorCoreBytes = [int64]0
$extensionHostBytes = [int64]0
$tsserverBytes = [int64]0
$claudeBytes = [int64]0
$claudeCount = 0

Get-CimInstance Win32_Process -Filter "Name='Cursor.exe'" |
  ForEach-Object {
    $ws = [int64]$_.WorkingSetSize
    $cmd = [string]$_.CommandLine
    if ($cmd -match '--type=extensionHost') {
      $extensionHostBytes += $ws
    } elseif ($cmd -match '--type=renderer') {
      $extensionHostBytes += $ws
    } elseif ($cmd -match '--type=') {
      # gpu-process, utility, etc. — count toward extension/render bucket
      $extensionHostBytes += $ws
    } else {
      $cursorCoreBytes += $ws
    }
  }

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*tsserver*' } |
  ForEach-Object {
    $tsserverBytes += [int64]$_.WorkingSetSize
  }

foreach ($image in @('claude.exe', 'claude-helper.exe')) {
  Get-CimInstance Win32_Process -Filter ("Name='" + $image + "'") |
    ForEach-Object {
      $claudeBytes += [int64]$_.WorkingSetSize
      $claudeCount += 1
    }
}

$os = Get-CimInstance Win32_OperatingSystem
$ramTotalMb = [math]::Round($os.TotalVisibleMemorySize / 1KB, 0)
$ramFreeMb = [math]::Round($os.FreePhysicalMemory / 1KB, 0)

$payload = [ordered]@{
  cursor_core_mb = (Round-Mb $cursorCoreBytes)
  extension_host_mb = (Round-Mb $extensionHostBytes)
  tsserver_mb = (Round-Mb $tsserverBytes)
  claude_desktop_mb = (Round-Mb $claudeBytes)
  claude_desktop_count = $claudeCount
  ram_total_mb = $ramTotalMb
  ram_free_mb = $ramFreeMb
}

$payload | ConvertTo-Json -Compress
