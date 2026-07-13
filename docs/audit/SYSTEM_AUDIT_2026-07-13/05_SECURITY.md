# Pillar 5 — Security (secrets · RLS · RBAC · Finding Registry 교차)

> **감사일:** 2026-07-13 · **READ-ONLY** — grep + MCP advisor + Registry 교차만
> **Baseline:** [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](../../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml) (38 findings) · [`PLATFORM_AUDIT_REFERENCE.md`](../PLATFORM_AUDIT_REFERENCE.md) §7·§9

## 점수

| 항목         |                  점수 |
| ------------ | --------------------: |
| **Security** | **84 / 100** (Strong) |

감점 근거: H-09 leaked-password protection **BLOCKED_DEP** (Supabase Pro+ 요금제 의존 — 402 evidence) · authenticated definer WARN 206 상시 표면 · DR drill 미실시(§43 — Release pillar와 공유). Critical/High 코드 결함은 잔존 0.

## 1. Finding Registry 교차 (2026-07-13 기준 38건)

| 상태            |     수 | 항목                                                                                                                                                                             |
| --------------- | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VERIFIED_FIXED  | **36** | C-01 · C-02 · H-01~H-08 · H-10 · H-11 · M-01~M-21 · EXT-01 · EXT-02 · R9-INSTALL-CTX                                                                                             |
| **OPEN**        |  **1** | `R9-PERF-JS` (HIGH · 성능 — [`06_PERFORMANCE.md`](06_PERFORMANCE.md) 귀속)                                                                                                       |
| **BLOCKED_DEP** |  **1** | `H-09` — Supabase leaked-password protection · `blocked_by: supabase-pro-entitlement-password-hibp` · migration `20260818000001` + `stack:auth-hibp-enable` 스크립트는 준비 완료 |

**Critical/High 보안 코드 결함 잔존: 0** — H-02(범용 `rpc_lock_wallet` 노출) · M-04(anon ingress) · M-05(search_path) · M-06(client DML GRANT) 전부 migration + SQL 회귀 테스트로 VERIFIED_FIXED, 본 세션 advisor 재실측으로 `function_search_path_mutable 0` · ERROR 0 유지 확인.

## 2. Secrets 노출 (2026-07-13 grep 실측)

| 검사                                  | 결과                                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/**` 내 `SERVICE_ROLE` 실키/사용 | **0** — 유일 hit는 R12 secrets rotation 카탈로그 **label 문자열** (`platform-r12-post-release-display-contract.ts:156`)                                           |
| `VITE_` service key 슬롯              | **0** — 오히려 `apps/web/src/lib/env.ts` · `apps/admin/src/lib/env.ts`가 **fail-closed guard**: anon 슬롯에 `role=service_role` JWT가 들어오면 모듈 로드 시 throw |
| `.env.example`                        | placeholder만 (`YOUR_VALUE_HERE`)                                                                                                                                 |
| Edge                                  | `SUPABASE_SERVICE_ROLE_KEY`는 Deno env에서만 — constant-time 비교 gate (`service-auth.ts`)                                                                        |

## 3. RLS · GRANT (advisor + Reference 교차)

| 항목                         |                                                                                   값 | 근거                                |
| ---------------------------- | -----------------------------------------------------------------------------------: | ----------------------------------- |
| RLS enabled                  |                                                        137/137 tables · policies 248 | Reference §9.1 (2026-07-12 catalog) |
| Views `security_invoker`     |                                                                             4/4 true | Reference §9.2                      |
| `rls_enabled_no_policy` INFO |                       5 — 전부 service/RPC-only 의도 테이블 (`live_crash_rounds` 등) | MCP advisor 2026-07-13              |
| RLS/GRANT 회귀 스냅샷        | `grants_rls_inventory_test.sql` · `public_scope_hardening_test.sql` + R3 계열 테스트 | supabase/tests                      |
| anon EXECUTE definer         |                                                              8 — 공개 read 전용 정합 | advisor 실측                        |
| authenticated definer WARN   |                   206 — guard-in-body 패턴 채택에 따른 상시 표면 (M-05 마감 시 수용) | advisor 실측                        |

## 4. Admin RBAC · 인증

| 통제                   | 상태                                                                                   | 근거                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Admin RBAC fail-closed | `rpc_admin_list_role_grants` fail-closed · localStorage DEV-only — PIR P1 vitest 17/17 | [`P1/admin-rbac.md`](../../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P1/admin-rbac.md) |
| 역할별 nav allowlist   | H-07 fix — `filterAdminNavEntries` desktop/mobile/group + route gate redirect          | Registry                                                                            |
| 수동 액션 사유+감사    | H-08 fix — reason≥4 dialog + `can(earn.settlement.approve)` + audited RPC              | Registry                                                                            |
| MFA AAL2 step-up       | `/mfa/*` + `_assert_admin_aal2` (high-risk RPC) · `admin_mfa_aal2_test.sql`            | migrations · Phase 1 §14                                                            |
| SIWE                   | `siweLoginLive=false` (M-04 이후 잠금) · edge가 body user_id 거부                      | Registry M-04                                                                       |
| Leaked password (HIBP) | **BLOCKED_DEP** — Pro+ 활성 후 `stack:auth-hibp-enable` 1회                            | Registry H-09                                                                       |

## 5. 잔여 위험 정리

| 위험                                      | 심각도             | 처리                                                                                               |
| ----------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| H-09 HIBP 비활성                          | HIGH (BLOCKED_DEP) | Pro+ 결제 시 즉시 활성 — 코드 준비 완료 · Public Launch 전 권장                                    |
| authenticated definer 206 WARN            | 수용됨             | 신규 RPC 추가 시 guard-in-body + REVOKE 규율 유지 (25-postgres-plpgsql)                            |
| Freeze 중 migration 워킹트리 수정 (SA-01) | MEDIUM             | operator가 Critical-fix 적격 여부 판정 후 `stack:push-remote` — [`02_DATABASE.md`](02_DATABASE.md) |
| 운영 auth test-like 계정 3                | 마감               | M-17 — banned_until 2099 처리 완료                                                                 |

## 6. NOT VERIFIED

- 런타임 침투 테스트 (pentest 스크립트 존재하나 본 감사 미실행 — G13/READ-ONLY)
- Cloudflare Pages 배포 헤더/CSP 실측 (R8 evidence 인용으로 대체)
