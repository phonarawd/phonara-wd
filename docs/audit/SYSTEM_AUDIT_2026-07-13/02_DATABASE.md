# Pillar 2 — Database (migrations · RLS · RPC · advisor)

> **감사일:** 2026-07-13 · **READ-ONLY** — MCP `list_migrations` · `get_advisors` · 로컬 파일 실측만 (DDL/DML 0)
> **Baseline:** [`PLATFORM_AUDIT_REFERENCE.md`](../PLATFORM_AUDIT_REFERENCE.md) §9 (2026-07-12 catalog) + 본 세션 재실측
> **Wave 0/5 갱신 (2026-07-13):** SA-01 migration 3건 추가 push-fix loop 정리 · SA-04 Edge/SQL cross-use 스캔 완료 · advisor WARN/unused_index accepted waiver 고정 — [§7](#7-accepted-waiver-2026-07-13)

## 점수

| 항목         |                                                      점수 |
| ------------ | --------------------------------------------------------: |
| **Database** | **82 / 100** (원 점수) → **85 / 100** (2026-07-13 재산정) |

감점 근거(원 감사 시점): 로컬 migration 2건 원격 미적용(SA-01) · advisor WARN 215 잔존(수용된 표면이나 authenticated definer 206은 지속 감시 필요) · unused index 167. RLS 137/137 · advisor ERROR 0 · 보존 Σ=0 이력은 세계 수준.

**2026-07-13 재산정 (SA-01 partial · SA-04 VERIFIED_FIXED):** SA-04(Edge/SQL RPC cross-use 미판정)는 `scripts/audit/generate-rpc-usage-matrix.ts`에 Edge Function·SQL call-site 스캔을 추가해 완전히 마감(§7 accepted waiver). SA-01은 migration 코드 측(commit·push·CI quality/e2e/advisors green)은 완료했으나, `sql` job 자체는 **여전히 RED** — 이번 세션에서 발견/조사한 사전 존재 conservation 버그 2건(`ew_e21_hedge_reduce_only_test.sql`·`ew_e22_sports_parity_test.sql`, 근본 원인 가설 대폭 축소했으나 미확정 — 위 표 참조)이 남아 있어 `stack:push-remote`는 아직 실행하지 않았다(96-prod-apply-agent-deny 정본 순서 준수). +3점만 반영한 이유: 이 두 conservation 버그는 **머니 코드**이며 sql job green 없이는 SA-01을 완전히 마감할 수 없다.

**2026-07-14 Phase 2 closeout:** SA-01 → **`VERIFIED_FIXED`**. E21/E22 “conservation drift”는 money RPC 결함이 아니라 Σ 스냅샷 RLS 오탐(테스트 하네스). 수정 커밋 `fd9290be`·`8fa65cc9`가 HEAD에 포함 · CI run `29271360173` 4/4 green · `check:engine-foundation-parity` missing 0 · `stack:push-remote` pending 0 · advisor ERROR 0.

## 1. Migration parity (2026-07-13 실측)

| 항목                        |                                                                               값 | 근거                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------- |
| 로컬 migration 파일         |                                                                          **244** | Wave 0 push-fix loop에서 3건 추가(`…closeout2` 이미 존재 · `…closeout3` 리버트 후 `…closeout4`로 재작성 · 순번상 최종 244) |
| `migrations.lock.json` 항목 |                                                                 **244** (sha256) | lock 파일 실측                                                                                                             |
| **원격 동기화**             | `bun run stack:push-remote` 실행 대기 — [§8](#8-w0-push-fix-loop-실행-기록) 참조 | Wave 0 실행 로그                                                                                                           |
| 원격 중복 name              |                                     1 — `p1b_admin_ops_visibility` (version 2개) | MCP list + Reference §9.3 동일 (변동 없음)                                                                                 |

**판정 갱신:** 원 감사에서 발견한 SA-01(migration 2건 원격 미적용)은 Wave 0 push-fix loop에서 정리. 다만 CI `sql` job에서 4개의 pre-existing test regression(ew_e21/ew_e22 conservation · futures_parity leverage-order masking · m20_r4b wrap-detection false positive)이 발견되어, 이를 해소하는 migration 2건(`…closeout3`→revert 후 `…closeout4`)이 추가되었다. `stack:push-remote`는 CI green 확인 후 실행 예정(§8).

## 2. Advisor (MCP 실측 2026-07-13)

### 2.1 Security

| Level     |    수 | 세부                                                                                                                                                                                     |
| --------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ERROR** | **0** | 차단 오류 없음 — R3 sweep 유지                                                                                                                                                           |
| WARN      |   215 | `authenticated_security_definer_function_executable` 206 · `anon_security_definer_function_executable` 8 · `auth_leaked_password_protection` 1 (**H-09 BLOCKED_DEP** — Pro+ 요금제 의존) |
| INFO      |     5 | `rls_enabled_no_policy`: `live_crash_rounds` · `pg_webhook_replay` · `service_ingress_rate_buckets` · `siwe_challenges` · `user_game_pf_state` (전부 RPC/service-only 의도 테이블)       |

anon definer 8개: `_is_admin` · `rpc_get_fixture_markets` · `rpc_get_golden_earth_status` · `rpc_get_public_platform_status` · `rpc_get_synthetic_book` · `rpc_list_sports_catalog` · `rpc_list_sports_fixtures` · `rpc_live_crash_get_current` — 전부 공개 read 표면으로 의도 정합 (Reference §9.1과 일치).

**참고 (drift):** 2026-07-12 Reference 시점 대비 `function_search_path_mutable` 8→**0** (M-05 fix 유지 확인) · WARN 총량 225→215. **Wave 5 처분:** [§7](#7-accepted-waiver-2026-07-13) accepted waiver로 고정.

### 2.2 Performance

| Level |    수 | 세부                                                                                                                                     |
| ----- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| WARN  | **2** | `multiple_permissive_policies` — M-20 R4-c 통합 후 residual 2 (Registry 기록과 일치: `sports_sport_catalog` service ALL ∩ public SELECT) |
| INFO  |   191 | `unindexed_foreign_keys` 24 · `unused_index` 167                                                                                         |

**참고:** `auth_rls_initplan` 26→**0** (M-20 R4-b fix 유지 확인). **Wave 5 처분:** `unused_index` 167 — [§7](#7-accepted-waiver-2026-07-13) accepted waiver로 고정.

## 3. RPC 표면 (정적 — [`RPC_USAGE_MATRIX.md`](../RPC_USAGE_MATRIX.md))

| 지표                                 |                                                                                                                                             값 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------: |
| Types `rpc_*`                        |                                                                                                                                            256 |
| apps 호출 (web/admin)                |                                                                                                                                            144 |
| apps 미호출                          |                                                                                                                                            112 |
| — Edge/SQL cross-use (Wave 5 신규)   |                                                                                  **99** — edge 22 · sql_cron_or_internal 36 · sql_test_only 41 |
| — **genuinely unused** (Wave 5 신규) |                                                                                   **13** — [§7.1](#71-sa-04-genuinely-unused-rpc-13건--waiver) |
| Types에 없는 call site               |                                                                                                                                              3 |
| Live 대비 (Reference §9.4)           | frontend-used 150/249 · missing name 0 · literal arg mismatch 0 · cast debt는 R7에서 `check:rpc-type-hygiene` 0으로 마감 (M-16 VERIFIED_FIXED) |

**Wave 5 (SA-04) 마감:** `scripts/audit/generate-rpc-usage-matrix.ts`에 Edge(`supabase/functions/**`)·SQL(`supabase/migrations|tests/**`) call-site 스캔을 추가해 112건의 apps-미호출 RPC를 3가지로 분리했다 — `edge`(브라우저/edge에서 직접 호출, 22건), `sql_cron_or_internal`(cron.schedule 또는 내부 wrapper에서 호출, 36건), `sql_test_only`(SQL 통합 테스트에서만 exercise, 41건), `none`(어디에도 참조 없음, 13건). 전체 분류표는 [`RPC_USAGE_MATRIX.md`](../RPC_USAGE_MATRIX.md) §SA-04 참조.

## 4. RLS · GRANT 테스트 인벤토리

| 항목                      |                                                                                                                   값 | 근거                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------------- |
| SQL 통합 테스트           |                                                                                                        **142** files | `supabase/tests/*.sql` count 2026-07-13                                             |
| RLS/GRANT 스냅샷 테스트   |                                           존재 — `grants_rls_inventory_test.sql` · `public_scope_hardening_test.sql` | Phase 1 §14 + R3 regression 목록                                                    |
| 보존(Σ=0)·해시체인 테스트 | `conservation_test.sql` · `hardening_test.sql` + phase별 (Reference §10.2: KRW·PHON·USDT Σ=0.000000 · hash broken 0) | Reference §10                                                                       |
| R3 remediation 회귀       |                                        `h02_r3a_*` · `m06_r3b_*` · `m05_r3c_*` · `m04_r3d_*` · `h09_r3e_*` SQL tests | Finding Registry regression 필드                                                    |
| **실행 결과**             |                                                      CI `sql` job authoritative — Wave 0 push-fix loop 4 사이클 실행 | [`CI_GATE_AUTHORITY.md`](../../SSOT/CI_GATE_AUTHORITY.md) · GitHub Actions run 이력 |

Live catalog 분모 (Reference §9.1 · 2026-07-12 — 본 세션 재조회 생략): tables 137 (RLS 137/137) · views 4 (`security_invoker=true` 4/4) · RLS policies 248 · function overloads 592.

## 5. Finding (Pillar 2)

| ID          | 심각도 | 상태                        | 내용                                                                                                                                                                                                               |
| ----------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SA-01**   | MEDIUM | **VERIFIED_FIXED (Wave 0)** | 로컬 migration 2건 원격 미적용 + Freeze 중 워킹트리 수정 — Wave 0 push-fix loop로 CI green 확인 후 `stack:push-remote` 실행                                                                                        |
| SA-04       | LOW    | **VERIFIED_FIXED (Wave 5)** | types `rpc_*` 112건 apps 미호출 — Edge/SQL cross-use 스캔 완료(99 cross-use · 13 genuinely-unused) · waiver 문서화                                                                                                 |
| (링크) H-09 | HIGH   | **BLOCKED_DEP**             | leaked-password protection — Supabase Pro+ 의존 ([Registry](../../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml)) — [`w6-security-hibp`](../../../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml) operator 트랙 |

## 6. NOT VERIFIED

- 원격 live row counts · 운영 데이터 상태 (2026-07-12 Reference 수치로 대체)
- SQL 142 테스트의 현재 pass/fail 전체 목록 — CI `sql` job 최종 green 실행 로그 인용 (로컬 실행 금지 G13)
- 13건 genuinely-unused RPC의 admin desk 조립 계획 여부 (Phase R 후속 백로그 — 본 세션 범위 밖)

## 7. Accepted waiver (2026-07-13)

두 항목을 **수용된 위험(accepted waiver)**으로 고정한다. 삭제·구조 변경은 엔진 freeze(`00-post-closeout-active-ssot.mdc`) 위반이므로, 이 문서화가 처분의 최종 형태이며 향후 감사에서 동일 항목을 다시 결함으로 제기하지 않는다(단, 신규 코드가 추가로 위반하는 경우는 별도).

| 항목                                                 |  수 | 근거                                                                                                                                                                  | 수용 이유                                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | --: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authenticated_security_definer_function_executable` | 206 | rule `25-postgres-plpgsql` §Function exposure — client `rpc_*`는 body 내부에서 `auth.uid()`/`_is_admin()` guard, internal `_*` helper는 anon/authenticated에서 REVOKE | 이 코드베이스의 **의도된 아키텍처 패턴**(guard-in-body) — PostgREST가 `public` 스키마 함수를 기본 노출하는 것을 코드 레벨 가드로 상쇄. M-05(`function_search_path_mutable` 0)로 검증된 동일 패턴의 자매 항목이며, 신규 RPC 추가 시 동일 가드 규율 유지가 조건. |
| `unused_index`                                       | 167 | MCP performance advisor INFO                                                                                                                                          | 대부분 FK 인덱스·복합 인덱스로 **쓰기 경합 완화용 사전 생성**(Postgres advisor는 "아직 사용 안 됨"만 표시, "불필요"를 의미하지 않음) — 트래픽 증가(Soft Launch 이후) 시 사용률 재평가. Freeze 중 DROP INDEX는 스키마 변경이므로 범위 밖.                       |

### 7.1 SA-04 genuinely-unused RPC 13건 — waiver

Edge/SQL cross-use 스캔에서 참조를 찾지 못한 13건은 대부분 **admin desk 미조립 기능**(코드는 존재·테스트는 있으나 UI가 아직 없음)이다. 엔진 freeze로 삭제 불가하며, Phase R admin desk 백로그 항목으로 인계한다(신규 작업 아님 — 인벤토리 문서화만):

`rpc_admin_fulfill_giftcard_redeem` · `rpc_admin_get_product_analytics` · `rpc_admin_list_giftcard_fee_market` · `rpc_admin_list_linked_device_users` · `rpc_admin_list_outcome_liability` · `rpc_admin_trade_exposure_summary` · `rpc_get_co_bet_status` · `rpc_get_dr_health_summary` · `rpc_get_earn_activity_feed` · `rpc_get_reward_config` · `rpc_get_whale_mission_status` · `rpc_register_affiliate_relationship` · `rpc_request_self_exclusion_release`

## 8. W0 push-fix loop 실행 기록

Wave 0 SA-01 정리 중 CI `sql` job에서 발견된 4개 pre-existing regression과 조치:

| 발견                                                                                                                    | 근본 원인                                                                                                                                                                                                                                                                     | 조치 migration/커밋                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `futures_parity_test.sql` — `leverage_too_high` 대신 `position_mode_hedge_side_exists`/`position_mode_one_way_opposite` | E21 migration(`20260808000001`)이 hedge/one-way mode assert를 leverage bound 체크보다 먼저 주입                                                                                                                                                                               | `20260824000001_platform_sql_ci_closeout3.sql` Fix A — assert를 leverage 체크 뒤로 재배치                                 |
| `m20_r4b_rls_perf_initplan_test.sql` — "got 8" (bare auth.uid() 미해소)                                                 | `_advisor_wrap_rls_auth_expr()`의 "already wrapped" 판정이 `(select ` 리터럴 프리픽스에 고정 — RLS qual은 parsed expression tree이므로 `pg_get_expr()` 재-deparse 시 그 프리픽스가 그대로 보존되지 않음(false positive)                                                       | `20260825000001_platform_sql_ci_closeout4.sql` — 판정을 "SELECT + whitespace + auth.\*() " 앵커로 완화, R4-b sweep 재실행 |
| `futures_parity_test.sql` liquidation boundary 블록 — `position_mode_one_way_opposite`                                  | 이 테스트는 E21(2026-08-08) 이전에 작성되어 같은 시장에서 long을 닫지 않고 short를 여는 패턴 — leverage 순서 수정(Fix A) 후 one_way guard가 정상 작동하며 이 pre-E21 gap을 드러냄                                                                                             | `supabase/tests/futures_parity_test.sql` — 각 시나리오 뒤에 명시적 `rpc_close_futures_position` 추가                      |
| `ew_e21_hedge_reduce_only_test.sql` / `ew_e22_sports_parity_test.sql` conservation 불일치                               | **VERIFIED_FIXED 2026-07-14** — 원인은 money drift가 아니라 `SET LOCAL ROLE authenticated` 상태에서 Σ 스냅샷이 RLS로 가려진 **테스트 하네스** (`after≈19998` / `+36`). `fd9290be` RESET ROLE · `8fa65cc9` E22-3 RPC place. CI sql green · parity missing 0 · advisor ERROR 0. | 재착수 금지 — Phase 2 closeout ([`PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md`](../../PLAN-ZERO-DEFECT-CRITICAL-HARDENING.md)) |

#### `ew_e22_sports_parity_test.sql` — E22-2 partial cashout, `before=50000.000000 after=50036.000000` (+36 정확히)

**손계산으로 재구성한 기대값** (odds=2.0 · stake=100 · portion=40 · `sports_cashout_margin=0.05`):

- `_sports_cashout_offer`: `v_offer = trunc(100 * 2.0 * 0.95, 6) = 190` (potential_payout=200 cap 미적용)
- `v_portion_offer = trunc(190 * 40/100, 6) = 76` → `v_client = 76`
- `v_house = v_portion(40) - v_client(76) = -36` → **house 계정 36 debit 되어야 함**
- 지갑 net: `unlock(+0) + debit(-40) + credit(+76) = +36`. house net(기대): `-36`. **합 = 0 → 수식상 정확히 균형**

**기각한 가설 (근거 명시):**

- currency 태그 불일치 — `sports_house_phon` seed(`20260616000101_wave_s3_sportsbook_place_bet.sql:20`)에 `currency='PHON'` 확인, 조회 필터와 일치. **기각**.
- `_credit_wallet_internal`의 reward-issuance 분기(`phon_bonus_available`로 크레딧 + `reward_issuance_phon` debit) 오발동 — `_is_reward_issuance_reason('sports_cashout')`는 `false`(허용 목록에 `sports_%` 없음, 명시적 나열만). **기각**.
- bonus/real 분기 desync — 테스트가 `UPDATE wallets SET phon_available=...`로 직접 세팅하지만 `trg_00_a_phon_track_compat` 트리거(`20260701000001_phon_bonus_real_wagering.sql:753-758`)가 `phon_real_available`로 정확히 backfill함을 트리거 본문으로 확인. **기각**.
- `_debit_system_account`/`_credit_system_account` 구현 자체 버그 — 두 함수 모두 `code` 컬럼으로 정확히 조회·갱신·`system_account_ledger` 기록. **기각**.

**신규로 확인한 별개 결함(이 conservation 버그의 직접 원인은 아니지만 수정 필요):** `_is_phon_wagering_bet_reason`(`20260701000001_phon_bonus_real_wagering.sql:97-99`)가 `LIKE 'sports_%'`로 `'sports_stake_cashout'`(부분 캐시아웃 stake debit)까지 "신규 베팅"으로 오분류 → `_apply_wagering_progress` 오발동. 이 테스트의 유저는 활성 `bonus_wagering_requirements`가 없어 no-op이라 **이 conservation 실패의 원인은 아님**이 확인됐지만, bonus wagering이 활성인 실사용자에게는 잘못된 wagering 진행 처리가 될 수 있는 **별도 버그** — SA/후속 티켓 후보.

**남은 가설(미검증 — RAISE NOTICE 계측 필요):** `_sports_latest_odds`가 preview/execute 두 호출 사이 다른 값을 반환하는지(캐시아웃 실패로 이어지지 않았으므로 낮은 확률), 또는 `system_account_ledger` INSERT의 어떤 트리거/제약이 UPDATE 자체를 조용히 무효화하는지. **다음 세션 지시:** 로컬 `db reset` 후 `rpc_partial_cashout_sports_bet` 본문에 `v_full_offer`·`v_portion_offer`·`v_house`·`sports_house_phon.balance`(전/후) `RAISE NOTICE` 삽입 → 이 E22-2 스니펫만 `psql`로 재현.

#### `ew_e21_hedge_reduce_only_test.sql` — E21-2, `before=70000.000000 after=19998.200033` (E21-1 유저의 50000 전액 소실 추정)

- `before=70000`은 E21-1 유저(50000, USDT)+E21-2 유저(20000) 합과 정확히 일치 — **E21-1 종료 시점까지는 conservation 정상**.
- E21-1은 `one_way` 전환 후 롱 포지션(`e21-ow-l`, 200 USDT margin)을 **연 채로 블록을 종료**(반대 숏 실패 검증 후 close 없이 종료) — 의도된 설계인지 미확인이나, 이 자체는 margin이 `usdt_locked`에 남을 뿐이라 합계는 불변이어야 함.
- `rpc_run_open_order_fills()`(`20260722000003_trade_e_iceberg_fill_resume_drain.sql:4`)가 `trading_open_orders` 테이블을 **전체 유저 대상**으로 스윕하는 구조 확인 — 단, E21-1은 LIMIT/STOP 주문을 남기지 않아(전부 MARKET open) 이 스윕의 대상이 아님. **"배치 함수가 다른 유저 지갑을 오염시킨다"는 최초 가설은 이 경로로는 기각**.
- `after=19998.200033 ≈ 20000 - 1.8`(E21-2 자신의 포지션 청산 수수료로 추정되는 소액) — **E21-1 유저의 50000 전체가 SUM에서 사라진 것으로 보이며, `usdt_available`/`usdt_locked` 중 하나가 NULL이 되면 `SUM()`이 조용히 무시하는 메커니즘과 정합적**이나 어느 연산이 NULL을 만드는지는 미확인.
- **다음 세션 지시:** 로컬 재현 시 E21-1 종료 직후 E21-1 유저의 `wallets` 행을 `SELECT * FROM wallets WHERE user_id=<e21-1 uid>`로 직접 조회해 NULL/이상값 여부부터 확인.
