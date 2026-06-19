import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const content = `# LOVABLE Games Polish · G#5-C — Promo Card Overflow (소형 amend)

> **상태:** PLAN · operator §APPROVE 대기  
> **큐:** L1-GP **parallel** · G#5 §AMBER 해소 · **G#6 HEAD 차단 아님**  
> **갱신:** 2026-06-17  
> **연결:** [PHONARA_LOVABLE_GAMES_POLISH_G5_ROULETTE_LOCK.md](PHONARA_LOVABLE_GAMES_POLISH_G5_ROULETTE_LOCK.md) · amend W §AMBER

---

## Scope (1줄)

\`/casino/roulette\` page shell 가로 overflow 0 — promo/hero card responsive fix only. **Wheel · Board · engine 0-touch.**

---

## Background (§AMBER from G5-B1-W)

| Viewport | page shell overflow | 원인 |
|----------|---------------------|------|
| 375 | 0 | — |
| 390 | **146** | promo card grid |
| 414 | **122** | promo card grid |

- 무관: \`grid sm:grid-cols-[200px_1fr]\` + \`aspect-[4/3]\` IMG (~520px)
- Wheel · RouletteBoard G5-B1 — **무관 · 회귀 금지**

---

## Goal

§3.7 page shell **375/390/414 = 0/0/0** on \`/casino/roulette\`.

---

## PRE-FLIGHT (Step 0)

\`\`\`bash
rg "grid-cols-\\[200px_1fr\\]|aspect-\\[4/3\\]" src/
rg "promo|GameDetail" src/ --glob "*.{tsx,jsx}"
\`\`\`

---

## FIX spec (C1–C5)

| ID | Fix | FAIL if |
|----|-----|---------|
| C1 | \`<md\`: grid-cols-1 stack | 200px column on 390 |
| C2 | min-w-0 · image w-full max-w-full | ~520px min forced |
| C3 | shell overflow-x-hidden if needed | CTA clipped |
| C4 | sm: 2-col desktop preserved | desktop regression |
| C5 | i18n DIFF=0 | key drift |

---

## NO-TOUCH (git diff = EMPTY)

- \`src/games/roulette/Stage.tsx\` · \`Controls.shared.tsx\` · RouletteBoard
- \`packages/game-engine/**\` · \`src/styles.css\` · shared-core 3

## EDIT (allowed)

- Game detail / casino route promo card wrapper (PRE-FLIGHT 확정)

---

## EXECUTE (Steps 0→5)

0. vitest BEFORE **615/615**  
1. PRE-FLIGHT raw  
2. C1–C4 fix  
3. §3.7 remeasure 375/390/414  
4. wheel/board spot-check  
5. §GREEN + STOP  

---

## §GREEN template

\`\`\`text
Roulette G#5-C promo-overflow §GREEN — §3.7 0/0/0 on 375/390/414 · NO-TOUCH wheel/board · vitest 615/615 carry · DIFF=0 · ZIP defer.
\`\`\`

---

## Queue

**Parallel** with G#6 Mint — operator 「G#5-C 프롬프트」

## Defer

ZIP · PHONARA paste · engine — 0.
`;

writeFileSync(join(import.meta.dir, '..', 'docs', 'PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md'), content, 'utf8');
console.log('wrote', content.length);
