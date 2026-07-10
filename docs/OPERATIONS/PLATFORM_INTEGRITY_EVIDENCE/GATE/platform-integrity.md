# GATE — `pir-gate-platform-integrity`

> **Todo:** `pir-gate-platform-integrity`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (presentation L0~L4 · security-auditor PASS · CI required 4)

## 목표

Wave G GATE — presentation 번들 + phase-r-guards + i18n/release + CI quality/sql/e2e/advisors + engine security-auditor.

## 로컬 (Implemented)

```text
Implemented: bun run gate:ai-impl -- --test \
  apps/web/src/features/casino/__tests__/use-auto-bet-queue.test.ts \
  apps/web/src/product/surfaces/games/__tests__/casino-game-shell.test.tsx \
  apps/admin/src/domain/__tests__/admin-rbac.test.ts \
  apps/web/src/features/sports/__tests__/sports-odds-insert-debounce.test.ts \
  apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts \
  apps/web/src/domain/__tests__/trade-fill-realtime-display-contract.test.ts \
  packages/game-engine/src/lib/quantize.test.ts \
  packages/game-engine/src/fairness/pf-golden-vectors.test.ts \
  packages/sports-ingest/src/decimal-odds.test.ts

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest 53/53 (9 files)

gate:ai-impl ✓ Implemented (L0~L4) green
check:phase-r-guards --strict ✓
check:i18n ✓
check:release ✓
```

## Security auditor

```text
VERDICT: PASS (ERROR count = 0)
RISK: LOW
Scope: PIR E1–E5 migrations · pir_* SQL tests · client realtime invalidate paths
Agent: security-auditor (readonly)
```

WARN (non-blocking): grants inventory optional pins; affiliate admin DEFINER pattern.

## Verified (CI)

```text
Branch: phase-r/platform-integrity-2026-07-11
PR: https://github.com/rlawhdgus10041004-sys/phonara-gb/pull/3
Run: https://github.com/rlawhdgus10041004-sys/phonara-gb/actions/runs/29121620586
SHA: 8b34c88b

Required:
  ✓ quality (typecheck / lint / test / build)
  ✓ sql (supabase db reset + SQL tests)
  ✓ e2e (playwright e2e)
  ✓ advisors (supabase security advisors · 0 ERROR)

Advisory (non-blocking): e2e-browser-matrix red (WebKit timeout) — merge 차단 아님
```

## GATE follow-up fixes (same PR)

- `lock:migrations` for PIR E1–E5
- database types sync from CI artifact
- `rpc_run_affiliate_settlements` AAL2 (`20260731000001`)
- `rpc_place_game_bet` RG entry+refresh restore (`20260732000001`) — E5 rewrite residue
- standby tests `platform: 'win32'` injection for Linux CI
- `ci-watch` normalize: do not map `advisory` → `advisors`

## 다음

`pir-closeout-unblock-205` — §82 · ACTIVE_WORK_SSOT NEXT = `#205` · Evidence GATE PASS
