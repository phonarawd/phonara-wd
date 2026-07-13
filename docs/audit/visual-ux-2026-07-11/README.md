# Visual & UX Audit Pack — 2026-07-11

> Phase R 정적 감사 산출물. **실행 큐 아님** — Director/재설계 입력용.  
> Active SSOT: [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../../SSOT/ACTIVE_WORK_SSOT.md)

| 문서                                               | 내용                                  |
| -------------------------------------------------- | ------------------------------------- |
| [VISUAL_AUDIT.md](./VISUAL_AUDIT.md)               | 페이지·시각 언어·hierarchy·UI 이슈    |
| [UX_AUDIT.md](./UX_AUDIT.md)                       | IA·플로우·클릭 깊이·UX 이슈           |
| [RESPONSIVE_AUDIT.md](./RESPONSIVE_AUDIT.md)       | Breakpoint·셸·컴포넌트 변화           |
| [DESIGN_SYSTEM_AUDIT.md](./DESIGN_SYSTEM_AUDIT.md) | 토큰·primitives·CSS·부채              |
| [SCREENSHOT_INDEX.md](./SCREENSHOT_INDEX.md)       | 캡처 스키마·큐 · PNG는 `/screenshots` |

## 최종 정량 (요약)

| 메트릭                    | 값                                              |
| ------------------------- | ----------------------------------------------- |
| Web routes                | 69                                              |
| Web pages                 | 55                                              |
| Web surface TSX           | 139                                             |
| Primitives                | 33                                              |
| Admin routes              | 27                                              |
| Dialog consumers          | ~12–15                                          |
| Bottom sheets             | 3–4                                             |
| Charts                    | 2                                               |
| Breakpoints               | 8 (+5 tiers · 4 smoke)                          |
| Design tokens             | ≈100                                            |
| Plan 완료율               | 202/278 ≈ **72.7%**                             |
| Visual polish (추정)      | **≈55–60%**                                     |
| Screenshots (1차 minimal) | **22 PNG** · 390 + 1920 · public+login-redirect |

## 스크린샷 1차 메모

- 엔진: Chrome CDP (`scripts/visual-audit-capture-cdp.ts`)
- Auth UI(home/trade/wallet/casino) = **login redirect** (Docker/세션 없음)
- `/install` = InstallPromptProvider 누락 에러 경계 캡처됨
- `landing_mobile_dark_01` = 스플래시 타이밍 (재캡처 권장)
- 상세: [SCREENSHOT_INDEX.md](./SCREENSHOT_INDEX.md) · [capture-manifest.json](./capture-manifest.json)

## 개선 우선순위

1. Casino L1 stage ×12
2. `#205` fiat hint
3. Sports VIP 실표면
4. Landing fold 절제
5. Trade mobile IA
6. P13 token purge
7. Admin DS 정렬  
   )
