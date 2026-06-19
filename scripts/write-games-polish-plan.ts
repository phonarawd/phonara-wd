import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const desktop = 'C:/Users/PC/Desktop/PHONARA-lovable-master-prompt.md';
const masterOut = join(root, 'docs/PHONARA_LOVABLE_GAMES_POLISH_MASTER.md');
const crashLockOut = join(root, 'docs/PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md');

const header = `# PHONARA · Lovable Games Polish Master (12 originals · Stake 압살 · 렉 0)

> **목적:** Lovable canvas에서 casino **12 originals** UI/UX를 엔진 오차 0 · 렉 0 · Stake 압살 수준으로 올리는 **standing 정본**.  
> **갱신:** 2026-06-17 · operator desktop \`PHONARA-lovable-master-prompt.md\` 흡수 + Deepshaft/Momentum 확장  
> **담당:** Lovable AI · Cursor (§GREEN 검증) · operator (APPROVE/EXECUTE GO)  
> **연결:** \`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md\` §3.1.5 · \`LOVABLE_OPERATOR_PROMPT_DISPATCH.md\`

---

## 0. 큐 위치 · 우선순위

| 트랙 | ID | 상태 |
|------|-----|------|
| L1 formal HEAD | L1-20 K1 | PLAN |
| **L1-GP (operator priority parallel)** | **Games Polish Sub-Queue** | **ACTIVE · HEAD = G#1 Crash** |
| L1 parallel | ~~L1-16f desktop~~ **CANCELLED** (operator 2026-06-18) |

**S4:** 게임 1개 = LOCK 1건. G#n §GREEN 전 G#n+1 금지. ZIP defer.

**Baseline:** vitest **586/586** · i18n **KO=EN=2620 DIFF=0**.

---

## 1. 12종 큐 (registry SOT)

| # | GameCode | 상태 |
|---|----------|------|
| — | plinko · mines · shell | ✅ signed-off |
| **G#1** | crash | ⏳ EXECUTE — \`PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md\` |
| G#2 | dice | PLAN |
| G#3 | limbo | PLAN |
| G#4 | hilo | PLAN |
| G#5 | roulette | PLAN |
| G#6 | mint_reels | PLAN · contract gap |
| G#7 | gold_rush | PLAN · slot (dig 아님) |
| G#8 | blackjack | PLAN · contract gap |
| G#9 | deepshaft | PLAN · LAW 4 FULL |
| G#10 | momentum | PLAN |

**엔진 mirror:** \`packages/game-engine/src/games/*.ts\` · \`cashoutMultiplier\` (not cashoutMult).

---

## 2. Lovable standing instruction (PART 1–5)

`;

const extension = `

### 9. Deepshaft  ⚠️ LAW 4 FULL
- Engine: \`levels[]\` (depth · outcome gold|cavein · levelMultiplier) · \`reachedDepth\` · \`caveIn\` · \`totalMultiplier\` · \`won\`.
- Selection: \`riskTier\` · \`targetDepth\`. Dig/reveal replay toward known \`levels[]\`.
- **Quarantine:** unrevealed depth cells — LAW 4 vitest + Playwright 🔒.
- AutoSlot: \`riskTier\` + \`targetDepth\`. Both viewports.

### 10. Momentum
- Engine: \`roll\` · \`won\` · \`comboBefore\` · \`comboAfter\` · \`comboMultiplier\` · \`cashedOut\` · \`totalMultiplier\`.
- Selection: \`comboBefore\` · \`cashOut\`. Streak/combo ramp toward decided \`roll\`.
- CSS discrete or light canvas — LAW 5 perf budget.
- AutoSlot: combo policy if applicable.

> **LAW 4 정정:** Gold Rush는 5-reel slot (dig 아님). Deepshaft만 dig LAW 4 FULL.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | 초판 — L1-GP 큐 정본 · 12종 · G#1 Crash FINAL LOCK |

`;

const body = readFileSync(desktop, 'utf8');
const part3End = body.indexOf('═══════════════════════════════════════════════════════════════════════\n## PART 4');
const beforePart4 =
  part3End > 0 ? body.slice(0, part3End) : body;
const fromPart4 = part3End > 0 ? body.slice(part3End) : '';

writeFileSync(masterOut, header + beforePart4 + extension + fromPart4, 'utf8');

writeFileSync(
  crashLockOut,
  `# LOVABLE Games Polish · G#1 Crash — LOCK v0.1 + World Crush Moment Bar (FINAL)

> **상태:** APPROVE · EXECUTE GO · REVISE #9 반영  
> **큐:** L1-GP Game #1 · PHONARA_LOVABLE_GAMES_POLISH_MASTER.md  
> **갱신:** 2026-06-17

## Scope

Crash presentation-only: CrashAutoSlot · skin/gradient cache · World Crush moment · 4-state cashout · CrashHistoryStrip. 엔진·shared-core·styles.css 0-touch.

## PRE-WORK

(b) getComputedStyle 3×/frame → ref cache + gradient (color,H) cache. render loop 안 getComputedStyle = FAIL.

## CREATE

CrashAutoSlot.tsx · CrashHistoryStrip.tsx · __tests__/CrashAutoSlot.test.tsx · __tests__/Stage.renderPath.test.tsx

## EDIT

Controls.desktop/mobile (autoSlot wire) · Controls.shared CrashCashoutSlot 4-state (cashoutMultiplier mirror) · Stage.tsx moment+perf · i18n additive

## 4-state

armed: commitment&&!busy&&!bet · pending: busy · success: cashedOut&&cashoutMultiplier>=1.01 · miss: phase crashed read-only&&!cashedOut

## NO-TOUCH

styles.css · packages/game-engine/** · useAutoBetQueue · AutoBetPanel · BetModeTabs · FROZEN 3 · 기존 crash __tests__

## §GREEN

§3 raw 1~10 + screenshots 3. Dice after APPROVE. ZIP defer.

상세: operator chat FINAL LOCK v0.1 + World Crush Moment Bar (REVISE #9) 정본.
`,
  'utf8',
);

console.log('wrote', masterOut, crashLockOut);
