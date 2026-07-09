# P3-D — Browser matrix snapshot (firefox · webkit)

> **Todo:** `p3-browser-matrix` · Plan `trade_desk_qa_audit` P3-D  
> **Status:** `[x]` impl 2026-07-08 · CI optional job Verified pending

---

## Scope

| Item                   | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Source spec            | `tests/e2e/trade-desk-smoke.spec.ts`                                   |
| Subset                 | E1 · E8 · E9 (render + oracle/kill-switch gates · no full money paths) |
| Engines                | `firefox` · `webkit` (Safari)                                          |
| Authoritative chromium | CI job `e2e` (unchanged)                                               |
| Optional CI            | job `e2e-browser-matrix` · `continue-on-error: true`                   |

## Operator / CI run

```powershell
# Local advisory only (G13 — prefer CI):
PHONARA_ALLOW_LOCAL_HEAVY_GATE=1 bun run test:e2e:browser-matrix -- --workers=1
```

```text
Implemented: gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-browser-matrix-display-contract.test.ts green
Verified: GitHub Actions → e2e-browser-matrix green (advisory · does not block merge)
```

## Manual signoff (plan P3-D)

| Browser         | Viewport   | Operator 1회  |
| --------------- | ---------- | ------------- |
| Edge (Chromium) | 390 / 1024 | `[ ]` pending |
| Mobile Chrome   | 390        | `[ ]` pending |
| Mobile Safari   | 390        | `[ ]` pending |
