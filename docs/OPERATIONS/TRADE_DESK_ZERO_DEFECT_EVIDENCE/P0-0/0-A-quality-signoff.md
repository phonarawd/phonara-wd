# P0-0 · 0-A-quality Signoff (F1 · L1 승격)

> **게이트:** Q1 manual diff + Q2 `check:money-formula-citations` **모두** green  
> **날짜:** 2026-07-07

---

## Q1 — Manual diff (GRAND_TOTAL 수식 ↔ SQL assert)

**한 줄 대조:**

| 소스                    | GRAND_TOTAL(c) 한 줄                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Formula SSOT**        | `Σ wallets(available_c+locked_c) + Σ system_accounts.balance WHERE currency=c`                                           |
| **SQL L64–69 (before)** | `(SUM(phon_available+phon_locked) FROM wallets) + (SUM(balance) FROM system_accounts WHERE currency='PHON')` · USDT 동형 |
| **SQL L91–97 (assert)** | `v_phon_total_after = v_phon_total_before` · `v_usdt_total_after = v_usdt_total_before`                                  |

**대조 결과:** 수식 구조 **일치** · 통화별 독립 assert **일치** · epsilon 0 **일치**

| #   | 검증                                     | 결과 |
| --- | ---------------------------------------- | ---- |
| Q1a | PHON 열 = `phon_available + phon_locked` | ✅   |
| Q1b | USDT 열 = `usdt_available + usdt_locked` | ✅   |
| Q1c | system_accounts currency filter          | ✅   |
| Q1d | after = before (no tolerance)            | ✅   |

### Q1 서명

| 역할                   | 상태                        | 날짜       | 비고                |
| ---------------------- | --------------------------- | ---------- | ------------------- |
| Agent Implemented      | `[x]` manual diff 기록 완료 | 2026-07-07 | 본 문서 Q1a–Q1d     |
| Operator / QA Verified | `[ ]`                       | —          | L9 QA 체크박스 연동 |

---

## Q2 — Automated citations (`check:money-formula-citations`)

| #   | 검증                                | 명령                                                                  | 결과                   |
| --- | ----------------------------------- | --------------------------------------------------------------------- | ---------------------- |
| Q2  | path:line 존재 + GRAND_TOTAL 키워드 | `bun run check:money-formula-citations`                               | `[x]` green 2026-07-07 |
| Q2b | lib + vitest drift guard            | `bun run test -- tests/scripts/check-money-formula-citations.test.ts` | `[x]` 5/5 2026-07-07   |

**CI:** GitHub Actions `quality` job — `check:money-formula-citations` 포함 · `check:engine-demolition:light` 동일

---

## L9 QA Verified (post-P0-0 필수 체크박스)

- [ ] Q1 manual diff 서명 완료 (operator)
- [x] Q2 citations green (agent local + CI)
