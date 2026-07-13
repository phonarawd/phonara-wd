# Pillar 2 — Database (migrations · RLS · RPC · advisor)

> **감사일:** 2026-07-13 · **READ-ONLY** — MCP `list_migrations` · `get_advisors` · 로컬 파일 실측만 (DDL/DML 0)
> **프로젝트:** `yocjhjsdwoijfdrehzoq` 단일 (lock 준수)
> **Baseline:** [`PLATFORM_AUDIT_REFERENCE.md`](../PLATFORM_AUDIT_REFERENCE.md) §9 (2026-07-12 catalog) + 본 세션 재실측

## 점수

| 항목         |                  점수 |
| ------------ | --------------------: |
| **Database** | **82 / 100** (Strong) |

감점 근거: 로컬 migration 2건 원격 미적용(SA-01) · advisor WARN 215 잔존(수용된 표면이나 authenticated definer 206은 지속 감시 필요) · unused index 167. RLS 137/137 · advisor ERROR 0 · 보존 Σ=0 이력은 세계 수준.

## 1. Migration parity (2026-07-13 실측)

| 항목                          |                                                               값 | 근거                                                     |
| ----------------------------- | ---------------------------------------------------------------: | -------------------------------------------------------- |
| 로컬 migration 파일           |                                                          **241** | `supabase/migrations/*.sql` count                        |
| `migrations.lock.json` 항목   |                                                 **241** (sha256) | lock 파일 실측                                           |
| 원격 migration rows           |                                                          **239** | MCP `list_migrations` + `check:engine-foundation-parity` |
| **원격 미적용 (name parity)** | **2** — `platform_sql_ci_closeout` · `platform_sql_ci_closeout2` | parity 스크립트 출력                                     |
| 원격 중복 name                |                     1 — `p1b_admin_ops_visibility` (version 2개) | MCP list + Reference §9.3 동일                           |

**판정:** 로컬 워킹트리의 SQL CI closeout migration 2건이 아직 `stack:push-remote`로 원격 동기화되지 않았다. 규칙(`20-supabase-safety` · `96`)상 migration 변경은 로컬 게이트 green 후 `stack:push-remote`까지가 마감 조건 → **Finding SA-01 (MEDIUM · OPEN)**. Freeze ACTIVE 상태이므로 push 시점은 CI-fix critical 경로 여부를 operator가 확인해야 한다 (`UNVERIFIED` 의도).

## 2. Advisor (MCP 실측 2026-07-13)

### 2.1 Security

| Level     |    수 | 세부                                                                                                                                                                                     |
| --------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERROR** | **0** | 차단 오류 없음 — R3 sweep 유지                                                                                                                                                           |
| WARN      |   215 | `authenticated_security_definer_function_executable` 206 · `anon_security_definer_function_executable` 8 · `auth_leaked_password_protection` 1 (**H-09 BLOCKED_DEP** — Pro+ 요금제 의존) |
| INFO      |     5 | `rls_enabled_no_policy`: `live_crash_rounds` · `pg_webhook_replay` · `service_ingress_rate_buckets` · `siwe_challenges` · `user_game_pf_state` (전부 RPC/service-only 의도 테이블)       |

anon definer 8개: `_is_admin` · `rpc_get_fixture_markets` · `rpc_get_golden_earth_status` · `rpc_get_public_platform_status` · `rpc_get_synthetic_book` · `rpc_list_sports_catalog` · `rpc_list_sports_fixtures` · `rpc_live_crash_get_current` — 전부 공개 read 표면으로 의도 정합 (Reference §9.1과 일치).

**참고 (drift):** 2026-07-12 Reference 시점 대비 `function_search_path_mutable` 8→**0** (M-05 fix 유지 확인) · WARN 총량 225→215.

### 2.2 Performance

| Level |    수 | 세부                                                                                                                                     |
| ----- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| WARN  | **2** | `multiple_permissive_policies` — M-20 R4-c 통합 후 residual 2 (Registry 기록과 일치: `sports_sport_catalog` service ALL ∩ public SELECT) |
| INFO  |   191 | `unindexed_foreign_keys` 24 · `unused_index` 167                                                                                         |

**참고:** `auth_rls_initplan` 26→**0** (M-20 R4-b fix 유지 확인).

## 3. RPC 표면 (정적 — [`RPC_USAGE_MATRIX.md`](../RPC_USAGE_MATRIX.md))

| 지표                       |                                                                                                                                             값 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------: |
| Types `rpc_*`              |                                                                                                                                            256 |
| apps 호출 (web/admin)      |                                                                                                                                            144 |
| **apps 미호출**            |                                                                  **112** — Edge/SQL/cron 사용 가능성 있어 삭제 후보 아님 (Finding SA-04 · LOW) |
| Types에 없는 call site     |                                                                                                                                              3 |
| Live 대비 (Reference §9.4) | frontend-used 150/249 · missing name 0 · literal arg mismatch 0 · cast debt는 R7에서 `check:rpc-type-hygiene` 0으로 마감 (M-16 VERIFIED_FIXED) |

미호출 112 샘플 (matrix): `rpc_accept_co_bet` · `rpc_admin_fulfill_giftcard_redeem` · `rpc_admin_list_giftcard_fee_market` · `rpc_admin_void_game_bet` 등 — 상당수가 admin 미조립 desk 기능 또는 service/cron 전용. 전수 Edge/SQL cross-use 판정은 **UNVERIFIED** (범위 밖).

## 4. RLS · GRANT 테스트 인벤토리

| 항목                      |                                                                                                                   값 | 근거                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------- |
| SQL 통합 테스트           |                                                                                                        **142** files | `supabase/tests/*.sql` count 2026-07-13                   |
| RLS/GRANT 스냅샷 테스트   |                                           존재 — `grants_rls_inventory_test.sql` · `public_scope_hardening_test.sql` | Phase 1 §14 + R3 regression 목록                          |
| 보존(Σ=0)·해시체인 테스트 | `conservation_test.sql` · `hardening_test.sql` + phase별 (Reference §10.2: KRW·PHON·USDT Σ=0.000000 · hash broken 0) | Reference §10                                             |
| R3 remediation 회귀       |                                        `h02_r3a_*` · `m06_r3b_*` · `m05_r3c_*` · `m04_r3d_*` · `h09_r3e_*` SQL tests | Finding Registry regression 필드                          |
| **실행 결과**             |                                                                   로컬 미실행 (G13) — **CI `sql` job authoritative** | [`CI_GATE_AUTHORITY.md`](../../SSOT/CI_GATE_AUTHORITY.md) |

Live catalog 분모 (Reference §9.1 · 2026-07-12 — 본 세션 재조회 생략): tables 137 (RLS 137/137) · views 4 (`security_invoker=true` 4/4) · RLS policies 248 · function overloads 592.

## 5. Finding (Pillar 2)

| ID          | 심각도 | 상태            | 내용                                                                                                                                                               |
| ----------- | ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SA-01**   | MEDIUM | OPEN            | 로컬 migration 2건(`platform_sql_ci_closeout`·`…2`) 원격 미적용 + Freeze 중 워킹트리에서 수정 — `stack:push-remote` 미완 · CI-fix critical 여부 operator 확인 필요 |
| SA-04       | LOW    | OPEN            | types `rpc_*` 112건 apps 미호출 — Edge/SQL cross-use 전수 판정 미실시 (인벤토리 관리 부채)                                                                         |
| (링크) H-09 | HIGH   | **BLOCKED_DEP** | leaked-password protection — Supabase Pro+ 의존 ([Registry](../../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml))                                                |

## 6. NOT VERIFIED

- 원격 live row counts · 운영 데이터 상태 (2026-07-12 Reference 수치로 대체)
- SQL 142 테스트의 현재 pass/fail — CI `sql` job 인용 (로컬 실행 금지 G13)
- 112 미호출 RPC의 Edge/SQL/cron 실사용 전수
