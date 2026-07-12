# R0 — Browser / DevTools MCP Availability Probe (M-18)

> **Finding:** `M-18`  
> **Date:** 2026-07-13T01:00:00+09:00  
> **SHA:** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`  
> **type:** runtime / console

## Probe 5 — capture OK (8GB low-RAM · 2026-07-13)

| 항목 | 값 |
| --- | --- |
| **MCP server** | `project-0-phonara-gb-playwright` |
| **serverStatus** | **`ready`** |
| **Launcher** | `scripts/run-playwright-mcp.cmd` + `scripts/playwright-mcp-8gb.json` |
| **Browser binary** | `chromium_headless_shell-1232` / `chrome-headless-shell.exe` |
| **Navigate** | **PASS** — `https://preview.phonara-web.pages.dev/` |
| **Page title** | `PHONARA \| Earn, Trade, Play` → post-hydration `PrimeForge — 부업 습관` |
| **Screenshot** | **PASS** — [`probe5-preview-landing-390.png`](probe5-preview-landing-390.png) (49 985 bytes) |
| **Snapshot** | [`probe5-snapshot-390.yml`](probe5-snapshot-390.yml) |
| **Viewport** | 390×844 (mobile) |
| **System RAM** | **2210MB free / 7920MB** · Cursor **3097MB** (warn · headless-shell OK) |

### Status enum (R0 Exit)

`AVAILABLE` + `CAPTURE_OK` + `LOW_RAM_WARN`

- Stage1 **캡처 1회 성공** → `M-18` **VERIFIED_FIXED** (R0 tool availability).
- R9 **1455px·580px** 전수 DOM 매트릭스는 별도 Stage2 evidence (본 Probe 범위 아님).

## Probe 4 — re-verify (operator request · 2026-07-13)

| 항목 | 값 |
| --- | --- |
| **MCP server** | `project-0-phonara-gb-playwright` |
| **serverStatus** | **`ready`** |
| **Tool count** | **24+** (`browser_navigate` · `browser_snapshot` · `browser_take_screenshot` · …) |
| **Browser binary** | `chromium-1232` + `chromium_headless_shell-1232` **installed** |
| **Capture** | **TIMEOUT** — full `chrome.exe` launches but CDP pipe handshake 180s 초과 |
| **Target URL** | `https://preview.phonara-web.pages.dev/` |
| **Viewport intent** | 390×844 |
| **System RAM** | **1833MB free / 7920MB** · Cursor **3715MB** (warn) |

### Status enum (R0)

`AVAILABLE_TOOLS_OK` + `BROWSER_LAUNCH_TIMEOUT` + `LOW_RAM_WARN`

- MCP tool catalog·server 연결은 **정상**.
- Stage1 캡처 1회 성공은 아직 **미충족** → `M-18` **OPEN** 유지 (CAPTURE pending).

### Fail log (Probe 4)

```text
TimeoutError: Timeout 180000ms exceeded
<launching> ...\chromium-1232\chrome-win64\chrome.exe ... --remote-debugging-pipe about:blank
<launched> pid=8500
GCM Registration response error: DEPRECATED_ENDPOINT (반복)
```

### Launcher fix (Probe 4 — headless-shell)

`scripts/run-playwright-mcp.cmd` → TEMP + `npx` + `--executable-path` → `chrome-headless-shell.exe` (주석과 구현 불일치 해소 · 8GB 경량화).

**다음 (operator 1회):**

1. Chrome·불필요 앱 정리 → **free RAM ≥ 2500MB** 목표 (`cursor:status`)
2. Settings → MCP → `playwright` **OFF → ON** (headless-shell launcher 로드)
3. 채팅: `Browser MCP 다시 검증해줘` (Probe 5 캡처 시도)

## Probe 3 — re-verify (2026-07-13T01:00)

| 항목 | 값 |
| --- | --- |
| **MCP server** | `project-0-phonara-gb-playwright` |
| **serverStatus** | **`ready`** |
| **Tool count** | **24+** |
| **Browser binary** | Chrome for Testing **installed** (`ms-playwright/chromium-1232`) |
| **Capture** | **TIMEOUT** — CDP handshake 180s 초과 |
| **Status** | `AVAILABLE_TOOLS_OK` + `BROWSER_LAUNCH_TIMEOUT` |

## History

| Probe | Result |
| --- | --- |
| 1 | NOT_AVAILABLE (tools=0) |
| 2 | CONFIGURED · EOVERRIDE then fixed |
| 3 | tools ready · chrome installed · capture TIMEOUT |
| 4 | tools ready · capture TIMEOUT · RAM warn · launcher→headless-shell |
| 5 | **CAPTURE OK** · 8gb.json · headless-shell · free RAM ~2210MB |
