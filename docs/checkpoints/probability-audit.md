# PHONARA · 카지노 10게임 확률·페이아웃 감사 (Probability Audit)

> **갱신:** 2026-06-17 · **L1-16m Part 1** · 코드 변경 **0** · 감사 산출물만  
> **정산 SOT:** `packages/game-engine` (paste/L2 후 RPC와 parity)  
> **Canvas 표시:** Lovable `src/games/*` — 엔진과 동일 수식 유지 필수

---

## 0. 요약

| 항목 | 판정 |
|------|------|
| Mines 3 mines · 22/22 picks · **2,277.00×** | **PASS** — Stake 1% house edge 모델과 일치 |
| 10게임 엣지 | 명시 `×0.99` / `99/p` / 테이블 RTP ~99% / 유럽 룰렛 36/37 |
| 회귀 | vitest **572/572** carry · 페이아웃/엣지 테스트 green |

---

## 1. Mines — 22/22 · 2,277.00× 검증

### 1.1 Operator 사례 (2026-06-17 스크린샷)

```
mines = 3, picks = 22, safe tiles = 25 − 3 = 22
```

연속 안전 타일 `k`번째 reveal 시 odds step:

\[
\text{step}_k = \frac{25-k}{22-k}, \quad k = 0 \ldots 21
\]

\[
m_{\text{raw}} = \prod_{k=0}^{21} \frac{25-k}{22-k}
  = \frac{25 \cdot 24 \cdot 23}{3 \cdot 2 \cdot 1} = \binom{25}{3} = 2300
\]

1% house edge:

\[
m = \left\lfloor m_{\text{raw}} \times 99 \right\rfloor / 100 = \left\lfloor 2300 \times 99 \right\rfloor / 100 = 2277.00
\]

**결론:** 22타일 전체 클리어 페이아웃 **2,277.00×** 정확. 이론 승률 ≈ 1/2300, RTP ≈ 99%.

### 1.2 구현 위치

| 레이어 | 파일 | 함수 | 엣지 |
|--------|------|------|------|
| **Engine (SOT)** | `packages/game-engine/src/games/mines.ts` | `minesMultiplier(mineCount, revealCount)` | `Math.floor(mult * 99) / 100` |
| Canvas (Lovable) | `src/games/mines/multiplier.ts` | 동일 공식 mirror | `× 0.99` (display) |

```29:38:packages/game-engine/src/games/mines.ts
export function minesMultiplier(mineCount: number, revealCount: number): number {
  if (revealCount <= 0) return 1;
  let mult = 1;
  for (let k = 0; k < revealCount; k++) {
    const safe = GRID_SIZE - mineCount - k;
    const total = GRID_SIZE - k;
    if (safe <= 0 || total <= 0) break;
    mult *= total / safe;
  }
  return Math.floor(mult * 99) / 100;
}
```

### 1.3 테스트

| 파일 | 내용 |
|------|------|
| `packages/game-engine/src/games/games.test.ts` | duplicate cell 거부 · schema |
| `packages/game-engine/src/casino-parity.test.ts` | mine position parity vectors |
| `packages/game-engine/src/lib/rtp-harness.test.ts` | Monte Carlo RTP (mines default selection) |

---

## 2. 10게임 매핑표

| # | 게임 | 페이아웃 / 확률 공식 | 1% 엣지 적용 | Engine 파일 | 테스트 |
|---|------|---------------------|--------------|-------------|--------|
| 1 | **Mines** | `Π (total/safe)` per reveal → `floor(raw×99)/100` | 명시 ×99/100 | `games/mines.ts` · `minesMultiplier` | `games.test.ts` · `casino-parity.test.ts` · `rtp-harness.test.ts` |
| 2 | **Crash** | `crash = max(1, floor(99/(1−f))/100)` · cashout at `autoCashout` | `99/(1−f)` 분포 → instant **1.00×** bust 비율 ~1% | `games/crash.ts` · `crashFromFloat` | `games.test.ts` · `fairness.test.ts` · `casino-parity.test.ts` |
| 3 | **Limbo** | result `limboFromFloat(f)` (Crash 동형) · win → payout = **target** | 분포에 99/(1−f) 내재 · target 승률 ≈ 1/target (edge) | `games/limbo.ts` · `limboFromFloat` | `fairness.test.ts` · `casino-parity.test.ts` |
| 4 | **Dice** | `mult = floor(99 / winProb) / 100` | 명시 99/p | `games/dice.ts` · `diceMultiplier` · `diceWinProbability` | `casino-parity.test.ts` · `fairness.test.ts` |
| 5 | **Plinko** | bucket table lookup · `P(bucket)=C(n,k)/2^n` | 테이블 **~99% RTP** calibrated | `games/plinko.ts` · `PAYOUT_TABLES` · `plinkoRtp` | `games.test.ts` (exact RTP · MC · legacy +EV regression) |
| 6 | **Hi-Lo** | per step `floor(99/p)/100` · cumulative product | 명시 99/p per guess | `games/hilo.ts` · `hiloMultiplier` | `games.test.ts` (max 10 guesses) · `casino-parity.test.ts` |
| 7 | **Blackjack** | `handPayoutMultiplier` — BJ 2.5× · win 2×/4× double · push 1×/2× | 룰 기반 (~0.5% S17 표준; engine는 고정 payout table) | `games/blackjack.ts` · `handPayoutMultiplier` · `playBlackjack` | `blackjack.test.ts` · conservation settle |
| 8 | **Roulette** | European · leg mult `ROULETTE_LEG_MAX_MULT` (straight 36× …) | **theoreticalRtp = 36/37 ≈ 97.30%** (single-zero) | `games/roulette.ts` · `evaluateRoulette` | `roulette.test.ts` · `theoreticalRtp()` |
| 9 | **Mint Reels** | `spinSlot` → line wins → `totalMult/activeLines` | paytable + reel strips → **~RTP harness** | `games/mint-reels.ts` · `lib/slot-engine.ts` | `mint-reels.test.ts` · `rtp-harness.test.ts` |
| 10 | **Gold Rush** | Mint Reels 동형 · 별도 paytable/reels | 동일 slot engine | `games/gold-rush.ts` | `gold-rush.test.ts` · `rtp-harness.test.ts` |

---

## 3. 게임별 상세

### 3.1 Crash

**Engine:**

```17:20:packages/game-engine/src/games/crash.ts
export function crashFromFloat(f: number): number {
  if (f >= 1) return 1;
  const raw = Math.floor(99 / (1 - f)) / 100;
  return Math.max(1, raw);
}
```

- `f ≥ 1` → crash **1.00×** (instant bust) — house edge mass.
- Canvas `src/games/crash/curve.ts`의 `m(t)=exp(0.85t)`는 **라이브 곡선 애니메이션**용; 정산·PF 검증은 `crashFromFloat` SOT.

### 3.2 Dice / Limbo

- **Dice:** `payout = floor(99 / winChance) / 100` where winChance = discrete roll probability on [0.00, 99.99].
- **Limbo:** win if `resultMultiplier ≥ target`; payout = target. Edge는 `limboFromFloat` heavy-tail 분포에 내재 (Crash 동형).

### 3.3 Plinko

- `plinkoRtp(rows, risk)` — exact binomial EV; gates **98.5%–99.5%** (`games.test.ts`).
- Legacy 12-low ~104% table regression anchor — **must stay < 100%**.

### 3.4 Hi-Lo

- Step multiplier: `p = (13−card)/13` (higher) or `(card−1)/13` (lower); skip = 1×.
- Max **10** guesses — schema enforced.

### 3.5 Blackjack

- Payout table: BJ **2.5×**, win **2×** (4× doubled), push **1×** (2× doubled), insurance +2 on win.
- Standard rule RTP; not flat 99% — documented as rule-based edge.

### 3.6 Roulette

- Single-zero: `theoreticalRtp() = 36/37` — one pocket house edge **1/37 ≈ 2.7%** (European standard, not 1% flat).

### 3.7 Slots (Mint Reels · Gold Rush)

- `slotPayoutMultiplier(totalLineMult, lines) = total / activeLines`.
- `slotTheoreticalRtp(config, lines)` — closed-form approx in `slot-engine.ts`.
- `rtp-harness.test.ts` — 100k seeds Monte Carlo vs theoretical where defined.

---

## 4. Canvas ↔ Engine parity 규칙

| 규칙 | FAIL |
|------|------|
| Lovable `src/games/*/multiplier.ts` · payout preview = engine formula | display-only 재계산 drift |
| PF verify uses `packages/game-engine` fairness stream | canvas-only RNG for settle |
| Paste(L2) 후 `@phonara/game-engine` import | duplicate divergent math |

---

## 5. §GREEN self-check (감사)

```bash
# Engine payout tests (PHONARA repo)
bun run --filter @phonara/game-engine test

# Mines 22/22 spot (node one-liner)
node -e "let m=1; for(let k=0;k<22;k++) m*=(25-k)/(22-k); console.log(Math.floor(m*99)/100)"
# expected: 2277
```

**PASS:** one-liner **2277** · game-engine tests green · Lovable vitest **572/572** carry.

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | 초판 · Mines 22/22 audit · 10-game mapping · L1-16m Part 1 |
| 2026-06-17 | L1-16m **§GREEN** — Part 2 PresenceMarquee ×7 HUD · Part 3 PF meta footer (Lovable canvas) |

---

*감사 전용 · 엔진 수정 금지 · L1-16m §GREEN (Part 1–3 complete)*
