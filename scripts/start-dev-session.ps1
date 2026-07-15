# PHONARA local dev — keeps Docker + Supabase + Vite running until window is closed.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

$env:PHONARA_KEEP_STACK = '1'
$env:PHONARA_DOCKER_AUTO_QUIT = '0'

Write-Host '=== PHONARA dev session ===' -ForegroundColor Cyan
Write-Host 'Web: http://127.0.0.1:3000' -ForegroundColor Green
Write-Host 'Studio: http://127.0.0.1:54523' -ForegroundColor Green
Write-Host 'Close this window or Ctrl+C to stop Vite. Run bun run stack:stop to release Docker.' -ForegroundColor Yellow
Write-Host ''

bun x tsx scripts/dev-web-local.ts
