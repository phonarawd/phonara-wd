# SCREENSHOT_INDEX — Phase 6 Closeout (2026-07-25)

> **루트:** `/screenshots`  
> **엔진:** Chrome CDP (`scripts/visual-audit-capture-cdp.ts`)  
> **Canonical:** `VIEWPORT_SMOKE_WIDTHS = [390, 768, 1024, 2560]`  
> **Ultrawide(별도):** `ULTRAWIDE_SMOKE_WIDTHS = [3440, 3840, 5120]` · `PHONARA_AUDIT_ULTRAWIDE=1` · `screenshots/ultrawide/` (4단 DoD 불변)

## Primary routes — 보유 현황 (디스크 실측 2026-07-25)

| Route                       | 390 | 768 | 1024 | 2560 | 비고                       |
| --------------------------- | --: | --: | ---: | ---: | -------------------------- |
| `/` landing                 |   6 |   6 |    6 |    6 | dark+light                 |
| `/install`                  |   3 |   3 |    3 |    3 | dark                       |
| `/home`                     |   3 |   — |    3 |    3 | auth · 768 CDP 의도 스킵   |
| `/wallet`                   |   3 |   — |    3 |    3 | auth · 768 스킵            |
| `/trade` (spot)             |   3 |   — |    3 |    3 | auth · 768 스킵            |
| `/sports`                   |   3 |   — |    3 |    3 | auth · 768 스킵            |
| Casino (dice/mines/hilo 등) |  9+ |   — |  15+ |   9+ | Phase 1 상호작용 캡처 포함 |

`—` = auth 라우트에서 CDP가 768을 의도적으로 스킵(기존 Phase 1 기록과 동일). Public(landing/install)은 4단 전부 PASS.

## 파일명 규칙

```text
{route}-{width}-{theme}-{nn}.png
예: home-1024-dark-01.png · trade-spot-390-dark-02.png
```

상호작용/결과 프레임: `*-bet-result.png` · `*-live-cashout.png`

## 이전 팩

2026-07-11 minimal 22 PNG(로그인 리다이렉트 다수)는 [`../visual-ux-2026-07-11/SCREENSHOT_INDEX.md`](../visual-ux-2026-07-11/SCREENSHOT_INDEX.md)에 이력으로만 유지 — **본 인덱스가 supersede**.
