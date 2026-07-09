# ENGINE_GAP_ADR — Platform World-Class Gap Index

> **상태:** draft index · **승인 todo:** `ew-e0-adr-approval`  
> **규칙:** Track B migration은 본 ADR 또는 하위 ADR 승인 후만 (`engine-p0-no-migration` 해제는 E0 gate)  
> **Track A canon (engine 0):** [`GLOBAL_EXPANSION.md`](../SSOT/GLOBAL_EXPANSION.md) · [`ONBOARDING_JOURNEY_CANON.md`](../SSOT/ONBOARDING_JOURNEY_CANON.md) · [`PLATFORM_NARRATIVE_CANON.md`](../SSOT/PLATFORM_NARRATIVE_CANON.md) — wired by `p6-doc-platform-canon-sync`  
> **Display contracts:** `platform-narrative-display-contract.ts` · `onboarding-journey-display-contract.ts` · `operator-trust-pages-display-contract.ts`

## 영구 제외 (non-waivable)

| 항목                | 사유                           |
| ------------------- | ------------------------------ |
| **광고 시청 미션**  | fraud · ad SDK · operator 정책 |
| **설문 미션**       | third-party panel · fraud      |
| Temporal workflows  | ADR-001 · `/admin/ops` only    |
| Polymarket 예측시장 | sportsbook scope 밖            |

## E1–E7 (기존 플랜 정본)

| Wave | Scope                       | Unlock                               |
| ---- | --------------------------- | ------------------------------------ |
| E1   | Tier Decay                  | `/tier/me` full                      |
| E2   | Mission Admin CRUD          | `/admin/earn/missions` write         |
| E3   | Viral leaderboard · CMS     | `/referral/leaderboard` · promotions |
| E4   | Option B tier · VIP markets | `/sports/vip` · `/tier/elite`        |
| E5   | STUB→live wire              | gap surfaces                         |
| E6   | Admin desks                 | deferred admin pages                 |
| E7   | co-mission · whale missions | social missions                      |

## E8 — Financial connectivity (31차)

| Gap                     | ADR todo                           | Engine todo                        | UI unlock                     |
| ----------------------- | ---------------------------------- | ---------------------------------- | ----------------------------- |
| P2P `/wallet/transfer`  | `ew-e8-adr-financial-connectivity` | `ew-e8-engine-p2p-transfer`        | `ew-e10-ui-wallet-transfer`   |
| Trading API keys        | same                               | `ew-e8-engine-api-keys`            | `ew-e10-ui-settings-api-keys` |
| Points→giftcard reverse | same                               | `ew-e8-engine-points-shop-reverse` | `/points/shop`                |

**Gates:** `test:sql` Σ=0 · `stack:push-remote` · advisor 0 · `ew-e8-gate-financial`

## E9 — Identity · Support · Growth intelligence (31차)

| Gap                             | Engine                                 | UI                        |
| ------------------------------- | -------------------------------------- | ------------------------- |
| SIWE wallet login               | `ew-e9-engine-siwe-auth`               | login surface             |
| Support tickets                 | `ew-e9-engine-support-tickets`         | `/support/ticket`         |
| Product analytics events        | `ew-e9-engine-product-analytics`       | `/admin/viral-stats` full |
| App-install attribution mission | `ew-e9-engine-app-install-attribution` | missions hub tab          |
| Tier leaderboard RPC            | `ew-e9-engine-tier-leaderboard`        | `/tier/leaderboard`       |

**Gates:** `ew-e9-gate-identity-support`

## E10 — Trust · Native · Advanced missions (31차)

| Gap                           | Engine                           | UI                         |
| ----------------------------- | -------------------------------- | -------------------------- |
| KRW deposit proof upload      | `ew-e10-engine-krw-proof-upload` | `/wallet/deposit/krw`      |
| Mission chain server-side     | `ew-e10-engine-mission-chains`   | `/home/missions`           |
| co-bet (optional)             | `ew-e10-engine-co-bet`           | sports social              |
| ML recommendations (optional) | `ew-e10-engine-ml-missions`      | earn hub                   |
| Kakao share SDK               | `ew-e10-ui-kakao-share-sdk`      | `/referral/invite` augment |
| System status                 | `ew-e10-ui-system-status`        | `/status`                  |
| Live chat (third-party)       | config only                      | `/support/chat`            |

**Final gate:** `ew-e10-gate-platform-world-class` replaces E7 as **Platform World-Class DONE**

## Trade Desk Engine Wave defer (L4 · post-L9 · 2026-07-08)

> Trade Desk Zero-Defect §10 — [`ENGINE_BOUNDARY.md`](../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer 와 상호 링크.

| Slice                     | ADR                                                                                            | Unlock gate                  |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| Synthetic → Real CLOB     | [005-engine-wave-clob-defer.md](005-engine-wave-clob-defer.md)                                 | P4-D + settlement model      |
| Tier APY ↔ accrual (E4)   | [006-engine-wave-tier-accrual-defer.md](006-engine-wave-tier-accrual-defer.md)                 | P4-D + claimable RPC         |
| Accounting Invariant full | [007-engine-wave-accounting-invariant-defer.md](007-engine-wave-accounting-invariant-defer.md) | P4-D + journal leg SQL       |
| DB TX Race deep audit     | [008-engine-wave-db-tx-race-defer.md](008-engine-wave-db-tx-race-defer.md)                     | P4-D + multi-session harness |

**Launch RC:** 위 4 slice **defer stub** — migration 착수 금지 until Accepted.

## Conservation & security (all waves)

- Money: `@phonara/money` · ledger append-only · idempotency keys
- RLS+GRANT pair per migration (`25-postgres-plpgsql`)
- Client: display RPC only
