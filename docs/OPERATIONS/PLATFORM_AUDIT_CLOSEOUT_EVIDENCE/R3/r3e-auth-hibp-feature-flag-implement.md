# R3-e — Auth HIBP · Feature Flag Allowlist (`audit-r3e-auth-hibp-feature-flag`)

> **Stage:** R3-e · **Plan todo:** `audit-r3e-auth-hibp-feature-flag`  
> **Finding:** H-09 (+ R3 feature-flag allowlist/AAL2)  
> **Date:** 2026-07-13  
> **Command:** Implement (migration 1 · RED-first SQL · `stack:push-remote` · Management API HIBP attempt)

## Finding touched

| Finding  | Fix summary                                                                                         | Gate |
| -------- | --------------------------------------------------------------------------------------------------- | ---- |
| **H-09** | HIBP enable attempted via Management API → **402 Pro+ required** · script + DEFER documented        | Auth API · advisor WARN residual 1 |
| **(R3)** | `rpc_set_feature_enabled` sports/`live_crash` allowlist + `_assert_admin_aal2` + reason/audit 복구 | SQL · remote probe |

## Root cause / fix

| 필드 | 값 |
| ---- | --- |
| **Root cause (flag)** | E10 `CREATE OR REPLACE`가 gameday AAL2 injection을 지움 · allowlist에 Admin이 쓰는 `sports`/`live_crash` 누락 |
| **Fix (flag)** | migration `20260818000001_h09_r3e_feature_flag_allowlist` — allowlist 확장 + AAL2 + grant pin |
| **Root cause (HIBP)** | Auth `password_hibp_enabled=false` · advisor `auth_leaked_password_protection` WARN |
| **Fix attempt (HIBP)** | `bun run stack:auth-hibp-enable` → PATCH 402 `"…available on Pro Plans and up"` |
| **Ledger** | money path 변경 0 |
| **Residual** | HIBP = **BLOCKED_DEP** (Pro+) · MFA DEFER와 동급 soft-launch non-blocker |

## Code owners

| Path | Role |
| ---- | ---- |
| `supabase/migrations/20260818000001_h09_r3e_feature_flag_allowlist.sql` | feature flag allowlist + AAL2 |
| `supabase/tests/h09_r3e_feature_flag_allowlist_test.sql` | RED-first owner |
| `scripts/enable-auth-hibp.ts` · `stack:auth-hibp-enable` | HIBP Management API |
| `scripts/check/guard-coverage-allowlist.ts` | `rpc_set_feature_enabled` aal2-exempt **제거** |

## Gates

```text
RED probe (pre-apply MCP): has_aal2=false · has_sports=false · has_live_crash=false
bun run lock:migrations → froze 1 · 236 total
bun run check:migrations → OK (236)
bun run stack:push-remote → OK · remote name …_h09_r3e_feature_flag_allowlist · advisor ERROR 0
remote probe → has_aal2=true · sports=true · live_crash=true · anon EXECUTE=false
bun run stack:auth-hibp-enable → 402 PRO_PLAN_REQUIRED
bun run check:advisors → 0 ERROR · auth_leaked_password_protection WARN **1** (residual)
```

## Remote probe (2026-07-13)

| Check | Result |
| ----- | ------ |
| `_assert_admin_aal2` in body | **true** |
| allowlist `sports` / `live_crash` | **true** |
| anon EXECUTE | **false** |
| authenticated EXECUTE | true (body admin+AAL2) |
| `password_hibp_enabled` | **false** (402 Pro+) |
| advisor `auth_leaked_password_protection` | WARN **1** residual |

## No Shortcut checklist

- [x] sports/live_crash allowlist · Admin+AAL2 · reason/audit
- [x] Migration 1 tranche · rewrite 없음
- [x] RED-first SQL owner · guard-coverage exempt 제거
- [x] `stack:push-remote` · advisor 0 ERROR
- [x] HIBP API 시도 증거 (402) · DEFER/unblock 문서화 — 가짜 WARN 0 주장 **안 함**

Finding status: **BLOCKED_DEP** (H-09 · Pro+ entitlement) · feature-flag sub-scope **VERIFIED** (Backend/DB).

**Unblock:** org/project Pro 업그레이드 → `bun run stack:auth-hibp-enable` → advisor WARN 0 → registry `VERIFIED_FIXED`.

NEXT Implement: **`audit-r4-market-ops`**.
