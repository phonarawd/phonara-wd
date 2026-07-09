# ADR 0006: Wallet Σ Rule (Ledger Conservation)

## Status

Accepted (2026-06-29)

## Context

PHONARA is a multi-product wallet platform: deposits, withdrawals, trade margin, sports stakes, casino bets, staking, and bonus/wagering buckets all flow through append-only ledger RPCs. A single cent of drift—or client-side recomputation masking server truth—blocks launch (Release Risk **P0**). Floating-point JavaScript arithmetic and non-idempotent submits have caused production-class defects in similar systems.

## Decision

**Ledger invariants (non-waivable):**

| Rule           | Requirement                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Arithmetic     | `@phonara/money` Decimal utilities only — no JS `number` for balances, fees, odds, PnL, rates             |
| Mutation style | Append-only ledger entries; available vs locked balances explicit                                         |
| Conservation   | Every balance-moving RPC nets **Σ(deltas) = 0** per currency across user wallets + system accounts        |
| Idempotency    | Balance-changing operations require idempotency keys; duplicate submits must not double-move              |
| Audit          | Hash-chain integrity where applicable; rate snapshots on exchange/game/trade legs                         |
| UI             | Display RPC/hook values only — **no** client recomputation of payout, PnL, liquidation, fees, or balances |

**Verification gates:**

- SQL integration tests in `supabase/tests/` exercise changed branches with conservation + hash-chain assertions (`ROLLBACK`, no residue)
- Money E2E specs assert **delta or Σ=0**, not absolute balance guesses (`30-audit-discipline`)
- `expected X but got Y` on Σ assertions = **RED STOP** (not flaky retry)
- Remote path after migration changes: local `db reset` → `bun run test:sql` → `bun run stack:push-remote` → Supabase advisor **0 ERROR**

**Wallet UI scope (Phase A):** deposit, withdraw, gate states, activity/history surfaces wire to existing ledger RPCs; bonus/real/wagering display follows engine read paths (see `d3-wallet` evidence).

## Consequences

- UI polish cannot trade away solvency; engine freeze (ADR-0002) applies to ledger RPCs unless operator escalates.
- Failed Σ tests block `phaseR-stage` and launch regardless of visual completeness.
- Presentation-layer FOMO/scripted feeds remain display-only string props—they must not mutate ledger state.

## References

- ADR-0002 Engine Freeze
- `.cursor/rules/30-money-ledger.mdc`, `25-postgres-plpgsql.mdc`, `30-audit-discipline.mdc`, `20-supabase-safety.mdc`
- Master plan — Wallet Σ Rule · P0 risk matrix · `phaseA-wallet-*` exit criteria
- `docs/rebuild/P1-2-WALLET-PLAN.md` (wallet UI 정본, engine A-plan)
