# ENGINE_GAP E4 Tier Option B (#246)

> **상태:** `[x]` DONE · **날짜:** 2026-07-11  
> **플랜:** `phase_r_super-app_8bdf2c10` · todo `ew-e4-tier-option-b-wave` (#246)  
> **ADR:** [`013-tier-option-b.md`](../PRODUCT/ADR/013-tier-option-b.md)  
> **코드 계약:** [`tier-option-b-display-contract.ts`](../../apps/web/src/domain/tier-option-b-display-contract.ts)  
> **선행:** E3 GATE `#245` `[x]`  
> **후행:** `ew-e4-gate-tier-option-b` (#247)

## 범위

| 항목 | 내용 |
| ---- | ---- |
| ADR | Option B fee/cap 매트릭스 · Prime Elite 수동 only · admin write |
| Migration | `20260804000001_ew_e4_prime_elite_enum.sql` + `20260804000002_ew_e4_tier_option_b.sql` |
| RPC | `rpc_get_user_tier_summary` · `rpc_admin_set_user_earn_vip_tier` |
| Enum | `earn_vip_tier` += `prime_elite` |
| Caps | casino/sports stake mult · trade leverage · withdraw daily · fee rate helper |
| Decay | prime_elite auto-decay **skip** |
| Admin | `/tiers` · user tier write path (UI unlock = GATE) |

## 증거

| Gate | 결과 |
| ---- | ---- |
| `gate:ai-impl` tier-option-b + related | **17/17** (WAVE pin) · related cashback/fees green |
| SQL | `ew_e4_tier_option_b_test.sql` E4-0..E4-4 · **CI sql authoritative** (G13) |
| Remote | GATE: `stack:push-remote` · advisor 0 |

## 다음

`ew-e4-gate-tier-option-b` — `test:sql` · `stack:push-remote` · unlock fee display truth · admin tier write UI · `/sports/vip` · `/tier/elite` prep · **`[x]` DONE** 2026-07-11 · 후행 `ew-e5-gap-surfaces-wire`.
