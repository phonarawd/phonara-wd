# P0-0 · 0-A-read Checklist

> **작업:** assert 라인 read-only 대조 (역추출 전 검증)  
> **날짜:** 2026-07-07  
> **대조 기준:** 플랜 §0-A 초안 ↔ baseline assert 파일 (**수정 금지**)  
> **E0 인덱스:** [`../README.md`](../README.md)

---

## 1. GRAND_TOTAL 수식 대조

| #   | §0-A 정의                                      | 코드 assert                                                                                              | 일치 |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---- |
| R1  | `Σ wallets (available_c + locked_c)`           | `conservation_test.sql` L64–69: `SUM(phon_available + phon_locked)`, `SUM(usdt_available + usdt_locked)` | ✅   |
| R2  | `+ Σ system_accounts.balance WHERE currency=c` | L66, L68: `SUM(balance) FROM system_accounts WHERE currency='PHON'/'USDT'`                               | ✅   |
| R3  | 통화별 독립 assert                             | L91–97: `v_phon_total_after = v_phon_total_before` · USDT 동일                                           | ✅   |
| R4  | E2E helper 동일 수식                           | `wallet-money.ts` L269–284: wallets CTE + system_accounts CTE → sum                                      | ✅   |
| R5  | E2E before/after exact equality                | `trade-desk-smoke.spec.ts` L128–150 (spot) · L190–226 (futures flat) · L255–301 (stake+claim)            | ✅   |

**SQL 헤더 주석 (L9–12):** `GRAND TOTAL per currency = Σ(wallets.available + wallets.locked) + Σ(system_accounts.balance)` — §0-A와 동형 ✅

---

## 2. Epsilon · flat-only · 제외 항목

| #   | §0-A                                  | 코드/테스트                                                                              | 일치 |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------- | ---- |
| R6  | SQL epsilon **0** (NUMERIC exact)     | `conservation_test.sql` L91–97 `ASSERT ... = ...` (no tolerance)                         | ✅   |
| R7  | E2E **0 at 6dp** string equality      | `wallet-money.ts` L282–283 `to_char(..., '...0.000000')` · smoke `toBe(before.*)`        | ✅   |
| R8  | Futures Σ assert **close 후** (flat)  | `conservation_test.sql` L81 `rpc_close_futures_position` 후 snapshot · smoke E4 L190–226 | ✅   |
| R9  | Open position 중간 스냅샷 **범위 외** | assert 코드에 open-only Σ 검증 **없음** (의도적 · R2)                                    | ✅   |
| R10 | deposit/withdraw **범위 외**          | `conservation_test.sql` L14–15 주석 · 테스트 시퀀스에 deposit/withdraw 없음              | ✅   |

---

## 3. 불일치 분기 (F4)

| 결과                        | 조건                         | 액션                                                        | 본 세션  |
| --------------------------- | ---------------------------- | ----------------------------------------------------------- | -------- |
| **일치**                    | R1–R10 전부 ✅               | → **0-A-write 진행** (역추출)                               | **해당** |
| **불일치 — §0-A 문서 오류** | 코드 assert 정본 · §0-A 틀림 | §0-A를 코드에 맞게 수정 후 write                            | —        |
| **불일치 — 코드 버그 의심** | §0-A·플랜 정본 · assert FAIL | **P0-0 중단** · operator 이슈 · engine fix = P4-D 승인 체계 | —        |
| **불일치 — 의도적 drift**   | baseline assert 수정 제안    | **금지** — 문서만 정본화                                    | —        |

**판정:** **일치** — `MONEY_CONSERVATION_FORMULA.md` 역추출(0-A-write) 진행 허용.

---

## 4. Read-only 확인 서명

| 역할              | 판정                      | 날짜       |
| ----------------- | ------------------------- | ---------- |
| Agent Implemented | R1–R10 ✅ · 분기 **일치** | 2026-07-07 |
| Operator Verified | `[ ]`                     | —          |
