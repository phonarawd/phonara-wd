import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const g6 = `# LOVABLE Games Polish · G#6 Mint Reels — LOCK v0.1

> **상태:** FULL APPROVE · EXECUTE GO · 2026-06-17  
> **큐:** L1-GP Game #6 · contract gap · Stake 압살 · 렉 0  
> **선행:** G#1–G#5 §GREEN · vitest **615/615**

## Scope

Mint Reels presentation polish: S1–S8 slot surface · honest settle · Path B auto-slot · outcome-leak · CONTRACT-GAP FLAG. No fake reel stops.

## Engine mirror

- Result: \`totalMultiplier\` ONLY
- Selection: \`lines\` (1–20)
- NOT exposed: stops · window · paytable in result

## Contract gap (DELIVER FLAG 필수)

True per-reel stop needs engine \`stops\`+\`window\`. Decorative seedToGrid + totalMultiplier tier only.

## Path B §3.1

not-applicable — lines pre-committed · auto.wiring green

## §GREEN template

Mint Reels G#6 §GREEN — vitest 616/616 · contract-honest · contract-gap FLAG · G6-S1 PASS · §3.1 N/A · perf OK · WC 5 · §3.10 defer · ZIP defer.

상세: operator chat Mint Reels G#6 Plan v0.1 APPROVED.
`;

writeFileSync(join(import.meta.dir, '..', 'docs', 'PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md'), g6, 'utf8');
console.log('ok');
