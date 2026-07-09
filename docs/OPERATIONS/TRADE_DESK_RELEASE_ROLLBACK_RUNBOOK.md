# Trade Desk — Release / Rollback Runbook (P4-C)

> **Todo:** `p4-release-rollback` · Plan `trade_desk_qa_audit` P4-C · v4 E5 Version Compatibility  
> **Status:** `[x]` impl 2026-07-08 · operator 15min rollback dry-run Verified pending  
> **교차:** [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md) §4C · [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) §15 (e) · E0 [`P4/rollback-dry-run-2026-07-08.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/rollback-dry-run-2026-07-08.md)

---

## 목적

Trade desk **릴리스·롤백·버전 skew** 판정을 operator 1인 기준으로 고정한다.  
**DB migration 역삭제 금지** — applied migration rollback = **forward-fix only** ([`96-prod-apply-agent-deny`](../../.cursor/rules/96-prod-apply-agent-deny.mdc) · P4-D).

**코드 정본:** [`trade-desk-release-rollback-display-contract.ts`](../../apps/web/src/domain/trade-desk-release-rollback-display-contract.ts)

---

## 릴리스 래더 (Pre → Deploy → Post)

| 단계                   | 정본                                                                | 체크                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pre-deploy**         | GitHub CI 4 job green                                               | `bun run ci:status` · quality · sql · e2e · advisors                                                                                                  |
| **Migration touch 시** | local `db reset` → `test:sql` Σ=0 → `stack:push-remote` → advisor 0 | [`TRADE_DESK_MIGRATION_VERIFICATION.md`](TRADE_DESK_MIGRATION_VERIFICATION.md) · P4-D 3 gate · [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) |
| **Deploy**             | frontend CDN/hosting artifact                                       | deploy sha 기록 (§Deploy log)                                                                                                                         |
| **Post-deploy smoke**  | `trade-desk-smoke` subset                                           | CI e2e job 또는 operator advisory 1회                                                                                                                 |
| **Post-deploy soak**   | 24h spotcheck WARNING 0                                             | [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md) §4D                                                                              |

**PHONARA 기본 (P0~P3):** UI-only · **migration 0** — deploy = frontend artifact만. migration은 [`TRADE_DESK_MIGRATION_VERIFICATION.md`](TRADE_DESK_MIGRATION_VERIFICATION.md) P4-D operator 서면 승인 + security-auditor PASS 후에만 · **우회 창구 금지**.

---

## Rollback trigger (즉시 검토)

| Trigger                     | 신호                                 | 우선 액션                                                                                       |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Money E2E fail**          | CI e2e wallet/trade conservation red | submit halt · incident 기록 · §Rollback checklist                                               |
| **Σ≠0**                     | `conservation_test` · soak SQL drift | **즉시** trade kill switch 검토 · P0-0 formula 재확인                                           |
| **Advisor ERROR**           | CI advisors job red                  | RPC/RLS 노출 — frontend rollback만으로 미해결 가능                                              |
| **Soak CRITICAL**           | 24h spotcheck CRITICAL               | oracle/edge 경로 — [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) |
| **Money/Security incident** | §15 ops-window 정의                  | (e) P4-C rollback 트리거 · **forward-fix 우선**                                                 |

> UI-only regression (layout/a11y) = rollback 후보이나 Money trigger **아님** — hotfix deploy 우선.

---

## Rollback 절차 (15분 operator checklist)

> **Dry-run:** E0 [`P4/rollback-dry-run-2026-07-08.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/rollback-dry-run-2026-07-08.md) — 배포 전 1회 수행 · 서명.

| #   | 분    | 액션                                                                            | 확인                            |
| --- | ----- | ------------------------------------------------------------------------------- | ------------------------------- |
| 1   | 0–2   | CI/alert에서 trigger 분류 (Money vs UI vs Security)                             | incident 카테고리 기록          |
| 2   | 2–5   | **Frontend:** 이전 deploy artifact SHA로 redeploy (git revert + CI green)       | §Deploy log 이전 행             |
| 3   | 5–7   | **Cache:** CDN purge 또는 cache-bust 확인 · operator hard refresh 1회           | §Browser/CDN cache              |
| 4   | 7–10  | **Backend:** migration **역삭제 금지** — 필요 시 forward-fix migration만 (P4-D) | compatibility matrix ❌ 행 회피 |
| 5   | 10–12 | Smoke: `/trade` · `/trade/futures` load · submit block banner 정상              | trade-desk-smoke subset         |
| 6   | 12–15 | E0 incident + §Deploy log rollback 행 · §15 (a)~(e)                             | ops-window 기록                 |

**금지:** `supabase db push` down migration · applied file 삭제 · MCP `apply_migration` 역적용.

---

## §Compatibility — Frontend × Backend × Migration

> deploy 시 **1행 기록:** `(frontend_sha, migration_list_hash, verdict, deployed_at)`  
> `migration_list_hash` = `supabase/migrations.lock.json` 전체 `migrations` 객체의 **canonical JSON SHA256** (파일명→content hash map · 키 정렬).

| Frontend        | Backend (migrations)   | 판정                      | 액션                                                              |
| --------------- | ---------------------- | ------------------------- | ----------------------------------------------------------------- |
| vN              | vN (parity)            | ✅ **SUPPORTED**          | 정상 deploy · CI 4 job green                                      |
| vN+1            | vN                     | ⚠️ **SKEW-RISK**          | frontend만 선행 deploy **금지** — API contract breaking 없을 때만 |
| vN              | vN+1                   | ⚠️ **SKEW-RISK**          | migration 선행 시 feature flag 또는 **동시 deploy**               |
| vN+1            | vN+1 (new RPC field)   | ✅ if backward compatible | P4-D 승인 + contract test · advisor 0                             |
| vN-1 (rollback) | vN (migration applied) | ❌ **UNSUPPORTED**        | **forward-fix only** — DB 역삭제 금지                             |

**판정 헬퍼 (코드):** `classifyVersionCompatibility(frontendGeneration, backendGeneration, options)` — [`trade-desk-release-rollback-display-contract.ts`](../../apps/web/src/domain/trade-desk-release-rollback-display-contract.ts)

**migration_list_hash 산출 (operator):**

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
# lock 파일 migrations 키만 정렬 JSON → sha256 (check:migrations 정본과 동일 집합)
Get-Content supabase/migrations.lock.json | ConvertFrom-Json | Select-Object -ExpandProperty migrations | ConvertTo-Json -Compress
# 출력 문자열을 sha256 — 또는 CI quality job의 check:migrations green = lock parity 확인
```

---

## §Deploy log (matrix 1행 · L9 필수)

| deployed_at (UTC+9) | frontend_sha | migration_list_hash                         | verdict   | operator   | notes                                                                                                          |
| ------------------- | ------------ | ------------------------------------------- | --------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-07-08          | `ae94979`    | `6b41190fa972caf2` (204 · check:migrations) | SUPPORTED | agent impl | L9 baseline · [`L9/release-approval-record.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md) |
| 2026-07-07          | `fed305d`    | parity                                      | SUPPORTED | operator   | Launch RC 4C Verified                                                                                          |

> L9 Release Approval: 최신 green deploy 1행 + rollback dry-run E0 링크 필수 ([`E0/README.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md) §13).

---

## Browser / CDN cache note (v5 V4)

> Rollback 후 **Frontend artifact는 이전 SHA**인데 **CDN edge cache** 또는 **사용자 browser cache**에 **new JS chunk**가 남을 수 있음 → Old UI + New Backend skew.

| 완화                              | PHONARA trade path                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Content-hash filename (Vite 기본) | ✅ `apps/web` build — chunk filename에 hash                                                          |
| Rollback 후 CDN purge             | hosting provider purge 1회 (Cloudflare 등)                                                           |
| Operator hard refresh             | rollback checklist #3                                                                                |
| PWA service worker                | **N/A** — trade desk critical path SW unregister 불필요 (PWA install optional · `check:pwa` CI only) |

---

## Implemented evidence

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-release-rollback-display-contract.test.ts green
```

**Verified:** GitHub CI quality job green after push · operator 15min rollback dry-run 1회 (선택 · E0 서명)

---

## 교차 참조

- [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) — 장애 UI 방어 · §15 (e) rollback
- [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md) — Launch RC · CI authoritative
- [`../SSOT/CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) — G13 heavy gate CI only
- [`../PRODUCT/ADR/004-trade-desk-sentry-defer.md`](../PRODUCT/ADR/004-trade-desk-sentry-defer.md) — post-deploy observability defer
