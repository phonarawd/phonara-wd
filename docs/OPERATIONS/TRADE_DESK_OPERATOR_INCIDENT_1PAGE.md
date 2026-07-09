# Trade Desk Operator — Incident 1페이지 (D1)

> **대상:** operator 1인 · 새벽 3시 playbook  
> **정본:** [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md) · **본 문서는 압축본**  
> **원칙:** UI 방어 유지 → 확인 → 복구 · **새 RPC/엔진 변경 금지** (forward-fix 우선)

---

## Tier 1 — 즉시 대응 (UI 이미 방어)

| 시나리오            | UI                               | operator 액션 (순서)                                                            |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| **Fetch/DB down**   | `trade-desk-fetch-error` + retry | 1) retry 클릭 유도 2) Supabase/PostgREST 상태 3) 복구 대기 — **엔진 패치 금지** |
| **Realtime down**   | disconnect banner · submit block | 1) 재연결 대기 2) channel 상태 3) submit block 유지                             |
| **RPC timeout/5xx** | toast stable code                | 1) 재시도 2) idempotency 중복 여부 3) ledger duplicate leg 확인                 |
| **Offline**         | `navigator.onLine` gate          | 네트워크 복구 대기                                                              |
| **Stale price**     | per-symbol stale banner          | oracle `updated_at` 확인 · submit block 유지                                    |

---

## Oracle — Lag vs Freeze (분류 필수)

| 구분       | 신호                             | UI            | Submit | runbook |
| ---------- | -------------------------------- | ------------- | ------ | ------- |
| **Lag**    | `updated_at` age **> 300s**      | stale banner  | block  | T0 §2.1 |
| **Freeze** | age ≤300s · mark **≥60s 무변동** | freeze banner | block  | T0 §7   |

**정본:** [`TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md`](TRADE_DESK_T0_ORACLE_OPS_RUNBOOK.md)

---

## Oracle Freeze — 4단계 에스컬레이션

| 단계       | 담당             | SLA      | 액션                                     |
| ---------- | ---------------- | -------- | ---------------------------------------- |
| **1 탐지** | UI banner + soak | 즉시     | submit block 유지 · false urgency 금지   |
| **2 확인** | operator         | **15분** | `oracle_prices` · lag vs freeze 분류     |
| **3 승인** | operator         | 30분     | cron/edge 재기동 · E0 incident 기록      |
| **4 공지** | operator 판단    | 필요 시  | i18n freeze copy · eligibility-visible만 |

---

## §15 Incident — 실패 시 (a)~(e)

**Incident 정의:** wallet Σ drift · duplicate submit ledger · unauthorized RPC · operator rollback

| 단계              | 규칙                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **(a) 카운터**    | 해당 카테고리 ops-window 카운터 **리셋** — 3m 무사고는 **해소일**부터 재개                                             |
| **(b) 기록**      | `E0/ops-window/incident-YYYY-MM-DD.md` — 근본원인·영향·완화·재발방지 1줄                                               |
| **(c) 티어 회귀** | **72시간 내** P-티어 재오픈 판정 (Money→P0-0/E2E · Security→S0)                                                        |
| **(d) 선언 철회** | Zero-Defect 근접/달성 **즉시 철회** → "조건부 운영 중" · **마케팅 금지**                                               |
| **(e) 롤백**      | Money/Security → [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) · forward-fix 우선 |

**ops-window:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/README.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/README.md)

---

## E0 Incident 기록 (1분)

새 파일: `docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/incident-YYYY-MM-DD.md`

```text
category: Money / Security / Dup order / Rollback
detected_at · resolved_at · impact · root_cause (1줄)
mitigation · recurrence_prevention (1줄)
ops-window reset: week1 / month1 / month3
tier regression: P0-0 / S0 / none
```

---

## Money 확인 (prod)

```powershell
# soak spotcheck (operator advisory)
bun run scripts/trade-desk-launch-rc-soak-spotcheck.sql  # 또는 문서 경로 참조
```

**Heavy SQL/E2E:** GitHub CI only (G13) — 로컬 `test:sql` 일상 실행 금지

---

## 금지 (인시던트 중)

- `supabase db push` / migration 역삭제
- client-side payout 재계산 · float money
- Zero-Defect 달성 선언 (3m incident 0 전)
- 과장 urgency · guaranteed-profit copy ([`COPYWRITING_CANON.md`](../SSOT/COPYWRITING_CANON.md))

---

## 교차 참조

- Tier 2 chaos: [`TRADE_DESK_FAILURE_RECOVERY_MATRIX.md`](TRADE_DESK_FAILURE_RECOVERY_MATRIX.md)
- Release/rollback: [`TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md`](TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md)
- Load/realtime soak: [`TRADE_DESK_LOAD_REALTIME_SOAK.md`](TRADE_DESK_LOAD_REALTIME_SOAK.md)
- Observability KPI: [`TRADE_DESK_OBSERVABILITY.md`](TRADE_DESK_OBSERVABILITY.md)
