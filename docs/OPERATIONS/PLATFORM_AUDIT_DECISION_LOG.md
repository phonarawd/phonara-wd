# Platform Audit Decision Log

> **날짜:** 2026-07-13 · Playbook 1.0.0  
> Architecture 변경은 ADR. 일상 판정은 본 로그.

## DL-R0-001 — Control plane bootstrap

| 항목     | 값                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                      |
| Decision | R0 통제 산출물 생성 · Finding CLOSED 아님                                                       |
| A        | Product Owner (겸임 operator · 문서 승인 대기)                                                  |
| Evidence | [`R0/control-plane-baseline.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/control-plane-baseline.md) |
| SHA      | `9c4bf29b40d31b2d2952bd6257f5690d691ecbc2`                                                      |

## DL-R0-002 — Observability stack = ADR-021 Option A

| 항목     | 값                                                                                  |
| -------- | ----------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                          |
| Decision | Launch 최소안 = Supabase logs + edge_ops_events + alert scripts · Sentry defer 유지 |
| A        | Runtime Owner                                                                       |
| ADR      | [`ADR-021`](../PRODUCT/ADR/021-platform-observability-stack.md)                     |

## DL-R0-003 — Evidence bucket 지정

| 항목     | 값                                                                               |
| -------- | -------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                       |
| Decision | Primary = Supabase Storage `platform-audit-evidence` · Index = CLOSEOUT_EVIDENCE |
| A        | Security + Runtime                                                               |
| Doc      | [`PLATFORM_EVIDENCE_RETENTION.md`](PLATFORM_EVIDENCE_RETENTION.md)               |

## DL-R0-004 — Browser MCP probe

| 항목     | 값                                                                                 |
| -------- | ---------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                         |
| Decision | Catalog 실측 tools=0 → M-18 OPEN · R9 전제 미충족 기록                             |
| A        | Runtime                                                                            |
| Evidence | [`browser-mcp-probe.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/browser-mcp-probe.md) |

## DL-R0-SLO — Metrics **confirmed**

| 항목     | 값                                                                           |
| -------- | ---------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                   |
| Decision | SLO/Trigger/perf 초안 → **confirmed** (operator chat: 전부 진행 권한)        |
| A        | Product + Runtime (1인 겸임 · 본 로그에 기록)                                |
| Doc      | [`PLATFORM_SLO_SLA.yaml`](PLATFORM_SLO_SLA.yaml) `metrics_status: confirmed` |

## DL-R0-BUCKET — Evidence bucket created

| 항목     | 값                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------ |
| When     | 2026-07-13                                                                                             |
| Decision | `platform-audit-evidence` private bucket 생성                                                          |
| Evidence | [`evidence-bucket-provisioned.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/evidence-bucket-provisioned.md) |

## DL-R0-BROWSER-MCP — Playwright MCP configured

| 항목     | 값                                                                                            |
| -------- | --------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                    |
| Decision | `.cursor/mcp.json` + TEMP launcher · chrome-for-testing install                               |
| Status   | Probe5: **CAPTURE OK** · `playwright-mcp-8gb.json` · headless-shell · M-18 **VERIFIED_FIXED** |

## DL-R0-PROBE5 — Browser MCP Probe 5 capture (8GB)

| 항목     | 값                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                                                  |
| Decision | Navigate+screenshot preview landing @390×844 · free RAM ~2210MB · headless-shell                                                                                                            |
| A        | Runtime                                                                                                                                                                                     |
| Evidence | [`probe5-preview-landing-390.png`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/probe5-preview-landing-390.png) · [`browser-mcp-probe.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R0/browser-mcp-probe.md) |

## DL-R1-INVESTIGATE — R1 Trust & Truth batch

| 항목     | 값                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                           |
| Decision | C-01 · C-02 · H-01 · M-01 Investigate complete → **APPROVED_FOR_IMPLEMENT**                          |
| A        | Product Owner (Standing Grant)                                                                       |
| Evidence | [`r1-trust-truth-investigate.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R1/r1-trust-truth-investigate.md) |
| Next     | Implement PR R1-a (C-01 · H-01 · M-01) then R1-b (C-02)                                              |

## DL-R1-IMPLEMENT — R1 Trust & Truth fail-closed

| 항목     | 값                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| When     | 2026-07-13                                                                                                                                       |
| Decision | C-01/C-02/H-01/M-01 + PrimeForge→PHONARA Implement → status **VERIFYING** (vitest 26/26 · typecheck · i18n) · Stage1 Browser pending preview SHA |
| A        | Product Owner (Standing Grant)                                                                                                                   |
| Evidence | [`r1-trust-truth-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R1/r1-trust-truth-implement.md)                                                 |
| Next     | Preview deploy → Stage1 `/` · `/status` Browser → VERIFIED_FIXED                                                                                 |

| 항목     | 값                                                                        |
| -------- | ------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                |
| Decision | Plan `platform-perfect-launch` Owner 승인 · Standing Grant 활성 · NEXT=R1 |
| A        | Product Owner (operator chat grant)                                       |

## DL-R0-005 — Severity 재계산 (H-02 · H-10)

| 항목     | 값                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                            |
| Decision | §35 공식 적용 결과 H-02(Impact5+Expl≥4)·H-10(score20)를 CRITICAL로 등재 (감사 표 HIGH와 다를 수 있음 · registry 우선) |
| A        | Security / Product (문서 채택 시)                                                                                     |

## DL-R0-STANDING — Standing Grant 활성 조건 고정

| 항목     | 값                                                                              |
| -------- | ------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                      |
| Decision | Playbook §31 Standing Grant를 ACTIVE_WORK_SSOT에 고정 · Plan Owner 승인 전제    |
| A        | Product Owner                                                                   |
| Scope    | 동일 Finding 내 investigate→commit→push→PR→CI≤5 · migration/Domain/Release 제외 |

## DL-R1-001 — Stage1 Browser PASS (after preview redeploy)

| 항목       | 값                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| When       | 2026-07-13                                                                                                                                        |
| Decision   | `deploy:pages:web:preview` 후 Stage1 **PASS** · C-01/C-02/H-01/M-01 → **VERIFIED_FIXED** · NEXT=`audit-r2-capability-rails` Implement (H-03+H-11) |
| A          | Runtime / Product                                                                                                                                 |
| Evidence   | [`R1/r1-stage1-browser.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R1/r1-stage1-browser.md)                                                             |
| Intent SHA | `391646f6` · Docs `b466e8fc` · Deploy `949b87ec.phonara-web.pages.dev`                                                                            |

## DL-R2B-H10 — Withdrawal OFF = 운영 의도 (재개 게이트 문서화)

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | `feature_withdrawal_enabled=false`는 **소프트 런치/T1 의도적 OFF** (코드 결함 아님). 재개는 Feature Flag 5조건 + KYC/AML/MFA/cap/queue/Σ=0 전부 Green 후에만 |
| A        | Product Owner (Standing Grant · Plan R2-b)                                                                                                                 |
| Flag     | `app_config.feature_withdrawal_enabled` **false 유지** · R10 이전 flip 금지                                                                                |
| UI       | 사유·다음 행동 i18n + `/wallet/deposit` CTA · rail submit fail-closed                                                                                      |
| Doc      | [`PLATFORM_WITHDRAWAL_REENABLE_GATE.md`](PLATFORM_WITHDRAWAL_REENABLE_GATE.md)                                                                             |
| Evidence | [`R2/r2b-withdrawal-copy-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2b-withdrawal-copy-implement.md)                                              |
| Next     | R10에서 5조건 재확인 후 한 단계 활성화 · 기존 audited RPC only                                                                                             |

## DL-R2C-H05 — Sports odds stale · ingest 선행 · gate flip 금지

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | Remote odds newest `captured_at`=2026-06-16 → **ingest health not green**. UI는 stale를 `—`·비선택으로 fail-closed. `sportsBetting`/`sportsCashout` flip **금지** until ingest green |
| A        | Product Owner (Standing Grant · Plan R2-c)                                                                                                                 |
| Flag     | `LAUNCH_GATES.sportsBetting` · `sportsCashout` **false 유지**                                                                                              |
| UI       | server `captured_at` TTL (prematch 300s · live 15s) · place/cashout mutation block                                                                         |
| Evidence | [`R2/r2c-sports-odds-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2c-sports-odds-implement.md)                                                      |
| Next     | ingest worker 복구 · fresh snapshot ≥1 확인 후 gate flip (별도 ops 승인)                                                                                    |

## DL-R2D-M21 — KRW proof upload wire · gate flip

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | E10 attach RPC는 live였으나 Web caller 0 → `/wallet/deposit/krw`에 validate→storage→`rpc_attach_krw_deposit_proof` wire + `krwDepositProofLive=true`        |
| A        | Product Owner (Standing Grant · Plan R2-d)                                                                                                                 |
| Flag     | `LAUNCH_GATES.krwDepositProofLive` **true** (wire와 동시 flip)                                                                                             |
| Money    | attach **원장 이동 0** · credit는 기존 match RPC only · Admin review = `/admin/deposits`                                                                    |
| Evidence | [`R2/r2d-krw-proof-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R2/r2d-krw-proof-implement.md)                                                           |
| Next     | ~~R3-a~~ → **`audit-r3b-service-write-grants`** (M-06)                                                                                                     |

## DL-R3A-H02 — rpc_lock_wallet client revoke · Live Crash secret

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | H-02: `rpc_lock_wallet` authenticated EXECUTE revoke · `live_crash_rounds` direct SELECT 제거 · `server_seed` column 비공개 · SELECT-only pin on bets/tier |
| A        | Security / DB (Standing Grant · Plan R3-a · migration 1)                                                                                                   |
| Migration | `20260814000001_h02_r3a_wallet_mutator_live_crash` · remote name parity · advisor 0 ERROR                                                                  |
| Evidence | [`R3/r3a-wallet-mutator-live-crash-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3a-wallet-mutator-live-crash-implement.md)                           |
| Next     | ~~R3-b~~ → **`audit-r3c-search-path-sweep`** (M-05)                                                                                                        |

## DL-R3B-M06 — service-write GRANT minimize · trigger/helper revoke

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | M-06: client DML allowlist 재고정 · 전 trigger EXECUTE revoke · postgres DEFAULT PRIVILEGES에서 anon/authenticated 자동 ALL/EXECUTE 제거                   |
| A        | Security / DB (Standing Grant · Plan R3-b · migration 1)                                                                                                   |
| Migration | `20260815000001_m06_r3b_service_write_grants` · remote name parity · advisor 0 ERROR                                                                       |
| Note     | `supabase_admin` DEFAULT PRIVILEGES는 hosted 42501로 migration이 변경 불가 — postgres creator defaults만 강제                                             |
| Evidence | [`R3/r3b-service-write-grants-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3b-service-write-grants-implement.md)                                     |
| Next     | ~~R3-c~~ → **`audit-r3d-siwe-analytics-ingress`** (M-04)                                                                                                   |

## DL-R3C-M05 — earn/tier helper search_path pin × 8

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | M-05: advisor `function_search_path_mutable` 8건(earn/tier IMMUTABLE helpers)에 function-level `search_path=public, pg_temp` pin · body 미개서 · client REVOKE 유지 |
| A        | Security / DB (Standing Grant · Plan R3-c · migration 1 · 동일 유형 sweep)                                                                                |
| Migration | `20260816000001_m05_r3c_search_path_sweep` · remote name parity · advisor 0 ERROR · targeted WARN 8→0                                                     |
| Evidence | [`R3/r3c-search-path-sweep-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3c-search-path-sweep-implement.md)                                           |
| Next     | ~~R3-d~~ → **`audit-r3e-auth-hibp-feature-flag`** (H-09)                                                                                                   |

## DL-R3D-M04 — SIWE/analytics anon revoke · HMAC service ingress

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | M-04: anon SIWE/analytics EXECUTE revoke · HMAC(IP)+resource dual bucket service ingress · payload/retention · SIWE body `user_id` 거부 · `siweLoginLive=false` |
| A        | Security / Auth / DB (Standing Grant · Plan R3-d · migration 1 + edge)                                                                                    |
| Migration | `20260817000001_m04_r3d_siwe_analytics_ingress` · remote name parity · advisor 0 ERROR · edge `siwe-auth`+`product-analytics`                             |
| Evidence | [`R3/r3d-siwe-analytics-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3d-siwe-analytics-implement.md)                                                 |
| Next     | ~~R3-e~~ → **`audit-r4-market-ops`**                                                                                                                       |

## DL-R3E-H09 — feature flag allowlist+AAL2 · HIBP Pro+ BLOCKED_DEP

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | R3-e: `rpc_set_feature_enabled`에 sports/live_crash allowlist + `_assert_admin_aal2` 복구. HIBP는 Management API PATCH **402 Pro+** → Finding H-09 `BLOCKED_DEP` (MFA DEFER 동급 · soft-launch non-blocker). Unblock: Pro → `bun run stack:auth-hibp-enable` → advisor WARN 0 → `VERIFIED_FIXED`. |
| A        | Security / Auth / DB (Standing Grant · Plan R3-e · migration 1 + Auth API)                                                                                |
| Migration | `20260818000001_h09_r3e_feature_flag_allowlist` · remote name parity · advisor ERROR 0                                                                   |
| Evidence | [`R3/r3e-auth-hibp-feature-flag-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R3/r3e-auth-hibp-feature-flag-implement.md)                               |
| Next     | **`audit-r4-market-ops`**                                                                                                                                  |

## DL-R8-H06 — Clean SHA deploy parity · dirty Pages 금지

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | H-06: `--commit-dirty=true` 제거 · `deploy-pages.ts` clean tree + `--commit-hash` 강제 · Web/Admin `release-manifest.json` · `check:deploy-parity` · Admin `_headers`. R9는 `check:deploy-parity -- --remote` green 전 금지. |
| A        | SRE / Security (Standing Grant · Plan R8)                                                                                                                  |
| Gates    | local parity 4/4 · vitest 6/6 · advisors 0 ERROR · bun audit Critical 0 · migration name parity 0 · Web preview headers PASS                               |
| Evidence | [`R8/r8-deploy-parity-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R8/r8-deploy-parity-implement.md)                                                    |
| Next     | clean dual preview deploy → remote SHA parity → **`audit-r9-runtime-matrix`**                                                                              |

## DL-R9-PREFLIGHT — Browser Stage1 착수 전 준비 (Implement 미착수)

| 항목     | 값                                                                                                                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| When     | 2026-07-13                                                                                                                                                 |
| Decision | R9 **preflight only**: `PLATFORM_RUNTIME_URL_MATRIX.json` (124 URL) · `audit:runtime-urls` · Stage1 template · Handoff §audit-r9 확장 · Browser MCP preview `/`·`/status`·580px resize OK. **블로커:** `check:deploy-parity -- --remote` red (manifest SPA fallback · Admin preview fetch fail). |
| A        | SRE (Standing Grant · Plan R9 preflight)                                                                                                                   |
| Gates    | `audit:runtime-urls` 124/124 · vitest 2/2 · local deploy-parity 4/4 · remote parity **FAIL**                                                               |
| Evidence | [`R9/r9-preflight.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-preflight.md) · [`R9/r9-stage1-matrix-template.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-stage1-matrix-template.md) |
| Next     | operator: clean `deploy:pages:web:preview` + `deploy:pages:admin:preview` → remote parity green → `Implement audit-r9-runtime-matrix`                      |

## Concurrent signoff note (1인 겸임)

R0 문서 채택 시 Security / Runtime / Product 역할 체크리스트를 **시차 서명**한다. AI는 A 대행 금지.
