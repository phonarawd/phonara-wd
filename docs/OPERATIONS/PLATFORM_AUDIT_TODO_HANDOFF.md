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

| 항목 | 값 |
| --- | --- |
| **Finding** | H-03 · H-11 |
| **Phase** | Implement **`[x]`** · Investigate **`[x]`** |
| **Evidence** | [`R2/r2a-crypto-giftcard-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2a-crypto-giftcard-implement.md) · [`R2/r2a-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2a-stage1-browser.md) |
| **범위** | `cryptoRails=false` → deposit/withdraw hub에서 crypto rail 제거·direct URL fail-closed · giftcard market 0 → hub 숨김/submit 차단 |
| **Owner path** | `apps/web/src/product/surfaces/wallet/` · `crypto-edge-display-contract` · giftcard hub |
| **게이트** | `typecheck` green · owner vitest 56/56 |

---

## audit-r2b-withdrawal-copy `[x]` DONE

**상태:** DONE 2026-07-13 · H-10 **VERIFIED_FIXED** · 재착수 금지

| 항목 | 값 |
| --- | --- |
| **Finding** | H-10 |
| **Phase** | Implement + 운영 decision log **`[x]`** |
| **Evidence** | [`R2/r2b-withdrawal-copy-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2b-withdrawal-copy-implement.md) · [`R2/r2b-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2b-stage1-browser.md) · DL-R2B-H10 · [`PLATFORM_WITHDRAWAL_REENABLE_GATE.md`](PLATFORM_WITHDRAWAL_REENABLE_GATE.md) |
| **범위** | OFF=운영 의도 문서화 · 사유/다음 행동 i18n · Feature Flag 5조건 재개 체크리스트 · flag flip 0 |
| **Owner path** | `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts` · withdraw hub |
| **게이트** | typecheck · check:i18n · owner vitest 9/9 · Browser `/wallet/withdraw` → login |

**착수:** ~~`Implement audit-r2b-withdrawal-copy per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r2c-sports-odds-freshness `[x]` DONE

| 항목 | 값 |
| --- | --- |
| **Finding** | H-05 |
| **Phase** | Implement (ingest health 선행 확인) **`[x]`** |
| **범위** | stale odds `—` · bet/cashout gate · server timestamp freshness |
| **Owner** | `apps/web/src/domain/sports-odds-freshness-display-contract.ts` · sports surfaces |
| **게이트** | gate:ai-impl L0~L4 · vitest **28/28** · Stage1 `/sports` → login |
| **Evidence** | [`R2/r2c-sports-odds-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2c-sports-odds-implement.md) · [`R2/r2c-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2c-stage1-browser.md) |

**착수:** ~~`Implement audit-r2c-sports-odds-freshness per PLATFORM_AUDIT_TODO_HANDOFF.md`~~

---

## audit-r2d-krw-proof-wire `[x]` DONE

| 항목 | 값 |
| --- | --- |
| **Finding** | M-21 |
| **Phase** | Implement |
| **범위** | `/wallet/deposit/krw` proof upload · typed attach RPC · pending only · ledger 0 |
| **Owner** | wallet deposit krw · Admin deposits |
| **Evidence** | [`R2/r2d-krw-proof-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2d-krw-proof-implement.md) · [`R2/r2d-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2d-stage1-browser.md) |
| **Gate** | `gate:ai-impl` vitest **24/24** · `krwDepositProofLive=true` |

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

## audit-r9-runtime-matrix `[ ]`

| 항목 | 값 |
| --- | --- |
| **Finding** | M-18 (R9 일괄 Runtime · Stage1+2) |
| **Phase** | Browser MCP only — 코드 수정 0 (증거 수집만) |
| **선행 (non-waivable)** | clean dual preview deploy → `bun run check:deploy-parity -- --remote` green · Web/Admin `releaseSha` 일치 · `gitDirty=false` |
| **SOT** | [`PLATFORM_RUNTIME_URL_MATRIX.json`](PLATFORM_RUNTIME_URL_MATRIX.json) · `bun run audit:runtime-urls` |
| **Evidence** | [`R9/r9-preflight.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-preflight.md) · [`R9/r9-stage1-matrix-template.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix-template.md) |
| **범위 Stage1** | Critical 8 surface × 390/580/1455 = **24 states** (Landing · Home · Wallet · Trade · Sports · Casino · Admin `/` · Settings) |
| **범위 Stage2** | Stage1 green 후 · remaining 124 concrete URL · 768/1024/2560 · parameterized fixture/user seed |
| **정본 URL** | Web 95 + Admin 29 = 124 (`audit:runtime-urls`) |
| **MCP** | `project-0-phonara-gb-playwright` · `playwright-mcp-8gb.json` · preview origin only (G5) |
| **판정** | R1–R7 수시 Stage1 PASS는 **재측정만** — R9 Stage1이 최종 판정 · Stage1 red → Stage2 금지 |
| **게이트** | Stage1+2 green · console/page error 0 · axe critical+serious 0 · overflow/overlap 0 · SLO LCP/JS (Stage1) |

### Preflight (착수 전 — 본 세션 완료)

- [x] URL matrix JSON + `audit:runtime-urls` validator
- [x] Stage1 matrix template · R9 preflight evidence
- [x] Browser MCP preview `/` navigate OK
- [ ] `check:deploy-parity -- --remote` green — **operator: clean preview deploy**

### Implement 절차 (순서 고정)

```text
1. Remote parity green 확인 (manifest JSON · SHA 기록)
2. Stage1 24 states — r9-stage1-matrix-template.md 채움 (Browser MCP)
3. Stage1 24/24 PASS → Stage2 remaining URL + viewports
4. Evidence → registry · closeout:todo audit-r9-runtime-matrix
```

**착수:** `Implement audit-r9-runtime-matrix per PLATFORM_AUDIT_TODO_HANDOFF.md — Browser MCP only`

---

## audit-r10-rollout-soak `[ ]`

| Feature Flag 5조건 · Rollback Trigger · SLO soak ≥24h

**착수:** `Implement audit-r10-rollout-soak per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r11-closeout `[ ]`

| Release Freeze · 3-Owner Sign-off · Evidence 90일 · 출시 후보 보고만

**착수:** `Implement audit-r11-closeout per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r12-post-release `[ ]`

| 24h/72h/7d PPR · DR drill · Secrets rotation

**착수:** `Implement audit-r12-post-release per PLATFORM_AUDIT_TODO_HANDOFF.md`
