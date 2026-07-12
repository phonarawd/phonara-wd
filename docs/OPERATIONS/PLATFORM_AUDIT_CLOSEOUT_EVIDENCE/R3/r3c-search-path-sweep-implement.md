# R3-c — search_path Sweep (`audit-r3c-search-path-sweep`)

> **Stage:** R3-c · **Plan todo:** `audit-r3c-search-path-sweep`  
> **Finding:** M-05  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 1 · RED-first SQL · `stack:push-remote` · advisor targeted delta)

## Finding touched

| Finding  | Fix summary                                                                                     | Gate          |
| -------- | ----------------------------------------------------------------------------------------------- | ------------- |
| **M-05** | Advisor `function_search_path_mutable` 8건 → 0 · earn/tier IMMUTABLE helpers function-level pin | SQL + advisor |

## Root cause / fix

| 필드           | 값                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root cause** | E4 Option B (`20260804000002`)가 `_earn_*` / `_tier_decay_*` IMMUTABLE helper를 `CREATE OR REPLACE`로 재작성하며 `SET search_path` 누락 — 이전 `launch_rc` pin 무효화 |
| **Fix**        | migration `20260816000001_m05_r3c_search_path_sweep` — `ALTER FUNCTION … SET search_path = public, pg_temp` × 8 · client REVOKE 재고정                                |
| **Ledger**     | money path 변경 0 (proconfig only · body 미개서)                                                                                                                      |
| **Note**       | Plan 문구의 “SECURITY DEFINER”와 달리 advisor 8건은 **IMMUTABLE SQL helpers**(prosecdef=false). 정본은 advisor `function_search_path_mutable` 목록                    |

## Code owners

| Path                                                               | Role            |
| ------------------------------------------------------------------ | --------------- |
| `supabase/migrations/20260816000001_m05_r3c_search_path_sweep.sql` | M-05 pin        |
| `supabase/tests/m05_r3c_search_path_sweep_test.sql`                | RED-first owner |

## Targets (8)

1. `_earn_tier_index(earn_vip_tier)`
2. `_earn_limit_roulette(earn_vip_tier)`
3. `_earn_limit_referral_payout(earn_vip_tier)`
4. `_earn_limit_viral_share(earn_vip_tier)`
5. `_earn_limit_daily_quiz(earn_vip_tier)`
6. `_earn_referral_multiplier(earn_vip_tier)`
7. `_tier_decay_previous(earn_vip_tier)`
8. `_tier_decay_xp_cap(earn_vip_tier)`

## Gates

```text
RED probe (pre-apply MCP): 8/8 has_search_path=false · proconfig NULL
bun run lock:migrations → froze 1 · 234 total
bun run check:migrations → OK (234)
bun run stack:push-remote → OK · remote name …_m05_r3c_search_path_sweep · advisor ERROR 0
bun run check:advisors → 0 ERROR · function_search_path_mutable absent from WARN breakdown
remote probe (MCP) → 8/8 has_search_path=true · anon/auth EXECUTE=false · smoke bronze=0 · gold mult=1.25
```

## Remote probe (2026-07-13)

| Check                                  | Result        |
| -------------------------------------- | ------------- |
| `search_path=public, pg_temp` on all 8 | true          |
| anon/authenticated EXECUTE             | false × 8     |
| `_earn_tier_index('bronze')`           | 0             |
| `_earn_referral_multiplier('gold')`    | 1.25          |
| advisor `function_search_path_mutable` | **0** (was 8) |

## No Shortcut checklist

- [x] Advisor targeted WARN 8→0 (`function_search_path_mutable`)
- [x] Body rewrite 0 · volatility/grants 유지
- [x] Client EXECUTE 0 유지
- [x] Migration 1 tranche · rewrite 없음
- [x] RED-first SQL owner
- [x] `stack:push-remote` · advisor 0 ERROR

Finding status: **VERIFIED_FIXED** (M-05 · Backend/DB profile).

NEXT Implement: **`audit-r3d-siwe-analytics-ingress`** (M-04).
