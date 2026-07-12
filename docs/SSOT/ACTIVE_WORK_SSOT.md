# Active Work SSOT (2026-07-11)

> **유일한 실행 큐 정본.** 그 외 `.md` (엔진 evidence · v2 wave · Demolition batch · forensic)는 **이력·감사 전용** — 구현 큐로 읽지 않는다.

## 현재 상태

| 영역                          | 상태                                         | AI 행동                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Engine Apex**               | `[x] FULLY CLOSED`                           | `supabase/migrations` · `packages/*-engine` **신규 작업 금지** (버그·Phase R 와이어·**PIR Wave E** 예외만)                                                                                                                                                     |
| **Phase D Demolition**        | `[x] DONE`                                   | 삭제 확장 **금지**                                                                                                                                                                                                                                             |
| **Platform Integrity (PIR)**  | **`[x]` DONE** 2026-07-11                    | Plan `platform_integrity_remediation_v1` **전부 `[x]`** · Evidence [`PLATFORM_INTEGRITY_EVIDENCE/`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md) · `#205` **unblocked**                                                                                |
| **Phase R UI Rebuild**        | **IN PROGRESS (Track B E-Wave)**             | **왕초보 큐:** To-do **위→아래** · completed **스킵** · Track B **`ew-e10-gate-platform-world-class` `[x]` DONE** · E10 growth+trust+wallet **`[x]`** · E10 WAVE **`[x]`** · E9 GATE **`[x]`** · E8 GATE **`[x]`** · E23–E0 · T2/T1 · P13 · DA · PQA **`[x]`** |
| **Trade Desk Remediation**    | **Phase 4 closeout `[x]` DONE**              | Plan `trade_desk_remediation_v3` · S4 LAUNCH RC APPROVED 2026-07-07 · **CI/soak Verified `[x]` 2026-07-07**                                                                                                                                                    |
| **Trade Desk Zero-Defect QA** | **L9 closeout `[x]` impl** · §15 **STARTED** | Plan `trade_desk_qa_audit` · `closeout-doc-sync` 2026-07-08 · operator Stage 2/3 · 3m window **pending**                                                                                                                                                       |
| **Cursor 8GB perf (v4.4.5)**  | **`[x]` DONE**                               | `cursor:perf-rollout` diagnosis-first · `high-remediation` dry-run 기본 · evidence JSONL · summary remediation assert · tsserver/argv **옵트인** (`--include-tsserver-tuning`)                                                                                 |
| **Platform Perfect Launch**   | **R1 Implement VERIFYING** · Finding CLOSED **아님** | Plan `platform-perfect-launch` · C-01/C-02/H-01/M-01 **VERIFYING** · NEXT=Stage1 Browser after push · then `audit-r2-*` |

## Platform Perfect Launch Remediation (Plan `platform-perfect-launch` · execute SSOT)

> **감사 정본(참고):** [`PLATFORM_AUDIT_REFERENCE.md`](../audit/PLATFORM_AUDIT_REFERENCE.md) — 실행 큐 아님  
> **통제 정본:** [`PLATFORM_AUDIT_FINDING_REGISTRY.yaml`](../OPERATIONS/PLATFORM_AUDIT_FINDING_REGISTRY.yaml) · [`PLATFORM_AUDIT_RACI.md`](../OPERATIONS/PLATFORM_AUDIT_RACI.md) · [`PLATFORM_PLAYBOOK_VERSION.yaml`](../OPERATIONS/PLATFORM_PLAYBOOK_VERSION.yaml)  
> **Standing Grant:** [`PLATFORM_STANDING_GRANT.md`](../OPERATIONS/PLATFORM_STANDING_GRANT.md) · Decision Log [`PLATFORM_AUDIT_DECISION_LOG.md`](../OPERATIONS/PLATFORM_AUDIT_DECISION_LOG.md)  
> **Known Good SHA (R0 baseline):** `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`  
> **보고 언어:** Gate green = **출시 후보**까지 · 좋은 SOP ≠ 품질 증명 · Capability ≠ Correctness

| Todo | 상태 | 완료일 | 증거 |
| --- | --- | --- | --- |
| **`audit-r0-control-plane`** | **`[x]` DONE** | **2026-07-13** | Finding registry(+`dod_profile`) · ADR-021 · Evidence bucket **CREATED** · Playwright MCP Probe5 **CAPTURE_OK** · 1인 RACI · SLO **confirmed** · [`R0/control-plane-baseline.md`](../OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/control-plane-baseline.md) |
| **`audit-r1-trust-truth`** | **`[x]` impl** · VERIFYING | **2026-07-13** | C-01/C-02/H-01/M-01 fail-closed · PrimeForge→PHONARA · vitest **26/26** · typecheck · i18n · [`R1/r1-trust-truth-implement.md`](../OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R1/r1-trust-truth-implement.md) · Stage1 Browser **pending** preview SHA |

**R0 Exit 메모:** Finding CLOSED **0** (M-18 **VERIFIED_FIXED** R0 tool availability) · SLO **confirmed** · M-18 Browser MCP **CAPTURE_OK** Probe 5 · bucket `platform-audit-evidence` **public=false**

**Plan 승인:** **`[x]`** 2026-07-13 operator chat · Standing Grant 활성

**현재 NEXT (본 큐):** **R1 Verify** — Stage1 Browser `/` · `/status` (390·580·1455) on preview SHA → Finding `VERIFIED_FIXED` → then **`audit-r2-*`**

## Cursor 8GB Performance Rollout (v4.4.5 · diagnosis-first · YAML `phase0-gate`)

> **정본:** Plan `8gb_cursor_최적화` · branch `phase-r/cursor-perf-8gb` · operator: `bun run cursor:perf-rollout`

| Todo                                       | 상태           | 완료일         | 증거                                                                                                                        |
| ------------------------------------------ | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **`phase0-gate`** (Phase 0 선행 + rollout) | **`[x]` DONE** | **2026-07-10** | `gate-diagnosis` · `gate-phase0` · `high-remediation` · `perf-rollout` v4.4 step order · evidence JSONL · summary PASS-only |

**Implemented:** `gate:ai-impl` perf scripts **90/90** · `cursor-dev-processes` DRIFT · `dominant-ram-consumer` 경계 fixture · `claude-desktop-processes` allowlist · `parse-migrations-lock` SOT · `schtasks-lifecycle` Query-first · standby 8s · `.cursor/perf/` workspace-artifacts

**Operator:** `bun run cursor:perf-rollout` → `RESTART_CURSOR_REQUIRED` 시 Cursor 재시작 · HIGH 시 `--confirm-high-remediation` 확인 후 · Max Context UNVERIFIED 시 `--attest-max-context=6k` 또는 evidence 제출

## Platform Integrity Remediation (Plan `platform_integrity_remediation_v1` · execute SSOT)

> **상태:** **`[x]` DONE** 2026-07-11 — 형제 큐 **전부 마감** · Track A `#205` **unblocked**  
> **근거:** 2026-07-11 READ-ONLY 감사 (DB · 엔진 · Realtime/Edge)  
> **Evidence:** [`PLATFORM_INTEGRITY_EVIDENCE/README.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/README.md)  
> **ADR-008 교차:** C-2 system-account 잠금순서 = Engine Wave DB TX deep audit의 **부분 Accepted** ([`008-engine-wave-db-tx-race-defer.md`](../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md) §PIR)

| Todo                           | 상태           | 완료일         | 증거                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pir-w0-ssot`**              | **`[x]` DONE** | **2026-07-11** | ACTIVE_WORK_SSOT 형제 큐 · Evidence 스캐폴드 · `#205` BLOCKED · ADR-008 §PIR                                                                                                                                                                                                                                                                                                    |
| `pir-p0-autobet-session`       | **`[x]` DONE** | **2026-07-11** | 순수 `stepAutoBetSession` · 루프 지역 상태 · `sessionActiveRef` · `autoBet(stakeOverride)` · vitest **9/9** · shell **4/4**                                                                                                                                                                                                                                                     |
| `pir-p0-autobet-gate`          | **`[x]` DONE** | **2026-07-11** | `gate:ai-impl` auto-bet+shell · L0~L4 green · vitest **13/13** · Evidence [`P0/autobet-gate.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P0/autobet-gate.md)                                                                                                                                                                                                                  |
| `pir-p1-admin-rbac`            | **`[x]` DONE** | **2026-07-11** | `rpc_admin_list_role_grants` fail-closed · localStorage DEV-only · vitest **17/17** · Evidence [`P1/admin-rbac.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P1/admin-rbac.md)                                                                                                                                                                                                 |
| `pir-p1-sports-odds-debounce`  | **`[x]` DONE** | **2026-07-11** | odds INSERT ≥500ms debounce · fixture-only patch · no full `['sports']` invalidate · Evidence [`P1/sports-odds-debounce.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P1/sports-odds-debounce.md)                                                                                                                                                                              |
| `pir-e1-system-lock-order`     | **`[x]` DONE** | **2026-07-11** | `_lock_system_accounts` · buy/sell/fill 선잠금 · SQL 118/118 · `stack:push-remote` · advisor 0 · Evidence [`E1/system-lock-order.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/E1/system-lock-order.md)                                                                                                                                                                        |
| `pir-e2-realtime-narrow`       | **`[x]` DONE** | **2026-07-11** | publication DROP `wallet_ledger`/fills · `ledger_user_created_idx` · wallets→ledger invalidate · SQL **119/119** · `stack:push-remote` · advisor 0 · Evidence [`E2/realtime-narrow.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/E2/realtime-narrow.md)                                                                                                                        |
| `pir-e3-golden-earth`          | **`[x]` DONE** | **2026-07-11** | lock-late global FOR UPDATE · `golden_earth:gjp:{total}` · `gen_random_bytes` · E3-0/1/2 SQL OK · `stack:push-remote` · advisor 0 · Evidence [`E3/golden-earth.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/E3/golden-earth.md)                                                                                                                                               |
| `pir-e4-sweep-chunk`           | **`[x]` DONE** | **2026-07-11** | liq/stop keyset · funding hold schedule · affiliate LIMIT · SQL E4-0..3 · `stack:push-remote` · advisor 0 · Evidence [`E4/sweep-chunk.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/E4/sweep-chunk.md)                                                                                                                                                                         |
| `pir-e5-idempotency-handlers`  | **`[x]` DONE** | **2026-07-11** | place/claim UV→existing · wallet recheck · SQL E5-0..3 · `stack:push-remote` · advisor 0 · Evidence [`E5/idempotency-handlers.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/E5/idempotency-handlers.md)                                                                                                                                                                        |
| `pir-p2-quantize-odds`         | **`[x]` DONE** | **2026-07-11** | `quantize6` number 제거 · ingest string-only · vitest quantize+decimal-odds · Evidence [`P2/quantize-odds.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P2/quantize-odds.md)                                                                                                                                                                                                   |
| `pir-p2-pf-golden-vectors`     | **`[x]` DONE** | **2026-07-11** | 12게임 PF 경계 float SQL↔TS pin · `check:determinism` · vitest **4/4** · SQL `pir_pf_golden_vectors_test` · Evidence [`P2/pf-golden-vectors.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/P2/pf-golden-vectors.md)                                                                                                                                                             |
| `pir-gate-platform-integrity`  | **`[x]` DONE** | **2026-07-11** | `gate:ai-impl` PIR bundle vitest **53/53** · `phase-r-guards --strict` · i18n/release · security-auditor **PASS ERROR 0** · CI quality·sql·e2e·advisors green ([run 29121620586](https://github.com/rlawhdgus10041004-sys/phonara-gb/actions/runs/29121620586)) · Evidence [`GATE/platform-integrity.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/GATE/platform-integrity.md) |
| **`pir-closeout-unblock-205`** | **`[x]` DONE** | **2026-07-11** | §82 · NEXT = `#205` · Evidence [`GATE/unblock-205.md`](../OPERATIONS/PLATFORM_INTEGRITY_EVIDENCE/GATE/unblock-205.md) · Plan YAML completed                                                                                                                                                                                                                                     |

**현재 NEXT (전역):** **`p10-games-batch-c`** (#210) — E10 Platform World-Class GATE **`[x]` DONE** 2026-07-12 · E10 growth UI **`[x]`** · E10 trust+support **`[x]`** · E10 wallet+settings **`[x]`** · E10 Admin KRW **`[x]`** · E10 WAVE **`[x]`** · E9 GATE **`[x]`** · E8 GATE **`[x]`** · E23–E0 · T2/T1 · P13 **`[x]`**

## Track B E10 Platform World-Class GATE (`ew-e10-gate-platform-world-class` · §21.4 · §32.2) — `[x]` DONE · 재착수 금지

> **선행:** `ew-e10-growth-ui` **`[x]`** · E10 linear chain 전부 **`[x]`** · **후행:** Track A `p13-closeout-bundle` (Soft Launch sibling)

| Todo                                   | 상태           | 완료일         | 증거                                                                                                                                           |
| -------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e10-gate-platform-world-class`** | **`[x]` DONE** | **2026-07-12** | Platform World-Class E8–E10 final · [`ENGINE_GAP_E10_GATE_PLATFORM_WORLD_CLASS.md`](../OPERATIONS/ENGINE_GAP_E10_GATE_PLATFORM_WORLD_CLASS.md) |

**Implemented:** E8+E9+E10 GATE contracts · §12.18 gap 0 (ad/survey skip) · §32 canon wired · `isEwE10PlatformWorldClassGateReady()`

**증거:** `gate:ai-impl` E10 GATE bundle **3/3** · `test:engine` **285/285** · `stack:push-remote` tail `20260711225356_ew_e10_platform_engine` · advisor **0 ERROR** · SQL E8+E9+E10 (CI authoritative · G13)

**다음 todo:** `p10-games-batch-c` (Track A)

## Track B E10 Growth UI (`ew-e10-growth-ui` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** `ew-e10-trust-support-ui` **`[x]`** · **후행:** `ew-e10-gate-platform-world-class` **`[x]`**

| Todo                   | 상태           | 완료일         | 증거                                                                                                                |
| ---------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| **`ew-e10-growth-ui`** | **`[x]` DONE** | **2026-07-12** | Kakao augment · app-install growth tab · [`ENGINE_GAP_E10_GROWTH_UI.md`](../OPERATIONS/ENGINE_GAP_E10_GROWTH_UI.md) |

**Implemented:** `appInstallMissionLive` · `kakaoShareSdkLive` · `/referral/invite` · `/home/missions` growth tab

**증거:** `gate:ai-impl` growth UI · vitest · `isEwE10GrowthUiUnlocked()=true`

**다음 todo:** `ew-e10-gate-platform-world-class` **`[x]`**

## Track B E10 Trust+Support UI (`ew-e10-trust-support-ui` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E10 wallet+settings `ew-e10-wallet-settings-ui` **`[x]`** · E9 GATE **`[x]`** · **후행:** `ew-e10-growth-ui`

| Todo                          | 상태           | 완료일         | 증거                                                                                                                                           |
| ----------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e10-trust-support-ui`** | **`[x]` DONE** | **2026-07-12** | `/support/ticket` · `/status` · `/tier/leaderboard` · [`ENGINE_GAP_E10_TRUST_SUPPORT_UI.md`](../OPERATIONS/ENGINE_GAP_E10_TRUST_SUPPORT_UI.md) |

**Implemented:** support ticket intake+history · public system status lanes · VIP XP leaderboard · `supportTicketsLive` · `tierLeaderboardLive` · `systemStatusLive`

**증거:** `gate:ai-impl` L0–L4 green · vitest **16/16** (trust+support bundle) · E9 RPC wire live

**다음 todo:** `ew-e10-growth-ui`

## Track B E10 Wallet+Settings UI (`ew-e10-wallet-settings-ui` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E10 WAVE `ew-e10-platform-engine-wave` **`[x]`** · Admin KRW proof **`[x]`** · E8 GATE **`[x]`** · **후행:** `ew-e10-trust-support-ui`

| Todo                            | 상태           | 완료일         | 증거                                                                                                                                                                                    |
| ------------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e10-wallet-settings-ui`** | **`[x]` DONE** | **2026-07-12** | `/wallet/transfer` · `/settings/api-keys` · redeem reverse · `financialConnectivityLive` · [`ENGINE_GAP_E10_WALLET_SETTINGS_UI.md`](../OPERATIONS/ENGINE_GAP_E10_WALLET_SETTINGS_UI.md) |

**Implemented:** transfer hub · API keys CRUD · giftcard redeem reverse · launch gate live

**증거:** `gate:ai-impl` L0–L4 green · vitest **13/13** · `financialConnectivityLive=true` · wire transfer/api-keys/redeem **live**

**다음 todo:** `ew-e10-trust-support-ui`

## Track B E10 Admin KRW Proof Review (`ew-e10-page-admin-krw-proof-review` · §29.2) — `[x]` DONE · 재착수 금지

> **선행:** E10 WAVE `ew-e10-platform-engine-wave` **`[x]`** · **후행:** `ew-e10-wallet-settings-ui` **`[x]`**

| Todo                                     | 상태           | 완료일         | 증거                                                                                                                           |
| ---------------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **`ew-e10-page-admin-krw-proof-review`** | **`[x]` DONE** | **2026-07-12** | `/admin/deposits` 증빙 보기·맞음 표시 · [`ENGINE_GAP_E10_ADMIN_KRW_PROOF.md`](../OPERATIONS/ENGINE_GAP_E10_ADMIN_KRW_PROOF.md) |

**Implemented:** `AdminDepositsPage` proof column · view signed URL · `rpc_admin_review_krw_deposit_proof` · **원장 이동 0** notice · beginner §29.2 RPC pin · display contract

**증거:** `gate:ai-impl` admin-krw-proof · vitest display+deposits page

**다음 todo:** `ew-e10-growth-ui` (wallet-settings `[x]`)

## Track B E10 Platform Engine WAVE (`ew-e10-platform-engine-wave` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E9 GATE `ew-e9-gate-identity-support` **`[x]`** · **후행:** `ew-e10-page-admin-krw-proof-review` **`[x]`**

| Todo                              | 상태           | 완료일         | 증거                                                                                                                                 |
| --------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **`ew-e10-platform-engine-wave`** | **`[x]` DONE** | **2026-07-12** | ADR-020 · KRW proof · mission chains · co-bet · recommend · [`ENGINE_GAP_E10_PLATFORM.md`](../OPERATIONS/ENGINE_GAP_E10_PLATFORM.md) |

**Implemented (WAVE):** ADR-020 · `ew_e10_platform_engine` · `platformEngine=true` · live flags **false** · EXISTS KRW match / E7 co-mission remigration **0**

**증거:** `gate:ai-impl` ew-e10-platform · vitest display contract · SQL E10-0..E10-5 artifact (CI authoritative · G13) · GATE remote apply = 후행

**다음 todo:** `ew-e10-growth-ui` (Admin KRW proof `[x]` · wallet-settings `[x]`)

## Track B E9 Admin Support Desk (`ew-e9-page-admin-support` · §29.5) — `[x]` DONE · 재착수 금지

> **선행:** E9 GATE `ew-e9-gate-identity-support` **`[x]`** · **후행:** `ew-e10-platform-engine-wave` **`[x]`**

| Todo                           | 상태           | 완료일         | 증거                                                                                                                             |
| ------------------------------ | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e9-page-admin-support`** | **`[x]` DONE** | **2026-07-12** | `/admin/support` · list/resolve · queues 수렴 · [`ENGINE_GAP_E9_ADMIN_SUPPORT.md`](../OPERATIONS/ENGINE_GAP_E9_ADMIN_SUPPORT.md) |

**Implemented:** `AdminSupportPage` · `useAdminSupportDesk` · nav owner/support · `AdminTable` · queues open-ticket banner · beginner i18n · display contract

**증거:** `gate:ai-impl` admin-support · vitest desk+page **9/9** · typecheck · i18n · release · related admin contracts **34/34**

**다음 todo:** `ew-e10-growth-ui` (Admin KRW proof `[x]` · wallet-settings `[x]`)

## Track B E9 Identity+Support GATE (`ew-e9-gate-identity-support` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E9 WAVE `ew-e9-identity-wave` **`[x]`** · **후행:** `ew-e9-page-admin-support` **`[x]`**

| Todo                              | 상태           | 완료일         | 증거                                                                                                                                                         |
| --------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`ew-e9-identity-wave`**         | **`[x]` DONE** | **2026-07-12** | ADR-019 · SIWE · tickets · analytics · app-install · tier LB · [`ENGINE_GAP_E9_IDENTITY_SUPPORT.md`](../OPERATIONS/ENGINE_GAP_E9_IDENTITY_SUPPORT.md)        |
| **`ew-e9-gate-identity-support`** | **`[x]` DONE** | **2026-07-12** | `stack:push-remote` · advisor **0** · SQL E9-0..E9-5 (CI) · [`ENGINE_GAP_E9_GATE_IDENTITY_SUPPORT.md`](../OPERATIONS/ENGINE_GAP_E9_GATE_IDENTITY_SUPPORT.md) |

**Implemented (GATE):** remote `ew_e9_app_install_enum` (tail `20260711194352`) · `ew_e9_identity_support` (tail `20260711194354`) · advisor **0 ERROR** · GATE display contract · hubs `built_hidden` · live flags **false** · EXISTS passkey/viral/affiliate remigration **0**

**증거:** `gate:ai-impl` ew-e9-gate-identity · vitest GATE+WAVE · `stack:push-remote` OK · advisor **0** · SQL E9-0..E9-5 **CI authoritative** (G13)

**다음 todo:** `ew-e10-growth-ui` (Admin KRW proof `[x]` · Admin support `[x]` · wallet-settings `[x]`)

## Track B E9 Identity+Support WAVE (`ew-e9-identity-wave` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E8 GATE `ew-e8-gate-financial` **`[x]`** · **후행:** `ew-e9-gate-identity-support` **`[x]`**

| Todo                      | 상태           | 완료일         | 증거                                                                                                                                                  |
| ------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e9-identity-wave`** | **`[x]` DONE** | **2026-07-12** | ADR-019 · SIWE · tickets · analytics · app-install · tier LB · [`ENGINE_GAP_E9_IDENTITY_SUPPORT.md`](../OPERATIONS/ENGINE_GAP_E9_IDENTITY_SUPPORT.md) |

**Implemented (WAVE):** ADR-019 · `ew_e9_app_install_enum` · `ew_e9_identity_support` · edge `siwe-auth` · `LAUNCH_GATES.identitySupportEngine=true` · live flags **false** · EXISTS passkey/viral/affiliate remigration **0**

**증거:** `gate:ai-impl` ew-e9-identity · vitest display contract · SQL E9-0..E9-5 artifact (CI authoritative · G13) · GATE remote apply **`[x]`**

**다음 todo:** `ew-e10-growth-ui` (Admin KRW proof `[x]` · Admin support `[x]` · E9 GATE `[x]` · wallet-settings `[x]`)

## Track B E8 Financial GATE (`ew-e8-gate-financial` · §21.1) — `[x]` DONE · 재착수 금지

> **선행:** E8 WAVE `ew-e8-financial-wave` **`[x]`** · **후행:** `ew-e9-identity-wave` **`[x]`**

| Todo                       | 상태           | 완료일         | 증거                                                                                                                                    |
| -------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **`ew-e8-financial-wave`** | **`[x]` DONE** | **2026-07-12** | ADR-018 · P2P · API keys · giftcard redeem · [`ENGINE_GAP_E8_FINANCIAL.md`](../OPERATIONS/ENGINE_GAP_E8_FINANCIAL.md)                   |
| **`ew-e8-gate-financial`** | **`[x]` DONE** | **2026-07-12** | `stack:push-remote` · advisor **0** · SQL Σ=0 (CI) · [`ENGINE_GAP_E8_GATE_FINANCIAL.md`](../OPERATIONS/ENGINE_GAP_E8_GATE_FINANCIAL.md) |

**Implemented (GATE):** remote `ew_e8_financial` (tail `20260711192506`) · advisor **0 ERROR** · GATE display contract · hub `built_hidden` · `financialConnectivityLive=false` · EXISTS deposit pin

**증거:** `gate:ai-impl` ew-e8-gate-financial · vitest GATE+WAVE · `stack:push-remote` OK · advisor **0** · SQL E8-0..E8-4 Σ=0 **CI authoritative** (G13)

**다음 todo:** `ew-e10-growth-ui` (E10 wallet-settings `[x]` · Admin KRW proof `[x]` · Admin support `[x]` · E9 GATE `[x]`)

**Track A `#236` P13 Launch Closeout:** **`[x]` DONE** 2026-07-11 — legacy class purge · docs sync · CI gate pin · `gate:ai-impl` **16/16** · `check:design-tokens --strict` · migration **0** · [`P13_LAUNCH_CLOSEOUT_BUNDLE.md`](../OPERATIONS/P13_LAUNCH_CLOSEOUT_BUNDLE.md)
**Track A `#235` DA W7 VISUAL:** agent impl `[x]` 2026-07-11 — Home+Shell+Trade · 390/768/1024/2560 · preview · axe 0 · dead control 0 · `gate:ai-impl` **22/22** · Plan YAML `completed` = operator `VISUAL APPROVED: da-w7` 후
**Track A `#234` DA W7 strict tokens:** **`[x]` DONE** 2026-07-11 — `check:design-tokens --strict` · text-tiny · legacy purge · `gate:ai-impl` · migration **0**
**Track A `#233` Soft Launch BUNDLE:** **`[x]` DONE** 2026-07-11 — ko/en QA · viewport/axe · CB-01~06 · admin spot-check · `gate:ai-impl` · migration **0**
**Track A `#232` T0-A prod preflight:** **`[x]` DONE** 2026-07-11 — checklist · live audit · `gate:ai-impl` **7/7** · migration **0**
**Track A `#231` P13 ops Web Push:** **`[x]` DONE** 2026-07-11 — settings 「알림 받기」 · SW · `push_subscriptions` · `ops-notify` web_push → `/queues` · `gate:ai-impl` **8/8** · migration **0**
**Track A `#230` Admin team desk:** **`[x]` DONE** 2026-07-11 — `/admin/team` · owner-only · `gate:ai-impl` **22/22**
**Track A `#229` Admin canonical docs:** **`[x]` DONE** 2026-07-11 — §29.5 · correspondence · RBAC · `gate:ai-impl` **12/12**
**Track A `#228` W8 GATE:** **`[x]` DONE** 2026-07-11 — Emotion Map · `gate:ai-impl` **49/49**
**Track A `#227` W8 sound DOC:** **`[x]` DONE** 2026-07-11 — `SOUND_DESIGN_CANON` · `gate:ai-impl` **5/5**
**Track A `#226` W8 signature:** **`[x]` DONE** 2026-07-11 — home·wallet·trade·casino·sports·vip · `gate:ai-impl` **36/36**
**Track A `#225` P12 Marketing GATE:** **`[x]` DONE** 2026-07-11 — §32.5 FAQ·feedback·affiliate·cookies + marketing surfaces · footer/redirect/education · `gate:ai-impl` vitest **59/59** · engine **0**  
**Track A `#221` P11 Side-income GATE:** **`[x]` DONE** 2026-07-11 — §12.19.6 `/wallet/redeem` · `/earn/cashback` · `/earn/play` · `/events` · leaderboard STUB · `gate:ai-impl` vitest **39/39** · engine **0**  
**Track A `#220` P11 wallet redeem:** **`[x]` DONE** 2026-07-11 — `/wallet/redeem` · Payment Method Card · withdraw/deposit rails · `gate:ai-impl` vitest **21/21** · subnav register · engine **0**  
**Track A `#219` P11 Earn side surfaces:** **`[x]` DONE** 2026-07-11 — `/events` · `/earn/play` · `/earn/cashback` · `/referral/leaderboard` STUB · `gate:ai-impl` vitest **45/45** · subnav P11 register  
**Track A `#218` P4 VISUAL:** agent impl `[x]` 2026-07-11 — contract **6/6** · surface **13/13** · axe 0 · dead control 0 · Plan YAML `completed` = operator `VISUAL APPROVED` 후  
**Track A `#216` DA W6 Brand elevation:** **`[x]` DONE** 2026-07-11 — BrandMark aurora · domain empty · QuadStreamLoading · `gate:ai-impl` **55/55**  
**Track A `#215` P10 VISUAL:** agent impl `[x]` 2026-07-11 — contract **6/6** · surface **13/13** · axe 0 · dead control 0 · Plan YAML `completed` = operator APPROVED 후  
**Track A `#214` P10 GATE:** **`[x]` DONE** 2026-07-11 — Sports+Casino 12 · subnav dead link 0 · H5/Fiat#12 · first-bet · `gate:ai-impl` **42/42**  
**Track A `#213` first-bet education:** **`[x]` DONE** 2026-07-11  
**Track A `#212` Casino fairness:** **`[x]` DONE** 2026-07-11 — `/casino/fairness` verifyRound · §23.2.1 PF limits · `gate:ai-impl` **23/23**  
**Track A `#211`–`#208` Games batches:** **`[x]` DONE** 2026-07-11 — Batch D/C/B/A  
**Track A `#207` AdminTable GATE:** **`[x]` DONE** 2026-07-11 — native `<table>` desk 0 · LoadingTable 0 · `gate:ai-impl` **8/8**  
**Track A `#206` AdminTable:** **`[x]` DONE** 2026-07-11 — `admin-table.tsx` · 18 desk migration · native `<table>` 0 · LoadingTable 0  
**Track A `#205` Fiat#11:** **`[x]` DONE** 2026-07-11 — Casino fiat hint session-lock

**재개 조건 (충족):**

```text
ew-e10-trust-support-ui [x] DONE
  → phase_r Track B 다음 = ew-e10-growth-ui
```

## Trade Desk Remediation (Plan `trade_desk_remediation_v3` · execute SSOT)

> **형제 큐:** Phase R Track A와 **독립** — 엔진 T0~T3 + Launch RC Tier 2.  
> **Operator signoff:** [`TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md`](../OPERATIONS/TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md) · [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](../OPERATIONS/TRADE_DESK_LAUNCH_RC_SIGNOFF.md)

| Todo                       | 상태           | 완료일         | 증거                                                                                                     |
| -------------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `phase-4-launch-rc`        | `[x]` impl     | 2026-07-07     | `trade-desk-launch-rc-display-contract` · complaint+toast registry 100%                                  |
| **`phase-4-closeout`**     | **`[x]` DONE** | **2026-07-07** | security-auditor PASS · §82 doc sync · **S4 LAUNCH RC APPROVED** · **4C CI + 4D soak operator verified** |
| **`operator-rc-closeout`** | **`[x]` DONE** | **2026-07-07** | CI quality·sql·e2e·advisors green (`fed305d`) · soak spot-check WARNING 0                                |

**Implemented:** `gate:ai-impl` launch-rc **6/6** · visual signoff **41/41** · security-auditor T0~T3 **PASS** (ERROR 0)

**Verified/DONE (full Tier 2 LAUNCH):** GitHub CI **quality·sql·e2e·advisors green** (`fed305d`) + 24h prod soak **WARNING 0** — `scripts/trade-desk-launch-rc-soak-spotcheck.sql` · remediate `scripts/trade-desk-launch-rc-soak-remediate.sql` · **2026-07-07**

## Trade Desk Zero-Defect QA Audit (Plan `trade_desk_qa_audit` · execute SSOT)

> **형제 큐:** Remediation Launch RC **선행 완료** · 본 큐 = P0-0→P4→**L9** Zero-Defect evidence + §15 운영 창  
> **E0 정본:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md)  
> **L9 승인:** [`L9/release-approval-record.md`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md)  
> **§15 운영 창:** [`ops-window/`](../OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/README.md) — **STARTED** 2026-07-08

| Todo                        | 상태           | 완료일         | 증거                                                                  |
| --------------------------- | -------------- | -------------- | --------------------------------------------------------------------- |
| P0-0 ~ P4 (impl)            | `[x]` impl     | 2026-07-07~08  | E0 P0-0/S0/P3/P4 slots · domain contracts · operator docs             |
| **`closeout-doc-sync`**     | **`[x]` DONE** | **2026-07-08** | L9 release-approval-record(실질) · §82 sync · §15 ops-window STARTED  |
| operator L9 Stage 2/3       | `[ ]` pending  | —              | rollback 15min dry-run · KPI baseline · Q1 operator · prod deploy sha |
| §15 week1 / month1 / month3 | **STARTED**    | 2026-07-08     | incident **0** · 마감 2026-07-15 / 2026-08-08 / 2026-10-08            |

**Implemented:** `closeout-doc-sync` — E0 `L9/` + `ops-window/` · ACTIVE_WORK_SSOT §82 · LAUNCH_RC §L9 cross-ref

**Zero-Defect 선언:** **금지** (L9) — §15 3m incident 0 + 복구 (a)~(e) 준수 후에만 "근접" 검토

## Trade Desk 결함 0 수렴 (Plan `트레이딩_결함_0_수렴` · 감사 후속)

> **근거:** [`ENGINE_UI_FULL_AUDIT_2026-07-08.md`](../audit/ENGINE_UI_FULL_AUDIT_2026-07-08.md) · Phase A **`[x]` DONE** 2026-07-08 · Phase B B1–B3 **`[x]` impl** 2026-07-08

| Todo                                        | 상태           | 완료일         | 증거                                                                                                                                                             |
| ------------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`phase-a-doc-honesty`**                   | **`[x]` DONE** | **2026-07-08** | D-1~D-7 계약·문서 정직화 · `gate:ai-impl` order-states **11/11** · parity **29/29** · layout-dedup **9/9** · i18n-surface **5/5** · `check:ai-reference` green   |
| **`phase-a-unverified`**                    | **`[x]` DONE** | **2026-07-08** | MCP READ-ONLY · UNVERIFIED 1~3 확정 · `list_migrations` 203/204 · `list_edge_functions` liquidation-worker absent · `funding_rates` 21×0% · `funding_payments` 0 |
| **`phase-b-worker-reconnect`** (B1 · H-1)   | **`[x]` impl** | **2026-07-08** | `market-data.worker.ts` depth/ticker WS onclose/onerror · `createReconnectScheduler` · REST re-seed · `parseWsJson` · vitest reconnect **8/8**                   |
| **`phase-b-feed-heartbeat`** (B2 · H-2)     | **`[x]` impl** | **2026-07-08** | `market-data-heartbeat.ts` · worker inactivity · kline Bybit ping/pong · vitest heartbeat **6/6**                                                                |
| **`phase-b-stale-detect`** (B3 · H-3)       | **`[x]` impl** | **2026-07-08** | `display-feed-stale.ts` · store `feedStale` · header/book badge · synthetic book 폴백 · vitest stale **17/17**                                                   |
| **`phase-b-kline-reconnect`** (B4–B5 · M-5) | **`[x]` impl** | **2026-07-08** | `display-kline-reconnect.ts` · `use-display-kline.ts` backoff+jitter · Binance primary 복귀 5m/visibility · vitest kline **9/9** · stale **3/3**                 |
| **`phase-c-rpc-validation`** (C1 · M-6)     | **`[x]` impl** | **2026-07-08** | `trading-rpc-display-contract.ts` · `use-trading.ts` 21 RPC `callRpc`+parsers · kline WS field guards · vitest rpc **6/6** · feed **5/5**                        |
| **`phase-c-type-dedup`** (C2 · L-1)         | **`[x]` impl** | **2026-07-08** | candle/MarginMode/TradeDeskKind/Ticker24h 단일 정본 · adapters · vitest dedup **8/8**                                                                            |
| **`phase-c-dead-contract`** (C3 · L-2)      | **`[x]` impl** | **2026-07-08** | `apps/web/src/contracts/controller-view-freeze.ts` 삭제 · admin copy 유지 · `ENGINE_BOUNDARY.md` 갱신                                                            |

**Implemented (Phase C):** typed RPC parsers · WS kline field guards · type dedup · UNVERIFIED-4 `rpc_run_open_order_fills` caller documented · dead web contract removed

**Phase C closeout (2026-07-08):** `gate:ai-impl` trade-display-type-dedup + trading-rpc-display-contract green · `typecheck` green

| **`phase-d-chart-indicators`** (D5 · 갭 #14 일부) | **`[x]` impl** | **2026-07-08** | chart indicators · drawing tools |
| **`phase-e-engine-gaps`** (E1–E3 · RED STOP) | **`[x]` impl** | **2026-07-08** | `20260722000001_trade_e_phase_e_advanced_orders` · trailing stop · TIF · iceberg · UI wire · `trade_e_phase_e_advanced_orders_test.sql` |

**Implemented (Phase E):** `rpc_set_trailing_stop` · `rpc_clear_trailing_stop` · `time_in_force` · `display_quantity` iceberg slices · `rpc_run_stop_orders` trailing peak · `rpc_run_open_order_fills` IOC/FOK expiry

**NEXT:** **`da-w8-signature-surfaces-bundle` (#226)** · P12 GATE `#225` **`[x]`** 2026-07-11 · P12 legal pages `#224` **`[x]`** 2026-07-11 · P12 community hub `#223` **`[x]`** 2026-07-11 · P12 trust hub `#222` **`[x]`** 2026-07-11 · P11 GATE `#221` **`[x]`** 2026-07-11 · P11 wallet redeem `#220` **`[x]`** 2026-07-11 · Earn side `#219` **`[x]`** 2026-07-11 · P4 VISUAL `#218` agent impl `[x]` 2026-07-11 · W6 GATE `#217` **`[x]` DONE** 2026-07-11 · W6 BUNDLE `#216` **`[x]` DONE** 2026-07-11 · P10 VISUAL `#215` agent impl `[x]` · P10 GATE `#214` **`[x]` DONE** 2026-07-11 · first-bet education `#213` **`[x]` DONE** 2026-07-11 · Fairness `#212` **`[x]` DONE** 2026-07-11 · Batch D–A `#211`–`#208` **`[x]`** · AdminTable GATE `#207` **`[x]` DONE** 2026-07-11 · AdminTable `#206` **`[x]` DONE** 2026-07-11 · Fiat#11 `#205` **`[x]` DONE** 2026-07-11 · PIR **`[x]` DONE** · CasinoR#1 `#204` **`[x]`** · Casino lobby `#203` **`[x]`** · Sports#4–0 · Fiat#10 · DA W5…W0 · R0 · PQA §33 **`[x]`**

## 읽을 것 (active)

1. 본 문서 (`ACTIVE_WORK_SSOT.md`)
2. Phase R 실행: [`docs/PRODUCT/REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)
3. YAML todo 정본: Cursor Plan `phase_r_super-app_8bdf2c10` (frontmatter · **280 ids** · Track A **245** + Track B **35** · completed **273** · pending **0** · cancelled **7** · §20.6.1–§20.6.3 · §20.13 · §20.13.2 Fiat# · **§20.13.3 Sports#·CasinoR#** · **§20.14 Launch** · **§35 Forensic R0** · **§34 DA W5 GATE** · §25.12.9.1-D · §22.2.4 · **§22.2.5 Sports Parity** · **§23.2.1 Casino one-shot replay** · **§32.7** · **52차** 2026-07-10 · orchestration SSOT=본 plan · execute sibling=`trade_desk_*`·`phonara_수렴_*`)
   > **Note:** execute SSOT는 본 문서 — Fiat#11 `#205` **`[x]`** · Plan YAML frontmatter는 operator/Cursor UI에서 `completed` 동기화 필요 (세션 지시: plan 파일 직접 편집 금지)
4. 엔진 **상태 한 줄만**: [`docs/ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md) (게이트 수치 · 재착수 금지)
5. UX **의도 참조** (실행 큐 아님): `docs/SSOT/*_UX_CANON.md` · `UX_REFERENCE_CANON.md`
6. 경계: [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md) · [`OPERATOR_GATES.md`](OPERATOR_GATES.md) · [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)
7. YAML↔doc drift 게이트: `bun run check:plan-doc-sync` · drift 시 `bun run sync:plan-doc-mirror`

## 읽지 말 것 (frozen — denylist)

- `docs/ENGINE_PHASE*_EVIDENCE_REPORT.md` · `ENGINE_POST_APEX_*` · `ENGINE_FORENSIC_*` · `ENGINE_STATE_AUDIT_*`
- Batch 11 삭제 v2 SSOT (경로 목록: [`DEPRECATED_DOC_DENYLIST.md`](DEPRECATED_DOC_DENYLIST.md))
- [`DEMOLITION_PLAN.md`](../PRODUCT/DEMOLITION_PLAN.md) — **완료 이력만** · batch 재실행 큐 **아님**
- [`REBUILD_PLAN_TBD.md`](../PRODUCT/REBUILD_PLAN_TBD.md) — superseded stub

## 게이트 (엔진 회귀 확인 시만)

**저사양 operator (8GB):** SQL · E2E · full vitest/build chain은 **로컬 일상 금지** — **GitHub CI authoritative.**  
로컬 마감 = `gate:ai-impl` · push 후 CI green 확인. 정본: [`CI_GATE_AUTHORITY.md`](CI_GATE_AUTHORITY.md)

```powershell
# 로컬 (Implemented)
bun run gate:ai-impl -- --test <owner-vitest-path>

# Push → GitHub Actions CI job green (Verified)
# quality · sql · e2e · advisors — .github/workflows/ci.yml

# migration touch 시 (CI sql green 후)
bun run stack:push-remote
bun run check:advisors
```

| Gate             | 로컬                         | CI job           |
| ---------------- | ---------------------------- | ---------------- |
| Engine unit      | `bun run test:engine` (선택) | quality (`test`) |
| SQL Σ=0          | ❌ 위임                      | **sql**          |
| Playwright E2E   | ❌ 위임                      | **e2e**          |
| Remote advisor   | —                            | **advisors**     |
| Remote migration | `stack:push-remote`          | —                |

## 다음 착수 순서 (Phase R · Track A)

**P1 Foundation** → **P2 Admin** → P3 Auth → P4 Money → P5 Security → P6 Shell → **P7 Growth** → **P8 Core** → P9–P12 Product → P13 Soft Launch → E0–E7 Engine Wave

**현재 NEXT:** **`launch-ramp-t1-feature-gates` (#237)** · P13 closeout `#236` **`[x]` DONE** 2026-07-11 · W7 strict `#234` **`[x]`** 2026-07-11 · Soft Launch `#233` **`[x]`** 2026-07-11 · T0-A `#232` **`[x]`** · ops Web Push `#231` **`[x]`** 2026-07-11 · team desk `#230` **`[x]`** · Admin docs `#229` **`[x]`** · W8 GATE `#228` **`[x]`** · W8 sound `#227` **`[x]`** · W8 signature `#226` **`[x]`** · P12 GATE `#225` **`[x]`** 2026-07-11 · P12 legal pages `#224` **`[x]`** 2026-07-11 · P12 community hub `#223` **`[x]`** 2026-07-11 · P12 trust hub `#222` **`[x]`** 2026-07-11 · P11 GATE `#221` **`[x]`** 2026-07-11 · P11 wallet redeem `#220` **`[x]`** 2026-07-11 · Earn side `#219` **`[x]`** 2026-07-11 · P4 VISUAL `#218` agent impl `[x]` 2026-07-11 · W6 GATE `#217` **`[x]` DONE** 2026-07-11 · W6 BUNDLE `#216` **`[x]` DONE** 2026-07-11 · P10 VISUAL `#215` agent impl `[x]` · P10 GATE `#214` **`[x]` DONE** 2026-07-11 · first-bet education `#213` **`[x]` DONE** 2026-07-11 · Fairness `#212` **`[x]` DONE** 2026-07-11 · Batch D–A `#211`–`#208` **`[x]`** · AdminTable GATE `#207` **`[x]` DONE** 2026-07-11 · AdminTable `#206` **`[x]` DONE** 2026-07-11 · Fiat#11 `#205` **`[x]` DONE** 2026-07-11 · PIR **`[x]` DONE** · CasinoR#1 `#204` **`[x]`** · Casino lobby `#203` **`[x]`** · Sports#4–0 · Fiat#10 · DA · R0 · PQA **`[x]`**

**왕초보 작업법 (43차 · 이것만):**

1. Cursor Plan To-do **위에서 아래로** 본다
2. **`completed`(체크됨)는 건너뛴다**
3. Track A **`#225` P12 Marketing GATE `[x]`** — 다음 `#226` `da-w8-signature-surfaces-bundle`
4. PIR 형제 큐는 **`[x]` DONE** — 재착수 금지

**직선 큐 (pending 구간):** Track A `#205` → P10 잔여 → P11 → P12 → P13 → T1/T2 → Engine Wave (잔여 DB TX deep audit)

**품질 바 (운영자):** §13.1.2 — UX=거래소급 · 정산=플랫폼 내부 only · chart/WS **display-only** · §32.7 — 노출=동작|disabled+reason|hidden · §22.2.4 표시=RPC · dead control 0

## P9 WORLD 실행 큐 (§25.12.9.1-D · 28 steps + 26a–26b remediation · YAML #124–151)

**정본:** Plan §25.12.9.1-D step 번호 · §25.12.9.2 audit remediation · §22.2.1 F = redirect only · §20.13 global #N

**상태:** `[x]` P9 WORLD **28/28 + gate** · **`p9-gate-trade` `[x]`** · **`p9-world-preflight` `[x]`** · **E1 liquidation notify `[x]`** · **NEXT Launch E2 (#155)**

```text
1  p9-trade-parity-matrix-sync       [x] 2026-07-05
2  p9-trade-spot-pair-wire           [x] 2026-07-05
3  p9-trade-ticker-header-wire       [x] 2026-07-06
4  p9-trade-chart-pro-lwc            [x] 2026-07-06
5  p9-trade-chart-overlays-lwc       [x] 2026-07-06
6  p9-trade-fills-history-wire       [x] 2026-07-06
7  p9-trade-terminal-bottom-dock   [x] 2026-07-06
8  p9-trade-recent-trades-rail       [x] 2026-07-06
9  p9-trade-orderbook-parity         [x] 2026-07-06
10 p9-trade-futures-partial-close-ui [x] 2026-07-06
11 p9-trade-futures-margin-adjust-ui [x] 2026-07-06
12 p9-trade-futures-unrealized-pnl   [x] 2026-07-06
13 p9-trade-leverage-slider-ux         [x] 2026-07-06
14 p9-trade-order-ticket-density       [x] 2026-07-06
15 p9-trade-beginner-help-layer       [x] 2026-07-06
16 p9-trade-position-mode-label       [x] 2026-07-06
17 p9-trade-cross-margin-canary        [x] 2026-07-06
18 p9-trade-funding-history-display      [x] 2026-07-06
19 p9-trade-tier-fee-display              [x] 2026-07-06
20 p9-trade-oracle-circuit-banner       [x] 2026-07-06
21 p9-trade-ultra-layout              [x] 2026-07-06
22 p9-trade-mobile-history-tab          [x] 2026-07-06
23 p9-trade-mobile-futures-book-tab    [x] 2026-07-06
24 p9-trade-settings-prefs-wire           [x] 2026-07-06
25 p9-trade-layout-dedup-gate              [x] 2026-07-06
26 p9-trade-i18n-surface-audit              [x] 2026-07-06
26a p9-trade-audit-remediation-a1           [x] 2026-07-06 · spot whitelist filter+cancel · registry · §12.19
26b p9-trade-audit-remediation-a2           [x] 2026-07-06 · useTradeDeskViewport · chart single mount
27 p9-operator-visual-signoff              [x] 2026-07-06 · agent impl + operator VISUAL APPROVED
28 p9-gate-trade-world-class (#153)        [x] 2026-07-06
29 launch-engine-e1-liquidation-notify (#154)        [x] 2026-07-06
30 launch-engine-e2-admin-halt-market (#155)        [x] 2026-07-06
31 launch-engine-e3-ops-telegram-webhook (#156)      [x] 2026-07-06
32 launch-engine-e4-concurrent-race-test (#157)     [x] 2026-07-06
33 p4-fiat-reference-preflight (#158)        [x] 2026-07-06
34 p4-fiat-currency-precision-ssot (#159)        [x] 2026-07-06
35 p4-fiat-reference-rates-hook (#160)        [x] 2026-07-06
36 p4-fiat-hint-display-contract (#161)        [x] 2026-07-06
37 p4-fiat-money-display-hint (#162)        [x] 2026-07-06
38 p4-page-wallet-fiat-hint (#163)        [x] 2026-07-06
39 p9-trade-fiat-hint-wire (#164)        [x] 2026-07-06
40 p7-earn-fiat-hint-co-primary (#165)        [x] 2026-07-06
41 p5-page-settings-fiat-reference (#166)        [x] 2026-07-06
42 p4-gate-fiat-reference-world-class (#167)        [x] 2026-07-06
```

## Fiat Reference Core Gate (`p4-gate-fiat-reference-world-class` · §13.1.4 · §20.13.2 Fiat#9G · YAML #167) — `[x]` DONE · 재착수 금지

**Implemented:** `p4-gate-fiat-reference-world-class-display-contract.ts` — `assertP4FiatReferenceWorldClassGateSync` · Fiat#1–5 infra + Fiat#6–9 surface wires bundle · ComplaintRisk `fiat-hint-*` **core 3행 live** (ledger-leak · stale-hidden · locale-hardcode-krw) · P10 deferrals (`fiat-hint-casino-drift` · `fiat-hint-sports-odds-order`) registered · preflight grep full `apps/web/src` · **P10 page unblock**

**증거:** `gate:ai-impl` fiat bundle **113/113** (18 files) · `p4-gate-fiat-reference-world-class-display-contract` **6/6** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p10-page-casino` `[x]`** — §23 casino lobby Stake grid · Sports#4 **`[x]`** · **NEXT `p10-casino-replay-and-infra` (#204)**

## Sportsbook Home (`p10-page-sports` · §13.1.1 · §12.7 · YAML #168) — `[x]` DONE · 재착수 금지

**Implemented:** `/sports` sportsbook (fixture board + bet slip rail) · child routes `/sports/prematch|live|my-bets|rules|vip` · `/betting` redirect (§12.17) · `use-sports-page-controller` · `use-sports-bet-slip-state` · **USDT/PHON stake currency selector** → `rpc_place_sports_bet(p_currency)` · per-currency avail · `@phonara/sportsbook-engine` display-only payout preview · `TRADE_DUAL_CURRENCY_MATRIX` sports-slip-currency **`phonara: yes`**

**증거:** `gate:ai-impl` `product/surfaces/sports` **5/5** · `sports-page-display-contract` **4/4** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

## Platform Zero-Defect Audit (PQA §33 · YAML #169–179)

> **정본:** Plan `phase_r_super-app_8bdf2c10` §33 · 결함 대장 = [`PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`](../audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md)  
> **P10 잔여 unblock:** `pqa-gate-platform-audit` (#179) **`[x]` DONE** 2026-07-09 — `#180+` 착수 가능

| Todo                                    | 상태           | 완료일         | 산출                                                                                                                                                                                                                                                       |
| --------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pqa-audit-a-db-guards`                 | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_A_DB_GUARDS_2026-07-08.md`                                                                                                                                                                                                                 |
| `pqa-audit-b-rpc-contract`              | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_B_RPC_CONTRACT_2026-07-08.md` · `last-b-rpc-contract-report.json`                                                                                                                                                                          |
| `pqa-audit-c-surface-controls`          | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_C_SURFACE_CONTROLS_2026-07-08.md` · `audit-c-surface-controls.ts`                                                                                                                                                                          |
| `pqa-audit-d-config-state`              | **`[x]` DONE** | 2026-07-08     | `PLATFORM_AUDIT_D_CONFIG_STATE_2026-07-08.md` · `audit-d-config-state.ts`                                                                                                                                                                                  |
| **`pqa-audit-report`**                  | **`[x]` DONE** | **2026-07-08** | **`PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md`** — P0 **0** · P1 **3** · P2 **14** · P3 **7**                                                                                                                                                          |
| `pqa-fix-error-mapping`                 | **`[x]` impl** | 2026-07-08     | F1 · P2-ERR-01–10 · `packages/i18n/src/translate-error.ts` · admin `RpcError.i18nKey` · `translate-error.test.ts` **6/6**                                                                                                                                  |
| `pqa-fix-client-gate-prechecks`         | **`[x]` impl** | 2026-07-08     | F2 · P2-GATE-01–07 · `client-gate-contract.ts` · `use-client-gate-prechecks.ts` · trade/wallet/sports/earn wire · `client-gate-contract` **7/7** · F1+F2 bundle **33/33**                                                                                  |
| `pqa-fix-dead-controls`                 | **`[x]` impl** | 2026-07-08     | F3 · P3 stub · `dead-controls-display-contract.ts` · casino hub defer · sports VIP defer · settings API keys disabled · tier-keepStatus unavailable · reward tickets 0 note · BEP20 i18n removal · `gate:ai-impl` F3 bundle **38/38** · engine touch **0** |
| `pqa-fix-types-regen`                   | **`[x]` impl** | 2026-07-09     | F4 · `gen:types` · `check:types` drift gate · `database-types-contract.ts` · `rpc_run_open_order_fills` · `rpc_run_stop_orders` · CI sql job · `gate:ai-impl` F4 **5/5** · engine touch **0**                                                              |
| `launch-engine-e5-realtime-publication` | **`[x]` impl** | 2026-07-09     | F5 · `20260724000001_trade_wallet_realtime_publication.sql` · 10 tables · `trade_wallet_realtime_publication_test.sql` · `stack:push-remote` · advisor 0                                                                                                   |
| `pqa-gate-platform-audit`               | **`[x]` DONE** | **2026-07-09** | G · `gate:ai-impl` PQA bundle **21/21** · `check:i18n` · `check:release` · `audit:pqa-c` · `audit:pqa-d` · `check:ai-reference` · §33 G close · P10 unblock                                                                                                |

**Implemented (audit A–E):** read-only A/B/C/D + E 결함 대장 · prod P0 blocker **0** · advisor ERROR **0** · §12.19 **0** · dead control P2 **0**

**증거 (audit closeout):** `bun run audit:pqa-c` · `bun run audit:pqa-d` · `check:ai-reference` · `typecheck` · `check:hygiene`

**재현:**

```powershell
bun run audit:pqa-c
bun run audit:pqa-d
bun run check:engine-foundation-parity   # migration parity P1-002
```

**P1 engine 큐 (F와 병행 · RED STOP):** `launch-engine-e5-realtime-publication` **`[x]`** 2026-07-09

## Sports Fiat Hint (`p10-sports-fiat-hint-wire` · §13.1.4.4 · §20.13.2 Fiat#10 · YAML #196) — `[x]` DONE · 재착수 금지

> **선행:** `da-w5-gate-domain-cards` **`[x]`** · `p4-fiat-money-display-hint` **`[x]`** · `p10-page-sports` **`[x]`** · **후행:** `p10-sports-hub-pages` (#197) **`[x]`**

| Todo                            | 상태           | 완료일         | 증거                                                                                                                                                                      |
| ------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-sports-fiat-hint-wire`** | **`[x]` DONE** | **2026-07-10** | stake+return secondary · odds-after `potentialPayoutDisplay` · trade 30s rates · `fiat-hint-sports-odds-order` live · `gate:ai-impl` sports fiat **25/25** · engine **0** |

**Implemented:** `sports-fiat-hint-display.ts` · `use-sports-fiat-hint.ts` · `sports-money-with-fiat-hint.tsx` · slip avail/stake/payout rows · `FiatHintDisclaimer` 1× · client odds multiply **0**

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Casino Fiat Hint session-lock (`p10-casino-fiat-hint-session-lock` · §13.1.4.4 · §20.13.2 Fiat#11 · YAML #205) — `[x]` DONE · 재착수 금지

> **선행:** `p4-fiat-money-display-hint` **`[x]`** · `p10-casino-replay-and-infra` **`[x]`** · **후행:** `p2-admin-table-primitive` (#206) **`[x]`** → `p2-gate-admin-table-dedup` (#207)

| Todo                                    | 상태           | 완료일         | 증거                                                                                                                                                     |
| --------------------------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-casino-fiat-hint-session-lock`** | **`[x]` DONE** | **2026-07-11** | `CasinoFiatRateSession` · bet-open lock · spin drift 0 · `casino_session_lock` · `fiat-hint-casino-drift` live · `gate:ai-impl` **22/22** · engine **0** |

**Implemented:** `casino-fiat-rate-session.ts` · `casino-fiat-hint-display.ts` · `use-casino-fiat-hint.ts` · `casino-money-with-fiat-hint.tsx` · shell stake/win/balance wire · `GameOutcomeLayer` FiatHint · ComplaintRisk `fiat-hint-casino-drift` owned live

**증거:** `gate:ai-impl` casino fiat session-lock **22/22** (6 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p12-gate-marketing` `[x]`** — P12 Marketing GATE · §32.5 FAQ·feedback·affiliate·cookies + marketing · `gate:ai-impl` **59/59** · **NEXT `da-w8-signature-surfaces-bundle` (#226)**

## P13 Admin ops Web Push (`p13-admin-ops-push` · §32.6 Gap A-4 · YAML #231) — `[x]` DONE · 재착수 금지

> **선행:** `p13-prep-admin-team-desk` (#230) **`[x]`** · **후행:** `p13-ops-prod-preflight` (#232)

| Todo                     | 상태           | 완료일         | 증거                                                                                                                                  |
| ------------------------ | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`p13-admin-ops-push`** | **`[x]` DONE** | **2026-07-11** | settings CTA · SW `/sw.js` · `push_subscriptions` · `ops-notify` WEB_PUSH fan-out → `/queues` · `gate:ai-impl` **8/8** · engine **0** |

**Implemented:** `admin-ops-push-display-contract.ts` · `admin-ops-web-push.ts` · `useAdminOpsPush.ts` · settings push section · `apps/admin/public/sw.js` · `ops-web-push-dispatch.ts` · ntfy Click `OPS_ADMIN_PUBLIC_URL`

**증거:** `gate:ai-impl` P13 ops push **8/8** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · migration **0** (edge wire only)

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

## DA W7 Enforcement Strict Tokens (`da-w7-enforcement-strict-tokens` · §34.28 · YAML #234) — `[x]` DONE · 재착수 금지

> **선행:** `da-w6-gate-brand-elevation` (#217) **`[x]`** · Soft Launch `#233` **`[x]`** · **후행:** `da-w7-operator-visual-dae-signoff` (#235) agent impl **`[x]`**

| Todo                                  | 상태           | 완료일         | 증거                                                                                                                         |
| ------------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **`da-w7-enforcement-strict-tokens`** | **`[x]` DONE** | **2026-07-11** | `check:design-tokens --strict` green · text-tiny · P3 legacy class/bridge purge · `gate:ai-impl` **19/19** · migration **0** |

**Implemented:** `--ds-text-tiny` / `text-tiny` · Text `tiny` variant · legacy `text-primary`/`muted-foreground`/`bg-primary` → accent/muted SOT · theme bridge purge · `scripts/check-design-tokens.ts` strict (spacing-ratchet advisory) · `da-w7-enforcement-strict-tokens-display-contract.ts`

**증거:** `gate:ai-impl` W7 owners **19/19** · `check:design-tokens --strict` green (101 spacing advisory) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine **0**

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

## DA W7 Operator Visual DAE Sign-off (`da-w7-operator-visual-dae-signoff` · §20.12 · §34.28 · YAML #235) — agent impl `[x]` 2026-07-11

> **§20.12:** agent gate green ≠ Plan YAML `completed` — operator preview 육안 **`VISUAL APPROVED: da-w7`** 채팅 기록 후 Plan #235 `completed` 가능.

**Implemented (green):**

| 항목                 | 증거                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Display contract     | `da-w7-operator-visual-dae-signoff-display-contract.ts` · Home+Shell+Trade · 4-tier 390/768/1024/2560 · DAE checklist |
| Automated companions | surface **16/16** · contract **6/6** · axe critical 0 · dead control 0                                                |
| Preview              | `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev                                                    |
| Bundle gate          | `gate:ai-impl` **22/22** · `typecheck` · `check:i18n` · `check:release` · engine **0**                                |

**operator 육안 체크리스트 (§20.12 · Plan YAML #235 completed 조건):**

1. Preview **390 / 768 / 1024 / 2560** — `/home` · AppShell (BottomNav·TopBar·aurora) · `/trade` · `/trade/futures`
2. Home signature day-flow · next-action accent · Shell aurora backdrop · Trade spot desk
3. dead control 0 · axe critical 0 (브라우저 DevTools)
4. 채팅 **`VISUAL APPROVED: da-w7`** → Plan YAML `completed` + §82 doc sync

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

## P13 Soft Launch Bundle (`p13-soft-launch-bundle` · §20.5 · §20.14.5 · YAML #233) — `[x]` DONE · 재착수 금지

> **선행:** `p13-ops-prod-preflight` (#232) **`[x]`** · **후행:** `da-w7-enforcement-strict-tokens` (#234) **`[x]`**

| Todo                         | 상태           | 완료일         | 증거                                                                                                     |
| ---------------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| **`p13-soft-launch-bundle`** | **`[x]` DONE** | **2026-07-11** | Soft Launch QA · CB-01~06 · viewport/axe · admin spot-check · `gate:ai-impl` **22/22** · migration **0** |

**Implemented:** `P13_SOFT_LAUNCH_BUNDLE.md` · `p13-soft-launch-display-contract.ts` · QA vitest · admin spot-check

**증거:** Soft Launch contract + QA + admin spot-check · `gate:ai-impl` **22/22** · ko/en · 390/768/1024 · axe critical 0 · CB caps pin · viewer negative · engine **0**

**Operator Verified (실돈 CB · 실기기 PWA 스크린샷):** T0-A MFA/자본 DEFER와 독립 — 「Closed Beta gate 실행」 시 재개

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

## P13 T0-A Prod Preflight (`p13-ops-prod-preflight` · §20.14 · YAML #232) — `[x]` DONE · 재착수 금지

> **선행:** `p13-admin-ops-push` (#231) **`[x]`** · **후행:** `p13-soft-launch-bundle` (#233) **`[x]`**

| Todo                         | 상태           | 완료일         | 증거                                                                        |
| ---------------------------- | -------------- | -------------- | --------------------------------------------------------------------------- |
| **`p13-ops-prod-preflight`** | **`[x]` DONE** | **2026-07-11** | T0-A checklist · prod live audit · `gate:ai-impl` **7/7** · migration **0** |

**Implemented:** `P13_T0A_PROD_PREFLIGHT.md` · `p13-ops-prod-preflight-display-contract.ts` · `scripts/p13-ops-prod-preflight-spotcheck.sql`

**증거:** `gate:ai-impl` T0-A **7/7** · pg_cron 14/14 · Vault price-feed · funding/withdrawal **false** · CB lev 5 / OI 50% · engine **0**

**Operator DEFER (2026-07-11 · soft-launch blocker 아님):**

- **MFA enroll** — 유료 결제 필요 → 나중 ([`P13_T0A_PROD_PREFLIGHT.md`](../OPERATIONS/P13_T0A_PROD_PREFLIGHT.md) §3.1 D1)
- **실입금 · insurance/treasury 자본** — 나중 (같은 문서 §3.1 D2)

**다음 todo:** `launch-ramp-t1-feature-gates` (#237) — P13 closeout #236 `[x]` DONE

## P12 Marketing GATE (`p12-gate-marketing` · §3.5 · §28.5 · §32.5 · YAML #225) — `[x]` DONE · 재착수 금지

> **선행:** `p12-legal-pages` (#224) **`[x]`** · **후행:** `da-w8-signature-surfaces-bundle` (#226)

| Todo                     | 상태           | 완료일         | 증거                                                                                                                                                                                                                              |
| ------------------------ | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p12-gate-marketing`** | **`[x]` DONE** | **2026-07-11** | §32.5 `/support/faq` · `/feedback` · `/legal/affiliate` · `/legal/cookies` + trust/community hubs · footer FAQ/feedback · referral affiliate CTA · ads cookies · education localStorage · `gate:ai-impl` **59/59** · engine **0** |

**Implemented:** `p12-gate-marketing-display-contract.ts` · assert bundle (trust · community · legal · operator-trust · redirects · footer · education) · vitest **6/6** owner + **59/59** gate bundle

**증거:** `gate:ai-impl` P12 marketing GATE **59/59** (14 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226)

## P12 Legal pages (`p12-legal-pages` · §12.15 · §28.5 · §32.5 · YAML #224) — `[x]` DONE · 재착수 금지

> **선행:** `p12-community-support-hub` (#223) **`[x]`** · **후행:** `p12-gate-marketing` (#225) **`[x]`**

| Todo                  | 상태           | 완료일         | 증거                                                                                                                                                                                  |
| --------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p12-legal-pages`** | **`[x]` DONE** | **2026-07-11** | `/legal/affiliate` · `/legal/cookies` · `/referral/terms`→affiliate · `/cookies`→cookies · footer + referral CTA + ads consent cookies link · `gate:ai-impl` **40/40** · engine **0** |

**Implemented:** `p12-legal-pages-display-contract.ts` · `legal-display-contract` affiliate/cookies · `affiliate-page` · `cookies-page` · LegalNav · redirects · landing footer · ads consent cookies link · referral terms link · i18n `legal.affiliate.*` · `legal.cookies.*`

**증거:** `gate:ai-impl` P12 legal pages **40/40** (7 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226) — P12 GATE `#225` **`[x]`**

## P12 Community+support hub (`p12-community-support-hub` · §12.12 · §32.5 · YAML #223) — `[x]` DONE · 재착수 금지

> **선행:** `p12-trust-marketing-hub` (#222) **`[x]`** · **후행:** `p12-legal-pages` (#224) **`[x]`**

| Todo                            | 상태           | 완료일         | 증거                                                                                                                                                                                     |
| ------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p12-community-support-hub`** | **`[x]` DONE** | **2026-07-11** | `/announcements` · `/status` STUB · `/support/ticket` STUB · `/support` · `/support/faq` · `/feedback` · `/faq` redirect · footer FAQ/feedback · `gate:ai-impl` **40/40** · engine **0** |

**Implemented:** `p12-community-support-hub-display-contract.ts` · announcements/support/status/feedback contracts · `product/surfaces/marketing/*` support pages · routes · dead-controls STUB rows · MarketingShell matchers · landing footer FAQ/feedback/support

**증거:** `gate:ai-impl` P12 community+support **40/40** (14 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226) — P12 GATE `#225` **`[x]`**

## P12 Trust+marketing hub (`p12-trust-marketing-hub` · §3.5 · §12.0β Public · YAML #222) — `[x]` DONE · 재착수 금지

> **선행:** `p11-gate-side-income` (#221) **`[x]`** · **후행:** `p12-community-support-hub` (#223) **`[x]`**

| Todo                          | 상태           | 완료일         | 증거                                                                                                                                                            |
| ----------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p12-trust-marketing-hub`** | **`[x]` DONE** | **2026-07-11** | `/tier` · `/features` · `/features/earn` · `/features/vip` · `/fees` · `/security` · trust narrative · MarketingShell · `gate:ai-impl` **36/36** · engine **0** |

**Implemented:** `p12-trust-marketing-hub-display-contract.ts` · `tier-guide` · `features-hub` · `fees-page` · `trust-hub` contracts · `product/surfaces/marketing/*` · routes · `platform.trust.*` · `trust.hub.*` i18n · landing footer links

**증거:** `gate:ai-impl` P12 trust+marketing **36/36** (14 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226) — P12 GATE `#225` **`[x]`**

## P11 Side-income GATE (`p11-gate-side-income` · §12.19.6 · YAML #221) — `[x]` DONE · 재착수 금지

> **선행:** `p11-earn-side-surfaces` (#219) **`[x]`** · `p11-page-wallet-redeem` (#220) **`[x]`** · **후행:** `p12-trust-marketing-hub` (#222) **`[x]`**

| Todo                       | 상태           | 완료일         | 증거                                                                                                                                                                        |
| -------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p11-gate-side-income`** | **`[x]` DONE** | **2026-07-11** | §12.19.6 `/wallet/redeem` · `/earn/cashback` · `/earn/play` · `/events` · leaderboard STUB defer · earn/wallet subnav dead link 0 · `gate:ai-impl` **39/39** · engine **0** |

**Implemented:** `p11-gate-side-income-display-contract.ts` · assert bundle (earn-side · redeem rails · STUB defer) · vitest **5/5** owner + **39/39** gate bundle

**증거:** `gate:ai-impl` P11 side-income GATE **39/39** (13 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226) — P12 GATE `#225` **`[x]`**

## P11 wallet redeem (`p11-page-wallet-redeem` · §12.5 · §13.1 · YAML #220) — `[x]` DONE · 재착수 금지

> **선행:** `p11-earn-side-surfaces` (#219) **`[x]`** · **후행:** `p11-gate-side-income` (#221) **`[x]`**

| Todo                         | 상태           | 완료일         | 증거                                                                                                                                                 |
| ---------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p11-page-wallet-redeem`** | **`[x]` DONE** | **2026-07-11** | `/wallet/redeem` · PHON shop · Payment Method Card · withdraw/deposit rails · no new RPC · `gate:ai-impl` **21/21** · subnav register · engine **0** |

**Implemented:** `wallet-redeem-display-contract.ts` · `use-wallet-redeem-controller.ts` · `wallet-redeem-page.tsx` · `routes/wallet.redeem.tsx` · `P11_WALLET_REDEEM_REGISTERED_ROUTES` · i18n `wallet.redeem.*`

**증거:** `gate:ai-impl` wallet-redeem **21/21** (3 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `da-w8-signature-surfaces-bundle` (#226) — P12 GATE `#225` **`[x]`**

## P4 VISUAL (`p4-operator-visual-signoff` · §20.12 · §22.2 Wallet · §25.12.6 · YAML #218) — agent impl `[x]` 2026-07-11

> **§20.12:** agent gate green ≠ Plan YAML `completed` — operator preview 육안 **`VISUAL APPROVED: p4-operator-visual-signoff`** 채팅 기록 후 Plan #218 `completed` 가능.

**Implemented (green):**

| 항목                      | 증거                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Display contract          | `p4-money-visual-signoff-display-contract.ts` · §22.2 Wallet checklist · §30.3 · 3-rail · wallet-hero · 3-tier                         |
| Automated companions      | `p4-money-visual-signoff.test.tsx` **13/13** · contract test **6/6**                                                                   |
| §25.12.6 / Toss·Revolut   | balance hero · deposit/withdraw CTA · 3-rail hub · KRW auto-convert disclosure                                                         |
| §32.7 / H8 dead control 0 | wallet CTA · deposit rails · withdraw rails · krw submit · rewards→ledger                                                              |
| Bundle gate               | `gate:ai-impl` visual signoff **13/13** · `typecheck` · `check:i18n` · `check:release` · `check:design-tokens` advisory · engine **0** |

**operator 육안 체크리스트 (§20.12 · Plan YAML #218 completed 조건):**

1. `bun run deploy:pages:web:preview` foreground 1회 (§30.1) — **`[x]`** 2026-07-11 → https://preview.phonara-web.pages.dev
2. Preview **390 / 768 / 1024** — `/wallet` · `/wallet/deposit` · `/wallet/withdraw` · `/wallet/deposit/krw` · `/ledger` · `/rewards/history`
3. **§22.2** 3-rail deposit (KRW·Crypto·Giftcard) · withdraw KRW+crypto · hero balance clarity
4. **§30.3** KRW deposit auto-convert + rate snapshot + expected PHON
5. dead control 0 · axe critical 0 (브라우저 DevTools)
6. 채팅 **`VISUAL APPROVED: p4-operator-visual-signoff`** → Plan YAML `completed` + §82 doc sync

**다음 todo:** `p12-trust-marketing-hub` (#222)

## Digital Aurora W6 GATE (`da-w6-gate-brand-elevation` · §34.18–34.20 · YAML #217) — `[x]` DONE · 재착수 금지

> **선행:** `da-w6-brand-elevation-bundle` (#216) **`[x]`** · **후행:** `p4-operator-visual-signoff` (#218) **agent impl `[x]`**

| Todo                             | 상태           | 완료일         | 증거                                                                                                                                                                                                  |
| -------------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w6-gate-brand-elevation`** | **`[x]` DONE** | **2026-07-11** | BrandMark aurora · domain empty · Quad Stream · `da-w6-gate-brand-elevation-display-contract` · `gate:ai-impl` **23/23** · `check:design-tokens` advisory (91 notes) · VISUAL advisory · engine **0** |

**Implemented:** GATE display contract · brand scan cues (6 unique) · surface scan board · VISUAL advisory checklist (10)

**operator VISUAL advisory (§34.18–34.20 · full §20.12 = da-w7):**

1. BrandMark `aurora` Quad Stream glow (landing hero)
2. Domain empty: casino chips · trade pulse · wallet vault · sports stadium
3. Quad Stream loading (router pending · ledger/sports)
4. `prefers-reduced-motion` → static glow/axes
5. `check:design-tokens --strict` green (`da-w7-enforcement-strict-tokens` **`[x]`**)

**다음 todo:** `p12-trust-marketing-hub` (#222) — P4 VISUAL `#218` **agent impl `[x]`**

## Digital Aurora W6 Brand Elevation (`da-w6-brand-elevation-bundle` · §34.18–34.20 · YAML #216) — `[x]` DONE · 재착수 금지

> **선행:** `p10-operator-visual-signoff` (#215) agent impl `[x]` · operator assign `#216` · **후행:** `da-w6-gate-brand-elevation` (#217) **`[x]`**

| Todo                               | 상태           | 완료일         | 증거                                                                                                                                            |
| ---------------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w6-brand-elevation-bundle`** | **`[x]` DONE** | **2026-07-11** | BrandMark `aurora` · DomainEmptyMark (chips/pulse/vault/stadium) · QuadStreamLoading · router pending · `gate:ai-impl` **55/55** · engine **0** |

**Implemented:** `da-w6-brand-elevation-display-contract.ts` · `brand-elevation.css` · `brand-mark` aurora · `domain-empty-mark` · `quad-stream-loading` · EmptyState `domain` · landing AB-b aurora · casino/trade/wallet/sports wires · `defaultPendingComponent`

**증거:** `gate:ai-impl` W6 brand elevation **55/55** (10 files) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**다음 todo:** `p12-trust-marketing-hub` (#222) — P4 VISUAL `#218` **agent impl `[x]`**

## P10 VISUAL (`p10-operator-visual-signoff` · §20.12 · §22.2 Sports+Casino · §34.17 · YAML #215) — agent impl `[x]` 2026-07-11

> **§20.12:** agent gate green ≠ Plan YAML `completed` — operator preview 육안 **`VISUAL APPROVED: p10-operator-visual-signoff`** 채팅 기록 후 Plan #215 `completed` 가능.

**Implemented (green):**

| 항목                      | 증거                                                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display contract          | `p10-betting-visual-signoff-display-contract.ts` · §22.2 checklist · §34.17 sports-odds/casino-play · 3-tier · dual-currency                                                                       |
| Automated companions      | `p10-betting-visual-signoff.test.tsx` **13/13** · contract test **6/6**                                                                                                                            |
| §13.1.1 spot-check        | sports slip USDT/PHON · casino shell stake currency                                                                                                                                                |
| §32.7 / H8 dead control 0 | slip place · lobby PF/play · shell place/back · bet-mode · fairness verify                                                                                                                         |
| Bundle gate               | `gate:ai-impl` visual signoff **13/13** · `typecheck` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict` · `check:design-tokens` advisory · engine **0** |

**operator 육안 체크리스트 (§20.12 · Plan YAML #215 completed 조건):**

1. `bun run deploy:pages:web:preview` foreground 1회 (§30.1) — **`[x]`** 2026-07-11 → https://preview.phonara-web.pages.dev
2. Preview **390 / 768 / 1024** — `/sports` · `/sports/live` · `/sports/my-bets` · `/casino` · `/casino/fairness` · `/games/crash` (+ sample games)
3. **§13.1.1** USDT/PHON selector spot-check (sports slip · casino shell)
4. **§34.17** sports-odds heatmap · casino-play hover glow tiles
5. dead control 0 · axe critical 0 (브라우저 DevTools)
6. 채팅 **`VISUAL APPROVED: p10-operator-visual-signoff`** → Plan YAML `completed` + §82 doc sync

**다음 todo:** `p12-trust-marketing-hub` (#222) — P4 VISUAL `#218` **agent impl `[x]`** · W6 GATE `#217` **`[x]`** · W6 BUNDLE `#216` **`[x]`**

## P10 Betting GATE (`p10-gate-betting` · §12.19.6 · §32.7 H5 · Fiat#12 · YAML #214) — `[x]` DONE · 재착수 금지

> **선행:** `p10-first-bet-education` (#213) **`[x]`** · **후행:** `p10-operator-visual-signoff` (#215) **agent impl `[x]`**

| Todo                   | 상태           | 완료일         | 증거                                                                                                                                                                                               |
| ---------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-gate-betting`** | **`[x]` DONE** | **2026-07-11** | Sports hub+fairness manifest · 12 stage files · H5 stake dual live · Fiat#12 hints live · first-bet sheet · §31.4 risk row · casino E2E=`operator-or-ci` · `gate:ai-impl` **42/42** · engine **0** |

**Implemented:** `p10-gate-betting-display-contract.ts` · assert bundle (parity · fiat sports/casino · replay · education) · vitest **6/6** owner + **42/42** gate bundle

## First-bet Education (`p10-first-bet-education` · §32.5 · YAML #213) — `[x]` DONE · 재착수 금지

> **선행:** `p10-page-casino-fairness` (#212) **`[x]`** · **후행:** `p10-gate-betting` (#214) **`[x]`**

| Todo                          | 상태           | 완료일         | 증거                                                                                                                                                                                            |
| ----------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-first-bet-education`** | **`[x]` DONE** | **2026-07-11** | sports+casino sheet · bet slip·RG·provably-fair · `phonara.education.bet.dismissed` · `/legal/responsible-gaming` · `/casino/fairness` · 독립 route 0 · `gate:ai-impl` **15/15** · engine **0** |

**Implemented:** `operator-trust-pages-display-contract` BET\__ · `bet-first-visit-education` · `use-bet-first-visit-education` · `BetFirstVisitEducationSheet` · `BetFirstVisitEducationGate` · AppShell mount · `bet.education._` i18n

## Casino Fairness Verifier (`p10-page-casino-fairness` · §23.2.1 · YAML #212) — `[x]` DONE · 재착수 금지

> **선행:** `p10-games-batch-d` (#211) **`[x]`** · **후행:** `p10-first-bet-education` (#213) **`[x]`**

| Todo                           | 상태           | 완료일         | 증거                                                                                                                                                                         |
| ------------------------------ | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-page-casino-fairness`** | **`[x]` DONE** | **2026-07-11** | `/casino/fairness` · `verifyRound` UI · nonce=1 · per-bet client seed · seed rotation UI 0 · lobby PF CTA live · subnav registered · `gate:ai-impl` **23/23** · engine **0** |

**Implemented:** `casino-fairness-display-contract` · `use-casino-fairness-verifier` · `casino-fairness-page` · `casino.fairness` route · lobby CTA unlock · `SHELL_SUBNAV_REGISTERED_ROUTES` `/casino/fairness`

## Sports Hub Pages (`p10-sports-hub-pages` · §20.13.3 Sports#0 · YAML #197) — `[x]` DONE · 재착수 금지

> **선행:** `p10-sports-fiat-hint-wire` **`[x]`** · **후행:** `p10-sports-parity-contract-and-board` (#198) **`[x]`**

| Todo                       | 상태           | 완료일         | 증거                                                                                                                                                                                                        |
| -------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-sports-hub-pages`** | **`[x]` DONE** | **2026-07-10** | `/sports/prematch` · `/sports/fixture/$fixtureId` · `/sports/my-bets` · P10 subnav manifest · `rpc_get_fixture_markets` 1x2 · `/my-bets`+`/betting/[id]` redirect · `gate:ai-impl` **41/41** · engine **0** |

**Implemented:** `sports-hub-pages-display-contract` · `sports.fixture.$fixtureId` route · `SportsFixtureMarketsPanel` · board→fixture Link · my-bets panel · §12.19.6 hub chips live

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#2 **`[x]`**

## Sports Live Surface Wire (`p10-sports-live-surface-wire` · §20.13.3 Sports#2 · YAML #199) — `[x]` DONE · 재착수 금지

> **선행:** `p10-sports-parity-contract-and-board` **`[x]`** · **후행:** `p10-sports-slip-advanced-wire` (#200)

| Todo                               | 상태           | 완료일         | 증거                                                                                                                                                                                                       |
| ---------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-sports-live-surface-wire`** | **`[x]` DONE** | **2026-07-10** | `sports-live-surface-display-contract` · `useLiveFixtureState`/`useLiveFixtureStates` · `useSportsRealtime` · suspend/score/delay banner · `/sports/live` 확장만 · `gate:ai-impl` **33/33** · engine **0** |

**Implemented:** Live in-play wire — goal/market suspend 배너 · live delay notice · score 갱신 · realtime cache patch · parity `live-inplay-state`/`live-realtime-cache` → DONE · parallel live route **0**

**다음 todo:** **`p10-casino-replay-and-infra`** (#204) — Casino lobby **`[x]`**

## Casino Lobby (`p10-page-casino` · §23 · YAML #203) — `[x]` DONE · 재착수 금지

> **선행:** `p10-sports-rules-and-vip-stub` **`[x]`** · **후행:** `p10-casino-replay-and-infra` (#204)

| Todo                  | 상태           | 완료일         | 증거                                                                                                                                                                                                                 |
| --------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-page-casino`** | **`[x]` DONE** | **2026-07-10** | `casino-lobby-display-contract` · `/casino` Stake grid · Originals/Slots/Table/Live · featured · balance RPC display · PF CTA deferred · `casinoGamePath` → `/games/$code` · `gate:ai-impl` **26/26** · engine **0** |

**Implemented:** Lobby discovery live · category chips · featured+grid · wallet balance display-only · PF strip disabled+reason until fairness · dead-controls hub → live · parallel defer page **0**

**다음 todo:** **`p10-casino-replay-and-infra`** (#204)

## Sports Rules + VIP Stub (`p10-sports-rules-and-vip-stub` · §20.13.3 Sports#4 · YAML #202) — `[x]` DONE · 재착수 금지

> **선행:** `p10-sports-layout-dedup-gate` **`[x]`** · **후행:** `p10-page-casino` (#203) **`[x]`**

| Todo                                | 상태           | 완료일         | 증거                                                                                                                                                                                                                            |
| ----------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-sports-rules-and-vip-stub`** | **`[x]` DONE** | **2026-07-10** | `sports-rules-and-vip-display-contract` · `/sports/rules` i18n sections · `/sports/vip` Platinum+ eligibility strip + defer stub · `ew-e5-gap-surfaces-wire` unlock · `gate:ai-impl` **4/4** · related **30/30** · engine **0** |

**Implemented:** Rules panel (odds/settlement/void/live/responsible) · VIP STUB with eligibility strip · dead-controls unlock todo → `ew-e5-gap-surfaces-wire` · parallel rules/vip page **0**

**다음 todo:** **`p10-casino-replay-and-infra`** (#204) — Casino lobby **`[x]`**

## Sports Parity + Multi-Market Board (`p10-sports-parity-contract-and-board` · §20.13.3 Sports#1 · YAML #198) — `[x]` DONE · 재착수 금지

> **선행:** `p10-sports-hub-pages` **`[x]`** · **후행:** `p10-sports-live-surface-wire` (#199) **`[x]`**

| Todo                                       | 상태           | 완료일         | 증거                                                                                                                                                                                                                                |
| ------------------------------------------ | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`p10-sports-parity-contract-and-board`** | **`[x]` DONE** | **2026-07-10** | `sports-exchange-parity-display-contract` · `SPORTS_PARITY_MATRIX` · `SPORTS_UI_ZONE_OWNERS` · `SPORTS_USER_COMPLAINT_RISKS` · `SPORTS_ACTION_PATH_REGISTRY` · fixture multi-market board · `gate:ai-impl` **20/20** · engine **0** |

**Implemented:** §22.2.5 parity contract · totals/spread/handicap/asian_handicap/btts/props selectable on `SportsFixtureMarketsPanel` · `sports-market-1x2-only` → live · parallel `market-board-v2` **0**

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#2 **`[x]`**

## Digital Aurora W5 GATE (`da-w5-gate-domain-cards` · §34.17 · YAML #195) — `[x]` DONE · 재착수 금지

> **선행:** `da-w5-cards-domain-variants` **`[x]`** · **후행:** `p10-sports-fiat-hint-wire` (#196) **`[x]`**

| Todo                          | 상태           | 완료일         | 증거                                                                                                                                                    |
| ----------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w5-gate-domain-cards`** | **`[x]` DONE** | **2026-07-10** | 0.2s scan distinguish · mission-card + wallet-hero + casino tile · `da-w5-gate-domain-cards-display-contract` · `gate:ai-impl` **40/40** · engine **0** |

**Implemented:** Domain cards GATE — unique scan cues · CVA fingerprints · Mission/Wallet/Casino owner wires verified

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#2 **`[x]`**

## Digital Aurora W5 Domain Cards (`da-w5-cards-domain-variants` · §34.17 · YAML #194) — `[x]` DONE · 재착수 금지

> **선행:** `da-w4-gate-motion` **`[x]`** · **후행:** `da-w5-gate-domain-cards` (#195) **`[x]`**

| Todo                              | 상태           | 완료일         | 증거                                                                                                                                                                                                 |
| --------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w5-cards-domain-variants`** | **`[x]` DONE** | **2026-07-10** | Card CVA 6 personalities · `domain-card-personalities.css` · mission/wallet/vip/trade/sports/casino wires · `da-w5-cards-domain-variants-display-contract` · `gate:ai-impl` **49/49** · engine **0** |

**Implemented:** Domain card personalities — Mission(ring+glow) · Wallet-hero(aurora edge) · VIP(tier ramp) · Trade-dense(line-first) · Sports-odds(heatmap) · Casino-play(hover glow) · CVA only

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W4 GATE (`da-w4-gate-motion` · §34.15–34.16 · YAML #193) — `[x]` DONE · 재착수 금지

> **선행:** `da-w4-motion-system-bundle` **`[x]`** · **후행:** `da-w5-cards-domain-variants` (#194) **`[x]`**

| Todo                    | 상태           | 완료일         | 증거                                                                                                                                                          |
| ----------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w4-gate-motion`** | **`[x]` DONE** | **2026-07-10** | `use-prefers-reduced-motion` regression · `motion-presets` instant + CSS 0ms · `da-w4-gate-motion-display-contract` · `gate:ai-impl` **38/38** · engine **0** |

**Implemented:** reduced-motion GATE — hook media-query SOT · instant variants · aurora static · count-up L2/reduced instant verified

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W4 Motion BUNDLE (`da-w4-motion-system-bundle` · §34.15–34.16 · YAML #192) — `[x]` DONE · 재착수 금지

> **선행:** `da-w3-gate-ia-progressive` **`[x]`** · **후행:** `da-w4-gate-motion` (#193) **`[x]`**

| Todo                             | 상태           | 완료일         | 증거                                                                                                                                                                                                                         |
| -------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w4-motion-system-bundle`** | **`[x]` DONE** | **2026-07-10** | `useCountUp` · `MoneyDisplay countUp` · `--ds-motion-count-up` 400ms · wallet balance · Earn XP · futures PnL · L2/reduced-motion instant · `da-w4-motion-system-display-contract` · `gate:ai-impl` **47/47** · engine **0** |

**Implemented:** interaction grammar wire · Signal Pulse display-only · reduced-motion instant

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W3 GATE (`da-w3-gate-ia-progressive` · §34.12–34.14 · YAML #191) — `[x]` DONE · 재착수 금지

> **선행:** `da-w3-ia-progressive-bundle` **`[x]`** · **후행:** `da-w4-motion-system-bundle` (#192) **`[x]`**

| Todo                            | 상태           | 완료일         | 증거                                                                                                                                                                                                             |
| ------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w3-gate-ia-progressive`** | **`[x]` DONE** | **2026-07-10** | `/home` above-fold ≤3 · `da-w3-gate-ia-progressive-display-contract` · `gate:ai-impl` **63/63** (home+wallet+trade) · 390/768/1024 VISUAL advisory · `typecheck` · `check:i18n` · `check:release` · engine **0** |

**Implemented:** Progressive disclosure GATE — Fold1–2 above-fold · Fold3 collapsed · wallet-hero/trade ticket collapse verified

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W3 Progressive IA (`da-w3-ia-progressive-bundle` · §34.12–34.14 · YAML #190) — `[x]` DONE · 재착수 금지

> **선행:** `da-w2-gate-shell-elevation` **`[x]`** · **후행:** `da-w3-gate-ia-progressive` (#191) **`[x]`**

| Todo                              | 상태           | 완료일         | 증거                                                                                                                                                                      |
| --------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w3-ia-progressive-bundle`** | **`[x]` DONE** | **2026-07-09** | `CollapsibleSection` · `/home` Fold1–5 · missions max3 · wallet-hero accordion · trade mobile ticket collapse · `HOME_UX_CANON` · `gate:ai-impl` **34/34** · engine **0** |

**Implemented:** Progressive disclosure — Fold1 status+next · Fold2 money open · Fold3 collapsed · Fold4 missions≤3 · Fold5 navigate-only

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W2 GATE (`da-w2-gate-shell-elevation` · §34.10–34.11 · YAML #189) — `[x]` DONE · 재착수 금지

> **선행:** `da-w2-shell-elevation-infra` **`[x]`** · **후행:** `da-w3-ia-progressive-bundle` (#190) **`[x]`**

| Todo                             | 상태           | 완료일         | 증거                                                                                                                                                                                             |
| -------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`da-w2-gate-shell-elevation`** | **`[x]` DONE** | **2026-07-09** | `check:ui-architecture --strict` green · `gate:ai-impl` shell **42/42** · 390/768/1024 smoke · 5탭 IA unchanged · `typecheck` · `check:i18n` · `check:release` · §82 NEXT=`da-w3` · engine **0** |

**Implemented:** Shell elevation GATE — aurora · floating BottomNav · Orbit Grid verified

**다음 todo:** **`p10-sports-slip-advanced-wire`** (#200) — Sports#1 **`[x]`**

## Digital Aurora W2 Shell Elevation (`da-w2-shell-elevation-infra` · §34.10–34.11 · YAML #188) — `[x]` DONE · 재착수 금지

> **선행:** `da-w1-gate-ds-2` **`[x]`** · **후행:** `da-w2-gate-shell-elevation` (#189)

| Todo                              | 상태           | 완료일         | 증거                                                                                                                                                                                                     |
| --------------------------------- | -------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w2-shell-elevation-infra`** | **`[x]` DONE** | **2026-07-09** | `aurora-background.tsx+css` · floating BottomNav (blur+shadow-2) · layout.css 12-col + col-span-8/4 · Earn lg+ side rails · reduced-motion static · `gate:ai-impl` shell+tokens **47/47** · engine **0** |

**Implemented:** Aurora Mesh (Earn/Wallet low · Trade off) · floating BottomNav · Orbit Grid 12-col · Earn side rails · `check:design-tokens` aurora/orbit hard checks

**다음 todo:** **`da-w2-gate-shell-elevation`** (#189)

## Digital Aurora W1 GATE (`da-w1-gate-ds-2` · §34.6–34.9 · YAML #187) — `[x]` DONE · 재착수 금지

> **선행:** `da-w1-ds-foundation-bundle` **`[x]`** · **후행:** `da-w2-shell-elevation-infra` (#188) **`[x]`**

| Todo                  | 상태           | 완료일         | 증거                                                                                                                                      |
| --------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w1-gate-ds-2`** | **`[x]` DONE** | **2026-07-09** | `gate:ai-impl` primitives+tokens **76/76** · `typecheck` · `check:i18n` · `check:design-tokens` advisory OK (94 notes) · §82 NEXT=`da-w2` |

**Implemented:** DS 2.0 bundle gate green — Text · elevation · Card CVA · spacing ratchet verified · engine touch **0**

**다음 todo:** **`da-w2-gate-shell-elevation`** (#189) — DA W2 **`[x]`**

## Digital Aurora W1 DS Foundation (`da-w1-ds-foundation-bundle` · §34.6–34.9 · YAML #186) — `[x]` DONE · 재착수 금지

> **선행:** `da-w0-foundation-ssot-bundle` **`[x]`** · **후행:** `da-w1-gate-ds-2` (#187) **`[x]`**

| Todo                             | 상태           | 완료일         | 증거                                                                                                                                                 |
| -------------------------------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w1-ds-foundation-bundle`** | **`[x]` DONE** | **2026-07-09** | `Text` · `elevation.css` · `Card` CVA 8 variants · spacing ratchet in `check:design-tokens` · `gate:ai-impl` primitives+tokens · parallel card **0** |

**Implemented:** `product/primitives/text.tsx` (display…money-mono) · `tokens/elevation.css` (`--ds-shadow-1`–`4` · `--ds-z-chrome|overlay|toast`) · `cardVariants` · MissionCard `variant="mission"` · theme bridges · advisory `gap-6` warn

**다음 todo:** **`da-w2-gate-shell-elevation`** (#189) — DA W2 **`[x]`**

## Digital Aurora W0 Foundation (`da-w0-foundation-ssot-bundle` · §34 · YAML #185) — `[x]` DONE · 재착수 금지

> **선행:** `r0-gate-forensic-remediation` **`[x]`** · **후행:** `da-w1-ds-foundation-bundle` (#186) **`[x]`**

| Todo                               | 상태           | 완료일         | 증거                                                                                                                                                                                      |
| ---------------------------------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`da-w0-foundation-ssot-bundle`** | **`[x]` DONE** | **2026-07-09** | ADR-009 Digital Aurora · `PRODUCT_EXPERIENCE_CANON.md` · UNIFIED §Interaction Grammar · DESIGN_PRINCIPLES §7 · DESIGN_CHARTER Phase4 defer 해제 · §35.1 Tech Stack · `check:ai-reference` |

**Implemented:** Brand DNA 5문법 · Emotion Map · Brand Memory · Accessibility Elevation · elevation ladder · motion L0/L1/L2 · PC 12-col Orbit Grid · Tech Stack SSOT · **UI/engine code 0** (DOC only)

**다음 todo:** **`da-w2-gate-shell-elevation`** (#189) — DA W2 **`[x]`**

## Forensic Remediation Gate (`r0-gate-forensic-remediation` · §35 · YAML #184) — `[x]` DONE · 재착수 금지

> **선행:** `#180–183` DOC/WIRE/INFRA **`[x]`** · **후행:** `da-w0-foundation-ssot-bundle` (#185) **`[x]`**

| Todo                               | 상태           | 완료일         | 증거                                                                                                                                              |
| ---------------------------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `r0-forensic-ssot-honesty-bundle`  | **`[x]` DONE** | 2026-07-09     | §35 SSOT 정직화 · plan-yaml/doc-sync                                                                                                              |
| `r0-sports-launch-gate-wire`       | **`[x]` DONE** | 2026-07-09     | `LAUNCH_GATES.sportsBetting` + kill-switch AND                                                                                                    |
| `r0-admin-rbac-ops-wire`           | **`[x]` DONE** | 2026-07-09     | RBAC desks + `confirmKillSwitch`                                                                                                                  |
| `r0-staking-domain-sot-sync`       | **`[x]` DONE** | 2026-07-09     | `/staking` boundary=`earn` · rule `97`                                                                                                            |
| **`r0-gate-forensic-remediation`** | **`[x]` DONE** | **2026-07-09** | `check:plan-yaml --track-a-only` · `check:plan-doc-sync` · `check:phase-r-guards --strict` · `typecheck` · R0 vitest **26/26** · §82 NEXT=`da-w0` |

**Implemented:** R0 #180–184 전건 green · YAML completed **188**/278 · pending **83** · first pending = `da-w2-gate-shell-elevation`

**다음 todo:** **`da-w2-gate-shell-elevation`** (#189) — DA W2 **`[x]`**

## Settings Fiat Hint Toggle (`p5-page-settings-fiat-reference` · §13.1.4.3 · §20.13.2 Fiat#9 · YAML #166) — `[x]` DONE · 재착수 금지

**Implemented:** `settings-preferences-display-contract.ts` — `preferences.fiatHintEnabled` localStorage · locale default ko ON · en OFF · `use-fiat-hint-preference.ts` · `use-settings-preferences-controller` toggle · `/settings/preferences` Switch card · wallet/trade/earn hooks read preference via `resolveLocaleTargetFiat`

**증거:** `gate:ai-impl` `preferences-settings-page` **1/1** · settings fiat vitest **26/26** (contract+controller+hook+page) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p5-page-settings-fiat-reference` `[x]`** — §13.1.4.3 settings override · **NEXT `p4-gate-fiat-reference-world-class` `[x]`**

## Earn Fiat Hint co-primary (`p7-earn-fiat-hint-co-primary` · §13.1.4.4 · §20.13.2 Fiat#8 · YAML #165) — `[x]` DONE · 재착수 금지

**Implemented:** `earn-fiat-hint-display.ts` · `use-earn-fiat-hint.ts` · `earn-money-with-fiat-hint.tsx` · `earn-mission-reward.tsx` — mission/referral/tier cards PHON + ≈fiat co-primary · `MissionCard.rewardSlot` · RPC `reward_phon` only (client recompute 0) · `useFiatReferenceRates` earn policy (60s) · surfaces: `/home` · `/home/missions*` · `/referral` · `/tier/me` · `FiatHintDisclaimer` 1× per surface

**증거:** `gate:ai-impl` `home-missions-page` **4/4** · earn fiat hint vitest **11/11** (display+hook+primitive) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p7-earn-fiat-hint-co-primary` `[x]`** — §13.1.4.4 Earn co-primary wire · **NEXT `p5-page-settings-fiat-reference` `[x]`**

## Trade Fiat Hint (`p9-trade-fiat-hint-wire` · §13.1.4.4 · §20.13.2 Fiat#7 · YAML #164) — `[x]` DONE · 재착수 금지

**Implemented:** `trade-fiat-hint-display.ts` · `use-trade-fiat-hint.ts` · `trade-money-with-fiat-hint.tsx` · `trade-price-with-fiat-hint.tsx` — spot/futures header last/mark price · spot/futures ticket avail/est rows · futures unrealized/realized PnL secondary hint · `useFiatReferenceRates` trade policy (30s) · oracle stale → hint `—` · USDT/PHON primary · `FiatHintDisclaimer` 1× per desk

**증거:** `gate:ai-impl` `trade-money-with-fiat-hint` **3/3** · trade fiat hint vitest **26/26** (display+hook+surfaces) · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p9-trade-fiat-hint-wire` `[x]`** — §13.1.4.4 Trade desk wire · **NEXT `p7-earn-fiat-hint-co-primary` `[x]`**

## P9 VISUAL (`p9-operator-visual-signoff`) — agent impl `[x]` 2026-07-06

> **§20.12:** agent gate green ≠ Plan YAML `completed` — operator preview 육안 **`VISUAL APPROVED: p9-operator-visual-signoff`** 채팅 기록 후 Plan #152 `completed` 가능.

**Implemented (green):**

| 항목                 | 증거                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display contract     | `p9-trade-visual-signoff-display-contract.ts` · G1–G7 · 4-tier · dual-currency spot-check                                                           |
| Automated companions | `p9-trade-visual-signoff.test.tsx` **29/29** · contract test **5/5**                                                                                |
| §13.1.1 spot-check   | spot USDT stake · futures USDT/PHON selector · positions/orders/fills margin column · staking stake_currency HelpTip                                |
| §32.7 dead control 0 | spot/futures submit · mobile sticky CTA · staking-stake-cta · staking-positions-hub-link                                                            |
| Trade bundle gate    | `gate:ai-impl` trade+staking **168/168** · `typecheck` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict` |

**operator 육안 체크리스트 (§20.12 · Plan YAML #152 completed 조건):**

1. `bun run deploy:pages:web:preview` foreground 1회 (§30.1)
2. Preview **390 / 768 / 1024 / 2560** — `/trade` · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions`
3. **§13.1.1** USDT/PHON selector·column spot-check (ticket · positions · fills · staking label)
4. **G7** hedge/reduce-only **미노출** · cross margin canary OFF 시 disabled+reason
5. dead control 0 · axe critical 0 (브라우저 DevTools)
6. 채팅 **`VISUAL APPROVED: p9-operator-visual-signoff`** → Plan YAML `completed` + §82 doc sync

**다음 todo:** `da-w2-gate-shell-elevation` (#189 · §34) · (이력: DA W2 shell / DA W1 GATE / DA W1 DS / DA W0 / R0 forensic / staking SOT / admin RBAC / sports launch / R0 DOC / Fiat / P10 page `[x]`)

## Wallet/Ledger Fiat Hint (`p4-page-wallet-fiat-hint` · §13.1.4.4 · §20.13.2 Fiat#6 · YAML #163) — `[x]` DONE · 재착수 금지

**Implemented:** `wallet-fiat-hint-display.ts` · `use-wallet-fiat-hint.ts` · `wallet-money-with-fiat-hint.tsx` — Wallet hero + balance rows + ledger/activity amount secondary hint · `useFiatReferenceRates` wallet policy (60s) · KRW deposit queryKey 공유 · KRW ledger rows settlement-only · `FiatHintDisclaimer` 1× per surface

**증거:** `gate:ai-impl` `wallet-fiat-hint` **9/9** · `product/surfaces/wallet` **60/60** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-page-wallet-fiat-hint` `[x]`** — §13.1.4.4 Wallet/Ledger wire · **NEXT `p9-trade-fiat-hint-wire`**

## Fiat Money Display Hint (`p4-fiat-money-display-hint` · §13.1.4.3 · §20.13.2 Fiat#5 · YAML #162) — `[x]` DONE · 재착수 금지

**Implemented:** `product/primitives/money-display-with-fiat-hint.tsx` — `MoneyDisplayWithFiatHint` · `FiatHintDisclaimer` · `MoneyDisplayWithFiatHintSlot` · primary `MoneyDisplay` + secondary `toFiatHint` span · `trade.fiatHint.asOf` tooltip · stale badge · disclaimer slot · `formatFiatHintAsOfTime`

**증거:** `gate:ai-impl` `money-display-with-fiat-hint` **9/9** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-money-display-hint` `[x]`** — §13.1.4.3 FiatHint primitive · **NEXT `p4-page-wallet-fiat-hint`**

## Fiat Hint Display Contract (`p4-fiat-hint-display-contract` · §13.1.4.3 · §20.13.2 Fiat#4 · YAML #161) — `[x]` DONE · 재착수 금지

**Implemented:** `fiat-reference-display-contract.ts` — `toFiatHint` · `LOCALE_FIAT_MAP` (ko→KRW · en→OFF · ja→JPY slot) · `formatFiatHintAmount` · `resolveLocaleTargetFiat` · `FIAT_HINT_I18N_KEYS` · i18n `trade.fiatHint.*` (ko/en) · `trade-i18n-surface-display-contract` wired keys

**증거:** `gate:ai-impl` `domain` **478/478** · `fiat-hint-display-contract` **9/9** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-hint-display-contract` `[x]`** — §13.1.4.3 FiatHint layer · **NEXT `p4-fiat-money-display-hint`**

## Fiat Reference Rates Hook (`p4-fiat-reference-rates-hook` · §13.1.4.2 · §20.13.2 Fiat#3 · YAML #160) — `[x]` DONE · 재착수 금지

**Implemented:** `features/money/fiat-reference-rates-lib.ts` · `use-fiat-reference-rates.ts` · 3-tier fallback (primary snapshot/oracle · secondary median-of-N · tertiary last-known-good) · pair TTL USDT/KRW **15m** · PHON/USDT **5m** · wallet `['exchange-rate', base, quote, 'active']` queryKey 공유 · `use-wallet-data` · `use-krw-deposit-controller` migrated

**증거:** `gate:ai-impl` `features/money` **20/20** · `fiat-reference-display-contract` **14/14** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-reference-rates-hook` `[x]`** — §13.1.4.2 rate layer hook · **NEXT `p4-fiat-hint-display-contract`**

## Currency Precision SSOT (`p4-fiat-currency-precision-ssot` · §13.1.4.1 · §20.13.2 Fiat#2 · YAML #159) — `[x]` DONE · 재착수 금지

**Implemented:** `currency-precision-display-contract.ts` · PHON/USDT/KRW/BTC `{decimals, rounding_mode}` · `@phonara/money` `toFixed` sync · `formatCurrencyPrecisionDisplay` · `currency-precision-display-audit-lib` inline `.toFixed(8)` grep gate

**증거:** `gate:ai-impl` `currency-precision-display-contract` **15/15** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-currency-precision-ssot` `[x]`** — §13.1.4.1 presentation precision SSOT · **이후 Fiat#3 `[x]`** · **NEXT `p4-fiat-hint-display-contract`**

## Fiat Reference Preflight (`p4-fiat-reference-preflight` · §13.1.4 · §20.13.2 Fiat#1 · YAML #158) — `[x]` DONE · 재착수 금지

**Implemented:** `fiat-reference-display-contract.ts` · `FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY` · settlement vs hint fiat codes · ComplaintRisk `fiat-hint-*` **5행** · `fiat-reference-display-audit-lib` naming+settlement leak grep gate

**증거:** `gate:ai-impl` `fiat-reference-display-contract` **12/12** · `typecheck` · `check:i18n` · `check:release` · `check:phase-r-guards --strict` · engine touch **0**

**마지막 완료:** **`p4-fiat-reference-preflight` `[x]`** — §13.1.4 display_only boundary · **이후 Fiat#2–3 `[x]`** · **NEXT `p4-fiat-hint-display-contract`**

**Implemented:** `concurrent_wallet_race_test.sql` — wallet `FOR UPDATE` · position `FOR UPDATE` · OI advisory lock invariants · live branches: double-lock · futures margin race · user-close vs service-liquidation sweep · withdrawal double-lock · grand-total Σ=0 · hash-chain

**증거:** `concurrent_wallet_race_test.sql` **5/5** (E4-0..E4-4) · `test:sql` **103/103** · `stack:push-remote` · advisor **0 ERROR** · migration **0** (test-only)

**마지막 완료:** **`launch-engine-e4-concurrent-race-test` `[x]`** — Go/No-Go FAIL #4 closed · **NEXT `p4-fiat-reference-preflight`**

## Launch E3 Ops Telegram Webhook (`launch-engine-e3-ops-telegram-webhook` · §20.14 #156) — `[x]` DONE · 재착수 금지

**Implemented:** `ops_notify_outbox` · … · edge `ops-notify` (**ntfy 1순위** + Telegram + HMAC webhook + fallback + outbound replay) · cron `phonara_ops_notify` + digest `0 3,13 * * *` (12:00/22:00 KST)

**증거:** `ops_notify_e3_test.sql` **2/2** · `test:sql` **102/102** · `stack:push-remote` · advisor **0 ERROR** · edge deploy `ops-notify` · `stack:verify-worldno1-edge` **9/9** · `stack:test-ops-pager` E2E **sent:1** · ntfy `ops-ntfy-dispatch` Deno **4/4**

**마지막 완료:** **`launch-engine-e3-ops-telegram-webhook` `[x]`** — Go/No-Go FAIL #3 closed · **NEXT `launch-engine-e4`**

## Launch E2 Admin Halt Market (`launch-engine-e2-admin-halt-market` · §20.14 #155) — `[x]` DONE · 재착수 금지

**Implemented:** `rpc_admin_halt_market` · `rpc_admin_list_trade_market_breakers` · `rpc_resume_market` audit 강화 (AAL2 · reason mandatory · before/after snapshot · immutable `audit_logs`) · Admin `/ops` market circuit breaker desk

**증거:** `admin_halt_market_e2_test.sql` **2/2** · `test:sql` **101/101** · `stack:push-remote` · advisor **0 ERROR** · `gate:ai-impl` admin-ops **1/1**

**마지막 완료:** **`launch-engine-e2-admin-halt-market` `[x]`** — Go/No-Go FAIL #2 closed · **이후 E3 `[x]`** · **현재 NEXT `launch-engine-e4`**

## Launch E1 Liquidation Notify (`launch-engine-e1-liquidation-notify` · §20.14 #154) — `[x]` DONE · 재착수 금지

**Implemented:** `_notify_position_liquidated` · `_settle_futures_position` liquidated branch → `notification_outbox` `trade_position` · inbox read/display wire · i18n `notif.liquidated.*` (기존 catalog)

**증거:** `liquidation_notify_e1_test.sql` **2/2** · `test:sql` **100/100** · `stack:push-remote` · advisor **0 ERROR** · `notifications-center-display-contract` **5/5**

**마지막 완료:** **`launch-engine-e1-liquidation-notify` `[x]`** — Go/No-Go FAIL #1 closed · **NEXT `launch-engine-e2` `[x]`**

## P9 Trade World-Class GATE (`p9-gate-trade-world-class` · §20.13 #153) — `[x]` DONE · 재착수 금지

**Implemented:** `p9-gate-trade-world-class-display-contract` · `assertP9TradeWorldClassGateSync` · §22.2.1 Tier-A pending 0 · §22.2.3 dedup 0 · §13.1.1 trade dual-currency rows phonara yes · §32.7 H1–H4 P9 trade PASS · §13.1.3 HowItWorks mounted · parity matrix sync (cross-margin · one-way · tier-fee · futures-table-columns)

**증거:** `gate:ai-impl` `p9-gate-trade-world-class-display-contract` **6/6** · `trade-layout-dedup-contract` **9/9** · `trade-action-path-contract` **6/6** · `trade-exchange-parity-display-contract` **29/29** · trade surfaces **122/122** · `typecheck` · `check:i18n` · `check:release` · `check:ui-architecture` · `check:phase-r-guards --strict`

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/p9-gate-trade-world-class-display-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-layout-dedup-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/trade-action-path-contract.test.ts
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/trade
```

**마지막 완료:** **`launch-engine-e3-ops-telegram-webhook` `[x]`** — ops Telegram pager · SQL **102/102** · remote advisor 0 · **NEXT `launch-engine-e4`**

**이전 완료:** **`p9-gate-trade-world-class` `[x]`** — WORLD step **28** · §22.2.1–§22.2.3 · §13.1.1 · §32.7 H1–H4 bundle green

**이전 완료:** **`p9-operator-visual-signoff` agent impl `[x]`** — `p9-trade-visual-signoff.test.tsx` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary · `gate:ai-impl` trade+staking **168/168** · §82 doc sync → **NEXT `p9-gate-trade-world-class`**

**세션 규칙:** todo 1개 · step green 후 다음 · Tier-B(hedge·reduce-only·spot limit) UI **금지** · Launch E1–E4 = `[LAUNCH·ENGINE]` bugfix migration (§20.14)

## Fiat Reference 큐 (§20.13.2 · YAML #158–167 · Launch E1–E4 **끝난 뒤** 순차)

**착수:** **`p13-ops-prod-preflight` `[x]`** · **`p13-admin-ops-push` `[x]`** · **`p13-prep-admin-team-desk` `[x]`** · **`p13-prep-admin-canonical-docs` `[x]`** · **`da-w8-gate-signature-experience` `[x]`** · **`da-w8-sound-design-spec-defer` `[x]`** · **`da-w8-signature-surfaces-bundle` `[x]`** · **`p12-gate-marketing` `[x]`** · **`p12-legal-pages` `[x]`** · **`p12-community-support-hub` `[x]`** · **`p12-trust-marketing-hub` `[x]`** · **`p11-gate-side-income` `[x]`** · **`p11-page-wallet-redeem` `[x]`** · **`p11-earn-side-surfaces` `[x]`** · **`p4-operator-visual-signoff` agent impl `[x]`** · **`da-w6-gate-brand-elevation` `[x]`** · **`da-w6-brand-elevation-bundle` `[x]`** · **`p10-operator-visual-signoff` agent impl `[x]`** · **`p10-gate-betting` `[x]`** · **`p10-first-bet-education` `[x]`** · **`p10-page-casino-fairness` `[x]`** · **`p10-games-batch-d` `[x]`** · **`p10-games-batch-c` `[x]`** · **`p10-games-batch-b` `[x]`** · **`p10-games-batch-a` `[x]`** · **`p2-gate-admin-table-dedup` `[x]`** · **`p2-admin-table-primitive` `[x]`** · Fiat#11 **`[x]`** · CasinoR#1 **`[x]`** · Casino lobby **`[x]`** · Sports#4/3/2/1/0 **`[x]`** · Fiat#10 **`[x]`** · PIR **`[x]` DONE** · **전역 NEXT `p13-soft-launch-bundle` (#233)** · T0-A `#232` **`[x]`** · To-do 순서대로 1개씩

```text
#158  p4-fiat-reference-preflight          [x]
#159  p4-fiat-currency-precision-ssot      [x]
#160  p4-fiat-reference-rates-hook          [x]
#161  p4-fiat-hint-display-contract          [x]
#162  p4-fiat-money-display-hint          [x]
#163  p4-page-wallet-fiat-hint          [x]
#164  p9-trade-fiat-hint-wire          [x]
#165  p7-earn-fiat-hint-co-primary          [x]
#166  p5-page-settings-fiat-reference          [x]
#167  p4-gate-fiat-reference-world-class          [x]
#168  p10-page-sports                    [x]
#169+ P10 (NEXT `p10-casino-replay-and-infra` · Casino lobby `[x]`)
```

## P9 Trade Base GATE (`p9-gate-trade` · §20.13) — `[x]` DONE · 재착수 금지

**Implemented:** `P9_TRADE_REGISTERED_ROUTES` manifest (5 routes) · `p9-gate-trade-contract` · tradeSubnav dead link 0 · earnSubnav staking chip visible · `use-trade-error-toast` 삭제 → controller `productToast` strict (§3.4) · first-trade education wired (`TradeFirstVisitEducationGate` · §32.5) · P7 regression `p7-growth-gate-contract` staking chip 갱신

**증거:** `gate:ai-impl` vitest **79/79** (trade · staking surfaces · domain contracts · `p9-gate-trade-contract` 6/6 · `subnav-route-manifest` · `trade-first-visit-education` · P8 regression) · `check:ui-architecture` green · `typecheck` · `check:i18n` · `check:release`

**P9 impl bundle:** `/trade` spot · `/trade/futures` · `/trade/positions` · `/trade/orders` · `/staking` · `/staking/positions` · first-visit education sheet

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/trade apps/web/src/product/surfaces/staking apps/web/src/features/trading apps/web/src/features/earn/use-staking-page-controller.ts apps/web/src/features/earn/use-staking-positions-page-controller.ts apps/web/src/features/trade apps/web/src/domain/__tests__/p9-gate-trade-contract.test.ts apps/web/src/domain/__tests__/staking-display-contract.test.ts apps/web/src/domain/__tests__/p7-growth-gate-contract.test.ts apps/web/src/domain/__tests__/p8-core-gate-contract.test.ts apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts
```

**이전 완료 (P9 VISUAL):** **`p9-operator-visual-signoff` `[x]`** — `p9-trade-visual-signoff.test.tsx` **29/29** · contract **5/5** · §13.1.1 dual-currency · dead control 0 · G7 cross-margin canary · `gate:ai-impl` trade+staking **168/168**

**이전 완료:** **`p9-trade-audit-remediation-a1` `[x]`** — `filterSpotDeskOpenOrders` whitelist · `spotOpenOrders` · mobile cancel wire · `cancel-spot-open-order` registry · PHONUSDT-PERP/BTCUSDT-SIM excluded · filter+cancel 동일 PR · `gate:ai-impl` spot-desk · `trade-action-path-contract` · `spot-stake-display-contract` green · §82 doc sync → **NEXT `p9-trade-audit-remediation-a2`**

**이전 완료:** **`p9-trade-i18n-surface-audit` `[x]`** — `trade-i18n-surface-display-contract` · `TRADE_I18N_DEFER_RULES` (Tier B/C owner todos) · catalog 386 keys wired|defer 0 unclassified · `trade.order.balancePercent` aria on balance chips · external-exchange-copy ComplaintRisk live · parity `i18n-surface-audit` DONE · `gate:ai-impl` i18n audit **5/5** · §82 doc sync → **NEXT `p9-trade-audit-remediation-a1`**

**이전 완료:** **`p9-trade-settings-prefs-wire` `[x]`** — `trade-settings-prefs-display-contract` · settings hub one-click + confirm toggles · spot/futures `requestSubmit*` reads prefs only · existing ConfirmDialog single layer · mutual exclusivity · `gate:ai-impl` trade+settings **174/174** · §82 doc sync → **NEXT `p9-trade-layout-dedup-gate`**

**이전 완료:** **`p9-trade-mobile-futures-book-tab` `[x]`** — `TradeDeskMobileTradeStack` order|book subtab · `SpotOrderBookPanel` + `TradeRecentTradesRail` mobile book · spot/futures parity · sticky CTA order subtab only · lg+ book rail 0 duplicate on `<lg` · `trade-mobile-layout-display-contract` · parity `mobile-futures-book-tab` DONE · `gate:ai-impl` trade **114/114** · §82 doc sync → **NEXT `p9-trade-settings-prefs-wire`**

**이전 완료:** **`p9-trade-mobile-history-tab` `[x]`** — `trade-mobile-layout-display-contract` · `TradeDeskMobileTabs` chart|trade|positions|history 4-tab · `<lg` dock 0 · sticky CTA 1 (`trade-desk-mobile-sticky-cta`) · `TradeDeskMobileHistoryStack` same panels as dock · spot/futures desk extend-only · parity mobile-tabs zone DONE · `gate:ai-impl` trade **113/113** · §82 doc sync → **NEXT `p9-trade-mobile-futures-book-tab`**

**이전 완료:** **`p9-trade-ultra-layout` `[x]`** — `trade-ultra-layout-display-contract` · `trade-desk-page-shell` · `trade-desk-layout.css` @container · `--ds-panel-min` 3-panel grid (chart 50%) · `--ds-content-max` shell · `trade-desk-table-scroll` overflow 0 at 1280+ container · spot/futures desk extend-only · parity `ultra-2560-layout` DONE · `gate:ai-impl` trade ultra + parity green · §82 doc sync → **NEXT `p9-trade-mobile-history-tab`**

**이전 완료:** **`p9-trade-oracle-circuit-banner` `[x]`** — `TradeMarketStatusBanner` single mount · kill/circuit/stale priority · spot/futures desk wire · `trade-market-status-display-contract` · ComplaintRisk `duplicate-status-banner` → live · parity `oracle-circuit-banner` DONE · `gate:ai-impl` trade market status green · §82 doc sync → **NEXT `p9-trade-ultra-layout`**

**이전 완료:** **`p9-trade-tier-fee-display` `[x]`** — `TradeTierFeeBadge` VIP badge + `tier_fee` HelpTip · `rpc_get_earn_hub_status.tier` read · est fee numeric = ticket-density only · `tier-fee-display-contract` · parity `tier-fee-badge` partial · ComplaintRisk `duplicate-est-fee-row` → live · `gate:ai-impl` futures-order-ticket **20/20** · spot-order-ticket · tier-fee · parity **31/31** · §82 doc sync → **NEXT `p9-trade-oracle-circuit-banner`**

**이전 완료:** **`p9-trade-funding-history-display` `[x]`** — header `funding_rates.rate` only · dock history sub-tab `TradeFundingHistoryPanel` · `useFundingPayments` · `funding-history-display-contract` · parity `funding-rate-history` DONE · ComplaintRisk `funding-history-missing` → live · `gate:ai-impl` funding+dock+parity **38/38** · §82 doc sync → **NEXT `p9-trade-tier-fee-display`**

**이전 완료:** **`p9-trade-cross-margin-canary` `[x]`** — `MarginModeSegment` canary wire · `feature_cross_margin_enabled` ON=live cross selector · OFF=disabled+`trade.margin.crossDisabled` · `CROSS_MARGIN_CANARY_WAVE` · `useTradeLaunchFlags` · parity sync assert · `gate:ai-impl` futures-order-ticket **20/20** · margin-mode-display **3/3** · §82 doc sync → **NEXT `p9-trade-funding-history-display`**

**이전 완료:** **`p9-trade-position-mode-label` `[x]`** — `PositionModeFixedLabel` · `MarginModeSegment` · one-way fixed label + HelpTip · account-scoped margin copy · hedge toggle built_hidden (E21) · `position_mode`/`margin_mode` HelpTip · `gate:ai-impl` futures-order-ticket **17/17** · beginner-language **7/7** · §82 doc sync → **NEXT `p9-trade-cross-margin-canary`**

**이전 완료:** **`p9-trade-beginner-help-layer` `[x]`** — `TradeHowItWorksPanel` · `TradeHelpTip` · spot/futures/staking HowItWorks · 13 HelpTip terms wired · trade subnav `trade.subnav.help.*` · `trade-beginner-language-display-contract` **7/7** · beginner-help **2/2** · `gate:ai-impl` trade **90/90** · §82 doc sync → **NEXT `p9-trade-position-mode-label`**

**이전 완료:** **`p9-trade-order-ticket-density` `[x]`** — `futures-order-ticket` · `spot-order-ticket` extend-only · OKX balance % chips · est fee/liq/margin rows · §13.1.1 USDT/PHON margin selector → `p_margin_currency` · avail switch · desk dual balance · open orders `margin_currency` column · `order-ticket-display` · ComplaintRisk `futures-margin-phon-hidden` → live · parity dual currency → yes · `gate:ai-impl` trade **90/90** · order-ticket-display **4/4** · §82 doc sync → **NEXT `p9-trade-beginner-help-layer`**

**이전 완료:** **`p9-trade-leverage-slider-ux` `[x]`** — `LeverageControl` extend-only · OKX/Binance preset chips (1x·5x·10x·20x·Max) + slider · `max_leverage` RPC cap clamp · high-leverage risk ack 유지 · parity `leverage-slider` → DONE · `gate:ai-impl` futures-order-ticket **5/5** · leverage-control-display **4/4** · §82 doc sync → **NEXT `p9-trade-order-ticket-density`**

**이전 완료:** **`p9-trade-futures-unrealized-pnl` `[x]`** — `FuturesPositionsPanel` extend-only · unrealized PnL + ROE columns (oracle mark via `compute-position-display-metrics`) · realized PnL column for closed · dock + `/trade/positions` mark wire · ComplaintRisk `pnl-dash` → live · parity `unrealized-pnl` → DONE · `gate:ai-impl` futures-positions-panel + parity **11/11** · §82 doc sync → **NEXT `p9-trade-leverage-slider-ux`**

**이전 완료:** **`p9-trade-futures-margin-adjust-ui` `[x]`** — `FuturesPositionsPanel` extend-only · isolated margin adjust ConfirmDialog (add/remove + amount) · dock + `/trade/positions` same panel props · `rpc_adjust_isolated_margin` wire · cross positions hidden · ComplaintRisk `margin-adjust-ui` → live · parity `margin-adjust` → DONE · `gate:ai-impl` trade surfaces **73/73** · §82 doc sync → **NEXT `p9-trade-futures-unrealized-pnl`**

**이전 완료:** **`p9-trade-futures-partial-close-ui` `[x]`** — `FuturesPositionsPanel` extend-only · partial close ratio ConfirmDialog (25/50/75%) · dock + `/trade/positions` same panel props · `rpc_partial_close_futures` wire · ComplaintRisk `partial-close-ui` → live · `gate:ai-impl` trade surfaces **67/67** · §82 doc sync → **NEXT `p9-trade-futures-margin-adjust-ui`**

**이전 완료:** **`p9-trade-orderbook-parity` `[x]`** — `SpotOrderBookPanel` extend-only · grouping selector · spread row · depth total column · click→ticket (`onBookPriceClick` futures wire) · `order-book-display` spread/grouping helpers · no `futures-order-book-panel` · `gate:ai-impl` trade surfaces green · §82 doc sync → **NEXT `p9-trade-futures-partial-close-ui`**

**이전 완료:** **`p9-trade-recent-trades-rail` `[x]`** — `TradeRecentTradesRail` lg+ book column ×1 · `useReferencePriceTicks` · collapsible · reference disclosure · no full-width duplicate · `gate:ai-impl` trade surfaces **58/58** · §82 doc sync → **NEXT `p9-trade-orderbook-parity`**

**이전 완료:** **`p9-trade-terminal-bottom-dock` `[x]`** — `TradeDeskBottomDock` lg+ single owner · positions close · orders cancel · fills history · inline lg+ `FuturesPositionsPanel` removed · mobile tabs only · `useFuturesDeskWire` close/fills wire · `gate:ai-impl` trade surfaces **55/55** · §82 doc sync → **NEXT `p9-trade-recent-trades-rail`**

**이전 완료:** **`p9-trade-fills-history-wire` `[x]`** — `useTradingOrderFills` · `trade-fills-history-panel` · `/trade/orders` history tab · §22.2.4 RPC rows · `margin_currency` column · tabular nums · `gate:ai-impl` trade surfaces **51/51** · §82 doc sync → **NEXT `p9-trade-terminal-bottom-dock`**

**이전 완료:** **`p9-trade-chart-overlays-lwc` `[x]`** — candle/line toggle · MA7/EMA21 · crosshair OHLC legend · oracle/liq priceLine · fullscreen · display-only RPC boundary · `gate:ai-impl` chart+parity **39/39** · §82 doc sync

**이전 완료:** **`p9-trade-chart-pro-lwc` `[x]`** — LWC v5 `chart/*` · crosshair MagnetOHLC · wheel/touch · fitContent reset · volume histogram · interval 1m–1d · majors WS + PHON `rpc_get_candles` · display-only disclosure · `gate:ai-impl` chart+parity **30/30** · §82 doc sync

**이전 완료:** **`p9-trade-ticker-header-wire` `[x]`** — `useMarketTickerDisplay` · `format-ticker-display` · `TradeMarketTickerStats` · spot/futures header change/high/low/vol(OI) · collapsible mobile advanced row · i18n `trade.change24` 등 header subset · `gate:ai-impl` trade surfaces **29/29** · §82 doc sync

**이전 완료:** Plan **38.5차** 정본 sync · **`p9-trade-spot-pair-wire` `[x]`** — `spot-stake-display-contract` · `use-spot-desk-wire` pair selector · §13.1.1 stake rules · `gate:ai-impl` spot-stake+spot-desk **10/10** · §82 doc sync

**이전 완료:** Plan **37차** §13.1.2 · **`p9-trade-parity-matrix-sync` `[x]`** — `gate:ai-impl` trade-exchange-parity **21/21**

**이전 완료:** Plan **35차** §32.7 Operator Zero-Complaint 흡수 · `p9-world-preflight` YAML `[x]`

**이전 완료:** `p9-gate-trade` — Implemented: trade+staking wire · manifest `/trade/*` + `/staking/*` · §3.4 productToast strict · §32.5 education · §82 doc sync

**이전 완료:** `p8-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Earn+Home · `/home` · `/notifications` · `/settings/*` · `/account` · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **24/24** · `p8-core-visual-signoff-display-contract` · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev · §82 doc sync

## P8 Core Part GATE (`p8-gate-core` · §20.13 #113)

**Implemented:** `P8_CORE_REGISTERED_ROUTES` manifest (11 routes) · `p8-core-gate-contract` · §3.4.2 inbox/prefs/toast separation · `emitNotification` → `productToast.showText` · sonner glue `toast-zone.tsx` only · P7 regression `p7-growth-gate-contract` green

**증거:** `gate:ai-impl` vitest **145/145** (home · settings 7 surfaces · account hub/profile · notifications · domain contracts · `p8-core-gate-contract` 7/7 · `subnav-route-manifest`) · `check:ui-architecture` green · `typecheck` · `check:i18n` · `check:release`

**P8 impl bundle (#103–#112 · 재착수 금지):** `/home` · `/notifications` · `/settings` + `/settings/*` (account · preferences · referral · notifications prefs · api-keys STUB) · `/account` · `/account/profile`

**마감 게이트 (정본):**

```powershell
bun run gate:ai-impl -- --test apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx apps/web/src/product/surfaces/settings apps/web/src/product/surfaces/account/__tests__/account-hub-page.test.tsx apps/web/src/product/surfaces/account/__tests__/account-profile-page.test.tsx apps/web/src/product/surfaces/notifications apps/web/src/features/earn/__tests__/use-earn-home-page-controller.test.ts apps/web/src/features/settings apps/web/src/features/account/__tests__/use-account-hub-controller.test.ts apps/web/src/features/account/__tests__/use-account-profile-controller.test.ts apps/web/src/domain/__tests__/p8-core-gate-contract.test.ts apps/web/src/domain/__tests__/p7-growth-gate-contract.test.ts apps/web/src/domain/__tests__/earn-home-display-contract.test.ts apps/web/src/domain/__tests__/notifications-center-display-contract.test.ts apps/web/src/domain/__tests__/notifications-pwa-display-contract.test.ts apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts apps/web/src/domain/__tests__/settings-account-display-contract.test.ts apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts apps/web/src/domain/__tests__/settings-preferences-display-contract.test.ts apps/web/src/domain/__tests__/settings-referral-display-contract.test.ts apps/web/src/domain/__tests__/account-hub-display-contract.test.ts apps/web/src/domain/__tests__/account-profile-display-contract.test.ts apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts
```

**마지막 완료:** `p8-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Earn+Home · `/home` · `/notifications` · `/settings/*` · `/account` · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **24/24** · `p8-core-visual-signoff-display-contract` · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev · §82 doc sync

**이전 완료:** `p8-gate-core` — Implemented: `gate:ai-impl` **145/145** · §12.19.6 P8 manifest dead link 0 · §3.4.2 notification 3-channel · §82 doc sync

**이전 완료:** `p8-page-home` — `/home` `EarnHomePage` · §28.7 ambient · vitest **10/10** · manifest drift 0

**이전 완료:** `p7-gate-growth` — Implemented: `gate:ai-impl` vitest **82/82** (earn · home/referral/share/tier surfaces · domain contracts · `p7-growth-gate-contract` · `subnav-route-manifest`) · §12.19.6 P7 routes dead link 0 · §13.5.5 `mergeE12MissionItems` reward_phon parity · §3.4.3 onboarding D0 hub duplicate claim 0 · `check:ui-architecture` green · §82 doc sync

**이전 완료:** `p7-page-share-earnings` — Implemented: `gate:ai-impl` vitest **23/23** (earn) + domain/surface/manifest **19/19** · `/share/earnings` · canvas OG card · `rpc_get_golden_earth_status.earned_phon_today` + `rpc_get_earn_hub_status` tier display · Web Share · PNG export · post-share `share_referral_link` · `viral_streak_share` claim · earn subnav manifest sync

**이전 완료:** `p7-tier-benefits-narrative` — Implemented: `gate:ai-impl` vitest **7/7** (domain) + **2/2** (controller) + **2/2** (surface) · `/tier/benefits` narrative block · `tier.benefits.narrative.*` i18n ko+en · PHON 단일지갑+미션+추천 3-step story · `rpc_get_earn_hub_status` tier/XP display only

**이전 완료:** `p7-page-tier-benefits` — Implemented: `gate:ai-impl` vitest **21/21** (earn) + domain/surface **28/28** · `/tier/benefits` · unified tier matrix · decay policy · gap 혜택 미노출 · `rpc_get_earn_hub_status` current-tier highlight · earn subnav manifest sync

**이전 완료:** `p7-page-tier-me` — Implemented: `gate:ai-impl` vitest **19/19** (tier-me contract · controller · page · manifest) · `/tier/me` · `rpc_get_earn_hub_status` · decay UX (presentation until E1) · `tier_keep_status` claim · earn subnav manifest sync

**이전 완료:** `p7-page-home-missions-referral` — Implemented: `gate:ai-impl` vitest **11/11** (referral contract · controller · page) · `/home/missions/referral` · curated referral-only missions (`viral-partnerHubVisit` · `tier-reachSilver` · `tier-reachGold`) · viral+repeatable claim · `rpc_get_earn_hub_status` tier/referral read · `invite_3_friends` one-shot read

**이전 완료:** `p7-page-home-missions-invite` — Implemented: `gate:ai-impl` vitest **10/10** (invite contract · controller · page) · `/home/missions/invite` · curated viral invite missions · `rpc_get_viral_mission_status` · referral hub read · onboarding D2/D3 handoff

**이전 완료:** `p7-page-home-attendance` — Implemented: `gate:ai-impl` vitest **19/19** (attendance contract · controller · page · manifest) · `/home/attendance` · `rpc_claim_daily_reward` · streak cycle · RoutineCard · earn subnav manifest sync

**이전 완료:** `p7-page-home-missions` — Implemented: `gate:ai-impl --test apps/web/src/product/surfaces/home/__tests__/home-missions-page.test.tsx` vitest **4/4** · `gate:ai-impl --test apps/web/src/features/earn/__tests__/use-home-missions-page-controller.test.ts` · `check:ui-architecture` green · `/home/missions` hub tabs · manifest sync

**이전 완료:** `p7-page-referral-invite` — Implemented: `gate:ai-impl --test apps/web/src/product/surfaces/referral/__tests__/referral-invite-page.test.tsx` vitest **4/4** · Web Share canonical · `/referral/invite` · manifest sync

**이전 완료:** `p7-page-referral` — `/referral` surface · earn subnav manifest

**이전 완료:** `p6-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §12.19.5 AppShell · BottomNav·TopBar·EarnShell · 5탭 IA · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **33/33** · `check:ui-architecture` green · `check:design-tokens` advisory · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev

**이전 완료:** `p3-operator-visual-signoff` — **VISUAL APPROVED** · §20.12 · §22.2 Landing+Auth · 390/768/1024 · axe critical 0 · dead control 0 · `gate:ai-impl` vitest **46/46** · `check:design-tokens` advisory · `deploy:pages:web:preview` → https://preview.phonara-web.pages.dev

**이전 완료:** `p6-doc-platform-canon-sync` — §32 GLOBAL_EXPANSION · ONBOARDING_JOURNEY · PLATFORM_NARRATIVE SSOT sync · display contracts 3종 · ENGINE_GAP_ADR index · `gate:ai-impl` domain vitest 10/10 · `check:ai-reference` green

**이전 완료:** `p6-gate-shell` — Implemented: `gate:ai-impl --test apps/web/src/product/shell` · `resilience-grammar.test.tsx` 5/5 · `check:ui-architecture` green · sonner glue 0 · subnav dead link 0

**이전 완료:** `p6-page-offline` — Implemented: `gate:ai-impl --test apps/web/src/features/pwa/__tests__/pwa-sw-update.test.ts` · vitest 4/4 · `pwa-shell.test.tsx` 2/2 · `typecheck` · `check:release`

**출시 결함 0 + World-Class + Operator trust + Admin 33차:** §3.4 · §3.5 · §12.19.6 · §13.11 · §24.4–§24.7 · §29.5 · §32 · §32.5–§32.6 · E0–E10
