@echo off
REM Launch Playwright MCP outside the monorepo so npm does not inherit
REM package.json "overrides" (esbuild EOVERRIDE when using npx from repo root).
REM Use chromium-headless-shell (lighter on 8GB) + isolated profile.
setlocal
set "PHONARA_MCP_CWD=%TEMP%\phonara-playwright-mcp"
if not exist "%PHONARA_MCP_CWD%" mkdir "%PHONARA_MCP_CWD%"
cd /d "%PHONARA_MCP_CWD%"

set "PHONARA_HEADLESS_SHELL=%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1232\chrome-headless-shell-win64\chrome-headless-shell.exe"
if not exist "%PHONARA_HEADLESS_SHELL%" (
  echo [run-playwright-mcp] headless-shell missing: %PHONARA_HEADLESS_SHELL% >&2
  echo [run-playwright-mcp] install: npx playwright install chromium-headless-shell >&2
  exit /b 1
)

REM 8GB low-RAM contract: headless-shell (~200-400MB) + omit images + block trackers.
REM PLAYWRIGHT_MCP_EXECUTABLE_PATH is read by @playwright/mcp (see playwright.dev/mcp/configuration).
set "PLAYWRIGHT_MCP_EXECUTABLE_PATH=%PHONARA_HEADLESS_SHELL%"
set "PLAYWRIGHT_MCP_HEADLESS=true"
set "PLAYWRIGHT_MCP_CONFIG=%~dp0playwright-mcp-8gb.json"
npx -y @playwright/mcp@latest --config "%PLAYWRIGHT_MCP_CONFIG%"
exit /b %ERRORLEVEL%
