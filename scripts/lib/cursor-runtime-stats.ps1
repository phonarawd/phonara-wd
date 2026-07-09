$ErrorActionPreference = 'SilentlyContinue'
$cursor = Get-Process Cursor -ErrorAction SilentlyContinue
$cursorMb = if ($cursor) { [math]::Round(($cursor | Measure-Object WorkingSet64 -Sum).Sum / 1MB, 0) } else { 0 }
$cursorCount = if ($cursor) { $cursor.Count } else { 0 }
$semanticMb = 0
$partialMb = 0
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*tsserver*' } |
  ForEach-Object {
    $ws = [int64]$_.WorkingSetSize
    if ($_.CommandLine -like '*partialSemantic*') {
      $partialMb += $ws
    } else {
      $semanticMb += $ws
    }
  }
$semanticMb = [math]::Round($semanticMb / 1MB, 0)
$partialMb = [math]::Round($partialMb / 1MB, 0)
$os = Get-CimInstance Win32_OperatingSystem
$ramTotalMb = [math]::Round($os.TotalVisibleMemorySize / 1KB, 0)
$ramFreeMb = [math]::Round($os.FreePhysicalMemory / 1KB, 0)
Write-Output "CURSOR|$cursorCount|$cursorMb|TSSEM|$semanticMb|TSPART|$partialMb|RAMTOTAL|$ramTotalMb|RAMFREE|$ramFreeMb"
