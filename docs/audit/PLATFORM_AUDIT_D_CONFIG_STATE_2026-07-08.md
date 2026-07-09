# 플랫폼 감사 D — app_config ↔ 서버 게이트 / client precheck / 원격 ops 상태

> **일자:** 2026-07-08 · **범위:** Section D (읽기 전용) · **선행:** `pqa-audit-c-surface-controls` `[x]`  
> **판정 태그:** `PASS` / `FAIL` / `P1` / `P2` / `P3` / `UNVERIFIED` (`30-audit-discipline`)  
> **프로젝트 lock:** `yocjhjsdwoijfdrehzoq` only

---

## 실행 요약

| 항목                                | 정적 스캔 (repo) | 원격 prod (MCP read-only)                             | 최종 판정                   |
| ----------------------------------- | ---------------- | ----------------------------------------------------- | --------------------------- |
| `app_config` 키 (migration 참조)    | **212**          | **245** live rows                                     | **PASS** (live ≥ migration) |
| Platform `PLATFORM_CONFIG_KEYS` (9) | contract + hook  | **9/9** `is_public=true`                              | **PASS**                    |
| Server gate helper 존재             | migration 정적   | **6/7** helpers live (`_assert_funding_enabled` 별도) | **PASS**                    |
| Geo gate RPC 주입                   | migration only   | **0** `rpc_*` with `_assert_not_geo_blocked`          | **P2**                      |
| Client gate precheck gap            | **15** P2 rows   | cross/funding `is_public=false`                       | **P2** (Plan §33.3 #4 확정) |
| Security advisor ERROR              | —                | **0**                                                 | **PASS**                    |
| Security advisor WARN               | —                | **147** (anon SECURITY DEFINER executable)            | **P2관찰** (A와 동일)       |
| Migration name parity               | local **208**    | remote **203** · missing **5**                        | **P1**                      |
| `reconciliation_log` Σ/global_zero  | 로컬 Docker OFF  | **PHON/USDT/KRW** `is_match=true` · delta **0**       | **PASS** (prod)             |
| Hash-chain (`hash_chain_*`)         | 로컬 UNVERIFIED  | wallet **0** broken · system **0** broken             | **PASS** (prod)             |
| `system_halt` / `system_readonly`   | —                | **false** / **false**                                 | **PASS** (prod)             |

**재현 스크립트:**

```powershell
bun run tsx scripts/audit/audit-d-config-state.ts
bun run tsx scripts/check-remote-migration-parity.ts
```

**산출 JSON:** `scripts/audit/last-d-config-state-report.json`

**원격 MCP (read-only · 2026-07-08):** `get_advisors(security)` · `list_migrations` · `execute_sql` SELECT — project `yocjhjsdwoijfdrehzoq`

---

## 1. app_config 키 인벤토리

| 소스                                        | 개수                                                  | 근거                                                                                 |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Migration INSERT/`_app_config_numeric` 참조 | **212** unique keys                                   | `audit-d-config-state.ts` · `migrationKeyRefs`                                       |
| Prod live `app_config`                      | **245**                                               | MCP `execute_sql` `count(*)`                                                         |
| Web client explicit key lists               | **9** platform + **2** trade launch + **1** whitelist | `platform-gate-contract.ts` · `use-trade-launch-flags.ts` · `use-crypto-withdraw.ts` |
| Admin kill-switch desk                      | **10**                                                | `useAdminOperations.ts:KILL_DEFS`                                                    |
| Admin missions desk select                  | **16** earn/viral keys                                | `useAdminMissionsDesk.ts:CONFIG_SELECT_KEYS`                                         |

**관찰 (PASS):** live 245 > migration-ref 212 — 운영 튜닝·후속 migration seed 정상. 미참조 live-only 키 상세는 JSON `matrix` 전체 열거.

---

## 2. 서버 게이트 ↔ 키 매트릭스 (핵심)

| 게이트 종류        | config key(s)                                             | 서버 enforcement                                               | 근거                                                                      |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **system_live**    | `system_halt`, `system_readonly`                          | `_assert_system_live()` → 모든 balance-moving RPC 선행         | `20260609000018_p0_system_live_guard.sql:43–64`                           |
| **feature_kill**   | `feature_<name>_enabled`                                  | `_assert_feature_enabled(name)`                                | `20260609000019_p0_feature_kill_switches.sql:41–57`                       |
| **consent**        | `consent_gate_enabled`                                    | `_assert_onboarding_consent(user_id)` · prod **16** rpc        | MCP `rpcs_with_consent=16`                                                |
| **withdrawal_mfa** | `withdrawal_mfa_step_up_enabled`                          | `_assert_withdrawal_mfa_step_up()` · prod **1** rpc            | `20260623000007_withdrawal_mfa_step_up.sql` · MCP `rpcs_with_mfa=1`       |
| **geo**            | `geo_block_enabled`                                       | `_assert_not_geo_blocked(user_id)` **정의만** · RPC 주입 **0** | `20260627000001_worldno1_money_ops_rails.sql:749` · MCP `rpcs_with_geo=0` |
| **trade_launch**   | `feature_cross_margin_enabled`, `feature_funding_enabled` | `_assert_cross_margin_enabled()` · `_assert_funding_enabled()` | `20260620000140_trade_launch_funding_cross_gates.sql`                     |
| **per_game**       | `feature_game_<slug>_enabled` (12종)                      | casino place/settle 동적 key read                              | `20260609000029_s3_casino_atomic_settlement.sql:91`                       |
| **numeric_limit**  | `casino_*`, `sports_*`, `earn_*`, `aml_*` 등              | `_app_config_numeric(key, default)`                            | 다수 migration · REVOKE client                                            |

### 2.1 Platform kill-switch client read (E9)

`PLATFORM_CONFIG_KEYS` 9종 — prod 전부 `is_public=true` · `platform_gate_client_read_test.sql` 계약과 **일치**.

| key                          | prod value | is_public |
| ---------------------------- | ---------- | --------- |
| `system_halt`                | false      | true      |
| `system_readonly`            | false      | true      |
| `feature_game_enabled`       | true       | true      |
| `feature_spot_enabled`       | true       | true      |
| `feature_futures_enabled`    | true       | true      |
| `feature_staking_enabled`    | true       | true      |
| `feature_deposit_enabled`    | true       | true      |
| `feature_withdrawal_enabled` | true       | true      |
| `feature_sports_enabled`     | true       | true      |

근거: MCP `execute_sql` 2026-07-08 · `apps/web/src/domain/platform-gate-contract.ts:6–16` · `20260702000001_platform_gate_client_read.sql`

---

## 3. Client precheck ↔ server gate 불일치 (Plan §33.3 #4 확정)

| #    | key                              | 심각도 | 서버                                      | 클라이언트                                                         | 판정                    |
| ---- | -------------------------------- | ------ | ----------------------------------------- | ------------------------------------------------------------------ | ----------------------- |
| 1    | `consent_gate_enabled`           | **P2** | 16 RPC · prod **true**                    | web precheck **없음** (admin settings 표시만)                      | fail-closed RPC만       |
| 2    | `withdrawal_mfa_step_up_enabled` | **P2** | withdrawal RPC · prod **true**            | `translate-error` 매핑만 · UI step-up precheck **없음**            | `translate-error.ts:86` |
| 3    | `geo_block_enabled`              | **P2** | helper 존재 · **RPC 미주입**              | `profiles.geo_blocked` read (`geo-block.ts`) · `app_config` 미조회 | 서버·클라 이중 gap      |
| 4    | `feature_cross_margin_enabled`   | **P2** | `_assert_cross_margin_enabled`            | `use-trade-launch-flags` 조회 · **`is_public=false`** → RLS 빈값   | UI 항상 off 가능        |
| 5    | `feature_funding_enabled`        | **P2** | `_assert_funding_enabled` · prod **true** | 동일 · **`is_public=false`**                                       | 서버 on · UI 미반영     |
| 6    | `withdrawal_whitelist_enabled`   | **P2** | withdrawal RPC branch                     | `use-crypto-withdraw.ts:127` · **`is_public=false`**               | whitelist UI 신뢰 불가  |
| 7–18 | `feature_game_*_enabled` (12)    | **P2** | per-game server kill                      | aggregate `feature_game_enabled` only (`use-casino-round.ts:63`)   | 게임별 UI 차단 없음     |

**수정 큐:** `pqa-fix-client-gate-prechecks` (F2) — presentation glue only · 엔진 migration 없이 `is_public` 플래그 또는 전용 public read RPC 검토.

---

## 4. 원격 ops 상태 (MCP read-only)

### 4.1 `system_halt` / `system_readonly`

Prod: **false** / **false** — **PASS** (2026-07-08 MCP)

로컬 dev `system_readonly=true` 잔존 가능성은 A 감사와 동일 — `seed-local-trade-dev.ts` ledger-less UPDATE (Plan §33.3 #6). **로컬만 P1** · prod 무관.

### 4.2 `reconciliation_log` / Σ (global_zero)

최근 run `2026-07-08T02:00:00Z`:

| check_type  | currency      | is_match | delta    | triggered_halt |
| ----------- | ------------- | -------- | -------- | -------------- |
| global_zero | PHON          | true     | 0.000000 | false          |
| global_zero | USDT          | true     | 0.000000 | false          |
| global_zero | KRW           | true     | 0.000000 | false          |
| wallet      | PHON/USDT/KRW | true     | 0.000000 | false          |
| system      | PHON/USDT/KRW | true     | 0.000000 | false          |

**판정:** prod **Σ=0 PASS** — P0 돈 보존 blocker **없음**.

### 4.3 Hash-chain

| check_type        | is_match | broken_count | run_at               |
| ----------------- | -------- | ------------ | -------------------- |
| hash_chain_wallet | true     | **0**        | 2026-07-08T02:00:00Z |
| hash_chain_system | true     | **0**        | 2026-07-08T02:00:00Z |

**판정:** **PASS** — `verify_ledger_hash_chain` / `verify_system_account_hash_chain` reconciliation 경로 정상.

### 4.4 Security advisor

| level | count   |
| ----- | ------- |
| ERROR | **0**   |
| WARN  | **147** |
| INFO  | 1       |

WARN 대표: `anon_security_definer_function_executable` — A 감사 **P2관찰**과 동일. ERROR **0** = **PASS**.

### 4.5 Migration parity

|             | local                                 | remote                      |
| ----------- | ------------------------------------- | --------------------------- |
| count       | **208**                               | **203**                     |
| latest name | `spot_major_buy_fee_conservation_fix` | `zero_defect_sql_hardening` |

**Remote missing (name parity · P1):**

1. `trade_t0b_oracle_aal2_guard`
2. `trade_e_phase_e_advanced_orders`
3. `trade_e_iceberg_fill_slice_loop`
4. `trade_e_iceberg_fill_resume_drain`
5. `spot_major_buy_fee_conservation_fix`

**판정:** **P1** — operator `stack:push-remote` 큐 (engine touch · RED STOP). D 감사는 read-only이므로 apply **금지**.

---

## 5. UNVERIFIED

| 항목                                    | 이유                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| 로컬 Docker `app_config` live matrix    | Docker Desktop OFF — `dbSource: none`                   |
| 로컬 `reconciliation_log` / hash-chain  | 동일                                                    |
| `test:sql` platform_gate / conservation | G13 — CI **sql** job authoritative                      |
| 전체 245키 × RPC dynamic read 교차      | 정적+helper scan — 일부 operator 튜닝 키 **UNVERIFIED** |

---

## 6. E 착수 게이트 (`pqa-audit-report`)

- [x] D config 매트릭스 + JSON 산출 + 재현 스크립트
- [x] C 선행 (`PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md`)
- [x] Prod advisor **0 ERROR** · Σ/hash-chain **PASS**
- [x] Server↔client gate gap **15**건 P2 문서화 (F2 큐)
- [x] Migration parity drift **5**건 P1 등록

**`pqa-audit-report` `[x]` DONE** — `PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`

## 7. F 착수 게이트 (`pqa-fix-*`)

- [x] E P0–P3 결함 대장 + 수정 큐 매트릭스
- [x] ACTIVE_WORK_SSOT §82 PQA sync · `audit:pqa-*` scripts
- [ ] **`pqa-fix-error-mapping`** — operator 승인 후 presentation 수정 착수

---

## 교차 참조

- Plan: `phase_r_super-app_8bdf2c10` §33.2 #D
- 선행: `docs/audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md`
- 스크립트: `scripts/audit/audit-d-config-state.ts`
- JSON: `scripts/audit/last-d-config-state-report.json`
- 수정 큐: `pqa-fix-client-gate-prechecks` · `stack:push-remote` (migration parity)
