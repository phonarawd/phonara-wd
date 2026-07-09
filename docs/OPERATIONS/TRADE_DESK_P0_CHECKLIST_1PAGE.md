# Trade Desk P0 — 구현자 1페이지 체크리스트 (D1)

> **대상:** 구현자 · 신규 합류자  
> **정본:** Cursor Plan `trade_desk_qa_audit` · **본 문서는 마스터 플랜 대체 아님** — 링크만  
> **선행:** P0-0 `0-A-close` 완료 후 P0 착수 ([`P0-0/money-formula-merge.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/money-formula-merge.md))

---

## Preflight (매 티어)

```powershell
git status
rg "spot-desk-page|futures-desk-page|staking-hub" apps/web/src
bun run check:phase-r-guards -- --strict
```

**금지:** parallel `-page` · duplicate hook · `supabase/migrations` 신규 (엔진 freeze · P4-D 승인 없음)

---

## P0-0 — Money SSOT (P0 착수 gate)

| 단계            | 산출                                                                               | E0                                                                                      | 체크                            |
| --------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| **0-A-read**    | assert read-only 대조 · 불일치 분기                                                | [`0-A-read-checklist.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/0-A-read-checklist.md)   | `[x]`                           |
| **0-A-write**   | [`MONEY_CONSERVATION_FORMULA.md`](../SSOT/MONEY_CONSERVATION_FORMULA.md) + mermaid | merge sha                                                                               | `[x]`                           |
| **0-A-quality** | Q1 manual diff + Q2 citations                                                      | [`0-A-quality-signoff.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/0-A-quality-signoff.md) | `[x]` agent · Q1 operator `[ ]` |
| **0-A-close**   | DoD #0·#3 · `check:ai-reference`                                                   | [`money-formula-merge.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/P0-0/money-formula-merge.md) | `[x]`                           |

**Σ DoD 인용:** 0-A-close 전 **금지** · flat position only assert ([`MONEY_CONSERVATION_FORMULA.md`](../SSOT/MONEY_CONSERVATION_FORMULA.md))

---

## P0-1~4 — Silent → Visible

| ID       | 항목                 | testid / 핵심            | DoD 한 줄                                     | 체크       |
| -------- | -------------------- | ------------------------ | --------------------------------------------- | ---------- |
| **P0-1** | Fetch error UI       | `trade-desk-fetch-error` | fetch fail blank 0 · retry → refetch 3종      | `[x]` impl |
| **P0-2** | Staking wallet error | `staking-wallet-error`   | wallet fail → 0원 표시 0 · retry refetch      | `[x]` impl |
| **P0-3** | Mobile CTA 사유      | sticky CTA               | disabled 이유 100% visible                    | `[x]` impl |
| **P0-4** | Tier error + claim   | tier fail                | bronze lie 0 · claim disabled · **E2E no-tx** | `[x]` impl |

**P0 마감 게이트:**

- [x] P0-0 merged
- [x] P0-1~4 vitest + P0-4 E2E
- [x] S0 security-auditor PASS
- [x] `gate:ai-impl` · `typecheck` · `check:i18n`

**P0 완료 선언 금지:** P0-0 미완 · P0-4 E2E 미구현 · S0 red

---

## S0 — 보안 (P0 직후 · P1/P2 병렬)

| 범위        | 검증                                    | 체크         |
| ----------- | --------------------------------------- | ------------ |
| A 정보 노출 | error UI raw RPC/stack 0                | `[x]`        |
| B RLS/GRANT | cross-user reject                       | `[x]` CI sql |
| C 동시성    | duplicate idempotency · UI double-click | `[x]`        |

**범위 밖 (명시):** DB TX Race = Engine Wave defer ([ADR-008](../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md)) — S0 통과 ≠ DB TX deep audit

**증거:** [`S0/security-auditor-delta.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/S0/security-auditor-delta.md)

---

## E0 슬롯 (티어 마감 시 채움)

| 티어  | 경로                  | 필수 증거                            |
| ----- | --------------------- | ------------------------------------ |
| P0-0  | `P0-0/`               | read · quality · merge sha           |
| P0    | `P0/`                 | `gate:ai-impl` · P0-4 E2E CI URL     |
| S0    | `S0/`                 | auditor delta · idempotency negative |
| P1~P3 | 동명                  | vitest · perf · soak · axe           |
| P4    | `P4/`                 | rollback dry-run · failure matrix    |
| L9    | `L9/` + `ops-window/` | Release Approval 3단계               |

**인덱스:** [`TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md`](TRADE_DESK_ZERO_DEFECT_EVIDENCE/README.md)

---

## Implemented closeout (로컬)

```powershell
bun run gate:ai-impl -- --test <owner-vitest-path>
git push origin <branch>
bun run ci:status
```

Heavy (sql · e2e · check:full) = **GitHub CI only** (G13 · [`CI_GATE_AUTHORITY.md`](../SSOT/CI_GATE_AUTHORITY.md))

---

## 교차 참조

- Release/operator: [`TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md`](TRADE_DESK_RELEASE_CHECKLIST_1PAGE.md)
- Incident: [`TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md`](TRADE_DESK_OPERATOR_INCIDENT_1PAGE.md)
- Launch RC: [`TRADE_DESK_LAUNCH_RC_SIGNOFF.md`](TRADE_DESK_LAUNCH_RC_SIGNOFF.md)
