# Trade Desk Remediation — Phase 4 Launch RC Signoff

> **Execute SSOT:** Cursor Plan `trade_desk_remediation_v3` (v4.2 FINAL) · Tier 2  
> **Todo:** `phase-4-launch-rc` · closeout **`phase-4-closeout` `[x]` DONE** 2026-07-07  
> **선행:** Tier 1 engineering complete (Phase 0~3 · Phase 2B toast)  
> **Verified:** GitHub CI **quality·sql·e2e·advisors green** + **24h prod soak OK** — operator 2026-07-07 ([`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md))

---

## Tier 2 Launch RC 체크리스트

| 항목                           | Gate                                                      | Agent Implemented   | Operator Verified                                                |
| ------------------------------ | --------------------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| **4A** 390/768/1024 signoff    | vitest layout mount · dead control · operator axe browser | `[x]` vitest layout | `[x]` 2026-07-07 · vitest 41/41 · browser axe advisory           |
| **4A** dead control 0          | `P9_TRADE_DEAD_CONTROL_TEST_IDS`                          | `[x]` vitest        | `[x]` 2026-07-07                                                 |
| **4B** Complaint registry 100% | `assertTradeDeskLaunchRcSync`                             | `[x]` contract      | `[x]` 2026-07-07                                                 |
| **4B** Toast registry 100%     | `TRADE_TOAST_EVENT_REGISTRY` (T2 deferred only)           | `[x]` contract      | `[x]` 2026-07-07                                                 |
| **4C** CI check:full           | GitHub Actions                                            | —                   | `[x]` 2026-07-07 · `fed305d` · quality·sql·e2e·advisors green    |
| **4D** 24h prod soak           | `trade-desk-launch-rc-soak-spotcheck.sql`                 | `[x]` script        | `[x]` 2026-07-07 · WARNING 0 · remediate applied                 |
| **4E** security-auditor        | readonly T0~T3                                            | `[x]` PASS          | `[x]` 2026-07-07 · ERROR 0 · **P3-B advisory closed 2026-07-08** |
| **S4** LAUNCH RC APPROVED      | §E 템플릿                                                 | —                   | **`[x]` 2026-07-07**                                             |

---

## §4A — Multi-viewport signoff (S4)

| Viewport | width | Surfaces                                                        | Automated          |
| -------- | ----- | --------------------------------------------------------------- | ------------------ |
| Mobile   | 390   | `/trade` · `/trade/futures` · `/staking` · `/staking/positions` | vitest mount + axe |
| Tablet   | 768   | 동일                                                            | vitest mount + axe |
| Desktop  | 1024+ | 동일                                                            | vitest mount + axe |

**Dead control 0 (enabled CTA must wire handler):**

| testid                         | Surface                     |
| ------------------------------ | --------------------------- |
| `spot-submit`                  | Spot desk                   |
| `futures-submit`               | Futures desk                |
| `trade-desk-mobile-sticky-cta` | Mobile spot sticky          |
| `staking-stake-cta`            | Staking hub                 |
| `staking-positions-hub-link`   | Staking positions → hub nav |

**Implemented evidence:**

```text
gate:ai-impl --test apps/web/src/domain/__tests__/trade-desk-launch-rc-display-contract.test.ts green
gate:ai-impl --test apps/web/src/product/surfaces/__tests__/p9-trade-visual-signoff.test.tsx green
```

**axe critical 0:** vitest jsdom + Radix tabs = false positives on trade/staking desks · **operator browser DevTools axe at 390/768/1024 = S4 authoritative** (§4A).

---

## §4B — Complaint Registry Signoff표

> Source: [`TRADE_USER_COMPLAINT_RISKS`](../../apps/web/src/domain/trade-exchange-parity-display-contract.ts)  
> Launch scope = all rows **except** P10 sports/casino deferrals.

| Mitigation     | 의미                                      | Launch RC       |
| -------------- | ----------------------------------------- | --------------- |
| `live`         | DevTools/테스트 CONFIRMED · control wired | agent_confirmed |
| `built_hidden` | UI DOM 0                                  | agent_confirmed |
| `disabled+key` | disabled + i18n reason visible            | agent_confirmed |

**Out-of-scope (P10 · 별도 plan):** `sports-stake-usdt-only` · `casino-stake-usdt-only`

**Agent sync:** `listTradeLaunchRcComplaintSignoffRows()` → in-scope rows **100%** `agent_confirmed`.

---

## §4B — Toast Event Signoff표

> Source: [`TRADE_TOAST_EVENT_REGISTRY`](../../apps/web/src/domain/trade-toast-display-contract.ts)

| Rule                    | Launch RC                                               |
| ----------------------- | ------------------------------------------------------- |
| `implemented: yes`      | sync path wired · no silent RPC success                 |
| `implemented: deferred` | **T2 only** · `ownerTodo: engine-t2-futures-completion` |
| silent fail             | **FAIL** (`trade-feedback-silent-fail` must be `live`)  |

**Deferred at Launch RC (S2 funding OFF policy · T2 optional):**

| eventId                   | ownerTodo                      |
| ------------------------- | ------------------------------ |
| `futures.sltp.updated`    | `engine-t2-futures-completion` |
| `futures.funding.applied` | `engine-t2-futures-completion` |

**Agent sync:** `listTradeLaunchRcToastSignoffRows()` → **100%** `agent_confirmed`.

---

## §4C — CI authoritative (Verified/DONE)

```text
git push → GitHub Actions CI:
  quality  (typecheck · vitest · i18n · release · build)
  sql      (test:sql Σ=0)
  e2e      (trade-desk-smoke + wallet/trade specs)
  advisors (0 ERROR)
```

> Launch RC **4C** = 위 4 job 전부 green. `check:full`(L8)은 workflow 미포함 · CI job bundle과 동치 ([`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md) §CI에 없는 gate).

**Operator 확인:**

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
git push origin <branch>
bun run ci:status
```

로컬 `check:full` red/green = **판정 불가** — CI green = Verified.

**Operator verified (2026-07-07):**

| 항목     | 값                                                          |
| -------- | ----------------------------------------------------------- |
| Branch   | `closeout/engine-apex-freeze-phase-r-ready-2026-07-03`      |
| Commit   | `fed305d` (origin synced)                                   |
| CI jobs  | quality · sql · e2e · advisors — **green**                  |
| Evidence | `d3e73ea` green CI vitest · `fed305d` P0 trade fixes pushed |

---

## §4D — 24h prod soak checklist

| Check            | 방법                                                                                                       | Pass                |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- |
| Oracle freshness | active symbols oracle age `<300s`                                                                          | WARNING 0 over 24h  |
| Cron health      | `trade-open-order-fills` · `trade-spot-order-fills` · `trade-stop-orders` · `trade-funding-accrual` active | job active          |
| Feature flags    | `feature_spot_enabled` · `feature_futures_enabled` · `feature_staking_enabled` = true                      | ON                  |
| Funding (S2 A)   | `feature_funding_enabled` may stay false                                                                   | accrue only when ON |
| Alert silence    | `ops_alerts` critical open 0 · `ops_notify_outbox` critical stuck 0                                        | 0                   |

**Spot-check (read-only · operator gate · 1 terminal):**

```powershell
psql $env:DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
```

**Remediation (one-time · soak blocker 해소 후 spot-check 재실행):**

```powershell
psql $env:DATABASE_URL -f scripts/trade-desk-launch-rc-soak-remediate.sql
psql $env:DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
```

24h soak = 위 spot-check를 **24시간 창**에서 cron/oracle/alert WARNING 0 확인 · operator 기록.

**Operator verified (2026-07-07):**

| Check            | 결과                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| Oracle freshness | `stale_symbols=0` (MATIC_USDT deactivated — stale feed)                               |
| Cron health      | 4/4 trade jobs active                                                                 |
| Feature flags    | spot · futures · staking · funding = `true`                                           |
| Alert silence    | `open_critical_alerts=0` · `pending_critical_notify=0` (stack_test residue resolved)  |
| Remediation      | `scripts/trade-desk-launch-rc-soak-remediate.sql` applied · prod spot-check WARNING 0 |

---

## §4E — Closeout (`phase-4-closeout` · 2026-07-07)

| 항목                                 | 결과               | 증거                                                                                                                                                    |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent Implemented                    | `[x]`              | `gate:ai-impl` launch-rc **6/6** · visual signoff **41/41**                                                                                             |
| security-auditor                     | **PASS** · ERROR 0 | T0~T3 readonly · RISK LOW · **Launch RC advisory → P3-B closed 2026-07-08**                                                                             |
| §82 doc sync                         | `[x]`              | 본 문서 · [`TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md`](TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md) · [`ACTIVE_WORK_SSOT.md`](../SSOT/ACTIVE_WORK_SSOT.md) |
| **4C CI (quality·sql·e2e·advisors)** | **`[x]` operator** | `fed305d` · Actions green 2026-07-07                                                                                                                    |
| **4D 24h prod soak**                 | **`[x]` operator** | soak spot-check WARNING 0 · remediate applied 2026-07-07                                                                                                |
| S4 LAUNCH RC APPROVED                | `[x]`              | §E 서명 2026-07-07                                                                                                                                      |

**security-auditor 요약 (readonly · T0~T3):**

| Tier                        | 판정                                                     |
| --------------------------- | -------------------------------------------------------- |
| T0 oracle/candles boundary  | OK — helper REVOKE · admin+AAL2 · cron service_role-only |
| T1 spot_open_orders RPC/RLS | OK — own-row RLS · money RPC auth+idem                   |
| T2 SLTP/funding             | OK — ownership guard · funding idempotency               |
| T3 staking                  | OK — USDT Σ=0 leg · auth+rate limit                      |

**Launch RC §4E advisory closeout (P3-B · 2026-07-08):**

| Advisory (S4 후속)                                                                                   | Closeout                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `grants_rls_inventory_test.sql` — entry RPC + `rpc_run_spot_order_fills` / `rpc_run_funding_accrual` | ✅ P3-B ASSERT pins — [`P3-B/security-residual-closeout.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P3-B/security-residual-closeout.md) |
| T0-d grep allowlist — T1 `_fill_house_spot_order`                                                    | ✅ `trade_t0d_candles_display_safety_test.sql`                                                                                   |
| cross-user negative SQL                                                                              | ✅ S0 정본 — `trade_cross_user_reject_test.sql` (P3-B 재구현 없음)                                                               |

**Verified/DONE (full Tier 2 LAUNCH):** S4 서명 + **4C CI green** + **4D 24h soak OK** — **2026-07-07 operator verified** · §4E advisory residual **2026-07-08 P3-B Implemented**.

---

## §E — Phase 4 Launch RC (S4 · Tier 2 · operator 서명)

```text
[PHONARA Trade Desk · Phase 4 Launch RC — Tier 2 완료 후]

S4 Launch RC: (x) 390/768/1024 signoff · (x) dead control 0 · (x) CI green · (x) 24h soak OK

서명: PHONARA operator  날짜: 2026-07-07
```

**LAUNCH RC APPROVED (S4):** Tier 1 engineering + complaint/toast registry 100% + security-auditor PASS + multi-viewport/dead-control signoff — **2026-07-07**.

**Verified/DONE (full Tier 2 LAUNCH):** S4 + **GitHub CI quality·sql·e2e·advisors green** + **24h prod soak OK** — **2026-07-07**.

---

## L9 — Zero-Defect Release Approval (Plan `trade_desk_qa_audit` · 2026-07-08)

> **선행:** 본 문서 S4 + 4C/4D Verified · **후속:** §15 운영 창 1w/1m/3m  
> **Zero-Defect 선언:** L9 시점 **금지** — CI green ≠ Zero-Defect

| 항목                              | Gate                                | Agent Implemented | Operator Verified     |
| --------------------------------- | ----------------------------------- | ----------------- | --------------------- | ---------------- | --------------------------- |
| L9 Release Approval Record (실질) | E0 `L9/release-approval-record.md`  | `[x]` 2026-07-08  | Stage 2/3 **partial** |
| §15 ops-window STARTED            | E0 `ops-window/week1                | month1            | month3`               | `[x]` 2026-07-08 | week1 PASS `[ ]` 2026-07-15 |
| §82 doc sync                      | ACTIVE_WORK_SSOT · 본 §L9           | `[x]` 2026-07-08  | —                     |
| Q1 manual diff (L9 QA)            | `0-A-quality-signoff.md`            | `[x]` agent       | `[ ]` operator        |
| Q2 citations                      | `check:money-formula-citations`     | `[x]`             | `[x]` CI quality      |
| Rollback dry-run                  | `P4/rollback-dry-run-2026-07-08.md` | `[x]` checklist   | `[ ]` 15min drill     |

**E0:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md)

---

## 교차 참조

- [`TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md`](TRADE_DESK_REMEDIATION_PHASE0_SIGNOFF.md) — S1~S3 · §0G Critical 5
- [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md) — oracle freshness
- [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md) — L9 3단계 · §15
- [`OPERATOR_GATES.md`](../SSOT/OPERATOR_GATES.md) · [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md)
- Contract: [`trade-desk-launch-rc-display-contract.ts`](../../apps/web/src/domain/trade-desk-launch-rc-display-contract.ts)
