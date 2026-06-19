# LOVABLE Phase 12 · Phase 6 Polish v0.1 LOCK (L1-09)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — operator L1-08 defer · L1-07 §GREEN · catalog **1502**
> **Scope:** scrim-soft · cva-base dedup · toast-variants — **shell/UI primitives only**
> **상위:** PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md L1-09 · U-S05 INTEGRATED_ROADMAP

---

## Scope (1줄)

Modal/sheet **scrim-soft** 토큰 · **cva** 중복 variant 정리 · **toast** variant grammar — presentation shell만 · funnel surface 구조 **0-touch**.

---

## 산출물 (가칭 · Plan에서 경로 확정)

| # | 항목 | 대상 (예) |
|---|------|-----------|
| P1 | scrim-soft | Dialog/Sheet/Drawer backdrop — oklch scrim token · reduced-motion |
| P2 | cva-dedup | `src/components/ui/*` cva 중복 → 단일 source (button/card/badge 등 Plan inventory) |
| P3 | toast-variants | toast success/error/reward variants · duration/motion grammar |

---

## NO-TOUCH

- Home L1-03/07 · Casino L1-02 · Trade L1-04 · games L1-05/06 · Plinko
- Crash FROZEN md5 trio
- `/sports` L1-08 defer — **0**
- engine/RPC · styles.css hex 추가 **0**

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | **ui/shell primitives + toast/scrim only** — Hub/Stage layout reorder **금지** |
| F2 | oklch tokens · TSX hex **0** · styles.css hex leak **0** |
| F3 | i18n: toast copy **기존 key 재사용 우선** · 신규 key §GREEN **Δ 기록** |
| F4 | vitest **82/2 · 384/4 NO-REGRESSION** |
| F5 | visual behavior **동등 이상** — regression dim/scrim **FAIL** |
| F6 | ZIP · paste · engine **0** |

**FAIL =** funnel Hub mount 변경 · games touch · catalog DIFF≠0 · vitest regression · generic toast

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LOCK APPROVE · catalog **1502** |
| 1 | Plan: file inventory · cva dup rg · toast/scrim before/after · **Cursor APPROVE** |
| 2 | scrim-soft |
| 3 | cva-dedup |
| 4 | toast-variants |
| 5 | vitest |
| 6 | §GREEN report |
| 7 | §GREEN self-check full block |

---

## §GREEN self-check (Step 7)

```bash
rg "scrim|backdrop" src/components/ui/ src/components/shell/
rg "cva\(" src/components/ui/ --count
rg "toast" src/components/ui/ src/hooks/
rg "#[0-9a-fA-F]{3,8}" src/components/ui/ src/styles.css
# catalog KO=EN · baseline 1502 · Δ in report
# vitest 82/2 · 384/4 NO-REGRESSION
# games/ casino/ trade/ home hub mount diff = 0 (spot)
```

---

*operator REVIEW → APPROVE / REVISE · Plan first*