# Casino SLO & Observability

Operational targets for casino settlement after game engine expansion.

---

## Per-game RTP monitoring

View: `casino_game_rtp_stats` (security_invoker, 24h rolling window)

| Column | Meaning |
|--------|---------|
| `bet_count` | Settled bets in window |
| `total_stake` / `total_payout` | Turnover aggregates (not balance absolutes) |
| `measured_rtp` | `total_payout / total_stake` |
| `measured_house_edge` | `1 - measured_rtp` |

Admin drift check: `rpc_check_casino_rtp_drift()` (admin-only)

---

## Drift alarm thresholds

| Signal | Threshold | Action |
|--------|-----------|--------|
| RTP drift vs theoretical | ±5% with ≥500 bets/24h | `ops_alerts` + audit |
| Auto kill-switch | Same | `feature_game_{code}_enabled = false` |
| Parity mismatch (existing) | Client `expected_result` ≠ server | Per-game kill + `parity_hold` |

Recovery: manual admin review after root-cause — re-enable via `app_config`.

---

## RPC performance budget

| RPC | p95 SLO | Config key |
|-----|---------|------------|
| `rpc_place_game_bet` | <120ms | `casino_rpc_place_bet_p95_ms` |

Monitor via application traces / Supabase logs. Heavy games (blackjack shuffle, slot evaluation) should stay within budget at p95 under normal load.

---

## PF transparency

After `rpc_reveal_game_round`, server seed is public. Client verifies with `@phonara/game-engine` `verifyRound()`.

---

## Earn vs Casino roulette

| Domain | RPC | game_code |
|--------|-----|-----------|
| Earn retention | `rpc_spin_roulette` | N/A (not casino) |
| Casino | `rpc_place_game_bet` | `roulette` |

Never share i18n keys or metrics between these paths.

---

See also: `docs/ADD_GAME_RUNBOOK.md`, `supabase/migrations/20260614000090_casino_metrics_slo.sql`
