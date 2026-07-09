# ADR 0002: Engine Freeze During UI Rebuild

## Status

**Accepted** — Engine Apex `[x] FULLY CLOSED` (2026-07-03). 본 ADR는 Phase R 전 기간 **유효**.

## Context

PHONARA is executing a zero-defect launch track that replaces presentation surfaces while preserving money, settlement, and game-engine behavior that already passes SQL conservation (Σ=0), hash-chain, and security-advisor gates. Uncontrolled engine changes during UI work create regression risk across wallet, trade, sports, casino, and admin surfaces—and violate the dependency graph where Money Engine is the lowest canonical layer.

## Decision

During the active release-governance UI track (Phase 0.5 through Phase R), the following paths are **frozen** unless an operator RED STOP explicitly authorizes engine work:

| Layer            | Frozen paths                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Database         | `supabase/migrations/**`                                                                                                    |
| Domain packages  | `packages/money`, `packages/game-engine`, `packages/trading-engine`, `packages/sportsbook-engine`, `packages/wallet-ledger` |
| Page controllers | pre-demolition `features/*/use-*-page-controller*` — v5 Demolition에서 삭제됨, 현재 active target 아님                      |

**Pre-demolition allowed work 기록 (현재 active 경로 아님):**

- `apps/web/src/ui/**`, `apps/web/src/components/**` presentation replacement
- 기존 controllers/RPCs를 새 UI에 wiring
- `apps/admin/src/**` admin presentation

위 presentation/controller 경로는 v5 Demolition에서 삭제되었으며 Phase R에서 새 구조로 재정의한다.

**UI boundary:** surfaces **display** RPC/hook values only. They must not recompute payouts, PnL, liquidation, fees, balances, odds, or settlement outcomes client-side.

**Exception path:** if a screen cannot ship without an engine/migration/controller change, work **stops immediately** (RED STOP) and reports to the operator. No silent engine edits to unblock UI.

## Consequences

- UI velocity is constrained to in-place surface replacement; engine defects discovered during UI work are triaged, not patched ad hoc.
- Money-path changes remain gated by local `db reset` → `test:sql` (Σ=0) → `stack:push-remote` → advisor 0 ERROR.
- Parallel `*V2` engine forks are forbidden; see ADR-0005.
- Tests that require engine changes to pass are signals for operator review, not justification to break freeze.

## References

- Master plan absolute boundary: Engine Freeze · RED ZONE
- `.cursor/rules/30-money-ledger.mdc`, `91-uiux-worldclass-methodology.mdc` (engine boundary)
- `RELEASE_ROADMAP.md` dependency matrix (Money Engine → Wallet → Trade/Sports/Casino) — 2026-07-04 삭제 (git history)
