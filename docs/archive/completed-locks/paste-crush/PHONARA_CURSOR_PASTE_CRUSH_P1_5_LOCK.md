# P1.5 · Auto-Bet 압살 + Game Detail Apex — v2 (정본)

> **상위:** [`PHONARA_CURSOR_PASTE_CRUSH_LOCK.md`](PHONARA_CURSOR_PASTE_CRUSH_LOCK.md) P1 · v4 §0·§10  
> **선행:** P1.3 ✅ · P1.4 ✅ · Route Dedup ✅  
> **범위:** Lovable canvas · **A=게임 UI queue** · **B=presentation detail** · 순서 **A→B 고정**  
> **갱신:** 2026-06-15 · **승인** (micro-amend #P1.5-A-1~4 · #P1.5-B-1~6 반영)

---

## 한 슬라이스 · 두 GREEN 게이트

```text
P1.5-A (Auto-Bet 결함) GREEN → P1.5-B (Detail Apex 시각) GREEN
```

**공통:** 60fps · Long Task 0 · framer-motion 신규 import 0 · 신규 npm dep 0

---

# Part A · Auto-Bet 압살 (먼저 · 기능)

## A.0 진단 (as-is)

| 게임 | Manual | Auto Tab | 상태 |
|------|--------|----------|------|
| Crash · Dice · Limbo · Plinko · Mint-Reels · Gold-Rush | ✅ | ✅ | 부분 결함 |
| Mines · HiLo · Roulette · Blackjack | ✅ | ❌ | Auto 없음 |

**부분 결함 5건:**

1. `setAutoActive(true)` race — 첫 fire 전 tab lock 미적용 · Stop 후 잔여 fire
2. `lastWasWin` 동일값 연속 → settle effect 미트리거 (WIN→WIN 멈춤)
3. 단발 게임 commitment 동기 미스 — reveal/추측/스핀 후 settle 전 fire
4. `busy` 게이트 부정확 — commitment alive 중 double fire 가능
5. `scaleStake` Infinity → baseStake 반환만 · error stop 없음

## A.1 수정 매트릭스 (14 implementation · +8 test)

### 코어 (3)

| 파일 | 변경 |
|------|------|
| `src/games/shared/hooks/useAutoBetQueue.ts` | settle → **`bet.version` + `bet.round_id`** (#P1.5-A-2) · Infinity/NaN → `finish("error")` · `firingRef` atomic · `requiresInRoundActions?` |
| `src/games/shared/BetModeTabs.tsx` | `autoActive` = **`AutoBetPanel.onActiveChange`** drill (#P1.5-A-3) · `bet` 변경마다 `version++` |
| `src/games/shared/AutoBetPanel.tsx` | `onActiveChange` prop · Start 시 commitment alive → 첫 fire 허용 |

### 4게임 wiring (4)

| 파일 | `onAutoFire` |
|------|--------------|
| `mines/Controls.shared.tsx` | prepare → auto first cell reveal → submit |
| `hilo/Controls.shared.tsx` | prepare → guess `higher` 1회 → submit |
| `roulette/Controls.shared.tsx` | prepare → repeat last bet → submit |
| `blackjack/Controls.shared.tsx` | prepare → **stand-only** auto (#P1.5-A-4 · i18n warn) |

`autoChildren` slot: Mines reveal count · HiLo direction · Roulette repeat · Blackjack stand warn

### i18n (~12 keys · ko/en)

`casino.auto.mines.revealCount` · `casino.auto.hilo.direction` · `casino.auto.roulette.repeat` · `casino.auto.blackjack.standOnly` · `casino.auto.blackjack.warn` 등

### 테스트 (+8)

| 파일 | 케이스 |
|------|--------|
| `useAutoBetQueue.test.ts` | round_id settle · WIN→WIN 연속 · Infinity error · balance loss |
| `BetModeTabs.test.tsx` | onActiveChange race · lock-from-Start |
| Mines/HiLo/Roulette/Blackjack contract ×4 | Start → fire1 → settle → fire2 → Stop |

## A.2 컴플라이언스 (#P1.5-A-1)

| OK | FAIL |
|----|------|
| UI wrapper prepare→submit | `packages/game-engine` reducer/result |
| RG `gate("place_bet")` Start 1회 | per-fire confirm |
| A8: Auto active → stake/selection/currency/tab disabled | — |
| fire 직전 balance check → `finish("loss")` | — |

**범위 예외:** `src/games/shared/*` + 4 Controls — **games UI queue only** · presentation-import · Supabase · `features/*/use-*.ts` **NO-TOUCH**

## A.3 §GREEN-A

```bash
rg "BetModeTabs" src/games --glob '*.tsx' | wc -l   # expect 10 game Controls hit
rg "packages/game-engine" src/games/shared/hooks/useAutoBetQueue.ts && exit 1 || true
bunx vitest run src/games/shared/hooks/__tests__/useAutoBetQueue.test.ts src/games/shared/__tests__/BetModeTabs.test.tsx
bunx vitest run 2>&1 | tail -3   # Step 0 baseline + 8
```

## A.4 스모크 (90s · 10게임)

1. Auto 탭 전 게임 visible  
2. Start → 1차 fire 즉시 · tab/stake/currency lock  
3. Settle ~320ms → 2차 fire  
4. WIN×5 연속 진행  
5. Stop → in-flight 1회 후 종료  
6. count=10 정확 stop · stopOnProfit/Loss · balance 0 loss stop  

## A.5 마감

```text
P1.5-A GREEN · 10/10 AutoBet · settle by round_id · A8 atomic lock · vitest +8
```

**FAIL =** BetModeTabs <10게임 · WIN→WIN 멈춤 재현 · packages/game-engine diff · vitest count mismatch

---

# Part B · Game Detail Apex (A GREEN 후 · 시각)

## B.0 원칙

**렉 0 · 60fps · GPU-only** · `useInView(200px)` + `usePageVisible` · lazy rail TTI 우선

## B.1 구조

```text
HERO STAGE → ENGINE slot + sticky rail (LiveWin / HotMult / TopWin24h)
→ STATS · HOW TO PLAY · FAIRNESS · PAIRED RAIL
```

Mobile: rail scroll-snap · Hero 축소

## B.2 부드러움 LOCK

- GPU: `transform` · `opacity` · `filter` only · layout anim 0
- `contain: layout paint style` · `content-visibility: auto`
- lazy rail `React.lazy` + `IntersectionMount`
- `React.memo` · props primitive
- keyframe **1개**: `slide-down-fade` · framer-motion 0
- Hero poster eager · blur = same src CSS filter
- `prefers-reduced-motion` → final only
- **`accentHex` → `--game-accent` CSS var only** (#P1.5-B-1)

## B.3 파일 (15 impl · +4 test · −3 delete)

**CREATE/REWRITE:** `GameDetailFrame` · `GameHeroStage` · `LiveWinTheater` · `HotMultiplierStrip` · `TopWin24hCard` · `HowToPlayCard` · `FairnessCard` · `PairedGamesRail` · `GameStatsStrip` · `IntersectionMount`

**DELETE (#P1.5-B-2):** `GameHeroPanel` · `RecentWinsPanel` · `PairedGamesPanel` · **reuse `useGameRecentWins`**

**EDIT:** `casino-game-meta.ts` · `useHotMultipliers.ts` · `ko.ts`/`en.ts` ~35 keys (#P1.5-B-5 ja/zh defer) · `styles.css`

**Tests:** GameHeroStage · LiveWinTheater · useHotMultipliers · casino-game-meta

**라우트 10개:** EDIT 0

## B.4 타이머 (#P1.5-B-4)

LiveWin 5500ms · HotMult 6000±jitter · CountUp RAF ≤900ms · tilt rAF → `--tilt-x/y` only (#P1.5-B-6) · **≤4 concurrent**

## B.5 측정 FAIL

Long Task >50ms · Lighthouse mobile <92 · CLS >0 · tab hidden CPU 미평탄 · hex in className

## B.6 §GREEN-B

```bash
rg -i "WatchCard|AdCard|mission\.ad" src/components/casino/detail && exit 1 || true
rg "[가-힣]" src/components/casino/detail src/data/casino-game-meta.ts --glob '!**/*.test.*' && exit 1 || true
rg "bg-\[#|text-white|text-black|oklch\(" src/components/casino/detail && exit 1 || true
rg "framer-motion|GameHeroPanel|RecentWinsPanel|PairedGamesPanel" src && exit 1 || true
bunx vitest run src/components/casino/detail/__tests__ src/hooks/__tests__/useHotMultipliers.test.ts src/data/__tests__/casino-game-meta.test.ts
bunx vitest run 2>&1 | tail -3
```

## B.7 마감

```text
P1.5-B GREEN · Hero Stage · Sticky Rail · Live Theater · 60fps LOCK · Long Task 0 · vitest +4
```

---

## vitest 카운트 (#P1.5-A-5)

**Step 0 실측 baseline 필수** (Route Dedup 후 **366** 또는 Lovable **365** — 회신에 숫자 명시)

| 게이트 | Δ | 예시 (baseline 366) |
|--------|---|---------------------|
| P1.5-A | +8 | **374** |
| P1.5-B | +4 | **378** |

365→373→377 은 Lovable baseline 365일 때 valid. **FAIL = Step 0 미기록**

---

## LOCK Footer

| ID | 규칙 |
|----|------|
| P1.5-A-1 | game-engine reducer/result 0-touch · UI queue only |
| P1.5-A-2 | settle = `version` + `round_id` |
| P1.5-A-3 | tab lock from `onActiveChange` Start |
| P1.5-A-4 | Blackjack auto = stand-only + i18n warn |
| P1.5-A-5 | vitest Step 0 baseline recorded |
| P1.5-B-1 | accentHex → CSS var only |
| P1.5-B-2 | delete P1.3 panels · reuse useGameRecentWins |
| P1.5-B-4 | timer ≤4 |
| P1.5-B-5 | ko/en only · ja/zh defer |
| P1.5-B-6 | tilt CSS vars · setState/frame 0 |

---

## EXECUTE 순서

```text
Step 0  — vitest baseline + BetModeTabs 6/10 audit
Step 1  — A: useAutoBetQueue + BetModeTabs + AutoBetPanel
Step 2  — A: 4 Controls wiring + i18n
Step 3  — A: tests +8 · §GREEN-A · P1.5-A GREEN 보고
Step 4  — B: styles + meta + hooks
Step 5  — B: Hero + Frame + lazy rail
Step 6  — B: bottom row + delete P1.3 panels
Step 7  — B: i18n + tests +4 · §GREEN-B · P1.5-B GREEN 보고
```

---

## PHONARA paste 어댑터

| Lovable | PHONARA |
|---------|---------|
| `src/games/shared/*` | `apps/web/src/games/shared/` (paste 후) |
| `components/casino/detail/*` | `apps/web/src/components/casino/detail/` |

**PHONARA repo 현재:** Auto-Bet · Detail Apex 소스 **미존재** → **Lovable EXECUTE 전용**

---

*P1.5 v2 정본 · Auto-Bet + Apex · 2026-06-15*
