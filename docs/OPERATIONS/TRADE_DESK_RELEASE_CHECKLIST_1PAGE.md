# Trade Desk Release — QA/Operator 1페이지 체크리스트 (D1)

> **대상:** QA · operator · 릴리스 승인자  
> **정본:** Plan `trade_desk_qa_audit` L9 · **마스터 플랜 대체 아님**  
> **판정:** CI green = Verified · 로컬 heavy red/green = **판정 불가** (G13)

---

## CI 4 job (Verified baseline)

| Job          | 내용                                                                          | 체크                       |
| ------------ | ----------------------------------------------------------------------------- | -------------------------- |
| **quality**  | typecheck · vitest · i18n · release · build · `check:money-formula-citations` | `[x]` Launch RC 2026-07-07 |
| **sql**      | db reset · test:sql · Σ=0                                                     | `[x]` CI                   |
| **e2e**      | trade-desk-smoke · wallet conservation                                        | `[x]` CI                   |
| **advisors** | remote Supabase 0 ERROR                                                       | `[x]` CI                   |

```powershell
Set-Location c:\Users\PC\Desktop\phonara-gb
git push origin <branch>
bun run ci:status
```

**Actions:** GitHub → CI workflow green = Verified ([`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md))

---

## L9 QA 필수 — Q1 / Q2 (F1 · post-P0-0)

| #      | 검증                                      | 증거                                                                                    | Agent | Operator            |
| ------ | ----------------------------------------- | --------------------------------------------------------------------------------------- | ----- | ------------------- |
| **Q1** | GRAND_TOTAL 수식 ↔ SQL assert manual diff | [`0-A-quality-signoff.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/0-A-quality-signoff.md) | `[x]` | `[ ]` **서명 대기** |
| **Q2** | `bun run check:money-formula-citations`   | CI quality job                                                                          | `[x]` | `[x]`               |

- [ ] **Q1** manual diff operator 서명
- [x] **Q2** citations green
- [x] CI 4 job green

---

## L9 Release Approval — 3단계

| 단계                     | 담당                            | 산출                                                                                                 | Agent | Operator                          |
| ------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------- | ----- | --------------------------------- |
| **1 · QA Verified**      | CI + §12 #0~12                  | [`L9/release-approval-record.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/L9/release-approval-record.md) §QA | `[x]` | `[x]` 4C · Q1 `[ ]`               |
| **2 · Operator Signoff** | rollback · soak · observability | E0 `P4/` + LAUNCH_RC                                                                                 | `[x]` | **partial** — dry-run · KPI `[ ]` |
| **3 · Release**          | deploy sha + migration hash     | §Deploy log 1행                                                                                      | `[x]` | `[ ]` prod 확인                   |

**서명 템플릿:** `L9/release-approval-record.md` §Operator · §Release

---

## Pre-deploy (1분)

- [x] CI 4 job green
- [x] P0~P4 UI-only · migration touch **0** (기본)
- [ ] migration touch 시: P4-D 3 gate + `stack:push-remote` + advisor 0

**Migration touch:** [`TRADE_DESK_MIGRATION_VERIFICATION.md`](TRADE_DESK_MIGRATION_VERIFICATION.md)

---

## Rollback (15분 · Money/Security trigger)

| #   | 분    | 액션                                  |
| --- | ----- | ------------------------------------- |
| 1   | 0–2   | trigger 분류 (Money / UI / Security)  |
| 2   | 2–5   | frontend 이전 SHA redeploy            |
| 3   | 5–7   | CDN/cache-bust 확인                   |
| 4   | 7–10  | DB **역삭제 금지** — forward-fix only |
| 5   | 10–12 | smoke `/trade` · banner 정상          |
| 6   | 12–15 | E0 incident + §15 (a)~(e)             |

**Dry-run:** [`P4/rollback-dry-run-2026-07-08.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/rollback-dry-run-2026-07-08.md) — 배포 전 1회 서명  
**정본:** [`TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md`](TRADE_DESK_RELEASE_ROLLBACK_RUNBOOK.md)

**Rollback trigger:** Σ≠0 · Money E2E fail · advisor ERROR · §15 Money/Security incident

---

## §15 운영 창 (L9 시작 · Zero-Defect 선언 금지)

| 창    | 목표 종료  | 지표                                  | 기록                                                                           |
| ----- | ---------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| 1주   | 2026-07-15 | Money · dup · security incident **0** | [`ops-window/week1.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/week1.md)   |
| 1개월 | 2026-08-08 | rollback · Σ drift · freeze MTTR      | [`ops-window/month1.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/month1.md) |
| 3개월 | 2026-10-08 | 누적 incident **0**                   | [`ops-window/month3.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/ops-window/month3.md) |

**CI green ≠ Zero-Defect** — 3m incident 0 전까지 선언 금지

---

## 교차 참조

- 구현 P0: [`TRADE_DESK_P0_CHECKLIST_1PAGE.md`](TRADE_DESK_P0_CHECKLIST_1PAGE.md)
- Incident: [`TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md`](TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md)
- Launch RC: [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md)
- E0: [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md)
