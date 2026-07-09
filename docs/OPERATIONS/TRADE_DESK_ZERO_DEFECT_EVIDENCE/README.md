# Trade Desk Zero-Defect — Evidence Repository (E0)

> **목적:** 감사·장애 시 문서보다 먼저 찾는 **증거 인덱스**  
> **채점 (v7.1):** 설계 완성도 ≠ 실행 완성도 — 빈 슬롯에 단일 10/10 **금지**  
> **실행 점수:** 채워진 슬롯 수 / 티어별 필수 슬롯 (아래 표)  
> **바이너리:** trace/video는 **GitHub CI artifact** 링크만 — repo root `/evidence` **금지** (G12)

**경로 (단일 SOT):** `docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/`

---

## 디렉터리 · 명명 규칙

```text
docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/
  README.md                          # 본 인덱스
  P0-0/0-A-read-checklist.md         # assert read-only 대조 · 불일치 분기 (F4)
  P0-0/0-A-quality-signoff.md        # Q1 manual diff 서명 · Q2 citations (F1)
  P0-0/money-formula-merge.md        # commit sha + doc path
  P0/gate-ai-impl-P0.md              # local gate exit + vitest N/N
  P0/P0-4-tier-no-tx.md              # E2E spec + CI run URL
  S0/security-auditor-delta.md
  P3-B/security-residual-closeout.md
  P3-A/perf-baseline-snapshot.md
  P3-C/load-realtime-soak-snapshot.md
  P3-D/browser-matrix-snapshot.md
  P4/failure-recovery-matrix.md       # P4-A Tier1/2 + freeze escalation
  P4/observability-kpi-baseline.md    # P4-B KPI 5종 + Sentry defer ADR
  P4/rollback-dry-run-2026-07-08.md
  P4/migration-verify-ladder.md       # P4-D approval gates + apply ladder
  P4/migration-operator-signoff.md    # P4-D gate 2 서면 승인 (touch 시)
  P4/migration-security-auditor-review.md  # P4-D gate 3 auditor pre-review
  L9/release-approval-record.md      # QA→Operator→Release 3단계 실질
  ops-window/                        # §15 1w/1m/3m incident 0 추적 (L9 시작)
    README.md · week1.md · month1.md · month3.md
```

| 티어     | E0 슬롯               | 증거 유형                                                                     | 상태                                                                             |
| -------- | --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **P0-0** | `P0-0/`               | 0-A-read · 0-A-quality (Q1+Q2) · merge sha                                    | `[x]` **0-A-close impl** 2026-07-07 · Q1 operator `[ ]`                          |
| P0       | `P0/`                 | `gate:ai-impl` · P0-4 E2E CI link                                             | `[x]` impl (Launch RC + contracts) · E0 P0 slot `[ ]` formal                     |
| S0       | `S0/`                 | security-auditor · idempotency negative                                       | `[x]` **impl** 2026-07-08 · CI Verified (Launch RC)                              |
| P1~P3    | 동명                  | vitest · perf · load/realtime soak · axe · browser matrix · security residual | P3-A~D **`[x]` impl** 2026-07-08 · CI Verified (Launch RC baseline)              |
| P4       | `P4/`                 | failure matrix · observability KPI · rollback dry-run · migration ladder      | **`[x]` impl** 2026-07-08 · operator dry-run / KPI baseline Verified **pending** |
| **L9**   | `L9/` + `ops-window/` | Release Approval 3단계 실질 · §15 운영 창                                     | **`[x]` impl** 2026-07-08 · operator Stage 2/3 · §15 마감 **pending**            |

**P0-0 실행 슬롯 (3종):** 3/3 — read ✅ · quality ✅ · merge ✅ ([`0-A-close`](P0-0/money-formula-merge.md))

**L9 실행 슬롯:** [`L9/release-approval-record.md`](L9/release-approval-record.md) ✅ · [`ops-window/`](ops-window/README.md) **STARTED** 2026-07-08

---

## CI 링크 템플릿

```text
Implemented: gate:ai-impl --test <path> green · vitest N/N
Verified: gh run list --workflow=ci.yml --limit 3
         GitHub Actions → quality · sql · e2e · advisors green
```

PHONARA 정합: 로컬 = `gate:ai-impl` · heavy = **GitHub CI** (`bun run ci:status`) · operator = [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](../TRADE_DESK_LAUNCH_RC_SIGNOFF.md) `Agent Implemented | Operator Verified` 패턴

**부록 D 1페이지 (D1 · P0-0 후):** [`TRADE_DESK_P0_CHECKLIST_1PAGE.md`](../TRADE_DESK_P0_CHECKLIST_1PAGE.md) · [`TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md`](../TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md) · [`TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md`](../TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md)

---

## P0-0 슬롯 (현재)

| 파일                                                       | 역할                                                | 상태                  |
| ---------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| [`P0-0/0-A-read-checklist.md`](P0-0/0-A-read-checklist.md) | assert read-only 대조 · **불일치 분기 (F4)**        | `[x]` impl 2026-07-07 |
| `P0-0/0-A-quality-signoff.md`                              | Q1 manual diff · Q2 `check:money-formula-citations` | `[ ]` 0-A-write 후    |
| `P0-0/money-formula-merge.md`                              | `MONEY_CONSERVATION_FORMULA.md` commit sha          | `[ ]` 0-A-close 후    |

**역추출 SSOT (0-A-write 산출):** [`docs/SSOT/MONEY_CONSERVATION_FORMULA.md`](../SSOT/MONEY_CONSERVATION_FORMULA.md)

**0-A-read 판정:** 일치 → 0-A-write(역추출) 진행 허용 · P0-0 Σ DoD 인용은 **0-A-close**까지 금지
