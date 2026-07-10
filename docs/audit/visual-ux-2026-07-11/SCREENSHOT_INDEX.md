# SCREENSHOT_INDEX — PHONARA Visual Capture Plan

> **날짜:** 2026-07-11  
> **상태:** **1차 minimal 캡처 완료** (22 PNG) · 풀 smoke/인증 세션 패스 대기  
> **루트:** `/screenshots`  
> **매니페스트:** [`capture-manifest.json`](./capture-manifest.json)  
> **엔진:** system Chrome CDP (`scripts/visual-audit-capture-cdp.ts`) — Playwright hook 차단으로 CDP 사용

---

## 0. 캡처 실행 결과 (2026-07-11)

| 항목 | 값 |
|------|-----|
| 모드 | `PHONARA_AUDIT_MINIMAL=1` (RAM ~700MB free) |
| PNG | **22** |
| Routes | 9 |
| Viewports | 390×844 · 1920×1080 |
| Themes | dark (+ landing light) |
| Scroll | top only (`_01`) |
| Auth redirects | home/trade/wallet/casino → `/login` (세션 없음 · Docker OFF) |
| Hover | 2장 (`screenshots/hover/`) |

### 실제 파일 목록

#### mobile/

| 파일 | 비고 |
|------|------|
| `landing_mobile_dark_01.png` | **스플래시/로딩** 타이밍 (본문 미도착) |
| `landing_mobile_light_01.png` | landing light |
| `login_mobile_dark_01.png` | 로그인 폼 OK |
| `signup_mobile_dark_01.png` | |
| `install_mobile_dark_01.png` | InstallPromptProvider 에러 경계 |
| `legal_terms_mobile_dark_01.png` | |
| `home_mobile_dark_01.png` | → login redirect |
| `trade_spot_mobile_dark_01.png` | → login redirect |
| `wallet_mobile_dark_01.png` | → login redirect |
| `casino_lobby_mobile_dark_01.png` | → login redirect |

#### desktop/

| 파일 | 비고 |
|------|------|
| `landing_desktop_dark_01.png` | hero · CTA · 미션 카드 OK |
| `landing_desktop_light_01.png` | |
| `login_desktop_dark_01.png` | |
| `signup_desktop_dark_01.png` | |
| `install_desktop_dark_01.png` | 에러 경계 |
| `legal_terms_desktop_dark_01.png` | |
| `home_desktop_dark_01.png` | → login redirect |
| `trade_spot_desktop_dark_01.png` | → login redirect |
| `wallet_desktop_dark_01.png` | → login redirect |
| `casino_lobby_desktop_dark_01.png` | → login redirect |

#### hover/

| 파일 | 비고 |
|------|------|
| `landing_cta_region_01.png` | |
| `landing_after_mousemove_01.png` | mouseMoved 후 |

### 캡처에서 드러난 UI 이슈

1. **Mobile landing dark** — 1.2s wait로 스플래시만 캡처 (재캡처 시 wait↑ 필요)  
2. **`/install`** — `useInstallPrompt must be used within InstallPromptProvider` 런타임 에러  
3. **Auth surfaces** — 로컬 세션 없이 전부 login redirect (의도된 게이트 · 실 UI는 Docker+login 패스 필요)

---

## 1. 디렉터리 스키마

```
screenshots/
  desktop/     # ≥1024 가로
  tablet/      # 768–1023 (및 태블릿 세로) — 1차 미캡처
  mobile/      # ≤767
  hover/       # 버튼·카드·메뉴 hover / open
  dialogs/     # Dialog · Sheet · Confirm — 미착수
  states/      # empty · error · loading · zero-balance — install 에러만 간접
  admin/       # Admin 전용 — 미착수
```

### 파일명 규칙

```
{page}_{viewport}_{nn}.png
```

Theme: `_{light|dark}_` infix  
예: `landing_desktop_dark_01.png`

---

## 2. Viewport 매트릭스

### 제품 smoke (권장 1차)

| ID | W×H | 폴더 | 1차 상태 |
|----|-----|------|----------|
| S1 | 390×844 | mobile | **[x]** |
| S2 | 768×1024 | tablet | [ ] |
| S3 | 1024×768 | tablet/desktop | [ ] |
| S4 | 1920×1080 | desktop | **[x]** |

### Director 풀 요청 (2차)

| Tier | Resolutions | 상태 |
|------|-------------|------|
| Desktop | 1920×1080 · 1600×900 · 1440×900 · 1280×720 | 1920만 |
| Tablet | 1024×1366 · 820×1180 | [ ] |
| Mobile | 430…320 | 390만 |

---

## 3. 다음 패스 (권장)

```powershell
# RAM ≥1228MB 권장 · Docker ON for auth surfaces
bun run stack:ensure --full
# 로그인 세션 주입 후:
$env:PHONARA_AUDIT_MINIMAL='0'
bun run tsx scripts/visual-audit-capture-cdp.ts
```

| 패스 | 내용 |
|------|------|
| 1b | landing mobile dark 재캡처 (wait 3s+) · install provider fix 후 재캡처 |
| 2 | smoke 4폭 × scroll 3 × public full |
| 3 | Docker + login → home/trade/wallet/casino/games 실 UI |
| 4 | dialogs / states / admin |

```text
캡처 상태: [x] 1차 minimal 완료 · [ ] 1차 smoke 풀 · [ ] 인증 세션 · [ ] 풀매트릭스
```

---

## 4. 재실행 명령

```powershell
# minimal (저사양)
$env:PHONARA_AUDIT_MINIMAL='1'
bun run tsx scripts/visual-audit-capture-cdp.ts

# full smoke (서버 이미 떠 있으면)
$env:PHONARA_AUDIT_NO_SPAWN='1'
$env:PHONARA_AUDIT_MINIMAL='0'
bun run tsx scripts/visual-audit-capture-cdp.ts
```

Playwright 경로 스크립트: `scripts/visual-audit-capture.ts` (hook 차단 시 CDP 사용)
