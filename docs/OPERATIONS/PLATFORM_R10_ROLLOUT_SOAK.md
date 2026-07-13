# Platform R10 — Rollout Soak · Feature Flag 5조건 · Rollback (§8 · §20b · §41)

> **Plan todo:** `audit-r10-rollout-soak`  
> **기계 정본:** [`PLATFORM_R10_ROLLOUT_SOAK.yaml`](PLATFORM_R10_ROLLOUT_SOAK.yaml)  
> **코드 계약:** [`platform-r10-rollout-display-contract.ts`](../../apps/web/src/domain/platform-r10-rollout-display-contract.ts)  
> **SLO/Trigger:** [`PLATFORM_SLO_SLA.yaml`](PLATFORM_SLO_SLA.yaml) · [`PLATFORM_SLO_SLA.md`](PLATFORM_SLO_SLA.md)  
> **Withdrawal:** [`PLATFORM_WITHDRAWAL_REENABLE_GATE.md`](PLATFORM_WITHDRAWAL_REENABLE_GATE.md)  
> **날짜:** 2026-07-13 · Playbook 1.0.0

R10은 **신규 rail flip 전** baseline soak(24h)과 **단계별 재개** 절차를 고정한다.  
「출시 완료」가 아니라 **soak Evidence + Trigger 감시 기록**까지가 본 Stage DoD다.

---

## 1. 30초 요약

| 항목           | 값                                                      |
| -------------- | ------------------------------------------------------- |
| Baseline soak  | T1 rails **flip 0** · Trigger/SLO 감시 ≥24h             |
| 재개 순서      | Live Crash → Trade → Sports → Giftcard → **Withdrawal** |
| 5조건          | Flag · Capability · Provider · Runtime E2E쌍 · Browser  |
| Rollback       | Known Good SHA 5분 · migration rewrite **금지**         |
| Spotcheck      | `scripts/platform-r10-rollout-spotcheck.sql`            |
| Alert dry-fire | `bun run stack:ops-alert-dry-fire` (R4 EXT-01)          |

---

## 2. Feature Flag 활성화 5조건 (§8)

신규/재개 rail을 `live`로 켜려면 **5가지 전부 Green**. 하나라도 red면 OFF/hidden 유지.

| #   | 조건                 | Green 기준                                             |
| --- | -------------------- | ------------------------------------------------------ |
| 1   | **Feature Flag**     | 명시 OFF/ON · Admin kill audit · reason 기록           |
| 2   | **Capability**       | engine/provider/live 판정 · runbook · cap              |
| 3   | **Provider Health**  | false-green 금지 · health endpoint OK                  |
| 4   | **Runtime**          | 성공 + negative E2E 1쌍 · money Σ=0 (CI authoritative) |
| 5   | **Browser Evidence** | Stage1 해당 surface PASS (MCP preview)                 |

R10은 **재개 단계마다** 본 표를 재확인한다. Baseline soak 단계는 flip 0 — 표는 **감시·문서화**만.

---

## 3. 재개 순서 (Plan R10)

| Order | Stage             | Feature keys                                       | Stage1 routes              | Flip                                                                           |
| ----: | ----------------- | -------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
|     0 | **Baseline soak** | —                                                  | 8 critical (축약 smoke)    | **금지**                                                                       |
|     1 | Live Crash        | `feature_game_enabled`                             | `/casino` · `/games/crash` | Owner gate                                                                     |
|     2 | Trade             | `feature_spot_enabled` · `feature_futures_enabled` | `/trade`                   | Owner gate                                                                     |
|     3 | Sports            | `feature_sports_enabled`                           | `/sports`                  | Owner gate                                                                     |
|     4 | Giftcard          | `feature_deposit_enabled`                          | giftcard deposit/redeem    | Owner gate                                                                     |
|     5 | Withdrawal        | `feature_withdrawal_enabled`                       | `/wallet/withdraw`         | [`PLATFORM_WITHDRAWAL_REENABLE_GATE.md`](PLATFORM_WITHDRAWAL_REENABLE_GATE.md) |

**금지:** Owner 승인·5조건 Green·soak Evidence 없이 순서 건너뛰기 또는 동시 flip.

---

## 4. Soak 타임라인 (≥24h)

```text
T-30m   pre-deploy baseline (CI · parity · dry-fire · flag snapshot)
Deploy  clean SHA only (H-06)
T+5m    post-deploy smoke — Stage1 8-route 축약 (console 0 · CTA · /status)
T+60m   SLO/trigger spotcheck SQL
T+24h   snapshot Evidence · Trigger fires 0 · Money Delta 0
```

### 4.1 Pre-deploy baseline (T-30m)

```powershell
bun run check:deploy-parity -- --remote
bun run stack:ops-alert-dry-fire
bun run audit:r10-rollout
```

### 4.2 Post-deploy smoke (T+5m)

Stage1 8 route 축약: load · console/page error 0 · 핵심 CTA · `/status` manifest 정합.  
red = **즉시 Rollback 검토** ([`PLATFORM_INCIDENT_RESPONSE.md`](PLATFORM_INCIDENT_RESPONSE.md)).

### 4.3 60분 · 24h spotcheck

```powershell
# operator · read-only prod/staging
psql $env:DATABASE_URL -f scripts/platform-r10-rollout-spotcheck.sql
```

24h 창 종료 시 Evidence: [`R10/r10-soak-24h-snapshot.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-soak-24h-snapshot.md)

---

## 5. Rollback Trigger 감시 (§20b · §39)

| Trigger key                      |   초안 | 윈도우 | 1차 액션                 |
| -------------------------------- | -----: | ------ | ------------------------ |
| `http_5xx_rate_pct_5m`           |   2.0% | 5m     | rail OFF / Known Good    |
| `provider_timeout_rate_pct`      |   5.0% | 15m    | provider halt            |
| `rpc_p95_ms`                     | 1500ms | 5m     | feature OFF 검토         |
| `money_delta_alarm`              |   true | 즉시   | **money rail 전면 halt** |
| `wallet_error_burst_per_min`     |     20 | 1m     | wallet OFF               |
| `permission_error_burst_per_min` |     10 | 1m     | authz + freeze 검토      |

- Trigger hit → Standing Grant로 “계속 수정” **금지** → Incident + Rollback Validation
- Alert mapping Evidence: R4 `stack:ops-alert-dry-fire` 6/6
- Rollback Drill: [`PLATFORM_DRILL_CALENDAR.md`](PLATFORM_DRILL_CALENDAR.md) — R10에서 1회 필수

### 5.1 15분 Rollback 체크리스트 (요약)

1. Trigger 분류 (Money / UI / Security)
2. Frontend: Known Good SHA 재배포
3. CDN purge · hard refresh
4. Backend: migration rollback **금지** — forward-fix only (§7)
5. Smoke: Stage1 축약 8 route
6. Decision Log + Evidence URI

템플릿: [`R10/r10-rollback-dry-run-template.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollback-dry-run-template.md)

---

## 6. SLO 감시 (§41)

수치 정본: [`PLATFORM_SLO_SLA.yaml`](PLATFORM_SLO_SLA.yaml) (`metrics_status: confirmed`).

| SLO ID             | 키                       |    초안 |
| ------------------ | ------------------------ | ------: |
| SLO-WALLET-P95     | `wallet_api_p95_ms`      |  ≤800ms |
| SLO-DEPOSIT-POST   | `deposit_post_max_min`   |  ≤30min |
| SLO-WITHDRAW-QUEUE | `withdraw_queue_max_min` | ≤120min |
| SLO-TRADE-SUCCESS  | `trade_success_rate_min` |  ≥99.0% |
| SLO-SPORTS-ODDS    | `sports_odds_stale_sec`  |   ≤120s |

성능 예산 (R9): `stage1_initial_js_kb` ≤450 · `stage1_lcp_max_ms` ≤3500.

soak 중 SLO 위반 = Trigger 후보 + Risk Register 갱신.

---

## 7. R9 Release blocker triage (R10 착수)

| ID                 | Triage                                                                 | R10 영향                                   |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------ |
| **R9-INSTALL-CTX** | **FIXED** — `PwaShell`이 `RootOutlet`을 `InstallPromptProvider`로 감쌈 | Stage2 `/install` 재측정 권고              |
| **R9-PERF-JS**     | **ACCEPTED_RISK** baseline soak (flip 0)                               | rail flip 전 Stage1 JS re-measure **필수** |

---

## 8. 교차 참조

- [`PLATFORM_AUDIT_TODO_HANDOFF.md`](PLATFORM_AUDIT_TODO_HANDOFF.md) §audit-r10
- [`PLATFORM_STAGE_SCHEDULE.md`](PLATFORM_STAGE_SCHEDULE.md) — R10 ≥1일+24h
- [`PLATFORM_INCIDENT_RESPONSE.md`](PLATFORM_INCIDENT_RESPONSE.md)
- [`PLATFORM_POST_RELEASE_REVIEW.md`](PLATFORM_POST_RELEASE_REVIEW.md) — R12
- Evidence: [`R10/r10-rollout-soak-implement.md`](PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R10/r10-rollout-soak-implement.md)
