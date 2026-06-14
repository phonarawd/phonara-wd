# PHONARA Lovable 이식 — 지구끝판왕 인계문 (새 채팅용)

> **새 Cursor 채팅:** **최신 세션 맥락** → [`docs/CHAT_HANDOFF_2026-06-14.md`](CHAT_HANDOFF_2026-06-14.md) (10게임 엔진·게이트·Lovable ZIP-1 v2 · **여기부터 이어가기**).  
> **작업 이력 (수정 내역):** [`docs/WORK_LOG_2026-06-14.md`](WORK_LOG_2026-06-14.md).  
> 정적 인계 베이스는 이 파일(`LOVABLE_HANDOFF.md`) + `LOVABLE_P1_FINAL_PHONARA.md`.

**관련 문서:** `docs/CHAT_HANDOFF_2026-06-14.md` · `docs/LOVABLE_P1_FINAL_PHONARA.md` · `docs/LOVABLE_CRASH_CHECKPOINT.md` · `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md` · `docs/GAMES-INTEGRATION.md` · `docs/ADD_GAME_RUNBOOK.md`

**레포:** `c:\Users\PC\Desktop\phonara-gb`  
**브랜치:** `main` · **HEAD:** `2d2547e` (`feat(casino): add four games, integration factory, and smoke E2E`)  
**이전 커밋:** `e78374f` (흡수 스캐폴드) · `b903c34` (P1 스펙 lock)

---

## 0. 한 줄 미션 (절대 흔들리지 말 것)

**Stake / Rollbit / Binance / Bybit를 압도하는 한국인 타깃 플랫폼.**

- **유입:** 부업·부수입·FOMO (0명 구간에서도 live/busy 체감)
- **퍼널:** Earn → Wallet → Casino → Trade (Earn first, Trade last)
- **기술 분리:** **눈에 보이는 것 100% Lovable** · **돈·RNG·페이아웃·원장·인증 = PHONARA 엔진 (절대 무수정)**

**엔진 절대 무수정:** Lovable/UI 이식 작업 중 엔진 레이어는 **한 줄도 손대지 않는다.** `packages/*` · `supabase/*` · domain · RPC · hooks · auth — 수정·마이그레이션·리팩터·UI 맞춤 변경 **전부 금지**. UI가 엔진 변경을 요구하면 **구현하지 말고 보고** (§10).

### 전역 흡수 범위 (게임만이 아님 — 절대 흔들리지 말 것)

**현재 PHONARA에 구현되어 있는 엔진만 빼고**, 사용자에게 보이는 **모든 것**은 Lovable 플랫폼에서 만든 UI/UX를 **100% 동일하게** 그대로 이식한다.

| 포함 (Lovable = 시각 소스 오브 트루스) | 제외 (엔진 · read-only) |
|---|---|
| **모든 페이지** — Earn·Home·Landing·Wallet·Login/Signup·Trade·Casino·Games 카탈로그·History·Fairness·Tournaments·Share·Offline·RG·More·Account·Settings·Dashboard·Ledger·Staking·Referral·Legal 등 | `packages/*` · `supabase/*` |
| **모든 탭·네비** — BottomNav 5탭·TopBar·서브탭·AccountSheet 섹션·모달 로그인 | `features/*/use-*.ts` · `hooks/use-wallet.ts` · `use-casino-round.ts` |
| **폰트·타이포·아이콘** — `lovable-globals.css` verbatim, font-family/weight/spacing 그대로 | `contexts/auth-context.tsx` · `lib/rpc.ts` · `domain/**` |
| **셸** — `components/shell/*` · `components/ui/*` (imported) | 원장·정산·RNG·PF 산출·잔액·배당 재계산 |
| **6종 게임 + A–G** — Stage/HUD/Controls·gfx/feel/presence 등 | `@phonara/ui`·구 PHONARA 셸/카지노 위젯 **잔재 금지** (ZIP 후 전량 삭제) |

- **구 UI = 구닥다리:** 기존 PHONARA 사용자-facing UI는 **전부 폐기 대상**. Lovable 이식 후 **한 톨도 남기지 않는다** — `app-shell`·구 `landing-page`·690줄 casino 시각·`@phonara/ui` 게임 위젯·placeholder·구 route JSX **전량 삭제**
- **폰트:** Lovable 지정 폰트를 시스템/`theme.css` 폰트로 **대체하지 않음**
- **탭:** 활성/비활성 스타일·아이콘·라벨·전환 모션 Lovable과 **동일**
- **최고 스펙:** 레포에 설치된 React 19 · Vite 8 · pixi@8 · matter-js · framer-motion · Tailwind v4 · Playwright/axe를 **전면 사용** — 구 PHONARA UI 패턴으로 되돌리지 않음
- **Cursor 역할:** ZIP paste + 어댑터 10~30줄 + props/i18n/testid 연결 + **구 UI 삭제**만 — **재디자인·정규화·개선·구 UI 혼합 금지**

Lovable ZIP 이식 후 Cursor가 할 일: **일괄 paste + 어댑터 연결 + 구 UI 삭제** (게임/페이지 **한 번에**).

### 납품 방식 — 단일 ZIP 일괄 (확정)

- **Lovable:** 전 페이지·전 탭·셸·6종 게임·A–G·보조 화면·i18n catalog를 **전부 완성** → **코드베이스 ZIP 1회** export.
- **Cursor:** ZIP **1회** 수령 → paste map 일괄 이식 → 구 UI **전량 삭제** → 어댑터·i18n·router → 게이트.
- **하지 않음:** 게임/페이지별 분할 ZIP · PHONARA에 부분 paste · 구 UI와 Lovable UI 공존.
- Crash 1차 체크포인트 등은 Lovable **내부 QA**용; Cursor 이식 타이밍은 **최종 ZIP** 기준.

---

## 1. 제품·정책 결정 (이미 문서/규칙 반영됨)

| 결정 | 내용 |
|---|---|
| FOMO / 라이브 피드 | **허용** — 0명 출시 구간에도 scripted feed·카운터·혼잡감 |
| 허위 수익·가짜 마감·근거 없는 실측 숫자 | 프레젠테이션 카피 **제한 안 함** (엔진 경로 mock 데이터는 여전히 금지) |
| Lovable Cloud | **비활성** — OAuth/결제/백엔드 Lovable에 두지 않음 |
| 데모/시뮬 라벨 | Lovable ZIP **출시 전 전부 제거** (`check:release` 통과 필수) |
| i18n | 모든 사용자 문구 `@phonara/i18n` 키 — 한국어는 locale 파일만 |
| Supabase | 프로젝트 **단일 고정** `yocjhjsdwoijfdrehzoq` |

관련 규칙: `.cursor/rules/90-ui-ux-presentation.mdc`, `95-presentation-import-absorption.mdc`, `75-workspace-hygiene.mdc`

---

## 2. 아키텍처 (3층 — 절대 규칙)

```text
┌──────────────────────────────────────────────────────────────┐
│ Lovable ZIP — UI/UX/게임 화면/Canvas/Pixi/사운드/모션       │
│ apps/web/src/components/{ui,shell,earn,trade,fomo,welcome,  │
│   games/**}                                                  │
│ apps/web/src/presentation-import/pages/**                    │
└────────────────────────────┬─────────────────────────────────┘
                             │ props / callbacks ONLY
┌────────────────────────────▼─────────────────────────────────┐
│ Cursor 어댑터 — apps/web/src/routes/*.tsx (얇게)             │
│ auth guard, useWallet, useCasinoRoundPipeline, navigate      │
└────────────────────────────┬─────────────────────────────────┘
                             │ hooks / RPC ONLY
┌────────────────────────────▼─────────────────────────────────┐
│ PHONARA 엔진 — READ-ONLY (Lovable 이식 중 수정 금지)         │
│ packages/{game-engine,money,trading-engine,wallet-ledger}    │
│ supabase/*, features/casino/use-casino-round.ts            │
│ hooks/use-wallet.ts, contexts/auth-context.tsx, lib/rpc.ts  │
└──────────────────────────────────────────────────────────────┘
```

### Lovable이 만들면 **안 되는 것**

- `src/engine/ports/*`, `EngineProvider`, `VITE_ENGINE_MODE`
- 클라이언트 RNG/HMAC 결과 생성 (`useProvablyFair` 결과 산출)
- `rpc_*` / Supabase 직접 호출
- JS `number`로 금액·배수·페이아웃 계산
- `routeTree.gen.ts`, `/auth`, `games.$gameId` 동적 라우트
- Wheel/Keno/슬롯/라이브 **정산** (UI shell만 P2)
- `@phonara/ui` 카지노 위젯 유지/모방

### PF 포맷 (엔진 고정)

```
HMAC-SHA256(key=serverSeed, message=`${clientSeed}:${nonce}:${cursor}`)
```

기본 `nonce=1`. UI는 **표시·검증만** (`verifyRound` from `@phonara/game-engine`).

---

## 3. 현재 진행 상태 (DONE vs TODO)

### ✅ 완료 (레포에 이미 있음)

| 항목 | 위치 |
|---|---|
| 흡수 플랜 v2.1 | `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md` |
| 게임 엔진 계약 | `docs/GAMES-INTEGRATION.md` |
| 일반 이식 가이드 | `apps/web/PRESENTATION_IMPORT.md` |
| `presentation-import/` 페이지 placeholder | `apps/web/src/presentation-import/pages/*` |
| 얇은 라우트 어댑터 | `/`, `/home`, `/earn`, `/trade`, `/account`, `/settings`, `/referral`, `/about`, `/terms`, `/privacy`, `/games` |
| 게임 props 타입 | `apps/web/src/components/games/shared/types.ts` |
| Vite alias `@/`, `react-router-dom` shim | `apps/web/vite.config.ts`, `shims/react-router-dom.tsx` |
| shadcn/Lovable 스택 선설치 | `apps/web/package.json` (framer-motion, Radix, vaul, cmdk, …) |
| React Compiler | `vite.config.ts` babel plugin |
| `PresentationRoot` + tokens | `presentation-import/presentation-root.tsx`, `styles/presentation-import-tokens.css` |
| 중복 `presentation/` 폴더 | **삭제됨** (CSS → `presentation-import/styles/presentation.css`) |
| workspace hygiene | `.cursor/rules/75-workspace-hygiene.mdc`, `bun run clean` |
| 카지노 엔진 6종 + RPC + PF | `packages/game-engine`, `supabase`, `use-casino-round.ts` |
| RG | `/responsible-gaming` + DB 가드 |

### ⏳ 미완 (다음 작업 — ZIP-1)

| 우선순위 | 작업 |
|---|---|
| **P0** | Lovable **ZIP-1** 대기 → **4종 풀 UI** (`mint_reels`, `gold_rush`, `roulette`, `blackjack`) + `/games` **카탈로그 10카드** paste |
| **P0** | 기존 6종 (`crash`…`hilo`) **1px freeze** — ZIP-1에서 건드리지 않음 |
| **P0** | `routes/casino.tsx` (**690줄**) → 어댑터 축소 + `<Imported*Game {...props} />` |
| **P0** | `pixi.js@8`, `matter-js`, `@tanstack/react-virtual` — ZIP에 import 있으면 `apps/web`에 추가 |
| **P1** | Earn/Home/Landing/Wallet/Auth/Trade Lovable 페이지 실제 UI 교체 |
| **P1** | `games-history`, `games-fairness`, `games-tournaments` 라우트 어댑터 추가 |
| **P1** | Earn 액션 → `useWallet` 실 RPC 연결 |
| **P2** | 슬롯/라이브 UI shell, 인터랙티브 Crash/Mines (엔진 PR 후) |
| **P3** | 신규 `game_code`, Storybook, ja/zh-CN i18n |

### ⚠️ placeholder 상태 (Lovable ZIP-1 붙여넣기 전)

모든 `presentation-import/pages/*-page.tsx`는 `PresentationImportPlaceholder` 표시 중.  
`components/games/*/imported-*-game.tsx` **10종 전부** placeholder (기존 6종 + 신규 4종).

---

## 4. 라우트 전체 맵

### TanStack Router — `apps/web/src/router.ts` (수동 등록, `routeTree.gen.ts` 없음)

| URL | 파일 | 상태 |
|---|---|---|
| `/` | `routes/index.tsx` | 어댑터 ✅ · landing placeholder |
| `/home` | `routes/home.tsx` | 어댑터 ✅ · placeholder |
| `/earn` | `routes/earn.tsx` | 어댑터 ✅ · placeholder |
| `/trade` | `routes/trade.tsx` | 어댑터 ✅ · placeholder |
| `/games` | `routes/games.tsx` | 어댑터 ✅ · catalog placeholder |
| `/account` | `routes/account.tsx` | 어댑터 ✅ · placeholder |
| `/settings` | `routes/settings.tsx` | 어댑터 ✅ · placeholder |
| `/referral` | `routes/referral.tsx` | 어댑터 ✅ · placeholder |
| `/about` | `routes/about.tsx` | 어댑터 ✅ · placeholder |
| `/terms` | `routes/terms.tsx` | 어댑터 ✅ · placeholder |
| `/privacy` | `routes/privacy.tsx` | 어댑터 ✅ · placeholder |
| `/login` | `routes/login.tsx` | **구 PHONARA UI** |
| `/signup` | `routes/signup.tsx` | **구 PHONARA UI** |
| `/reset-password` | `routes/reset-password.tsx` | **구 PHONARA UI** |
| `/dashboard` | `routes/dashboard.tsx` | **구 PHONARA UI** + `useWallet` |
| `/wallet` | `routes/wallet.tsx` | **구 PHONARA UI** + 엔진 |
| `/ledger` | `routes/ledger.tsx` | **구 PHONARA UI** |
| `/staking` | `routes/staking.tsx` | **구 PHONARA UI** |
| `/more` | `routes/more.tsx` | **구 PHONARA UI** |
| `/responsible-gaming` | `routes/responsible-gaming.tsx` | **구 PHONARA UI** + RG RPC |
| `/casino` | `routes/casino.tsx` | **690줄 구 UI** + `useCasinoRoundPipeline` |
| `/casino/crash` … `/hilo` | `routes/casino.tsx` | 동일 |
| `/casino/fairness` | `routes/casino.tsx` | FairnessDocsPage |

인증 URL: `/login`, `/signup` (Lovable의 `/auth` 아님).

---

## 5. Lovable ZIP → PHONARA 붙여넣기 경로 (§6 v2.1)

```text
src/components/{ui,shell,earn,trade,fomo,welcome}/*
  → apps/web/src/components/{ui,shell,earn,trade,fomo,welcome}/

src/games/shared/*
  → apps/web/src/components/games/shared/
src/games/shared/hooks/*
  → apps/web/src/components/games/shared/hooks/
src/games/{crash,dice,mines,plinko,limbo,hilo}/*
  → apps/web/src/components/games/{game}/

src/routes/games.tsx
  → presentation-import/pages/games-catalog-page.tsx  (export ImportedGamesCatalogPage)
src/routes/games.history.tsx
  → presentation-import/pages/games-history-page.tsx
src/routes/games.fairness.tsx
  → presentation-import/pages/games-fairness-page.tsx
src/routes/games.tournaments.tsx
  → presentation-import/pages/games-tournaments-page.tsx

src/routes/{home,earn,landing,account,...} 페이지 본문
  → presentation-import/pages/*-page.tsx  (export Imported*Page 이름 유지)
```

### Import 호환 (수정 불필요)

| Lovable | PHONARA |
|---|---|
| `@/components/...` | `apps/web/src/components/...` |
| `@/lib/utils` | `apps/web/src/lib/utils.ts` |
| `@/lib/motion` | `apps/web/src/lib/motion.ts` |
| `@/hooks/use-toast` | sonner shim |
| `react-router-dom` | `shims/react-router-dom.tsx` → TanStack Router |

---

## 6. 카지노 엔진 계약 (Lovable 게임 UI 필수)

### game_code (DB ENUM — 10종)

`crash | limbo | dice | mines | hilo | plinko | mint_reels | gold_rush | roulette | blackjack`

**Earn `rpc_spin_roulette` ≠ 카지노 `roulette`** — 코드·RPC·i18n·metrics 혼용 금지.

### 통화

`PHON` (플랫폼 토큰, 기본) | `USDT` — 금액 **항상 string** (`"10.000000"`)

### RPC 순서 (어댑터만 호출, 게임 컴포넌트 금지)

```
1. rpc_open_game_round({ p_game })
2. rpc_place_game_bet({ p_round_id, p_currency, p_stake, p_selection, p_client_seed, p_idempotency_key })
3. rpc_reveal_game_round({ p_round_id })
4. verifyRound() — 클라 검증 표시
```

훅: `apps/web/src/features/casino/use-casino-round.ts` — **포크/수정 금지**

### 게임별 selection (UI가 조작하는 JSON)

| 게임 | selection | 엔진 모델 주의 |
|---|---|---|
| Crash | `{ autoCashout: "2.00" }` | **원샷** — 베팅 전 목표 설정. Pixi 곡선은 연출. 중간 캐시아웃 버튼=시각만 |
| Dice | `{ target, direction: 'over'\|'under' }` | 원샷 |
| Mines | `{ mineCount, revealedCells: number[] }` | **원샷** — 타일 클릭으로 배열 쌓다가 한 번에 베팅 |
| Plinko | `{ rows: 8\|12\|16, risk }` | Matter.js=연출, 결과=서버 |
| Limbo | `{ target: "2.00" }` | 원샷 |
| Hilo | `{ startCard, guesses: [...] }` | 원샷 |
| mint_reels / gold_rush | `{ lines: 1..20 }` | **turbo UI-only** — RPC selection에 `turbo` 금지 |
| roulette | `{ bets: [{ type, value, stakeWeight }] }` | type union 엔진 고정. **split `value` = lower adjacent pocket (never sum)** — wins if `pocket === value` OR `pocket === value + 1` (예: 1\|2 → `value: 1`) |
| blackjack | `{ actions: [{ seat, move }] }` | 원샷. 기본 `{ actions: [{ seat: 0, move: 'stand' }] }` |

### 게임 컴포넌트 Props

`apps/web/src/components/games/shared/types.ts` → `ImportedGameSurfaceProps`

게임 컴포넌트는 **dumb/presentational** — props/callback만.

---

## 7. `casino.tsx` 어댑터 축소 (P0 ZIP 후 즉시)

**현재:** `apps/web/src/routes/casino.tsx` 690줄 — `@phonara/ui` Rocket/Mines/Dice 등 + `useCasinoRoundPipeline` 혼재.

**목표 패턴:**

```tsx
function CasinoPage({ initialGame }: { initialGame: GameCode }) {
  // auth, wallet, state, useCasinoRoundPipeline — 기존 로직 유지
  return (
    <PresentationRoot>
      <ImportedCrashGame {...gameProps} />  {/* gameCode별 분기 또는 lazy */}
      <ConfirmDialog ... />  {/* money UX — 엔진 확인 유지 */}
    </PresentationRoot>
  );
}
```

- `@phonara/ui` 게임 위젯 import **전부 제거**
- payout/multiplier **서버 `bet.payout`만** 표시
- `GAME_CONFIGS` / `game-config.ts` selection 스키마 유지

---

## 8. Lovable에 보낼 계약 (v2.1 요약)

**한 줄:** Stake급 **60fps 화면만** 만든다. 정산은 PHONARA 서버.

**P0 산출물:**
- `src/games/shared/` — BetPanel, BetHistoryStrip, FairnessSheet, RGGate, hooks
- 6종 게임 Canvas/Pixi
- `src/routes/games.tsx` 카탈로그 → 링크 `/casino/crash` 등 **정적 문자열**
- 데모/시뮬/백엔드연동 라벨 **전부 제거**

전문: `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md`

---

## 9. ZIP 도착 시 Cursor 작업 체크리스트 (순서 고정)

1. **붙여넣기** — §5 경로 그대로, **restyle 금지**
2. **의존성** — ZIP import에 `pixi.js`, `matter-js` 있으면 `apps/web/package.json` 추가 후 `bun install`
3. **export 이름** — `Imported*Page`, `ImportedCrashGame` 등 기존 이름 유지
4. **`casino.tsx` 축소** — §7
5. **구 UI 삭제** — `app-shell.tsx`, `landing-page.tsx`, casino `@phonara/ui` 사용처 등 (엔진 파일 제외)
6. **i18n** — 하드코딩 한국어 → `packages/i18n` 키
7. **게이트:**
   ```bash
   bun run typecheck
   bun --filter @phonara/web build
   bun run check:i18n
   bun run check:release
   bun run clean   # E2E 후 필수
   ```
8. **카지노 E2E** — PF + conservation Σ=0

---

## 10. 엔진 — 절대 무수정 (non-negotiable)

> **Lovable 이식 · P1 · UI/UX 작업 중 엔진은 절대 손대지 않는다.**  
> read-only가 아니라 **no-touch**: 수정·삭제·리팩터·버그픽스·마이그레이션·RPC/RLS·hook 로직 변경 **일체 금지**.  
> UI 통합이 엔진 변경을 요구하면 **중단하고 보고** — 엔진 변경은 **별도 명시 승인·별도 태스크**에서만.

```
packages/game-engine/**
packages/money/**
packages/trading-engine/**
packages/wallet-ledger/**
supabase/**
apps/web/src/domain/**
apps/web/src/features/casino/use-casino-round.ts
apps/web/src/features/casino/game-config.ts
apps/web/src/hooks/use-wallet.ts
apps/web/src/hooks/use-trading.ts
apps/web/src/hooks/use-profile.ts
apps/web/src/hooks/use-money.ts
apps/web/src/lib/rpc.ts
apps/web/src/lib/auth.ts
apps/web/src/lib/supabase.ts
apps/web/src/contexts/auth-context.tsx
```

**UI가 할 수 있는 것:** 위 hook/domain **호출** · RPC 결과 **표시** · `ImportedGameSurfaceProps` **callback 호출** · `mapGameSurfaceProps` **매핑**

**UI가 하면 안 되는 것:** RPC 직접 호출(게임/컴포넌트) · 금액/배당/PnL **재계산** · selection/RNG/PF **변경** · schema/migration **작성**

---

## 11. 삭제·금지 대상 (이식 완료 시 — **잔재 0, 한 톨도 금지**)

> 기존 PHONARA 사용자-facing UI = **구닥다리**. Lovable이 **유일한** 시각 출처. 아래는 ZIP 이식·게이트 green 후 **반드시 삭제**. 구 UI와 Lovable UI **공존 불가**.

```
apps/web/src/components/app-shell.tsx
apps/web/src/components/auth-shell.tsx
apps/web/src/components/landing-page.tsx
apps/web/src/components/daily-claim-card.tsx, roulette-card.tsx, missions-card.tsx
apps/web/src/features/earn/earn-surface.tsx (시각 — hook 아님)
apps/web/src/features/trading/*-panel.tsx (시각)
routes/casino.tsx 내 구 시각 코드 (@phonara/ui Rocket/Mines/Dice 등) — 어댑터 ~30줄만 남김
@phonara/ui 카지노 게임 위젯 사용처 (RocketCrashCanvas, MinesGrid, …)
구 PHONARA route JSX (login/dashboard/wallet/ledger/staking/more/RG 등) — Lovable 페이지로 교체 후 구 JSX 삭제
PresentationImportPlaceholder — 해당 surface Lovable 교체 완료 시 삭제
```

`apps/web/src/presentation/` — **이미 삭제됨**. 재생성 금지.

**금지:** 구 CSS/class를 Lovable 컴포넌트에 혼합 · `theme.css`로 Lovable 토큰 덮어쓰기 · Lovable을 `@phonara/ui`/구 스타일로 되돌리기

---

## 12. 개발 환경·성능

```bash
bun run setup          # 최초 1회: install + packages build + Playwright chromium
bun run dev            # web :3000
bun run clean          # E2E/빌드 후 — Cursor 렉 방지 (필수)
bun run check:release  # demo/test 잔여물 게이트
```

- `.cursorignore` — node_modules, dist, .vite, functions-sql 등 인덱스 제외
- bulk cleanup 후 **Cursor 재시작** 권장

---

## 13. 성능 수용 기준 (게임)

| 지표 | 기준 |
|---|---|
| Desktop frame p95 | < 12ms |
| Mobile frame p95 | < 16.6ms |
| 게임 lazy JS | < 250KB |
| INP | < 100ms |
| DOM/게임 | < 150 |

Canvas/Pixi, React 리렌더 최소, DPR cap 2.0.

---

## 14. 새 채팅 첫 지시 예시 (복붙용)

```
@docs/LOVABLE_HANDOFF.md 기준으로 Lovable P0 ZIP 이식을 이어서 진행해줘.

1) components/games/* + presentation-import/pages/games-catalog-page.tsx 붙여넣기
2) routes/casino.tsx 어댑터 축소 + ImportedGameSurfaceProps 연결
3) check:i18n, check:release, typecheck, build green
4) bun run clean

엔진(supabase, game-engine, use-casino-round) 수정 금지. 시각만 Lovable 그대로.
```

---

## 15. 참고 문서 인덱스

| 문서 | 용도 |
|---|---|
| `docs/LOVABLE_HANDOFF.md` | **이 파일** — 새 채팅 총괄 인계 |
| `docs/LOVABLE_ABSORPTION_PLAN_FINAL.md` | Lovable/Cursor 계약 v2.1 |
| `docs/GAMES-INTEGRATION.md` | RPC·selection·PF 기술 명세 |
| `apps/web/PRESENTATION_IMPORT.md` | 폴더 매핑·스택·워크플로 |
| `.cursor/rules/95-presentation-import-absorption.mdc` | 흡수 정책 |
| `.cursor/rules/75-workspace-hygiene.mdc` | 렉 방지 |

---

*Last updated: 2026-06-14 — PHONARA main @ 3e2796e*
