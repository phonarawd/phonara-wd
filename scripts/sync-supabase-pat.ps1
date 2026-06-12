# Sync SUPABASE_ACCESS_TOKEN in repo .env from Windows Credential Manager (Supabase CLI).
# Does NOT print the token.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $repoRoot '.env'

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredMan {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
  [DllImport("advapi32", SetLastError=true)]
  public static extern bool CredFree(IntPtr cred);
}
"@

$credPtr = [IntPtr]::Zero
if (-not [CredMan]::CredRead('Supabase CLI:supabase', 1, 0, [ref]$credPtr)) {
  Write-Error 'Supabase CLI credential not found. Run: supabase login'
}
$cred = [Runtime.InteropServices.Marshal]::PtrToStructure($credPtr, [type][CredMan+CREDENTIAL])
$bytes = New-Object byte[] $cred.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
[CredMan]::CredFree($credPtr) | Out-Null

$candidates = @(
  [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0),
  [Text.Encoding]::Unicode.GetString($bytes).Trim([char]0),
  [Text.Encoding]::ASCII.GetString($bytes).Trim([char]0)
) | Where-Object { $_ -match '^sbp_[A-Za-z0-9]+$' } | Select-Object -Unique

$token = $candidates | Select-Object -First 1
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Error 'Supabase CLI credential is empty or unreadable. Run: supabase login'
}

if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $repoRoot '.env.example') $envFile -ErrorAction SilentlyContinue
}
if (-not (Test-Path $envFile)) {
  New-Item -Path $envFile -ItemType File -Force | Out-Null
}

$lines = @(Get-Content $envFile -Encoding UTF8)
$found = $false
$out = foreach ($line in $lines) {
  if ($line -match '^\s*SUPABASE_ACCESS_TOKEN=') {
    $found = $true
    "SUPABASE_ACCESS_TOKEN=$token"
  } else {
    $line
  }
}
if (-not $found) {
  $out += "SUPABASE_ACCESS_TOKEN=$token"
}
Set-Content -Path $envFile -Value $out -Encoding UTF8
Write-Host '[ok] SUPABASE_ACCESS_TOKEN synced from Supabase CLI credential to .env'
