# §15 — Zero-Defect 운영 창 (E0)

> **시작:** 2026-07-08 (L9 `closeout-doc-sync`)  
> **원칙:** Zero-Defect는 **구현 완료 시점이 아니라 운영 결과** — CI green ≠ Zero-Defect  
> **선언 금지:** 3m incident 0 전까지 "Zero-Defect 달성/근접" 내부·마케팅 선언 **금지** ([`COPYWRITING_CANON.md`](../../../SSOT/COPYWRITING_CANON.md))

---

## 운영 창 일정

| 창        | 시작       | 목표 종료  | 지표                                    | 목표        | 기록                     |
| --------- | ---------- | ---------- | --------------------------------------- | ----------- | ------------------------ |
| **1주**   | 2026-07-08 | 2026-07-15 | Money incident · dup order · security   | **0**       | [`week1.md`](week1.md)   |
| **1개월** | 2026-07-08 | 2026-08-08 | Rollback · Σ drift · oracle freeze MTTR | **0 / SLA** | [`month1.md`](month1.md) |
| **3개월** | 2026-07-08 | 2026-10-08 | 위 항목 누적 · soak WARNING trend       | **0**       | [`month3.md`](month3.md) |

**L9 승인:** [`L9/release-approval-record.md`](../L9/release-approval-record.md)

---

## Incident 정의 (trade desk)

| 카테고리              | 예시                                                            |
| --------------------- | --------------------------------------------------------------- |
| **Money**             | wallet Σ drift · conservation_test fail · ledger duplicate leg  |
| **Security**          | unauthorized RPC success · cross-user fill · advisor ERROR prod |
| **Dup order**         | duplicate submit ledger · idempotency bypass                    |
| **Operator rollback** | P4-C rollback 트리거 발동                                       |

**비-incident:** UI-only regression · layout/a11y · fetch retry 성공 · advisory soak WARNING (문서화만)

---

## 실패 시 복구 (a)~(e)

| 단계              | 규칙                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **(a) 카운터**    | 해당 **카테고리** 운영 창 카운터 **리셋** — 3m 무사고는 incident **해소일**부터 재개                                         |
| **(b) 기록**      | `incident-YYYY-MM-DD.md` — 근본원인 · 영향 · 완화 · 재발방지 1줄                                                             |
| **(c) 티어 회귀** | operator **72시간 내** 관련 P-티어 재오픈 여부 (Money→P0-0/E2E · Security→S0)                                                |
| **(d) 선언 철회** | Zero-Defect 근접/달성 커뮤니케이션 **즉시 철회** → "조건부 운영 중"                                                          |
| **(e) 롤백**      | Money/Security → [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](../../TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md) · forward-fix 우선 |

---

## Incident 기록 템플릿

새 파일: `incident-YYYY-MM-DD.md`

```markdown
# Incident YYYY-MM-DD — <category>

| 필드                  | 값                                      |
| --------------------- | --------------------------------------- |
| category              | Money / Security / Dup order / Rollback |
| detected_at           |                                         |
| resolved_at           |                                         |
| impact                |                                         |
| root_cause            | 1줄                                     |
| mitigation            |                                         |
| recurrence_prevention | 1줄                                     |
| ops-window reset      | week1 / month1 / month3                 |
| tier regression       | P0-0 / S0 / none                        |
```

---

## PHONARA

- prod money spotcheck: [`trade-desk-launch-rc-soak-spotcheck.sql`](../../../../scripts/trade-desk-launch-rc-soak-spotcheck.sql)
- heavy SQL/E2E: **GitHub CI only** (G13)
- operator runbook: [`TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md`](../../TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md) (D1 · 본 README + failure matrix 정본)
