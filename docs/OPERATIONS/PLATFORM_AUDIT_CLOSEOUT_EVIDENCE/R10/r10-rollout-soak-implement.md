# R10 — Rollout Soak · 5조건 · Rollback (`audit-r10-rollout-soak`)

> **Stage:** R10 · **Plan todo:** `audit-r10-rollout-soak`  
> **Date:** 2026-07-13  
> **Command:** Implement per PLATFORM_AUDIT_TODO_HANDOFF.md  
> **dod_profile:** Ops · soak SOP · Trigger/SLO 감시

## Scope delivered

| 항목                     | 결과                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| Feature Flag 5조건 SOP   | [`PLATFORM_R10_ROLLOUT_SOAK.md`](../../PLATFORM_R10_ROLLOUT_SOAK.md) + YAML |
| Rollback Trigger ↔ Alert | 6 triggers · `stack:ops-alert-dry-fire` 1:1 (R4 EXT-01)                     |
| Soak ≥24h protocol       | T-30m · T+5m · T+60m · T+24h checkpoints                                    |
| Display contract         | `platform-r10-rollout-display-contract.ts`                                  |
| Spotcheck SQL            | `scripts/platform-r10-rollout-spotcheck.sql` (read-only)                    |
| R9-INSTALL-CTX fix       | `PwaShell` wraps `RootOutlet` in `InstallPromptProvider`                    |

## R9 blocker triage

| ID                 | Triage                                   | Evidence                                                                        |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------- |
| **R9-INSTALL-CTX** | **VERIFIED_FIXED**                       | `pwa-shell.tsx` · `__root.tsx` — Provider wraps all routes including `/install` |
| **R9-PERF-JS**     | **ACCEPTED_RISK** baseline soak (flip 0) | DL-R10-PERF-JS · rail flip 전 Stage1 JS re-measure 필수                         |

## Baseline soak status

| Checkpoint               | Implemented        | Operator 24h                                           |
| ------------------------ | ------------------ | ------------------------------------------------------ |
| Pre-deploy 30m checklist | **YES** (SOP §4.1) | operator 실행                                          |
| Post-deploy 5m smoke     | **YES** (SOP §4.2) | deploy 후 1회                                          |
| 60m spotcheck SQL        | **YES** (script)   | `psql … -f platform-r10-rollout-spotcheck.sql`         |
| 24h snapshot             | **TEMPLATE**       | [`r10-soak-24h-snapshot.md`](r10-soak-24h-snapshot.md) |

**판정:** R10 **Implemented** — soak SOP·Trigger·5조건·rollback 절차 고정.  
**Verified/DONE (24h):** operator가 24h 창 완료 + snapshot Evidence 후 R11 착수.

## Code / docs owners

| Path                                                           | Role                                    |
| -------------------------------------------------------------- | --------------------------------------- |
| `apps/web/src/domain/platform-r10-rollout-display-contract.ts` | 5조건 · stages · triggers · checkpoints |
| `apps/web/src/product/shell/pwa-shell.tsx`                     | InstallPromptProvider wraps children    |
| `apps/web/src/routes/__root.tsx`                               | RootOutlet inside PwaShell              |
| `docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.md`                 | Operator SOP                            |
| `docs/OPERATIONS/PLATFORM_R10_ROLLOUT_SOAK.yaml`               | Machine SOT                             |
| `scripts/platform-r10-rollout-spotcheck.sql`                   | 60m/24h read-only spotcheck             |
| `scripts/print-platform-r10-rollout.ts`                        | `audit:r10-rollout` summary             |

## Gates (Implemented)

```text
bun run typecheck → green
bun run check:pwa → green (PwaShell children contract)
bun run gate:ai-impl -- --test apps/web/src/domain/__tests__/platform-r10-rollout-display-contract.test.ts
bun run gate:ai-impl -- --test tests/scripts/platform-r10-rollout.test.ts
bun run audit:r10-rollout → contract summary exit 0
```

## Rollback drill

- Template: [`r10-rollback-dry-run-template.md`](r10-rollback-dry-run-template.md)
- Calendar: [`PLATFORM_DRILL_CALENDAR.md`](../../PLATFORM_DRILL_CALENDAR.md) — next 2026-08-13

## No Shortcut checklist

- [x] Feature Flag 5조건 문서화 (§8)
- [x] Rollback Trigger 6건 SLO YAML 연동
- [x] Soak 24h 타임라인 + spotcheck SQL
- [x] 재개 순서 5단계 + baseline soak (flip 0)
- [x] R9-INSTALL-CTX 코드 수정
- [x] R9-PERF-JS triage (ACCEPTED_RISK baseline · flip 전 re-measure)
- [x] migration 0 · engine 0
- [ ] Operator 24h snapshot Evidence — **pending** (R11 선행 권고)

## Next

1. Operator: 3-Owner 시차 서명 · 24h soak snapshot
2. **R9-PERF-JS** — code-split 후 Stage1 re-measure (rail flip 전)
3. **`audit-r12-post-release`** — PPR 24h/72h/7d · DR drill
