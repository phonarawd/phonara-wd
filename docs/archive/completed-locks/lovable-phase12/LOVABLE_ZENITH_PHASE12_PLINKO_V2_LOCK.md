# LOVABLE Phase 12 · Pixi Plinko v2 LOCK (L1-06)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — L1-05 Stage i18n §GREEN · catalog **1492**  
> **Scope:** `src/games/plinko/Stage.tsx` Matter.js → **Pixi** physics · Rollbit-grade visual · **3구간 feel routing 보존**  
> **상위:** PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md L1-06

---

## Scope (1줄)

Plinko **Stage 표면만** DOM/Matter → **Pixi** 렌더·물리 업그레이드 — mock bet pipeline · 3구간 risk routing · Controls **0-touch** · catalog **Δ=0** (1492 유지).

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | plinko/Stage.tsx (+ colocated pixi helpers) only — Controls 0-touch |
| F2 | 3구간 feel routing (low/med/high) state/props contract 보존 |
| F3 | mock pipeline display only — client payout recompute 금지 |
| F4 | catalog 1492 · KO=EN · Δ=0 |
| F5 | vitest 82/2 · 384/4 NO-REGRESSION |
| F6 | styles.css hex 0 |
| F7 | P1–P3 Controls gates 0-touch |
| F8 | ZIP · paste · engine 0 |

**FAIL =** F1/F2/F3 위반 · catalog Δ≠0 · vitest regression · 3구간 routing break

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LOCK APPROVE · catalog 1492 |
| 1 | Plan: Pixi lifecycle · Matter 제거 · 3구간 routing 표 |
| 2 | pixi.js · Stage canvas · responsive |
| 3 | peg/ball/slot visual (Rollbit rhythm) |
| 4 | mock outcome → slot land (display only) |
| 5 | 3구간 smoke low/med/high |
| 6 | vitest |
| 7 | §GREEN report |
| 8 | §GREEN self-check full block |

---

## §GREEN self-check (Step 8)

```bash
rg "pixi|Application" src/games/plinko/
rg "Matter\." src/games/plinko/Stage.tsx
rg "XControlsShared\s*\{\.\.\.p" src/games/plinko/
# catalog KO=1492 EN=1492 DIFF=0
# vitest 82/2 · 384/4 NO-REGRESSION
```

---

*operator REVIEW → APPROVE / REVISE / REJECT*