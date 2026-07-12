# R3-d — SIWE/Analytics Service Ingress (`audit-r3d-siwe-analytics-ingress`)

> **Stage:** R3-d · **Plan todo:** `audit-r3d-siwe-analytics-ingress`  
> **Finding:** M-04  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 1 · RED-first SQL · `stack:push-remote` · edge deploy · advisor 0)

## Finding touched

| Finding  | Fix summary                                                                                         | Gate |
| -------- | --------------------------------------------------------------------------------------------------- | ---- |
| **M-04** | anon SIWE/analytics EXECUTE revoke · HMAC(IP)+resource dual bucket service ingress · payload/retention · SIWE body `user_id` 거부 · `siweLoginLive=false` | SQL + edge + advisor |

## Root cause / fix

| 필드 | 값 |
| ---- | --- |
| **Root cause** | E9 `rpc_create_siwe_challenge` / `rpc_record_product_analytics_event`가 anon EXECUTE + rate limit은 `auth.uid()` 있을 때만 → 익명 flood 가능 · siwe-auth가 body `user_id`를 신뢰 |
| **Fix** | migration `20260817000001_m04_r3d_siwe_analytics_ingress` — anon REVOKE · `rpc_service_*` + `service_ingress_rate_buckets` dual bucket · payload limits · retention purge · edge `siwe-auth`/`product-analytics` |
| **Ledger** | money path 변경 0 |
| **Live** | `LAUNCH_GATES.siweLoginLive=false` 유지 |

## Code owners

| Path | Role |
| ---- | ---- |
| `supabase/migrations/20260817000001_m04_r3d_siwe_analytics_ingress.sql` | M-04 ingress |
| `supabase/tests/m04_r3d_siwe_analytics_ingress_test.sql` | RED-first owner |
| `supabase/tests/grants_rls_inventory_test.sql` | inventory pin |
| `supabase/tests/ew_e9_identity_support_test.sql` | E9-1 auth challenge path |
| `supabase/functions/siwe-auth/index.ts` | challenge+complete · no body user_id |
| `supabase/functions/product-analytics/index.ts` | analytics ingress |
| `supabase/functions/_shared/service-ingress.ts` | HMAC(IP) helper |
| `apps/web/src/domain/ew-e9-identity-support-display-contract.ts` | contract pin |

## Gates

```text
RED probe (pre-apply MCP): anon EXECUTE true on challenge + analytics
bun run lock:migrations → froze 1 · 235 total
bun run check:migrations → OK (235)
bun run gate:ai-impl --test ew-e9-identity-support-display-contract → green · vitest 2/2
bun run stack:push-remote → OK · remote name …_m04_r3d_siwe_analytics_ingress · advisor ERROR 0
bun run check:advisors → 0 ERROR
edge deploy: siwe-auth · product-analytics (--no-verify-jwt · public ingress)
remote privilege probe → anon challenge/analytics = false · service_* = service_role only
```

## Remote privilege probe (2026-07-13)

| Check | Result |
| ----- | ------ |
| anon EXECUTE `rpc_create_siwe_challenge` | **false** |
| anon EXECUTE `rpc_record_product_analytics_event` | **false** |
| authenticated EXECUTE challenge/analytics | true (uid rate limit) |
| service_role EXECUTE `rpc_service_create_siwe_challenge` | true |
| service_role EXECUTE `rpc_service_record_product_analytics_event` | true |
| anon/auth EXECUTE service ingress RPCs | false |
| `service_ingress_rate_buckets` | present |
| `siweLoginLive` | **false** |

## No Shortcut checklist

- [x] anon direct EXECUTE 0 on SIWE challenge + analytics
- [x] HMAC(IP) + resource dual bucket (service ingress)
- [x] payload/length limits · anon idempotency · retention purge
- [x] SIWE body `user_id` forbidden · JWT/existing identity only
- [x] `siweLoginLive=false` 유지
- [x] Migration 1 tranche · rewrite 없음
- [x] RED-first SQL owner · inventory · E9 regression pin
- [x] `stack:push-remote` · advisor 0 ERROR · edge deploy

Finding status: **VERIFIED_FIXED** (M-04 · Backend/DB profile).

NEXT Implement: **`audit-r3e-auth-hibp-feature-flag`** (H-09).
