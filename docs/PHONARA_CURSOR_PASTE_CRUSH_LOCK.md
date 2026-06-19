# 12-Z · 세계 1위 압살 로드맵 v4 (정본)

> **용도:** Lovable **12-Z FINAL GREEN + operator paste GO** 이후 PHONARA Cursor **P0→P7** (12-N~12-T).  
> **벤치:** Binance/Bybit · Stake/Roobet · **토스·해피스크린 게이미피케이션 코어 (광고·만보기 제외)** · Coinbase · Revolut · Strava  
> **선행:** [`LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md`](LOVABLE_ZENITH_PHASE12_PRODUCT_PLAN.md) · [`PRESENTATION_IMPORT.md`](../apps/web/PRESENTATION_IMPORT.md) · [`PHONARA_NORTH_STAR_PLAN.md`](PHONARA_NORTH_STAR_PLAN.md) §10  
> **갱신:** 2026-06-15 · v4 정본 (v3 amend 수렴)

---

## Paste 게이트 (P0 착수 전)

```text
12-H/F2/A/G → 12-Z §GREEN → operator 「ZIP 발행」→ operator paste GO → P0
```

| 조건 | FAIL |
|------|------|
| 12-Z §GREEN 미완 | P0~P7 전부 금지 |
| operator paste GO 없음 | P0 금지 |
| `BootSplash.tsx` · splash 산출물 없음 | P0 defer |

**현재 PHONARA:** `BootSplash` 없음 · `lovable-globals.css` placeholder → **P0 코드 착수 대기**.

---

## 0. 끝판왕 게이트 (Phase 공통 · 누락 시 revert)

### 0-1. 코드 규칙 (Cursor 이식 100%)

- `bg-[#` · `text-white` · `text-black` · `bg-black` · `bg-white` 신규 **0**
- `:root` light 토큰 **0** · `html.dark` 유지
- `oklch(` 리터럴: `lovable-globals.css` (+ `theme.css` @theme) **외 0**
- 한글 하드코딩 **0** (i18n 키만)
- `presentation-import/` engine NO-TOUCH **0** 위반
- 네이밍: `PascalCase.tsx` · `kebab-case.ts` · `use-*.ts` · `*.functions.ts`
- import: `@/` alias만 · `../../` 금지

### 0-2. 품질

- `bunx vitest run` PASS · TS strict · `any` 신규 0
- sitemap **44** 불변
- i18n parity **ko/en/ja/zh** 키 수 동일
- a11y: `aria-label` 100% · 키보드 PASS · WCAG AA (4.5:1 / 3:1)

### 0-3. 성능 (Lighthouse mobile)

- LCP < 2.0s · INP < 200ms · CLS < 0.05
- 신규 route JS < 60KB gzip · 이미지 `loading="lazy"` 100%

### 0-4. 디자인 시스템

- 토큰만: `--primary` · `--accent` · `--surface-*` · `--shadow-*` · `--gradient-*`
- motion: `framer-motion` · easing `[0.22, 1, 0.36, 1]` · 180/240/360/600ms
- breakpoint: **390 / 768 / 1280 / 1920** · mobile-first

### 0-5. 슬라이스 규약

- 1 Phase = **5~9 files** = 1 슬라이스
- 구현 → vitest → grep → Lighthouse → a11y → **1줄 보고**
- FAIL = **해당 Phase만 revert**

### 0-6. LOCK (영구 · v4 신설)

**§10 operator LOCK (Earn):**

```text
FAIL = mission.ad.* · mission.survey.* · rewarded video · offer wall
     · WatchCard · AdCard · 15s 광고 카운트다운 · earn.watchAd · WalkCard/만보기
```

**PWA LOCK:**

```text
OK   = PWA install · manifest · offline.html (11-C 정책)
FAIL = service worker 등록 (SW=0 유지)
FAIL = core Earn이 DeviceMotion · Health API · Pedometer · Background Sensor 의존
```

---

## §GREEN self-check (매 Phase · 복붙)

```bash
cd apps/web
bunx vitest run
test "$(rg -c '<url>' public/sitemap.xml | head -1)" = "44"

# §0-1 color / hardcode
rg "bg-\[#|text-white|text-black|bg-black|bg-white" src/components src/presentation-import src/routes --glob '!**/*.test.*' && exit 1 || true
rg "oklch\(" src/components/shell src/routes/__root.tsx 2>/dev/null | rg -v lovable-globals && exit 1 || true

# §0-6 §10 LOCK (P3+ 항상)
rg -i "WatchCard|AdCard|WalkCard|watchAd|rewarded|offer.?wall|mission\.ad\.|mission\.survey\." src/components/earn src/presentation-import --glob '!**/*.test.*' && exit 1 || true
rg -i "DeviceMotion|HealthKit|health.connect|pedometer|step.counter" src/components/earn src/hooks --glob '!**/*.test.*' && exit 1 || true

# engine NO-TOUCH
git diff --stat packages/money packages/trading-engine packages/game-engine wallet-ledger supabase apps/web/src/features apps/web/src/domain apps/web/src/hooks apps/web/src/lib/rpc.ts
```

---

## PHONARA 경로 어댑터

| Lovable (ZIP) | PHONARA (paste 후) |
|---------------|-------------------|
| `src/components/{casino,trade,earn,home}/*` | `apps/web/src/components/*` |
| `src/routes/imports/Imported*.tsx` | `presentation-import/pages/*-page.tsx` + thin `routes/*.tsx` |
| `presentation-import/styles/lovable-globals.css` | 동일 |
| `src/i18n/*` | `packages/i18n` merge + `@/i18n` shim |
| `*.functions.ts` | `apps/web/src/lib/*` (mock/display · views에서 RPC 직접 호출 금지) |

**NO-TOUCH:** `packages/*` · `supabase/*` · `features/*/use-*.ts` · `domain/**` · `lib/rpc.ts` · UI payout/balance 재계산

---

## P0. 선행 패치 (Cursor 이식 차단 해소)

- **P0-1 Splash 토큰:** `--boot-splash-{bg,fg,accent,glow}` in `lovable-globals.css` · `__root` critical `<style>` · `BootSplash`/`__root` `oklch` → `var(--boot-splash-*)`
- **P0-2 Splash i18n:** `brand.wordmark` · `brand.tagline.*` ko/en/ja/zh · JSX `"PHONARA"` 0

---

## P1. Casino — Stake/Roobet (12-N)

| 무기 | 구현 |
|------|------|
| 실시간 윈 마퀴 | `LiveWinTicker.tsx` |
| 카테고리 탭 | `CasinoCategoryTabs.tsx` (Hot/Originals/Live/Slots/Crash/New) |
| Hot 가로행 | `HotGamesRow.tsx` |
| 게임 카드 | `GameCard.tsx` (hover lift + glow + RTP + 라이브 카운트) |
| 메가윈 히어로 | `BigWinHero.tsx` |
| Provably Fair | `ProvablyFairBadge.tsx` |
| 잭팟 카운트다운 | `JackpotCountdown.tsx` |

→ `ImportedCasinoPage` / `casino-page.tsx` 재조립 · `lib/casino-live-mock.ts` (display mock)

### P1.1 · Casino "Alive" (12-N 보강 · 2 슬라이스)

> 정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_1_LOCK.md)

- **P1.1a Live Layer:** `useLiveCount` · `useLiveTickerFeed` · `casino-feed.ts` · ticker/jackpot/bigwin/GameCard live · i18n 4언어
- **P1.1b Poster Layer:** 10× CDN pointer · GameCard img · HotGamesRow/page wire
- **LOCK:** 광고·센서 0 · mock feed only · hydrate 안전

### P1.2 · Casino Hub 확장 (목록)

> 토너먼트/리더보드 등 `/casino` 목록 보강 — Lovable 슬라이스별 LOCK 문서 참조.

### P1.3 · Game Detail Alive

> 정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_3_LOCK.md)

- `/casino/$game` 공유 4패널 · `casino-game-meta.ts` · `useGameRecentWins`
- **P2 전** 카지노 라인 완결 · Play CTA presentation-only · **P1.3 ✅ GREEN** (2026-06-15)

### P1.4 · ⌘K Smart Search

> 정본: [`PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P1_4_LOCK.md) **v2**

- shell `__root` global · alias i18n · recent localStorage · **P2 직전**

### Route Dedup · `/games` → `/casino`

> 정본: [`PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md`](PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md) **v2 최종 · 17 files**

- redirect-only · utility `/casino/*` · link 일괄 · `src/games/` NO-TOUCH · **✅ GREEN** (2026-06-15)

## P2. Trade — Binance/Bybit (12-O)

> 정본: [`PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md) · **P2a chart + P2b depth**

| 무기 | 구현 |
|------|------|
| 프로 차트 | `TradeChartHero.tsx` (`lightweight-charts` v4 · lazy) |
| L2 오더북 | `OrderbookDepth.tsx` |
| 트레이드 테이프 | `MarketTradesTape.tsx` |
| 포지션·PnL | `PositionPanel.tsx` (display mock) |
| 모바일 시트 | `MobileTradeSheet.tsx` |
| 펀딩/24h | `FundingBadge.tsx` · `Change24hBadge.tsx` |
| 모드 세그먼트 | `TradeModeSegment.tsx` |

→ `ImportedTradePage` 재조립 · `trade-market-mock.ts` · 12-D TradeHub → crush 승격

---

## P3. Earn + Home — 게이미피케이션 코어 (12-P) ※ 광고·센서 0

| 무기 | 구현 |
|------|------|
| 시간제한 퀘스트 | `TurboQuestCard.tsx` — 30분 타이머 + 보상 부스트 |
| 럭키박스/룰렛 | `LuckyBoxCard.tsx` — 3D flip |
| 즉시 출금 한도 UI | `QuickCashCard.tsx` |
| 출석 7일 | `CheckInStrip.tsx` |
| 6레인 미션 | `MissionCard.tsx` — 거래/플레이/추천/예치/랭킹/시즌 |
| Home Bento | `HomeHub.tsx` — 3×3 + hero |

**제외 (§0-6 LOCK):** WatchCard · AdCard · 만보기 · rewarded video · offer wall

→ `ImportedEarnPage` 재조립 · **6 components + HomeHub**

---

## P4. Wallet — Crypto(주력) + KRW only (12-Q)

### 입금 `DepositSheet.tsx`

- **Crypto (default):** 자산 → 네트워크 → 주소 + QR + 최소액/컨펌수 + 복사
- **KRW 계좌이체:** 가상계좌(or 운영계좌 + 입금자명 코드) + 복사

### 출금 `WithdrawSheet.tsx`

- **Crypto:** 자산/네트워크 → 주소(QR) + 즐겨찾기 → 수수료/ETA → 2FA
- **KRW:** 은행 → 계좌 → 예금주 확인 → 한도/수수료 → 2FA

### 공통

`BalanceHero.tsx` · `AssetRow.tsx` · `TxTimeline.tsx` · `DepositMethodSegment.tsx` · `WithdrawMethodSegment.tsx`

**범위:** UI/플로우/검증 · mock `wallet-mock.functions.ts` · 실 체인/은행 = **097 crypto_deposit_*** + wallet adapter wire (별도 엔진 태스크)

→ `ImportedWalletPage` · `ImportedWalletDepositPage` · `ImportedWalletWithdrawPage`

**PG 카드결제:** v4 **전면 제외**

---

## P5. Referral — Revolut (12-R)

`CommissionTree.tsx` · `ShareCardGenerator.tsx` · `ReferralEarningsHero.tsx` · `TopReferrersStrip.tsx` → `ImportedReferralPage`

---

## P6. Ranking — Strava (12-S)

`SeasonHero.tsx` · `Podium.tsx` · `LeaderboardTable.tsx` (virtual · 30s poll) · `StickyMyRank.tsx` · `RankCategoryTabs.tsx` → `ImportedLeaderboardPage`

---

## P7. 12-T Final Polish

랜딩 카피 · route `head()` (leaf og:image) · sitemap/robots · favicon/apple-touch-icon · **manifest-only (SW=0)** · 4-breakpoint 회귀 · Lighthouse **90+** × 4 · `check:full` + E2E

---

## 실행 순서 (8 슬라이스)

```text
Lovable 12-Z → paste GO → P0 → P1(12-N) → P2(12-O) → P3(12-P) → P4(12-Q) → P5(12-R) → P6(12-S) → P7(12-T)
```

| Turn | 1줄 보고 |
|------|----------|
| P0 | `P0 GREEN · splash token+i18n · sitemap 44` |
| P1 | `12-N GREEN · casino 7 · §10 rg 0` |
| P2 | `12-O GREEN · trade 8 · lightweight-charts` |
| P3 | `12-P GREEN · earn 5 + bento · ad/sensor/walk 0` |
| P4 | `12-Q GREEN · crypto+KRW wallet · PG 0` |
| P5 | `12-R GREEN · referral tree + share card` |
| P6 | `12-S GREEN · leaderboard season` |
| P7 | `12-T GREEN · SEO · LH 90+ · check:full` |

---

## v4 변경 이력 (v3 → v4)

- P3 **WatchCard / AdCard 제거** — North Star §10 준수
- **§0-6** §10 LOCK + PWA LOCK 신설
- P3 최종: TurboQuest · LuckyBox · QuickCash · CheckIn · Mission · HomeHub
- P4 Crypto+KRW · PG 제외 · P0/P1/P2/P5/P6/P7 v3 동일

---

*PHONARA_CURSOR_PASTE_CRUSH_LOCK · v4 정본 · 2026-06-15*
