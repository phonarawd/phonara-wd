# §15 · Week 1 운영 창 (2026-07-08 → 2026-07-15)

> **지표:** Money incident · duplicate order · security incident = **0**  
> **상태:** **STARTED** 2026-07-08 · **PASS/FAIL:** `[ ]` pending (2026-07-15 마감)

---

## 카운터

| 카테고리          | count | 목표 | 마지막 갱신          |
| ----------------- | ----- | ---- | -------------------- |
| Money incident    | **0** | 0    | 2026-07-08 (창 시작) |
| Duplicate order   | **0** | 0    | 2026-07-08           |
| Security incident | **0** | 0    | 2026-07-08           |

---

## 일일 spot-check (operator · 선택)

| 날짜       | soak spot-check              | ops_alerts critical | incident | initials |
| ---------- | ---------------------------- | ------------------- | -------- | -------- |
| 2026-07-08 | 창 시작 · Launch RC baseline | 0 (2026-07-07)      | 0        | —        |
| 2026-07-09 |                              |                     |          |          |
| 2026-07-10 |                              |                     |          |          |
| 2026-07-11 |                              |                     |          |          |
| 2026-07-12 |                              |                     |          |          |
| 2026-07-13 |                              |                     |          |          |
| 2026-07-14 |                              |                     |          |          |
| 2026-07-15 | **마감**                     |                     |          |          |

**명령 (read-only):**

```powershell
psql $env:DATABASE_URL -f scripts/trade-desk-launch-rc-soak-spotcheck.sql
```

---

## Week 1 마감 (2026-07-15)

| 항목              | 결과                                                       |
| ----------------- | ---------------------------------------------------------- |
| Money incident    | `[ ]` 0 / FAIL                                             |
| Duplicate order   | `[ ]` 0 / FAIL                                             |
| Security incident | `[ ]` 0 / FAIL                                             |
| **Verdict**       | `[ ]` PASS · `[ ]` FAIL → [`README.md`](README.md) (a)~(e) |

**서명:**

```text
Week 1 PASS/FAIL: __________  Operator: ______  Date: 2026-07-15
```
