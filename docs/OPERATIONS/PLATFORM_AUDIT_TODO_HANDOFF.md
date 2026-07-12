# Platform Audit — Plan Todo Handoff (1:1 착수 정본)

> **Plan:** `platform-perfect-launch_6982dfdf` · **Cursor Plan todo id = 본 문서 앵커 id**  
> **사용법:** 플랜에서 todo 체크(또는 Assign) → 채팅에 `Implement <todo-id>` 한 줄 → 에이전트는 **해당 절만** 읽고 즉시 착수

```text
플랜 todo 체크 → Implement <id> → 본 문서 §<id> → Investigate(필요 시) → Implement → Verify → registry·ACTIVE_WORK sync
```

**공통 선행 (매 todo):** [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md) · [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](PLATFORM_AUDIT_FINDING_REGISTRY.yaml) · Standing Grant [`PLATFORM_STANDING_GRANT.md`](PLATFORM_STANDING_GRANT.md)

**공통 마감:** Evidence → `PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/` · registry `VERIFIED_FIXED` · **`bun run closeout:todo -- <id>`** (Plan YAML `completed`) · ACTIVE_WORK `[x]`

---

## audit-r0-control-plane `[x]`

**상태:** DONE 2026-07-13 · 재착수 금지

---

## audit-r1-trust-truth `[x]`

**상태:** DONE 2026-07-13 · C-01/C-02/H-01/M-01 VERIFIED_FIXED · 재착수 금지

---

## audit-r2a-crypto-giftcard `[x]` DONE

**상태:** DONE 2026-07-13 · H-03/H-11 **VERIFIED_FIXED** · 재착수 금지

| 항목           | 값                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finding**    | H-03 · H-11                                                                                                                                                                                             |
| **Phase**      | Implement **`[x]`** · Investigate **`[x]`**                                                                                                                                                             |
| **Evidence**   | [`R2/r2a-crypto-giftcard-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2a-crypto-giftcard-implement.md) · [`R2/r2a-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2a-stage1-browser.md) |
| **범위**       | `cryptoRails=false` → deposit/withdraw hub에서 crypto rail 제거·direct URL fail-closed · giftcard market 0 → hub 숨김/submit 차단                                                                       |
| **Owner path** | `apps/web/src/product/surfaces/wallet/` · `crypto-edge-display-contract` · giftcard hub                                                                                                                 |
| **게이트**     | `typecheck` green · owner vitest 56/56                                                                                                                                                                  |

---

## audit-r2b-withdrawal-copy `[x]` DONE

**상태:** DONE 2026-07-13 · H-10 **VERIFIED_FIXED** · 재착수 금지

| 항목           | 값                                                                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finding**    | H-10                                                                                                                                                                                                                                                                                                  |
| **Phase**      | Implement + 운영 decision log **`[x]`**                                                                                                                                                                                                                                                               |
| **Evidence**   | [`R2/r2b-withdrawal-copy-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2b-withdrawal-copy-implement.md) · [`R2/r2b-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2b-stage1-browser.md) · DL-R2B-H10 · [`PLATFORM_WITHDRAWAL_REENABLE_GATE.md`](PLATFORM_WITHDRAWAL_REENABLE_GATE.md) |
| **범위**       | OFF=운영 의도 문서화 · 사유/다음 행동 i18n · Feature Flag 5조건 재개 체크리스트 · flag flip 0                                                                                                                                                                                                         |
| **Owner path** | `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts` · withdraw hub                                                                                                                                                                                                                        |
| **게이트**     | typecheck · check:i18n · owner vitest 9/9 · Browser `/wallet/withdraw` → login                                                                                                                                                                                                                        |

**착수:** ~~`Implement audit-r2b-withdrawal-copy per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r2c-sports-odds-freshness `[x]` DONE

| 항목         | 값                                                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finding**  | H-05                                                                                                                                                                                            |
| **Phase**    | Implement (ingest health 선행 확인) **`[x]`**                                                                                                                                                   |
| **범위**     | stale odds `—` · bet/cashout gate · server timestamp freshness                                                                                                                                  |
| **Owner**    | `apps/web/src/domain/sports-odds-freshness-display-contract.ts` · sports surfaces                                                                                                               |
| **게이트**   | gate:ai-impl L0~L4 · vitest **28/28** · Stage1 `/sports` → login                                                                                                                                |
| **Evidence** | [`R2/r2c-sports-odds-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2c-sports-odds-implement.md) · [`R2/r2c-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2c-stage1-browser.md) |

**착수:** ~~`Implement audit-r2c-sports-odds-freshness per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r2d-krw-proof-wire `[x]` DONE

| 항목         | 값                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finding**  | M-21                                                                                                                                                                                        |
| **Phase**    | Implement                                                                                                                                                                                   |
| **범위**     | `/wallet/deposit/krw` proof upload · typed attach RPC · pending only · ledger 0                                                                                                             |
| **Owner**    | wallet deposit krw · Admin deposits                                                                                                                                                         |
| **Evidence** | [`R2/r2d-krw-proof-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2d-krw-proof-implement.md) · [`R2/r2d-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2d-stage1-browser.md) |
| **Gate**     | `gate:ai-impl` vitest **24/24** · `krwDepositProofLive=true`                                                                                                                                |

**착수:** ~~`Implement audit-r2d-krw-proof-wire per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r3a-wallet-mutator-live-crash `[x]` DONE

| Finding H-02 · migration tranche 1 · `rpc_lock_wallet` revoke · Live Crash `server_seed` 비공개 · RED-first SQL tests · `stack:push-remote` · advisor 0

**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3a-wallet-mutator-live-crash-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3a-wallet-mutator-live-crash-implement.md)

**착수:** ~~`Implement audit-r3a-wallet-mutator-live-crash per PLATFORM_AUDIT_TODO_HANDOFF.md — migration 1개 only`~~

---

## audit-r3b-service-write-grants `[x]` DONE

| Finding M-06 · service-write GRANT 최소화 · trigger/helper revoke · grants_rls_inventory_test

**착수:** ~~`Implement audit-r3b-service-write-grants per PLATFORM_AUDIT_TODO_HANDOFF.md`~~  
**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3b-service-write-grants-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3b-service-write-grants-implement.md) · 2026-07-13

---

## audit-r3c-search-path-sweep `[x]` DONE

| Finding M-05 · search_path 8건 IMMUTABLE helper sweep · migration 1 tranche

**착수:** ~~`Implement audit-r3c-search-path-sweep per PLATFORM_AUDIT_TODO_HANDOFF.md`~~  
**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3c-search-path-sweep-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3c-search-path-sweep-implement.md) · 2026-07-13 · advisor `function_search_path_mutable` 8→0

---

## audit-r3d-siwe-analytics-ingress `[x]` DONE

| Finding M-04 · anon SIWE/analytics revoke · HMAC service ingress · `siweLoginLive=false` 유지

**착수:** ~~`Implement audit-r3d-siwe-analytics-ingress per PLATFORM_AUDIT_TODO_HANDOFF.md`~~  
**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3d-siwe-analytics-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3d-siwe-analytics-implement.md) · 2026-07-13 · anon EXECUTE 0 · edge `siwe-auth`+`product-analytics`

---

## audit-r3e-auth-hibp-feature-flag `[x]` DONE (HIBP residual BLOCKED_DEP)

| Finding H-09 · feature-flag allowlist+AAL2 **verified** · HIBP **Pro+ 402 DEFER** · advisor WARN residual 1

**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3e-auth-hibp-feature-flag-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3e-auth-hibp-feature-flag-implement.md) · 2026-07-13 · migration `…_h09_r3e_feature_flag_allowlist` · `stack:auth-hibp-enable` 402

**착수:** ~~`Implement audit-r3e-auth-hibp-feature-flag per PLATFORM_AUDIT_TODO_HANDOFF.md`~~  
**Unblock HIBP:** Pro 업그레이드 → `bun run stack:auth-hibp-enable` → registry H-09 `VERIFIED_FIXED`

---

## audit-r4-market-ops `[x]` DONE

| ADR-021 실행 · H-04 price/crypto watcher · public status RPC · M-20 RLS perf · migration tranche 분리

**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R4/r4-market-ops-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R4/r4-market-ops-implement.md) · 2026-07-13 · migrations `…_h04_r4a_*` · `…_m20_r4b_*` · `…_m20_r4c_*` · edge deploy price-feed+crypto-chain-watcher · dry-fire 6/6 · initplan 0 · multi-perm 2 residual

**착수:** ~~`Implement audit-r4-market-ops per PLATFORM_AUDIT_TODO_HANDOFF.md — 1 tranche per PR`~~

---

## audit-r5-admin-safety `[x]` DONE

| H-07 · H-08 · M-12 · M-13 · M-02 · M-17 · Admin RBAC nav · settlement reason · no-op 제거

**상태:** DONE 2026-07-13 · 여섯 Finding **VERIFIED_FIXED** · 재착수 금지  
**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R5/r5-admin-safety-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R5/r5-admin-safety-implement.md) · [`R5/r5-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R5/r5-stage1-browser.md)  
**Gate:** `gate:ai-impl` vitest **26/26** · M-17 ban 3 (ledger delete 0)

**착수:** ~~`Implement audit-r5-admin-safety per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r6-product-consistency `[x]` DONE

| M-03 · M-07 · M-08 · M-09 · M-10 · M-11 · M-19 · Trade/Home/Casino/PWA

**상태:** DONE 2026-07-13 · 일곱 Finding **VERIFIED_FIXED** · 재착수 금지  
**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R6/r6-product-consistency-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R6/r6-product-consistency-implement.md) · [`R6/r6-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R6/r6-stage1-browser.md)  
**Gate:** `gate:ai-impl` vitest **40/40**

**착수:** ~~`Implement audit-r6-product-consistency per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r7-type-ui-hygiene `[x]` DONE

| M-14 · M-15 · M-16 · orphan · type-lie · primitive ratchet

**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R7/r7-type-ui-hygiene-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R7/r7-type-ui-hygiene-implement.md)  
**Gates:** `gate:ai-impl` · `check:rpc-type-hygiene` 0 · `check:primitive-ratchet --strict` · vitest 5/5

**착수(이력):** `Implement audit-r7-type-ui-hygiene per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r8-deploy-parity `[x]` DONE

| H-06 · clean SHA manifest · Web/Admin preview parity · 보안 헤더

**Evidence:** [`PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R8/r8-deploy-parity-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R8/r8-deploy-parity-implement.md)  
**Gates:** `check:deploy-parity` local 4/4 · vitest 6/6 · advisors 0 ERROR · bun audit Critical 0 · migration name parity 0 missing  
**R9 선행:** clean dual preview deploy 후 `check:deploy-parity -- --remote` green

**착수(이력):** `Implement audit-r8-deploy-parity per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r9-runtime-matrix `[x]` DONE 2026-07-13

| 항목         | 값                                                                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Finding**  | M-18 (R9 일괄 Runtime · Stage1+2)                                                                                                                                                                                                                                 |
| **Phase**    | Browser MCP evidence — **Release green 아님** (JS SLO · `/install` 결함)                                                                                                                                                                                          |
| **선행**     | `check:deploy-parity -- --remote` **PASS** · SHA `dcfd8c7e`                                                                                                                                                                                                       |
| **SOT**      | [`PLATFORM_RUNTIME_URL_MATRIX.json`](PLATFORM_RUNTIME_URL_MATRIX.json) · `bun run audit:runtime-urls`                                                                                                                                                             |
| **Evidence** | [`R9/r9-runtime-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-runtime-implement.md) · [`r9-stage1-matrix.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix.md) · [`r9-stage2-matrix.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage2-matrix.md) |
| **Stage1**   | 24 states · functional **24/24** · strict **3/24** (Web JS 539kb > 450kb SLO)                                                                                                                                                                                     |
| **Stage2**   | **366** states · **290 PASS** · FAIL `/install@2560` InstallPromptProvider                                                                                                                                                                                        |
| **MCP**      | `project-0-phonara-gb-playwright` · preview only (G5)                                                                                                                                                                                                             |
| **게이트**   | `audit:runtime-urls` 124/124 · vitest 2/2 · remote parity 9/9                                                                                                                                                                                                     |

### 마감 체크

- [x] Remote parity green
- [x] Stage1 24 states Browser MCP
- [x] Stage2 remaining URL + 768/1024/2560 (parameterized 2 deferred)
- [x] Evidence · Decision Log · `closeout:todo audit-r9-runtime-matrix`

### Release blockers (R10 전 triage)

| ID             | 요약                                 |
| -------------- | ------------------------------------ |
| R9-PERF-JS     | Web Stage1 initial JS SLO 21/21 FAIL |
| R9-INSTALL-CTX | `/install@2560` pageerror            |

**NEXT:** `audit-r10-rollout-soak` — **BLOCKED** until 위 2건 triage 또는 operator waiver

---

## audit-r10-rollout-soak `[x]` DONE 2026-07-13

| 항목          | 값                                                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase**     | Feature Flag 5조건 · Rollback Trigger · SLO soak ≥24h SOP                                                                                                                  |
| **Evidence**  | [`R10/r10-rollout-soak-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollout-soak-implement.md) · [`PLATFORM_R10_ROLLOUT_SOAK.md`](PLATFORM_R10_ROLLOUT_SOAK.md) |
| **R9 triage** | R9-INSTALL-CTX **FIXED** · R9-PERF-JS **ACCEPTED_RISK** baseline (flip 0)                                                                                                  |
| **게이트**    | `audit:r10-rollout` · vitest contract 3/3 + script 3/3 · `check:pwa`                                                                                                       |

### 마감 체크

- [x] 5조건 SOP + 재개 순서 6단계 (baseline + 5 flip)
- [x] Rollback Trigger 6건 ↔ dry-fire 매핑
- [x] Soak 24h 타임라인 + spotcheck SQL
- [x] R9-INSTALL-CTX Provider wrap fix
- [x] Operator 24h snapshot **template** ([`r10-soak-24h-snapshot.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-soak-24h-snapshot.md))
- [x] `closeout:todo audit-r10-rollout-soak`

**NEXT:** `audit-r12-post-release` — PPR 24h/72h/7d · DR drill

**착수:** ~~`Implement audit-r10-rollout-soak per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r11-closeout `[x]` DONE

**상태:** DONE 2026-07-13 · Release Freeze ACTIVE · Release candidate **BLOCKED** · 재착수 금지

| 항목                  | 값                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase**             | Closeout **`[x]`**                                                                                                                                             |
| **RC SHA**            | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`                                                                                                                     |
| **Freeze**            | ACTIVE · Critical-only                                                                                                                                         |
| **Release candidate** | **BLOCKED** (R9-PERF-JS · 3-Owner · soak 24h · DR drill)                                                                                                       |
| **Evidence**          | [`R11/r11-closeout-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R11/r11-closeout-implement.md) · [`PLATFORM_RELEASE_FREEZE.md`](PLATFORM_RELEASE_FREEZE.md) |
| **게이트**            | `audit:r11-closeout` · vitest · `gate:ai-impl`                                                                                                                 |

**Operator NEXT:** 3-Owner 시차 서명 · 24h soak snapshot · R9-PERF-JS fix 또는 waiver

**착수:** ~~`Implement audit-r11-closeout per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r12-post-release `[x]` DONE

**상태:** DONE 2026-07-13 · PPR 스케줄·템플릿 등록 · Production normal **pending_ppr** · 재착수 금지

| 항목                  | 값                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| **Phase**             | Post Release **`[x]`**                                                                                    |
| **RC SHA**            | `dcfd8c7eab0374296ffeecdc5cd3f79433786ebe`                                                                |
| **PPR due**           | 24h 2026-07-14 · 72h 2026-07-16 · 7d 2026-07-20 (KST)                                                     |
| **Production normal** | **pending_ppr** (3 reviews PENDING_OPERATOR)                                                              |
| **Evidence**          | [`R12/r12-post-release-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R12/r12-post-release-implement.md) |
| **게이트**            | `audit:r12-post-release` · vitest · `gate:ai-impl`                                                        |

**Operator NEXT:** PPR 24h/72h/7d template fill · secrets spotcheck · DR drill 2026-10-13

**착수:** ~~`Implement audit-r12-post-release per PLATFORM_AUDIT_TODO_HANDOFF.md`~~
