# 플랫폼 감사 E — P0–P3 심각도 결함 대장 (Zero-Defect Audit)

> **일자:** 2026-07-08 · **범위:** Section E — A/B/C/D 산출 통합 · **읽기 전용 감사 마감**  
> **판정 태그:** `PASS` / `FAIL` / `P0` / `P1` / `P2` / `P3` / `UNVERIFIED` (`30-audit-discipline`)  
> **프로젝트 lock:** `yocjhjsdwoijfdrehzoq` only  
> **선행:** `pqa-audit-d-config-state` `[x]` · A/B/C `[x]`

---

## Executive Summary

| 심각도               | 건수       | prod blocker | 요약                                                                                  |
| -------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------- |
| **P0**               | **0**      | **없음**     | prod Σ=0 · hash-chain 0 broken · advisor ERROR 0 · balance-moving guard gap 0         |
| **P1**               | **3**      | **2**        | Realtime publication 10테이블 · migration parity 5건 · `rpc_update_oracle_price` AAL2 |
| **P2**               | **14**     | 0 (UX/계약)  | error 매핑 9건 · client gate precheck 6그룹 · types drift · admin error map           |
| **P3**               | **7**      | 0            | casino stub · settings api-keys · sports VIP · route boundary · scanner 한계          |
| **PASS** (결함 아님) | 다수       | —            | guard coverage · RLS · i18n · dead control 정적 0 · platform kill-switch public read  |
| **UNVERIFIED**       | **8** 그룹 | —            | 로컬 Docker OFF · live RPC 전수 · E2E/SQL CI 위임                                     |

**운영 판정:** prod **P0 blocker 없음** — **§33 G (`pqa-gate-platform-audit`) `[x]` DONE** 2026-07-09 · F1–F5 + E5 수정 큐 green · **P10 잔여(#180+) 착수 unblock**.  
**로컬 dev:** `system_readonly=true` 잔존은 **P2(local)** — prod 무관.

**통합 근거 문서:**

| Section | 문서                                                         | JSON                                                |
| ------- | ------------------------------------------------------------ | --------------------------------------------------- |
| A       | `docs/audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`        | `last-a-db-guards-report.json` (Docker ON 후)       |
| B       | `docs/audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`     | `scripts/audit/last-b-rpc-contract-report.json`     |
| C       | `docs/audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md` | `scripts/audit/last-c-surface-controls-report.json` |
| D       | `docs/audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md`     | `scripts/audit/last-d-config-state-report.json`     |

**재현 (감사 재실행):**

```powershell
bun run tsx scripts/audit/audit-a-db-guards.ts          # Docker ON
bun run tsx scripts/audit/audit-b-rpc-contract.ts
bun run tsx scripts/audit/audit-c-surface-controls.ts
bun run tsx scripts/audit/audit-d-config-state.ts
bun run tsx scripts/check-remote-migration-parity.ts
```

---

## 1. P0 — 돈 / 보안 (즉시 STOP)

**등록 결함: 0건.** 아래는 **PASS 근거** (결함 대장에 “미발견”으로 명시).

| 검증 항목                            | prod 판정 | 근거                                                                |
| ------------------------------------ | --------- | ------------------------------------------------------------------- |
| Global zero Σ                        | **PASS**  | D §4.2 — PHON/USDT/KRW `delta=0` · `is_match=true` (MCP 2026-07-08) |
| Hash-chain                           | **PASS**  | D §4.3 — wallet/system `broken_count=0`                             |
| Security advisor ERROR               | **PASS**  | A §요약 · D §4.4 — ERROR **0**                                      |
| balance-moving guard gap             | **PASS**  | A §1 — `check:guard-coverage` gap **0** (로컬)                      |
| anon 테이블 write GRANT              | **PASS**  | A §2.2 — empty (로컬·prod)                                          |
| RLS disabled public tables           | **PASS**  | A §2.2 — ∅                                                          |
| system_halt / system_readonly (prod) | **PASS**  | D §4.1 — **false** / **false**                                      |

**재현 (P0 부재 확인):** 원격 MCP `execute_sql` — `reconciliation_log` 최근 `global_zero` · `hash_chain_*` · `get_advisors(security)`.

**UNVERIFIED (P0 경로 — CI authoritative):**

| 항목                                    | 이유                                    |
| --------------------------------------- | --------------------------------------- |
| `test:sql` conservation 103건           | G13 — GitHub **sql** job                |
| AAL1/halt 런타임 probe                  | `guard-audit.ts` — app_config 쓰기 필요 |
| 로컬 `grants_rls_inventory` 전 table 핀 | Docker Desktop OFF (A 세션 2)           |

---

## 2. P1 — 기능 파손 / 400 / prod parity

### P1-001 · `rt-pub-trade-wallet` — Realtime publication 누락

| 필드                 | 내용                                                                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **심각도**           | **P1**                                                                                                                                                                                                                           |
| **증상**             | trade/wallet 구독 10테이블 — `postgres_changes` 이벤트 **미전달** → 가격·지갑·주문·포지션 실시간 invalidate **무동작**                                                                                                           |
| **근거**             | `apps/web/src/hooks/use-trading.ts:495` (`oracle_prices`) · `:395` (`price_ticks`) · `use-wallet.ts:41,74` · `use-trade-realtime-feedback.ts:159–187` · prod `supabase_realtime`에 **6테이블만** (sports 3 + deposit 3) — B §5.2 |
| **누락 테이블 (10)** | `oracle_prices` · `price_ticks` · `wallets` · `wallet_ledger` · `spot_open_orders` · `trading_open_orders` · `futures_positions` · `spot_order_fills` · `trading_order_fills` · `staking_positions`                              |
| **재현**             | 1) 로그인 후 `/trade` 2) DevTools Network → Realtime channel connect OK 3) DB에서 `oracle_prices` UPDATE 4) UI 잔고/마크 **갱신 없음** (invalidate 미발화)                                                                       |
| **수정 방향**        | `launch-engine-e5-realtime-publication` (F5) — migration `ALTER PUBLICATION supabase_realtime ADD TABLE …` · RED-first SQL test · `stack:push-remote` · advisor 0                                                                |
| **수정 큐**          | `launch-engine-e5-realtime-publication`                                                                                                                                                                                          |

---

### P1-002 · `migration-parity-drift-5` — 원격 migration 5건 미적용

| 필드                | 내용                                                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **심각도**          | **P1**                                                                                                                                                                              |
| **증상**            | local **208** · remote **203** — 이름 parity 기준 **5건** prod 미적용 → RPC/가드/수수료 fix **드리프트**                                                                            |
| **근거**            | D §4.5 · `scripts/check-remote-migration-parity.ts`                                                                                                                                 |
| **미적용 name (5)** | `trade_t0b_oracle_aal2_guard` · `trade_e_phase_e_advanced_orders` · `trade_e_iceberg_fill_slice_loop` · `trade_e_iceberg_fill_resume_drain` · `spot_major_buy_fee_conservation_fix` |
| **재현**            | `bun run tsx scripts/check-remote-migration-parity.ts` → missing 5 출력                                                                                                             |
| **수정 방향**       | operator/engine RED STOP — local `db reset` → `test:sql` Σ=0 (CI) → **`bun run stack:push-remote`** → advisor 0                                                                     |
| **수정 큐**         | `stack:push-remote` (engine-p0)                                                                                                                                                     |

---

### P1-003 · `rpc-update-oracle-aal2-prod` — Admin oracle RPC MFA gap (prod)

| 필드          | 내용                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **심각도**    | **P1**                                                                                                                                                                    |
| **증상**      | authenticated가 `rpc_update_oracle_price` 호출 가능 · prod live def에 `_assert_admin_aal2()` **없음** — oracle/market side-effect                                         |
| **근거**      | A §5 — prod live def MCP 2026-07-08 · 로컬 migration `20260721000003_trade_t0b_phon_internal_oracle.sql:72+` vs prod 미적용(`P1-002` 연관) · allowlist 미등록             |
| **재현**      | 1) prod JWT (authenticated + admin role) 2) `rpc('rpc_update_oracle_price', { p_symbol, p_price, … })` 3) AAL2 없이 성공 가능 (**UNVERIFIED** 런타임 — 정적+MCP def 확인) |
| **수정 방향** | `trade_t0b_oracle_aal2_guard` migration apply(P1-002) 또는 신규 migration AAL2 주입 + inventory test · `stack:push-remote`                                                |
| **수정 큐**   | `P1-002` 선행 · engine RED STOP                                                                                                                                           |

---

## 3. P2 — UX / 미매핑 / gate 불일치 / stale types

### 3.1 Error mapping (web)

| id            | code                                 | 근거                                                                                              | 재현                                          | 수정                       |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------- |
| **P2-ERR-01** | `order_not_found`                    | migration `20260722000001_trade_e_phase_e_advanced_orders.sql:134` · `translate-error.ts` 미등록  | Phase E 주문 취소/조회 실패 → `error.UNKNOWN` | `pqa-fix-error-mapping`    |
| **P2-ERR-02** | `post_only_would_cross`              | 동일 `:264`                                                                                       | post-only 주문 거절                           | 동일                       |
| **P2-ERR-03** | `invalid_time_in_force`              | 동일 `:64`                                                                                        | TIF 잘못된 입력                               | 동일                       |
| **P2-ERR-04** | `market_hedge_blocked`               | `20260616000108_wave_s13_sportsbook_anti_arb_defense.sql:210`                                     | 스포츠 hedge 차단                             | 동일                       |
| **P2-ERR-05** | `sports_user_banned`                 | 동일 `:138`                                                                                       | 밴된 유저 베팅                                | 동일                       |
| **P2-ERR-06** | `withdrawal_address_not_whitelisted` | `20260629000001_worldno1_vertical_hardening.sql:61`                                               | 화이트리스트 외 출금                          | 동일                       |
| **P2-ERR-07** | `geo_blocked`                        | `20260627000001_worldno1_money_ops_rails.sql:765`                                                 | geo 차단 출금/베팅                            | 동일                       |
| **P2-ERR-08** | `market_not_found` 중복 needle       | `translate-error.ts:56` → `INVALID_INPUT` · `:66` → `SPORTS_FIXTURE_CLOSED` (**도달 불가**)       | 스포츠 `market_not_found` → 잘못된 i18n       | needle 순서/전용 code 분리 |
| **P2-ERR-09** | `affiliate_self_forbidden`           | migration `20260611000074_affiliate_relationships_depth.sql:57` · needle `forbidden` 선매칭 `:59` | 자기 추천 등록 → generic `FORBIDDEN`          | 전용 needle **앞**에 삽입  |

**규모:** migration stable code **294** · 미매핑 **190** (B JSON) — **client-facing 우선** 위 9건.

---

### P2-ERR-10 · Admin error map 부재

| 필드     | 내용                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| **근거** | `apps/admin/src/lib/rpc.ts:13–26` — `RPC_ERROR_CODES` **12종** · web `translate-error` **없음** |
| **재현** | admin desk RPC 실패 → raw/영문 code 노출 가능                                                   |
| **수정** | `pqa-fix-error-mapping` (admin slice)                                                           |

---

### P2-TYPES-01 · `database.types.ts` drift

| RPC                                 | 근거                                  | 수정                    |
| ----------------------------------- | ------------------------------------- | ----------------------- |
| `rpc_run_stop_orders`               | B §2.3 · types Grep 0건 · prod EXISTS | `pqa-fix-types-regen`   |
| `rpc_run_open_order_fills`          | 동일                                  | 동일                    |
| `rpc_spot_market_buy` dual overload | types 단일 merge · 동작 OK            | regen + overload 정직화 |

---

### P2-GATE — Server ↔ client precheck (Plan §33.3 #4 · D §3)

| id             | key                              | 서버                                  | 클라이언트 gap                                                   | 근거                           |
| -------------- | -------------------------------- | ------------------------------------- | ---------------------------------------------------------------- | ------------------------------ |
| **P2-GATE-01** | `consent_gate_enabled`           | 16 RPC · prod true                    | web precheck 없음                                                | D §3 #1 · admin settings만     |
| **P2-GATE-02** | `withdrawal_mfa_step_up_enabled` | withdrawal RPC                        | `translate-error.ts:86` 매핑만 · UI step-up precheck 없음        | D §3 #2                        |
| **P2-GATE-03** | `geo_block_enabled`              | helper 존재 · **RPC 주입 0**          | `profiles.geo_blocked` only · `app_config` 미조회                | D §3 #3 · `20260627000001:749` |
| **P2-GATE-04** | `feature_cross_margin_enabled`   | `_assert_cross_margin_enabled`        | `use-trade-launch-flags` · **`is_public=false`**                 | D §3 #4                        |
| **P2-GATE-05** | `feature_funding_enabled`        | `_assert_funding_enabled` · prod true | 동일 RLS 빈값 → UI off                                           | D §3 #5                        |
| **P2-GATE-06** | `withdrawal_whitelist_enabled`   | withdrawal branch                     | `use-crypto-withdraw.ts:127` · **`is_public=false`**             | D §3 #6                        |
| **P2-GATE-07** | `feature_game_*_enabled` (×12)   | per-game server kill                  | aggregate `feature_game_enabled` only · `use-casino-round.ts:63` | D §3 #7–18                     |

**재현 (대표):** `/trade` cross margin UI — 서버 gate on · client `use-trade-launch-flags` RLS empty → 토글 **항상 off** 표시.

**수정:** `pqa-fix-client-gate-prechecks` (F2) — `is_public` 또는 public read RPC · presentation glue only.

---

### P2-LOCAL-01 · dev `system_readonly=true` 잔존

| 필드       | 내용                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **심각도** | **P2(local)** — prod **false** (무관)                                                                                                                   |
| **근거**   | `scripts/seed-local-trade-dev.ts:212–228` ledger-less wallet UPDATE → `rpc_run_reconciliation` mismatch → readonly · `:286–288` 복구는 seed **완주** 시 |
| **재현**   | Docker ON · seed 중단 또는 reconciliation 재발 → `app_config.system_readonly=true` · balance-moving RPC 전부 거절                                       |
| **수정**   | `bun run seed:local-trade-dev` 재실행 완주 · 또는 ledger leg 정식 seed (engine 승인)                                                                    |

---

### P2-OBS-01 · anon SECURITY DEFINER executable (advisor WARN)

| 필드       | 내용                                                             |
| ---------- | ---------------------------------------------------------------- |
| **심각도** | **P2관찰** (ERROR 아님)                                          |
| **근거**   | A §2.3 · D §4.4 — WARN **147** · `_is_admin()` anon EXECUTE 포함 |
| **재현**   | Supabase dashboard advisor security                              |
| **수정**   | hardening backlog — anon EXECUTE REVOKE sweep (engine RED STOP)  |

---

### P2-RATE-01 · `_enforce_rate_limit` 미포함 (9 RPC)

| 필드     | 내용                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| **근거** | A §3.2 — `rpc_lock_wallet` · `rpc_request_withdrawal` · `rpc_cashout_sports_bet` 등 9건 |
| **판정** | gate 필수 **아님** · abuse hardening 후보                                               |
| **수정** | engine F 승인 시 migration                                                              |

---

## 4. P3 — 부채 / stub / defer 명시

| id                 | 항목                      | 근거                                                          | 재현                           | 수정 큐                       |
| ------------------ | ------------------------- | ------------------------------------------------------------- | ------------------------------ | ----------------------------- |
| **P3-CASINO-01**   | `/casino` hub stub        | `routes/casino.tsx:6` → `DomainHubPage`                       | `/casino` — title only         | `p10-casino-replay-and-infra` |
| **P3-CASINO-02**   | `use-casino-round` orphan | `use-casino-round.ts:38`                                      | hook·RPC 존재 · game surface 0 | P10                           |
| **P3-CASINO-03**   | 12 game routes missing    | `surface-domain-boundary.ts:33–46` · `/games/{slug}` **0**    | casino slug 404                | P10                           |
| **P3-SETTINGS-01** | API keys STUB             | `api-keys-settings-page.tsx:27` ENGINE:gap                    | settings hub hidden            | defer 또는 engine             |
| **P3-SETTINGS-02** | Create keys disabled      | `api-keys-settings-page.tsx:142` `canManageKeys` always false | 버튼 grey                      | 동일                          |
| **P3-SPORTS-01**   | VIP coming soon           | `sports-page.tsx:79–86` `SportsVipStubPanel`                  | `/sports/vip`                  | P10 또는 built_hidden         |
| **P3-ROUTE-01**    | `/r/$code` boundary       | `routes/r/$code.tsx:3` · boundary 미등록                      | redirect only · neutral        | 등록 defer 허용               |

**C dead control P2:** 정적 스캔 **0건** (`onClick={()=>{}}` · `href="#"` · `disabled={true}`) — **PASS**.

---

## 5. PASS — 감사 통과 (결함 등록 안 함)

| 영역                             | 결과            | 근거                                   |
| -------------------------------- | --------------- | -------------------------------------- |
| §12.19 domain isolation          | **0** violation | C §3 · `check:phase-r-guards --strict` |
| i18n Korean JSX                  | **0**           | C §5 · `check:i18n` green              |
| presentation ko/en               | **4006/4006**   | C §5                                   |
| Client RPC PGRST202 정적         | **0**           | B §2.1                                 |
| RLS SELECT (11 core tables)      | auth **Y**      | B §4.1 MCP                             |
| Platform kill-switch public read | **9/9**         | D §2.1                                 |
| Prod deposit/sports realtime pub | **6/6**         | B §5.1                                 |

---

## 6. UNVERIFIED — 추측 판정 금지

| #    | 항목                                      | 이유                       | 마감 경로                             |
| ---- | ----------------------------------------- | -------------------------- | ------------------------------------- |
| U-01 | 로컬 `pg_proc` RPC 인자 1:1 전수          | Docker OFF (B)             | Docker ON + `audit-b-rpc-contract.ts` |
| U-02 | `rpc_place_spot_limit_order` literal args | dynamic `callRpc` (B §2.2) | 타겟 E2E 또는 typed trace             |
| U-03 | `.from()` 44테이블 SELECT 전수            | prod 11테이블 핀 (B)       | Docker ON audit-b                     |
| U-04 | 로컬 grants inventory table 핀            | Docker OFF (A)             | `replay-grants-inventory.ts`          |
| U-05 | `test:sql` / conservation                 | G13                        | GitHub CI **sql** job                 |
| U-06 | 런타임 dead control (axe/E2E click)       | G13                        | CI **e2e** / operator gate            |
| U-07 | Dynamic `t(\`key.${var}\`)` keys          | C 정적 literal-only        | vitest/i18n 확장 (선택)               |
| U-08 | app_config 245키 × RPC dynamic read       | D §5                       | operator tuning keys — 샘플링 한계    |

---

## 7. 수정 큐 매트릭스 (F/G)

| 우선 | todo id                                 | PQA 결함 id           | 유형             |
| ---- | --------------------------------------- | --------------------- | ---------------- |
| 1    | `launch-engine-e5-realtime-publication` | P1-001                | engine migration |
| 2    | `stack:push-remote` (+ sql CI)          | P1-002 · P1-003       | engine apply     |
| 3    | `pqa-fix-error-mapping`                 | P2-ERR-01–10          | presentation     |
| 4    | `pqa-fix-client-gate-prechecks`         | P2-GATE-01–07         | presentation     |
| 5    | `pqa-fix-types-regen`                   | P2-TYPES-01           | tooling          |
| 6    | `pqa-fix-dead-controls`                 | P3-\* (stub 정리)     | presentation     |
| 7    | `p10-casino-replay-and-infra`           | P3-CASINO-\*          | Phase R surface  |
| G    | `pqa-gate-platform-audit`               | 전건 green + §82 sync | P10 unblock      |

**FAIL (운영):** P1 미해결 + `pqa-gate-platform-audit` green 주장 · P0 blocker 주장 + Σ/advisor 근거 없음 · guard/제약 **약화**로 통과 (`30-audit-discipline`).

---

## 8. G 착수 게이트 (`pqa-gate-platform-audit`) — `[x]` DONE 2026-07-09

- [x] E P0–P3 결함 대장 + UNVERIFIED + 수정 큐 매트릭스
- [x] A/B/C/D 선행 문서 + JSON 산출
- [x] ACTIVE_WORK_SSOT §82 PQA sync · `package.json` `audit:pqa-*` 재현 스크립트
- [x] F1–F5 수정 — `pqa-fix-error-mapping` · `pqa-fix-client-gate-prechecks` · `pqa-fix-dead-controls` · `pqa-fix-types-regen` · `launch-engine-e5-realtime-publication` **`[x]` impl**
- [x] `pqa-gate-platform-audit` — `gate:ai-impl` PQA bundle **21/21** · `check:i18n` · `check:release` · `audit:pqa-c` · `audit:pqa-d` · `check:ai-reference` · §82 sync · **P10 잔여 unblock**
- [ ] CI sql/e2e/advisors Verified — push 후 GitHub Actions green (G13 authoritative)

---

## 교차 참조

- Plan: `phase_r_super-app_8bdf2c10` §33 · §33.3 · §33.4
- A: `docs/audit/PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`
- B: `docs/audit/PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md`
- C: `docs/audit/PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md`
- D: `docs/audit/PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md`
- Rule: `.cursor/rules/30-audit-discipline.mdc`
