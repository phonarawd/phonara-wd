# PHONARA P1 FINAL v3 — Lovable 제작 스펙 (PHONARA 부록 A–K 동등 강제)

> **Lovable AI 채팅에 이 파일 전체를 붙여넣거나 `@docs/LOVABLE_P1_FINAL_PHONARA.md` 로 참조하세요.**  
> P0 계약·엔진 경계·paste map·2층 QA·i18n·testid 앵커를 한 문서에 고정합니다.

**관련 문서:** `docs/LOVABLE_HANDOFF.md` · `docs/LOVABLE_CRASH_CHECKPOINT.md` · `docs/GAMES-INTEGRATION.md` · `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md` · `apps/web/PRESENTATION_IMPORT.md`

**엔진 절대 무수정 (최상위 규칙 — Lovable/UI 작업 중 위반 금지):** PHONARA **엔진 레이어는 한 줄·한 바이트도 수정하지 않는다.** 리팩터·버그픽스·편의 개선·UI 맞춤 변경·마이그레이션·RPC/RLS 추가·hook 로직 변경·`game_code` 확장 전부 **금지**. UI가 엔진 변경을 요구하면 **구현하지 말고 보고만** 한다. UI는 hook/RPC **반환값 표시 + callback 호출**만.

**시각 1:1 규칙 (최우선):** 시각·레이아웃·모션·밀도는 Lovable 프리뷰와 바꾸지 않는다. PHONARA 통합은 **경로·props·i18n·testid만** — restyle·`theme.css` 병합 금지.

**구 UI 잔재 0 (한 톨도 금지):** 기존 PHONARA에 구현되어 있던 **사용자-facing UI/UX는 전부 구닥다리(legacy)** 이다. Lovable 이식 후 **한 톨도 남기지 않는다** — 클래스·컴포넌트·CSS·폰트·탭·placeholder·`@phonara/ui` 카지노/셸 위젯·`app-shell`·구 `landing-page`·690줄 `casino.tsx` 내 시각 코드 등 **전량 제거**. Lovable을 `@phonara/ui`나 구 PHONARA 스타일로 **되돌리기** 금지. 사용자가 보는 표면의 **단일 출처 = Lovable ZIP** 뿐.

**전역 흡수 범위 (게임만이 아님):** **엔진 레이어만 제외**하고 사용자에게 보이는 **모든 것** — 전 페이지·전 탭·셸·폰트·타이포·아이콘·색·spacing·모션·카피 리듬·컴포넌트 밀도 — 은 Lovable 플랫폼 산출물을 **100% 동일하게** 그대로 이식한다. Cursor는 통합만 한다 — **재디자인·정규화·구 UI 혼합·PHONARA 스타일 병합 금지.**

**지구 현존 최고 스펙 (레포 설치 기준, 전면 적용):** Lovable 산출물은 아래 스택을 **최대 한도로** 사용한다. 구 PHONARA UI 패턴·낡은 Canvas/DOM 트릭·저사양 폴백을 기본으로 두지 않는다.

| 영역 | 최고 스펙 (이미 레포에 설치·설정됨) |
|---|---|
| 런타임 | React 19 · React Compiler · Vite 8 · TanStack Router/Query/Virtual/Table |
| 그래픽 | `pixi.js@8` + `@pixi/filter-*` · matter-js · GPU tier auto · DPR cap 2.0 |
| 모션/UX | framer-motion · vaul · `@use-gesture/react` · canvas-confetti · WebAudio `useSound` |
| 스타일 | Tailwind v4 · `lovable-globals.css` · Radix primitives · presentation-import tokens |
| 품질 | TypeScript strict · Vitest · Playwright 3 profiles · axe · per-game chunk budget |

| Lovable 100% 이식 (전면) | PHONARA 엔진 (read-only, Lovable/Cursor 수정 금지) |
|---|---|
| 모든 페이지 UI/UX (Earn·Home·Landing·Wallet·Auth·Trade·Casino·Games·History·Fairness·Tournaments·Share·Offline·RG·More·Account·Settings·Legal·Dashboard·Ledger·Staking·Referral 등) | `packages/{game-engine,money,trading-engine,wallet-ledger}` |
| 앱 셸 전체 (TopBar·BottomNav 5탭·AccountSheet·SiteFooter·모달 로그인·Earn/Trade/Casino 탭 전환) | `supabase/*` (schema·RPC·RLS·migrations) |
| 폰트·타이포·`lovable-globals.css`·프레젠테이션 토큰·게임 A–G | `features/*/use-*.ts` · `hooks/use-wallet.ts` · `use-casino-round.ts` 등 |
| `components/{ui,shell,earn,trade,fomo,welcome,games}/**` · `presentation-import/**` | `contexts/auth-context.tsx` · `lib/rpc.ts` · `domain/**` |
| FOMO/라이브 피드·Presence mock·카운트다운 (프레젠테이션 string props) | 원장·정산·RNG·PF 결과 산출·잔액 계산 |

**폰트:** Lovable이 지정한 font-family·weight·letter-spacing·tabular nums 규칙을 `lovable-globals.css`에 **verbatim** 유지. `theme.css`·시스템 폰트로 대체 금지.

**탭/네비:** BottomNav 5탭·상단 탭·서브탭·AccountSheet 섹션 탭 — Lovable 레이아웃·아이콘·라벨·활성 상태·전환 모션 그대로.

**납품 방식 — 단일 ZIP 일괄 (확정):** Lovable에서 **모든 페이지·셸·10종 게임 카탈로그·A–G·보조 화면·i18n catalog·(선택) e2e/vitest**를 **전부 완성한 뒤**, **코드베이스 ZIP 한 번**으로 PHONARA에 넘긴다. PHONARA는 엔진·정산·테스트만 준비하고 **시각 구현은 하지 않음** — ZIP을 **1000% 그대로 흡수**만 한다.

---

# PHONARA P1 FINAL v3 — 승인 (PHONARA 부록 A–K 동등 강제)

P1 v3 비전(A–G · 모바일 한손 · 데스크탑 단축키 · 6종 Stage/HUD/Controls 분리 · 풀 QA)을 그대로 유지하고, **PHONARA monorepo 1:1 흡수**를 위한 부록 A–K를 동등 강제 조건으로 본다. 충돌 시 **부록 우선**.

---

## 0) 절대 규칙 (무위반)

- **엔진 절대 무수정** — `packages/*` · `supabase/*` · `domain/**` · `lib/rpc.ts` · `lib/auth.ts` · `contexts/auth-context.tsx` · `features/*/use-*.ts` · `hooks/use-wallet.ts` · `hooks/use-trading.ts` · `use-casino-round.ts` · `game-config.ts` 등 **read-only**. 수정·삭제·리팩터·마이그레이션·RPC/RLS·스키마·정산/RNG/PF/원장 로직 변경 **일체 금지**. UI 통합이 엔진 변경을 요구하면 **중단·보고** (§15)
- **전역 UI/UX = Lovable 100% 동일 이식** — 게임뿐 아니라 **모든 페이지·모든 탭·셸·폰트·타이포** 포함. **구 PHONARA UI 잔재 0** — 한 톨도 남기지 않음(§14)
- **구 UI = 구닥다리** — ZIP 후 `@phonara/ui` 카지노/셸·`app-shell`·구 route 시각·placeholder **전량 삭제**. Lovable을 구 스타일로 되돌리기 금지
- 클라 RNG/HMAC 결과 산출 금지(PF 표시·검증만), `rpc_*`/Supabase 직접 호출 금지, 금액은 항상 string, `parseFloat` 금지
- `apps/web/src/theme.css` 수정 금지 (엔진·레거시 표면 토큰 전용)
- `routeTree.gen.ts` 생성/의존 금지, `/auth`·`games.$gameId`·카지노 동적 `gameId` 라우트 금지
- `game_code` **10종** (`crash|dice|mines|plinko|limbo|hilo|mint_reels|gold_rush|roulette|blackjack`) — PHONARA 엔진·정산·PF **이미 구현됨**. Lovable은 UI/UX만 제공
- Earn 보상 `rpc_spin_roulette`와 카지노 `roulette` **도메인 분리** (코드·RPC·i18n·metrics 혼용 금지)
- Wheel/Keno/Tower/Coinflip 등 **미엔진 게임**은 P2 UI shell만 (정산 금지)
- `howler` 금지(WebAudio `useSound` only), 게임 폴더 내 Supabase/Cloud import **0건**
- A–G 전부 presentational. 신규 `game_code`/RPC/도메인 수정 금지

---

## 1) 신규 핵심 시스템 7종 (A–G, presentational)

| | 위치(Lovable) | 요지 |
|---|---|---|
| A GPU Shader | `src/games/shared/gfx/` | `pixi.js@8` + filters(bloom/CA/noise/distort), `useGPUTier` 자동 분기, DPR cap 2.0, context-lost 복구, Canvas2D fallback |
| B Game Feel | `src/games/shared/feel/` | `screenShake` · `hitStop` · `timeDilation` · `juice`, reduced-motion noop |
| C Live Presence (UI only) | `src/games/shared/presence/` | `PresenceProvider` + **mock 어댑터만**, ghost 렌더, 실시간 소스/카운트 산출 금지 |
| D Celebration Tier | `src/games/shared/celebrate/` | 6단계(micro→ultra), `ultra` ≤3s takeover + swipe dismiss |
| E Skin/Theme | `src/games/shared/theme/` | Default/Neon/Noir 토큰 스왑, AccountSheet 선택, localStorage |
| F Replay/Share | `src/games/shared/replay/` | result JSON deterministic 재생 → `captureStream`+`MediaRecorder` 10s WebM, fallback `html-to-image` |
| G Mobile One-Hand | `src/games/shared/mobile/` | `useThumbZone` · `useHandedness` · `OneHandSheet`(vaul) · `StickyBetBar` · `LongPressStepper` · `HapticButton`(≥56pt) |

추가 공통: `src/games/shared/visuals/` (GlowText/Confetti/ShockWave/Holo/Trail/Vignette/Bloom), `src/games/shared/hooks/` 확장(`useSound` 게임별 WebAudio 프리셋, mobile silent-switch 존중).

---

## 2) 10종 게임 (모바일 압살 + 데스크탑 최강)

**엔진 10종 (PHONARA 완료 — Lovable UI만 납품):**

| engine_code | 유형 | selection (원샷) | URL |
|---|---|---|---|
| `crash` … `hilo` | 기존 6종 | `docs/GAMES-INTEGRATION.md` | `/casino/{code}` |
| `mint_reels` | 3×5 슬롯 | `{ lines: 1..20 }` | `/casino/mint-reels` |
| `gold_rush` | 3×5 슬롯 | `{ lines: 1..20 }` | `/casino/gold-rush` |
| `roulette` | 유럽식 PF 테이블 | `{ bets: [{ type, value, stakeWeight }] }` | `/casino/roulette` |
| `blackjack` | PF 즉시 테이블 | `{ actions: [{ seat, move }] }` | `/casino/blackjack` |

Lovable은 `ImportedGameSurfaceProps` + 표준 E2E testid 9개 + i18n `casino.game.{code}` 계약을 준수한다. 베팅은 **`onPlaceBet` callback만** — Supabase/RPC/정산 직접 호출 금지.

각 게임 폴더: `Stage.tsx` · `HUD.tsx` · `Controls.mobile.tsx` · `Controls.desktop.tsx` · `index.tsx` · `__tests__/*.test.tsx`.

- **공통 레이아웃**: Mobile = Stage(상) + HUD(중) + Controls sticky 하단(thumb-easy). Desktop = `grid-cols-[1fr_360px]` 우측 BetPanel, ultra-wide ≥1920 `[1fr_400px]`. Landscape mobile = 자동 좌/우 split + handedness 엣지.
- **Crash "Aurora Ascension"** — Pixi nebula + glow 곡선, 하단 전폭 72pt CASHOUT(연출 전용), bust=vignette+timeDilation, cashout=shockwave+tier, Presence ghost lines. **원샷 `autoCashout`**.
- **Dice "Probability Meridian"** — liquid bar + 마그네틱, OVER/UNDER 50vw split.
- **Mines "Quantum Grid"** — 5×5 glass+hologram, 셀 ≥56pt, 타일 로컬 누적 → `revealedCells[]` 원샷.
- **Plinko "Cascade"** — matter-js + Pixi alpha trail, DROP long-press 연속, ghost balls.
- **Limbo "Event Horizon"** — 블랙홀 shader + 회전, target LongPressStepper.
- **HiLo "Cardstream"** — 카드 스택, HIGHER/LOWER 50vw split, 5/10/15 연승 tier.

성능: 60fps · INP < 100ms · 10분 auto-bet heap 0 (수동 체크).

---

## 3) 모바일 한손 (Stake/롤빗 패리티 + α)

Thumb-zone primary 하단 35% / read-only 상단 / 드래그 중간. Handedness 좌/우 토글 전 게임 일관. LongPressStepper(80ms threshold, 160→60ms 가속) → **키보드 호출 0회**. Primary ≥72pt 풀폭, secondary ≥56pt, gap ≥8pt. 모든 confirm = `vaul` bottom sheet + swipe-down + safe-area inset. Haptics: chip light · long-tick light · 확정 medium · cashout medium · big heavy · ultra pattern.

## 4) 데스크탑 — 지구 최강

GPU shader 풀 적용, cursor-aware glow trail, hover preview, scroll-wheel stake. **단축키**: `Space` bet/cashout · `1/2/5` quick stake · `Esc` confirm 취소 · `?` 단축키 시트. Crash/Plinko 우측 라이브 베팅 피드(Presence mock) + 미니 차트. Desktop frame p95 < 8ms · INP < 80ms.

---

## 5) Frozen Contract — `ImportedGameSurfaceProps` (변경 0)

필드·콜백·selection 스키마 P1 v3 그대로 유지(원샷 Crash/Mines/Plinko 포함). PF는 표시·`verifyRound` 검증 UI만. 금액 string 강제. 모든 게임은 props/callback only — RPC 호출 X.

정의: `apps/web/src/components/games/shared/types.ts` · `docs/GAMES-INTEGRATION.md`

---

## 6) 셸 · 보조 페이지 · RG · PWA/SEO

- TopBar/BottomNav 5탭, AccountSheet(잔액·사운드/햅틱·테마·**왼손/오른손**·언어·RG·로그아웃), SiteFooter, 모달-only 로그인.
- 보조 페이지(컴포넌트만): `games-history-page.tsx`(가상스크롤+Replay) · `games-fairness-page.tsx` · `games-tournaments-page.tsx` · `share-round-page.tsx` · `offline-page.tsx`. **라우트 등록은 Cursor**.
- `RGGate` 전역 Provider 승격, `useRGGate(intent)`가 모든 `onSubmitBet` 전 await(모바일 OneHandSheet). 실제 차단은 PHONARA RPC가 담당 — UI 우회 불가.
- 라우트별 `head()` 메타 + OG/Twitter/JSON-LD 컴포넌트 셋(라우트 파일은 Cursor가 작성), `prefers-reduced-motion`/`prefers-contrast`, Radix focus trap, ARIA, axe 0 violation.

---

## 7) i18n (DoD 필수)

`src/i18n/catalog.ts`에 키·ko·en 동시 export. 컴포넌트는 `t('key')`만, **JSX 하드코딩 한국어 금지**. 데모/시뮬/테스트 라벨 제거(Cursor `check:release` 통과 전제). Cursor가 `packages/i18n`으로 이식.

---

## 8) QA 2층 구조

### 8.1 Lovable `bun qa` (UI 계약 서브셋)

```
"lint": "eslint src/games src/components --max-warnings 0",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"e2e": "playwright test",
"qa": "bun lint && bun typecheck && bun test && bun e2e"
```

- ESLint 강화 범위: `src/games/**` + `presentation-import/**` (모노레포 strict는 2차). `no-restricted-imports`로 `src/games/**`에서 `@supabase/*` · `engine/ports` · `rpc_*` 금지. 금액 `parseFloat` 경고.
- Vitest: 게임 컴포넌트 props 계약, reduced-motion 분기, 공통 훅(`useGameLoop`/`useSound`/`useHaptics`/`useAutoBetQueue`/`useThumbZone`/`useHandedness`).
- Playwright 3 프로파일: Desktop Chrome 1440×900, iPhone 14 Pro 390×844, Pixel 7 412×915. `@axe-core/playwright` 게임별 0 violation. 모바일 primary CTA bbox 하단 35% 내부 검증, 키보드 미호출(focus 스파이). 데스크탑 단축키 검증.
- `useMockPipeline.ts`: **`import.meta.env.DEV` 게이트**, 정산 경로 진입 금지.

### 8.2 PHONARA P1 완료 게이트 (Cursor)

```
bun run check       # i18n + release + build + typecheck + lint + unit
bun run test:e2e    # casino.spec(실 Supabase·원장·PF) + RG + quality + 신규 games/*.spec
```

**P1 완료 = 8.1 + 8.2 모두 green**. `bun qa` 단독으론 완료 선언 X.

### 8.3 E2E TestID 앵커 (Money E2E 생존)

Controls/BetPanel에 다음 `data-testid` 필수 유지:

`casino-fairness-verifier` · `casino-stake-input` · `casino-client-seed-input` · `casino-prepare-hash` · `casino-place-bet` · `casino-bet-confirm` · `casino-bet-confirm-confirm` · `casino-bet-confirm-cancel` · `casino-error`.

정의: `apps/web/src/features/casino/casino-e2e-testids.ts`

### 8.4 성능 DoD (현실화)

- per-game chunk(`game-crash`, `game-plinko` 등) gzip **≤ 250KB**.
- Lighthouse mobile ≥ 90.
- p95 frame · 10분 heap = CI optional / 수동 체크리스트(1차 release blocker 아님).

---

## 9) PHONARA Paste Map (ZIP export 매핑)

| Lovable 작업 경로 | PHONARA 최종 경로 |
|---|---|
| `src/games/shared/{gfx,feel,presence,celebrate,theme,replay,mobile,visuals,hooks}/**` | `apps/web/src/components/games/shared/{동일}/**` |
| `src/games/{crash,dice,mines,plinko,limbo,hilo}/**` | `apps/web/src/components/games/{동일}/**` |
| `src/components/shell/**` | `apps/web/src/components/shell/**` |
| `src/styles.css` (game/celebrate/thumb 토큰) | `apps/web/src/presentation-import/styles/lovable-globals.css` + `apps/web/src/styles/presentation-import-tokens.css` |
| `src/routes/games.tsx` 등 | `presentation-import/pages/*` (컴포넌트만) |
| `e2e/games/**` | `tests/e2e/games/**` |

import alias `@/` 유지. Cursor가 `react-router-dom`/`use-toast`/`utils` shim 처리.

### 라우트 분업

| 화면 | PHONARA 라우트(Cursor 등록) | Lovable 산출물 |
|---|---|---|
| 카탈로그 | `/games` | `pages/games-catalog-page.tsx` |
| 플레이 | `/casino/{6종}` 정적 | `components/games/{game}/index.tsx` |
| 보조 | `/games/{history,fairness,tournaments}` | `pages/*` |
| 공유/오프라인 | `/share/$roundId` · `/offline` | 페이지 컴포넌트만 |

**Lovable 금지**: 라우트 등록 · `router.ts` · 동적 라우트 파일.

---

## 10) 신규 의존성

런타임: `pixi.js@^8`, `@pixi/filter-*`, `html-to-image` (기존: `matter-js` · `@tanstack/react-virtual` · `vaul` · `framer-motion` · `canvas-confetti`).

Dev: `@playwright/test`, `@axe-core/playwright`, `eslint-plugin-jsx-a11y`, `eslint-plugin-tailwindcss`, `@typescript-eslint/*` strict 셋.

금지: `howler`, 게임 내 Supabase/Cloud.

---

## 11) 산출물 체크리스트 (ZIP)

- [ ] A–G 전체 + 6종 Stage/HUD/Controls.mobile/Controls.desktop/index/__tests__
- [ ] `tests/e2e/games/{6종}.spec.ts` + shell/rg/pwa/a11y 보조 spec (3 프로파일)
- [ ] `src/i18n/catalog.ts` 키 전체
- [ ] `lovable-globals.css` 토큰(`--game-*`, `--celebrate-*`, thumb-zone vars)
- [ ] Presence **mock only**, Replay 10s WebM + fallback
- [ ] `howler` 0건, 게임 폴더 Supabase/Cloud import 0건
- [ ] testid 앵커 9개 DOM 존재
- [ ] `useMockPipeline` DEV 게이트
- [ ] `bun qa` green

---

## 12) 진행 순서 (확정)

1. A–G + QA 스캐폴드(ESLint games scope, Vitest, Playwright 3 profiles, `mobile/` paste zone)
2. **Crash 완성 → 1차 체크포인트**
3. Plinko → Mines → Limbo → HiLo → Dice (게임마다 unit+e2e 동시)
4. 셸(handedness, AccountSheet, TopBar/BottomNav)
5. 보조 페이지(history/fairness/tournaments/share/offline 컴포넌트)
6. RG Provider(UI) + i18n sweep
7. PWA/SEO(head/canonical/OG 컴포넌트 — 라우트는 Cursor)
8. F-1 qa green → Cursor F-2 check + money E2E green → **P1 완료**

### 1차 체크포인트 제출물 (Crash 직후)

1. Crash Stage/HUD/Controls.mobile/desktop 스크린(portrait + desktop)
2. `ImportedGameSurfaceProps` 콜백 와이어링 다이어그램(버튼→callback)
3. Crash vitest + `tests/e2e/games/crash.spec.ts` green 로그
4. testid 9개 DOM 존재 스크린/스냅샷
5. i18n catalog의 Crash 키 목록
6. `game-crash` chunk gzip 크기

위 6개 green 확인 후 나머지 5종 진행.

---

## 13) DoD

0. **전역 UI/UX** — 엔진 제외 **모든 페이지·탭·셸·폰트**가 Lovable 프리뷰와 시각적으로 동일. **구 PHONARA UI 잔재 0**(한 톨도 없음)
0b. **엔진 무수정** — §15 경로 **diff 0**. 마이그레이션·RPC·hook·domain 변경 없음
1. 6종 모바일 한손 단독 완결, 키보드 호출 0, primary CTA 100% thumb-easy
2. 데스크탑 단축키(Space/1/2/5/Esc/?) 전 게임 동작
3. 6단계 Celebration, ultra ≤3s + swipe dismiss
4. Replay 10s WebM export 검증
5. Presence mock ghost 렌더
6. 3 테마 전 게임 스왑
7. RG 전역, 모든 BetPanel 경유
8. PWA 설치 + 프리뷰 가드, Lighthouse mobile ≥90, per-game chunk ≤250KB gz
9. testid 앵커 9개 유지, money E2E green
10. i18n catalog 전수, 하드코딩 한국어 0건
11. `bun qa` green + Cursor `bun run check` + `bun run test:e2e` green

**규칙 0건 위반, 부록 A–K 동등 강제. lovable 천장 + PHONARA 1:1 흡수.**

---

## 14) 구 UI 전량 삭제 (잔재 0 — ZIP 이식 완료 시 Cursor)

기존 PHONARA 사용자-facing UI는 **구닥다리**. Lovable 교체 후 아래는 **한 톨도 남기지 않고 삭제**한다. (엔진·hooks·domain·RPC 파일은 유지)

```
apps/web/src/components/app-shell.tsx
apps/web/src/components/auth-shell.tsx
apps/web/src/components/landing-page.tsx
apps/web/src/components/daily-claim-card.tsx · roulette-card.tsx · missions-card.tsx
apps/web/src/features/earn/earn-surface.tsx (시각만 — hook 유지)
apps/web/src/features/trading/*-panel.tsx (시각만)
routes/casino.tsx 내 @phonara/ui · Rocket/Mines/Dice 등 구 게임 시각 (→ 어댑터 ~30줄만)
@phonara/ui 카지노 게임 위젯 사용처 전부
PresentationImportPlaceholder 가 남은 구 route 시각 (Lovable 페이지로 교체 후 placeholder 삭제)
```

**금지:** 구 UI와 Lovable UI **공존** · 구 CSS class를 Lovable 컴포넌트에 **혼합** · `theme.css`로 Lovable 토큰 **덮어쓰기**

---

## 15) 엔진 절대 무수정 목록 (read-only — Lovable/Cursor 공통)

> **UI/UX 이식·P1·Lovable ZIP 작업 중 아래 경로는 절대 수정하지 않는다.**  
> 예외 없음. 사용자 명시 승인 + 별도 엔진 태스크가 아니면 **한 줄도 변경 금지**.

```
packages/game-engine/**
packages/money/**
packages/trading-engine/**
packages/wallet-ledger/**
supabase/**                    # migrations · RPC · RLS · tests 포함
apps/web/src/domain/**
apps/web/src/lib/rpc.ts
apps/web/src/lib/auth.ts
apps/web/src/lib/supabase.ts
apps/web/src/contexts/auth-context.tsx
apps/web/src/features/casino/use-casino-round.ts
apps/web/src/features/casino/game-config.ts
apps/web/src/hooks/use-wallet.ts
apps/web/src/hooks/use-trading.ts
apps/web/src/hooks/use-profile.ts
apps/web/src/hooks/use-money.ts
```

**금지 예시:** UI 편의를 위한 RPC 추가 · selection 스키마 변경 · 클라 정산 · hook 내부 로직 수정 · conservation/RLS 완화 · `game_code` ENUM 추가

**허용:** `routes/*.tsx` 어댑터에서 hook **호출** · `mapGameSurfaceProps`로 props **매핑** · `presentation-import/**` · `components/games/**` · `components/shell/**` · i18n 키 **추가**

---

## Cursor — 단일 ZIP 수령 후 (일괄 이식 플레이북)

> **전제:** ZIP에 P1 전면 UI가 **100% 포함**. 엔진 레이어는 touch 0. 구 PHONARA UI는 이식 완료 시 **잔재 0**.

### 0) ZIP 수신 체크 (Lovable → Cursor 인계 전)

ZIP에 포함되어야 함 (paste map §9):

- [ ] `src/games/shared/{gfx,feel,presence,celebrate,theme,replay,mobile,visuals,hooks}/**`
- [ ] `src/games/{crash,dice,mines,plinko,limbo,hilo}/**` (각 Stage/HUD/Controls.mobile/desktop/index)
- [ ] `src/components/{ui,shell,earn,trade,fomo,welcome}/**`
- [ ] `presentation-import` 대응 페이지 컴포넌트 (Earn·Home·Landing·Wallet·Auth·Trade·Games catalog·History·Fairness·Tournaments·Share·Offline·RG·More·Account·Settings·Legal 등)
- [ ] `lovable-globals.css` (또는 `src/styles.css` 게임/celebrate/thumb 토큰)
- [ ] `src/i18n/catalog.ts` (키·ko·en)
- [ ] (권장) `tests/e2e/games/*.spec.ts`, 게임 `__tests__/**`

ZIP에서 **제외** (Cursor만 작성):

- [ ] `src/routes/**` 라우트 등록 파일 (`casino.crash.tsx` 등 Lovable 프리뷰용)
- [ ] `router.ts` / `routeTree.gen.ts`
- [ ] Supabase · Lovable Cloud · engine/ports

### 1) 일괄 paste (restyle 0)

`apps/web/PRESENTATION_IMPORT.md` · §9 paste map 경로에 **한 번에** 붙여넣기. `theme.css` 병합 금지.

### 2) 어댑터 연결 (얇게)

- `routes/*.tsx` — hook 호출 + `Imported*` 페이지 / `GameSurfaceLoader` / `CasinoLovableSurface`
- `mapGameSurfaceProps` · `useCasinoPageController` — 이미 있음, 연결만
- `src/i18n/catalog.ts` → `packages/i18n` 키 **추가만** (기존 키 삭제/의미변경 금지)
- `router.ts` — 보조·share·offline 등 미등록 라우트 등록
- `VITE_LOVABLE_CASINO_SURFACE=true`

### 3) 구 UI 전량 삭제 (§14)

`app-shell` · 구 `landing-page` · casino 구 시각(690줄) · `@phonara/ui` 카지노 위젯 · `PresentationImportPlaceholder` · 구 route JSX — **한 톨도 남기지 않음**.

### 4) 게이트 (P1 완료)

```
bun run check
bun run test:e2e    # casino.spec(money/PF) + games/*.spec + quality + RG
```

엔진 경로 `git diff` = 0 확인.

### 5) (선택) 체크포인트 산출물

`docs/checkpoints/{crash,dice,...}/` — ZIP에 Lovable이 이미 넣었으면 보관만; 없으면 Cursor가 이식 후 생성.

---

## Cursor ZIP 수령 후 (요약)

1. Paste map 일괄 paste · restyle 0  
2. 어댑터 + i18n + router  
3. 구 UI 삭제 · `VITE_LOVABLE_CASINO_SURFACE=true`  
4. `bun run check` + full E2E green · **엔진 diff 0**
