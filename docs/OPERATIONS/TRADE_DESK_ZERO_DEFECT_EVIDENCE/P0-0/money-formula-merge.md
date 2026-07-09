# P0-0 · Money Formula Merge Record

> **0-A-write 산출:** SSOT doc + E0 evidence 슬롯

---

## Merged artifacts

| 항목             | Path                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| **Formula SSOT** | `docs/SSOT/MONEY_CONSERVATION_FORMULA.md`                                     |
| 0-A-read         | `docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/0-A-read-checklist.md`  |
| 0-A-quality      | `docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/0-A-quality-signoff.md` |
| L1 gate script   | `scripts/check-money-formula-citations.ts`                                    |
| package.json     | `check:money-formula-citations`                                               |

---

## Commit

| 필드              | 값                              |
| ----------------- | ------------------------------- |
| Branch            | (session branch — push 시 기록) |
| Commit SHA        | (push 후 갱신)                  |
| Agent Implemented | 2026-07-07                      |
| Operator Verified | `[ ]`                           |

---

## 0-A-close (P0-0 gate · L1 승격)

| #   | 게이트                     | 명령                                                  | 결과                   |
| --- | -------------------------- | ----------------------------------------------------- | ---------------------- |
| C1  | 0-A-quality Q1 manual diff | 본 디렉터리 `0-A-quality-signoff.md`                  | `[x]` agent 2026-07-07 |
| C2  | 0-A-quality Q2 citations   | `bun run check:money-formula-citations`               | `[x]` green 2026-07-07 |
| C3  | DoD #0·#3 doc↔code sync    | `tests/scripts/check-money-formula-citations.test.ts` | `[x]` vitest 5/5       |
| C4  | SSOT reference hygiene     | `bun run check:ai-reference`                          | `[x]` green 2026-07-07 |

**CI:** `.github/workflows/ci.yml` quality job — `check:money-formula-citations` (L1 post-L9 → **P0-0 필수**)

---

## DoD #0 품질 (P0-0 close)

| DoD                  | 상태                                |
| -------------------- | ----------------------------------- |
| 0-A-read (분기 포함) | `[x]` 일치                          |
| 0-A-write merged     | `[x]`                               |
| 0-A-quality Q1       | `[x]` agent · operator `[ ]`        |
| 0-A-quality Q2       | `[x]` citations green               |
| **0-A-close**        | **`[x]` impl** 2026-07-07           |
| P0 unlock            | **허용** (P0-0 money SSOT baseline) |
