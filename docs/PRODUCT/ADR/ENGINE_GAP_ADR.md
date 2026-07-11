# ENGINE_GAP_ADR — Platform World-Class Gap Index

> **상태:** `[x]` Accepted · **승인일:** 2026-07-11  
> **승인 todo:** `ew-e0-adr-approval` (#239) · Plan `phase_r_super-app_8bdf2c10`  
> **선행:** `check:plan-yaml` green · Track A T2 `launch-scale-t2-triggers` (#238) `[x]` DONE  
> **후행:** E7 GATE `ew-e7-gate-engine-wave` (#253) **`[x]`** 2026-07-12 · E7 WAVE `#252` **`[x]`** · E6 GATE `#251` **`[x]`** 2026-07-12 · E6 WAVE `#250` **`[x]`** · E5 GATE `#249` **`[x]`** 2026-07-11 · E5 WIRE `#248` **`[x]`** · E4 GATE `#247` **`[x]`** · E4 WAVE `#246` **`[x]`** · E3 GATE `#245` **`[x]`** · E3 WAVE `#244` **`[x]`** · E2 GATE `#243` **`[x]`** · E2 WAVE **`[x]`** · E1 **`[x]`** · E0 **`[x]`**  
> **다음:** `ew-e8-gate-financial`  
> **후행:** E8 WAVE **`[x]` DONE** 2026-07-12 · ADR-018 · P2P · API keys · giftcard redeem  
> **후행:** E23 UI unlock **`[x]` DONE** 2026-07-12 · GATE **`[x]`** · WAVE **`[x]`** · ADR-017 · progressive · live crash · PF seed  
> **후행:** E22 UI unlock **`[x]` DONE** 2026-07-12  
> **후행:** E22 GATE **`[x]` DONE** 2026-07-12 · remote `ew_e22_sports_parity` · advisor **0** · unlock path built_hidden  
> **후행:** E22 WAVE **`[x]` DONE** 2026-07-12 · ADR-016 · partial cashout · odds · catalog  
> **후행:** E21 GATE `#255` **`[x]`** 2026-07-12 · WAVE `#254` **`[x]`** · ADR-015 · hedge/reduce-only remote apply 
> **코드 계약:** [`engine-gap-adr-display-contract.ts`](../../../apps/web/src/domain/engine-gap-adr-display-contract.ts)  
> **Track A canon (engine 0):** [`GLOBAL_EXPANSION.md`](../../SSOT/GLOBAL_EXPANSION.md) · [`ONBOARDING_JOURNEY_CANON.md`](../../SSOT/ONBOARDING_JOURNEY_CANON.md) · [`PLATFORM_NARRATIVE_CANON.md`](../../SSOT/PLATFORM_NARRATIVE_CANON.md)

## Decision (E0 · operator 승인)

1. **E1–E10 index** = Track B Platform World-Class 실행 정본 (본 문서).
2. **`engine-p0-no-migration` 해제** = 본 ADR Accepted 이후에만 · Track B `ew-e*` 세션에서만 migration 허용.
3. **RED STOP (non-waivable):**
   - Track A 세션에서 `supabase/migrations` · `packages/*-engine` 신규 기능 **금지**
   - 하위 Wave ADR(`[E·ADR]` / wave todo) **없이** E1+ migration 착수 **금지**
   - 광고·설문 미션 구현·UI 노출 **영구 금지** (아래 §영구 제외)
4. Trade Desk defer slice(005–008)는 **별도 Accepted** 전까지 migration 금지 (본 E0와 독립).

**Operator attestation:** 본 세션 todo 배정 = `ENGINE_GAP_ADR` E1~E10 index · RED STOP · 광고·설문 **영구 제외** 승인.

## 영구 제외 (non-waivable · operator 재확정 2026-07-11)

| 항목 | 사유 |
| ---- | ---- |
| **광고 시청 미션** | fraud · ad SDK · operator 정책 |
| **설문 미션** | third-party panel · fraud |
| Temporal workflows | ADR-001 · `/admin/ops` only |
| Polymarket 예측시장 | sportsbook scope 밖 |

> **FAIL:** 광고·설문 미션 UI/RPC/catalog 노출 · 「E-Wave에 포함」 주장 · built_hidden로 우회 노출.

## E1–E7 (기존 플랜 정본)

| Wave | Scope | Unlock |
| ---- | ----- | ------ |
| E1 | Tier Decay | `/tier/me` full |
| E2 | Mission Admin CRUD | `/admin/earn/missions` write |
| E3 | Viral leaderboard · CMS | `/referral/leaderboard` · promotions |
| E4 | Option B tier · VIP markets | `/sports/vip` · `/tier/elite` |
| E5 | STUB→live wire | gap surfaces |
| E6 | Admin desks | deferred admin pages |
| E7 | co-mission · whale missions | social missions |

## E8 — Financial connectivity (31차)

| Gap | ADR todo | Engine todo | UI unlock |
| --- | -------- | ----------- | --------- |
| P2P `/wallet/transfer` | `ew-e8-financial-wave` | same wave | `ew-e10-wallet-settings-ui` |
| Trading API keys | same | same | same |
| Points→giftcard reverse | same | same | `/points/shop` |

**Gates:** `test:sql` Σ=0 · `stack:push-remote` · advisor 0 · `ew-e8-gate-financial`

## E9 — Identity · Support · Growth intelligence (31차)

| Gap | Engine | UI |
| --- | ------ | -- |
| SIWE wallet login | `ew-e9-identity-wave` | login surface |
| Support tickets | same | `/support/ticket` |
| Product analytics events | same | `/admin/viral-stats` full |
| App-install attribution mission | same | missions hub tab |
| Tier leaderboard RPC | same | `/tier/leaderboard` |

**Gates:** `ew-e9-gate-identity-support`

## E10 — Trust · Native · Advanced missions (31차)

| Gap | Engine | UI |
| --- | ------ | -- |
| KRW deposit proof upload | `ew-e10-platform-engine-wave` | `/wallet/deposit/krw` |
| Mission chain server-side | same | `/home/missions` |
| co-bet (optional) | same | sports social |
| ML recommendations (optional) | same | earn hub |
| Kakao share SDK | `ew-e10-growth-ui` | `/referral/invite` augment |
| System status | `ew-e10-trust-support-ui` | `/status` |
| Live chat (third-party) | config only | `/support/chat` |

**Final gate:** `ew-e10-gate-platform-world-class` = **Platform World-Class DONE**

## Trade Desk Engine Wave defer (L4 · post-L9 · 2026-07-08)

> Trade Desk Zero-Defect §10 — [`ENGINE_BOUNDARY.md`](../../SSOT/ENGINE_BOUNDARY.md) §Engine Wave defer 와 상호 링크.  
> **E0 Accepted ≠** 아래 4 slice Accepted.

| Slice | ADR | Unlock gate |
| ----- | --- | ----------- |
| Synthetic → Real CLOB | [005-engine-wave-clob-defer.md](005-engine-wave-clob-defer.md) | P4-D + settlement model |
| Tier APY ↔ accrual (E4) | [006-engine-wave-tier-accrual-defer.md](006-engine-wave-tier-accrual-defer.md) | P4-D + claimable RPC |
| Accounting Invariant full | [007-engine-wave-accounting-invariant-defer.md](007-engine-wave-accounting-invariant-defer.md) | P4-D + journal leg SQL |
| DB TX Race deep audit | [008-engine-wave-db-tx-race-defer.md](008-engine-wave-db-tx-race-defer.md) | P4-D + multi-session harness |

**Launch RC:** 위 4 slice **defer stub** — migration 착수 금지 until Accepted.

## RED STOP 강제 (Track B 착수 규칙)

```text
E0 Accepted (본 ADR)
  → Wave ADR / wave todo 스펙
  → RED-first SQL test
  → migration (Track B only)
  → test:sql Σ=0 → stack:push-remote → advisor 0
  → [E·GATE] → UI unlock
```

| 금지 | FAIL = |
| ---- | ------ |
| E0 전 migration | `engine-p0-no-migration` 위반 |
| Wave ADR 없이 E1+ migration | RED STOP |
| Track A에서 engine 기능 추가 | Track 경계 위반 |
| 광고·설문 미션 | 영구 제외 위반 |
| UI만 green으로 engine DONE 주장 | `[E·GATE]` 미완료 |

## Conservation & security (all waves)

- Money: `@phonara/money` · ledger append-only · idempotency keys
- RLS+GRANT pair per migration (`25-postgres-plpgsql`)
- Client: display RPC only

## Verification (E0)

- [x] `check:plan-yaml` green (280 ids · orderViolations none)
- [x] E1–E10 index 본문 고정
- [x] RED STOP · `engine-p0-no-migration` 해제 조건 명시
- [x] 광고·설문 미션 **영구 제외** operator 재확정
- [x] Display contract + vitest pin
- [x] Wave 구현 = `ew-e1-decay-wave` 이후 (본 todo 범위 밖) → **E1 `[x]`** 2026-07-11 ([`010-tier-decay.md`](010-tier-decay.md)) · GATE `ew-e1-gate-decay` **`[x]`** 2026-07-11 (`/tier/me` full)
- [x] E2 Mission Catalog WAVE `ew-e2-missions-wave` (#242) — [`011-mission-catalog.md`](011-mission-catalog.md) · GATE `ew-e2-gate-missions` **`[x]`** 2026-07-11 (`/admin/earn/missions` write)
- [x] E3 Viral+CMS WAVE `ew-e3-viral-cms-wave` (#244) — [`012-viral-cms.md`](012-viral-cms.md) · leaderboard RPC · CMS targeting/schedule · viral analytics · GATE `ew-e3-gate-cms-promotions` **`[x]`**
- [x] E3 Viral+CMS GATE `ew-e3-gate-cms-promotions` (#245) — remote `ew_e3_viral_cms` · advisor 0 · unlock leaderboard · admin CMS/promotions · announcements
- [x] E4 Option B WAVE `ew-e4-tier-option-b-wave` (#246) — [`013-tier-option-b.md`](013-tier-option-b.md) · `rpc_get_user_tier_summary` · Prime Elite · caps · admin tier write
- [x] E4 Option B GATE `ew-e4-gate-tier-option-b` (#247) — remote `ew_e4_tier_option_b` · advisor 0 · unlock fee % · admin tier write · `/sports/vip` · `/tier/elite`
- [x] E7 Social WAVE `ew-e7-social-wave` (#252) — [`014-social-co-mission.md`](014-social-co-mission.md) · co-mission · whale_deposit_1m · GATE `ew-e7-gate-engine-wave` **`[x]`** 2026-07-12
- [x] E7 Social GATE `ew-e7-gate-engine-wave` (#253) — remote `ew_e7_social_co_mission` · advisor 0 · unlock `/home/missions` social · 후행 `ew-e21-trade-parity-wave`
- [x] E21 Trade parity WAVE `ew-e21-trade-parity-wave` (#254) — [`015-trade-parity-hedge-reduce-only.md`](015-trade-parity-hedge-reduce-only.md) · hedge · reduce-only · EXISTS pin (TP/SL · spot · trailing) · 후행 GATE `#255`
- [x] E21 Trade engine parity GATE `ew-e21-gate-trade-engine-parity` (#255) — remote `ew_e21_trade_parity_hedge_reduce_only` · advisor 0 · spot/TP/SL EXISTS honesty · 후행 `ew-e21-ui-trade-engine-unlocks`
- [x] E22 Sports parity WAVE `ew-e22-sports-parity-wave` — [`016-sports-parity-partial-cashout.md`](016-sports-parity-partial-cashout.md) · GATE+UI `[x]`
- [x] E23 Casino live WAVE `ew-e23-casino-live-wave` — [`017-casino-live-progressive-pf.md`](017-casino-live-progressive-pf.md) · progressive · live crash · PF · GATE `ew-e23-gate-casino-live` **`[x]`** 2026-07-12
- [x] E23 Casino live GATE `ew-e23-gate-casino-live` — remote `ew_e23_casino_live` · advisor 0 · casino_parity E23 GROWTH · 후행 UI unlock **`[x]`**
- [x] E23 Casino UI unlock `ew-e23-ui-casino-live-unlocks` — `casinoLiveLive` · live crash · progressive · fairness seed · 후행 `ew-e8-financial-wave`
- [x] E8 Financial WAVE `ew-e8-financial-wave` — [`018-financial-connectivity.md`](018-financial-connectivity.md) · P2P · API keys · giftcard redeem · 후행 GATE `ew-e8-gate-financial`
