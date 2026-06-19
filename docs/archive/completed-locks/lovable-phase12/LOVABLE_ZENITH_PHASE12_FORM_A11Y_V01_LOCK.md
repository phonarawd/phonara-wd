# LOVABLE Phase 12 · Phase 11 Form/A11y v0.1 LOCK (L1-11)

> **상태:** LOCK DRAFT v0.1 · **EXECUTE 0** — L1-10 §GREEN · catalog baseline **1512**
> **Scope:** ui/form helper density + aria-describedby wiring — **ui/form primitives only**
> **상위:** PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md L1-11

---

## Scope (1줄)

`ui/form.tsx` · FormLabel · FormDescription · FormMessage에 `form.helper.*` wiring + **aria-describedby** / **aria-invalid** density audit — Hub/games/routes **0-touch**.

---

## 산출물 (가칭 · Plan에서 경로·키 수 확정)

| # | 항목 | 대상 (예) |
|---|------|-----------|
| F1 | form.helper wiring | required/optional badge · FormDescription helper rhythm |
| F2 | aria-describedby | label ↔ description ↔ message id chain · error state |
| F3 | aria-invalid | FormControl + error message association |
| F4 | catalog Δ | Plan에서 **+N** 확정 · ko=en strict |

---

## NO-TOUCH

- Home/Casino/Trade/Earn Hub · games · routes · `/sports` L1-08 defer
- Phase 10 13 carry files · L1-09/L1-10 shell primitives regression
- styles.css token edits (unless Plan proves missing var)

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | **ui/form* + i18n only** — funnel surface mount **금지** |
| F2 | TSX hex **0** · JSX [가-힣] **0** |
| F3 | catalog **1512 + N** · ko=en DIFF=0 |
| F4 | vitest **82/2 · 384/4 NO-REGRESSION** |
| F5 | a11y: focus ring 유지 · 44px touch · aria on form fields |
| F6 | ZIP · paste · engine **0** |

**FAIL =** Hub/games/route touch · catalog DIFF≠0 · vitest regression · aria chain broken · form.helper keys unused

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | LOCK APPROVE · catalog **1512** |
| 1 | Plan: form.tsx inventory · aria audit · **+N keys** → Cursor APPROVE |
| 2 | form.helper wiring |
| 3 | aria-describedby / aria-invalid pass |
| 4 | vitest |
| 5 | §GREEN report |
| 6 | §GREEN self-check full block |

---

## §GREEN self-check (Step 6)

```bash
rg "form\.helper\.(required|optional)" src/components/ui/form.tsx src/i18n/
rg "aria-describedby|aria-invalid|aria-errormessage" src/components/ui/form.tsx
rg "[가-힣]" src/components/ui/form.tsx src/components/ui/
rg "#[0-9a-fA-F]{3,8}" src/components/ui/form.tsx
# catalog KO=EN · baseline 1512 · Δ=N in report
# vitest 82/2 · 384/4 NO-REGRESSION
# games/ routes/ hub = 0 touch
```

---

*operator REVIEW → APPROVE / REVISE → Plan first*