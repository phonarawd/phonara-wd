# Platform Audit — Plan Todo Handoff (1:1 착수 정본)

> **Plan:** `platform-perfect-launch_6982dfdf` · **Cursor Plan todo id = 본 문서 앵커 id**  
> **사용법:** 플랜에서 todo 체크(또는 Assign) → 채팅에 `Implement <todo-id>` 한 줄 → 에이전트는 **해당 절만** 읽고 즉시 착수

```text
플랜 todo 체크 → Implement <id> → 본 문서 §<id> → Investigate(필요 시) → Implement → Verify → registry·ACTIVE_WORK sync
```

**공통 선행 (매 todo):** [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md) · [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](PLATFORM_AUDIT_FINDING_REGISTRY.yaml) · Standing Grant [`PLATFORM_STANDING_GRANT.md`](PLATFORM_STANDING_GRANT.md)

**공통 마감:** Evidence → `PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/` · registry `VERIFIED_FIXED` · Plan todo `completed` · ACTIVE_WORK `[x]`

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

## audit-r2b-withdrawal-copy `[ ]`

| 항목 | 값 |
| --- | --- |
| **Finding** | H-10 |
| **Phase** | Implement + 운영 decision log |
| **선행** | R2 investigate · 출금 이미 fail-closed — copy/CTA/운영 의도 문서화 |
| **범위** | withdrawal OFF 사유·다음 행동 i18n · Feature Flag 5조건 체크리스트 |
| **게이트** | wallet withdraw vitest · Browser `/wallet/withdraw` |

**착수:** `Implement audit-r2b-withdrawal-copy per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r2c-sports-odds-freshness `[ ]`

| 항목 | 값 |
| --- | --- |
| **Finding** | H-05 |
| **Phase** | Implement (ingest health 선행 확인) |
| **범위** | stale odds `—` · bet/cashout gate · server timestamp freshness |
| **Owner** | `apps/web/src/domain/sports-*` · sports surfaces |

**착수:** `Implement audit-r2c-sports-odds-freshness per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r2d-krw-proof-wire `[ ]`

| 항목 | 값 |
| --- | --- |
| **Finding** | M-21 |
| **Phase** | Implement |
| **범위** | `/wallet/deposit/krw` proof upload · typed attach RPC · pending only · ledger 0 |
| **Owner** | wallet deposit krw · Admin deposits |

**착수:** `Implement audit-r2d-krw-proof-wire per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r3a-wallet-mutator-live-crash `[ ]`

| Finding H-02 · migration tranche 1 · `rpc_lock_wallet` revoke · Live Crash `server_seed` 비공개 · RED-first SQL tests · `stack:push-remote` · advisor 0

**착수:** `Implement audit-r3a-wallet-mutator-live-crash per PLATFORM_AUDIT_TODO_HANDOFF.md — migration 1개 only`

---

## audit-r3b-service-write-grants `[ ]`

| Finding M-06 · service-write GRANT 최소화 · trigger/helper revoke · grants_rls_inventory_test

**착수:** `Implement audit-r3b-service-write-grants per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r3c-search-path-sweep `[ ]`

| Finding M-05 · search_path 8건 SECURITY DEFINER sweep · 동일 유형 migration 1 tranche

**착수:** `Implement audit-r3c-search-path-sweep per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r3d-siwe-analytics-ingress `[ ]`

| Finding M-04 · anon SIWE/analytics revoke · HMAC service ingress · `siweLoginLive=false` 유지

**착수:** `Implement audit-r3d-siwe-analytics-ingress per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r3e-auth-hibp-feature-flag `[ ]`

| Finding H-09 · leaked-password protection · `rpc_set_feature_enabled` allowlist · advisor WARN→0

**착수:** `Implement audit-r3e-auth-hibp-feature-flag per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r4-market-ops `[ ]`

| ADR-021 실행 · H-04 price/crypto watcher · public status RPC · M-20 RLS perf · migration tranche 분리

**착수:** `Implement audit-r4-market-ops per PLATFORM_AUDIT_TODO_HANDOFF.md — 1 tranche per PR`

---

## audit-r5-admin-safety `[ ]`

| H-07 · H-08 · M-12 · M-13 · M-02 · M-17 · Admin RBAC nav · settlement reason · no-op 제거

**착수:** `Implement audit-r5-admin-safety per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r6-product-consistency `[ ]`

| M-03 · M-07 · M-08 · M-09 · M-10 · M-11 · M-19 · Trade/Home/Casino/PWA

**착수:** `Implement audit-r6-product-consistency per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r7-type-ui-hygiene `[ ]`

| M-14 · M-15 · M-16 · orphan · type-lie · primitive ratchet

**착수:** `Implement audit-r7-type-ui-hygiene per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r8-deploy-parity `[ ]`

| H-06 · clean SHA manifest · Web/Admin preview parity · 보안 헤더

**착수:** `Implement audit-r8-deploy-parity per PLATFORM_AUDIT_TODO_HANDOFF.md`

---

## audit-r9-runtime-matrix `[ ]`

| M-18 · Stage1 Critical 8 × 390/580/1455 → Stage2 124 URL · R1 수시 Browser와 별개 **전수** 판정

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
