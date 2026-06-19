# LOVABLE Phase 12 · Phase 10 Carry v0.1 LOCK (L1-10)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — L1-09 §GREEN · catalog baseline **1502**
> **Scope:** empty-state / error-state microcopy + ui primitive copy density audit — **shell/ui only**
> **상위:** PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md L1-10 · U-S05 INTEGRATED_ROADMAP
> **Defer (본 슬라이스 아님):** Phase 10 13 carry files (`trade/*` 9 · `lib/useCountUp` · `lib/confetti` · `casino.hilo` · `casino.limbo`) — **post-paste E2E**

---

## Scope (1줄)

`EmptyState` · `ErrorState` · Alert/form helper **ui primitives**의 하드코드/밀도/톤 audit → i18n key wiring · next-action microcopy — funnel Hub/games/routes **0-touch**.

---

## 산출물 (가칭 · Plan에서 경로·키 수 확정)

| # | 항목 | 대상 (예) |
|---|------|-----------|
| C1 | empty-state copy | `shell/EmptyState` · ui empty placeholders — title/desc/cta i18n |
| C2 | error-state copy | `shell/ErrorState` · Alert destructive/helper — stable error tone |
| C3 | microcopy density | form labels · helper text · inline validation rhythm — ui/ inventory |
| C4 | catalog Δ | Plan에서 **+N** 확정 · ko=en strict · JSX [가-힣] **0** |

---

## NO-TOUCH

- Home L1-03/07 · Casino L1-02 · Trade L1-04 · games L1-05/06 · Plinko · viral L1-07
- `/sports` L1-08 defer **0**
- Phase 10 **13 carry files** (trade/* · hilo/limbo · useCountUp/confetti) — **본 슬라이스 범위 밖**
- engine/RPC · routes mount reorder · scrim/cva/toast L1-09 산출물 regression

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | **ui/shell primitives + i18n catalog only** — Hub/Stage layout reorder **금지** |
| F2 | TSX hex **0** · oklch tokens only · styles.css hex leak **0** (chart recharts baseline 제외) |
| F3 | catalog **1502 + N** — Plan Step 1에서 **N 고정** · ko=en DIFF=0 |
| F4 | vitest **82/2 · 384/4 NO-REGRESSION** |
| F5 | tone: next-action focused · apology copy **금지** · Earn-first funnel personality |
| F6 | ZIP · paste · engine **0** |

**FAIL =** games/trade route touch · catalog DIFF≠0 · vitest regression · JSX literal ko/en leak · generic empty/error copy

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LOCK APPROVE · catalog **1502** |
| 1 | Plan: ui/shell empty/error inventory · hardcoded string rg · **+N keys table** → **Cursor APPROVE** |
| 2 | empty-state i18n + wiring |
| 3 | error-state i18n + wiring |
| 4 | microcopy density pass (helpers · validation rhythm) |
| 5 | vitest |
| 6 | §GREEN report (catalog Δ · gate table) |
| 7 | §GREEN self-check full block |

---

## §GREEN self-check (Step 7)

```bash
rg "EmptyState|ErrorState|empty\.|error\." src/components/shell/ src/components/ui/
rg "[가-힣]" src/components/shell/ src/components/ui/ --glob '!**/locales/**'
rg "#[0-9a-fA-F]{3,8}" src/components/ui/ src/styles.css
# catalog KO=EN · baseline 1502 · Δ=N in report
# vitest 82/2 · 384/4 NO-REGRESSION
# games/ casino/ trade/ home hub mount diff = 0 (spot)
# trade/* carry files = 0 touch
```

---

*operator REVIEW → APPROVE / REVISE → Plan first*