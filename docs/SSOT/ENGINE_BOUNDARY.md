# Engine Boundary — Phase R 엔진 보호 영역

> **상태:** Engine Apex **`[x] DONE` (2026-07-03)** — [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)  
> **Phase R intent:** v5 Demolition 이후 pre-demolition UI wiring 경로는 not active  
> **Generated UI wiring docs:** v5 Demolition Batch 11에서 삭제됨. Phase R에서 새 manifest model 재정의.

## 원칙

Phase R rebuild는 엔진·DB·RPC·hook 동작과 signature를 보존한다. Pre-demolition page controller와 UI wiring 경로는 v5 Demolition에서 삭제되었으며 현재 active target이 아니다.

- UI는 controller/hook/RPC **display value**만 표시
- money · odds · PnL · fee · margin · payout · settlement **client-side 재계산 금지**
- contract에 없는 값 → engine 수정 없이 UI에 표시하지 않음 ([`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md))

---

## 절대 보호 경로

| 경로                                              | 역할                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `supabase/**`                                     | migrations · RLS · RPC                                                                            |
| `supabase/functions/**`                           | Edge orchestration (cron workers · PG webhook · crypto broadcast) — deploy는 migration과 **별도** |
| `packages/money/**`                               | Decimal money                                                                                     |
| `packages/game-engine/**`                         | casino/game logic                                                                                 |
| `packages/trading-engine/**`                      | trading                                                                                           |
| `packages/sportsbook-engine/**`                   | sportsbook                                                                                        |
| `packages/wallet-ledger/**`                       | ledger                                                                                            |
| `apps/web/src/features/**/use-*-page-controller*` | pre-demolition page controllers — deleted, not active                                             |
| `apps/web/src/contracts/**`                       | surviving display/engine contracts                                                                |
| `apps/web/src/hooks/use-trading.ts`               | trading hooks                                                                                     |
| `apps/web/src/hooks/use-wallet.ts`                | wallet hooks                                                                                      |
| `apps/web/src/lib/rpc.ts` · `lib/supabase.ts`     | RPC client                                                                                        |
| `packages/i18n/**`                                | locale — key **delete/rename 금지**, add-only                                                     |

Single Supabase project: `yocjhjsdwoijfdrehzoq` only.

---

## Package scope (pre-demolition 기록 · not active)

| Package                            | U-phase treatment                                  |
| ---------------------------------- | -------------------------------------------------- |
| **`packages/ui`**                  | v5 Demolition에서 삭제됨 — 현재 active target 아님 |
| **`packages/game-ui`**             | v5 Demolition에서 삭제됨 — 현재 active target 아님 |
| **`apps/web/src/components/ui/*`** | v5 Demolition에서 삭제됨 — 현재 active target 아님 |

Phase R에서 shared UI package, game UI package, paste zone 여부를 새로 결정한다.

---

## Presentation rebuild 허용 (Phase R TBD)

- Pre-demolition paths below were deleted and are not current implementation targets:
  - `apps/web/src/ui/**`
  - `apps/web/src/components/shell/**`
  - `apps/web/src/theme.css` · `ui/design/**`
  - `apps/admin/src/ui/**`
- Game **screen** UI: bet controls · HUD · history · auto bet UX · loading/empty/error (engine wiring은 보존)

---

## Controller-view freeze

- compile-time hook/contract parity helper: `apps/admin/src/contracts/controller-view-freeze.ts` (`FreezeControllerView`)
- pre-demolition `apps/web/src/contracts/` and `page-controller-view-shapes.ts` are deleted/not active
- Phase R rebuild 중 surviving engine hooks/RPC contract 변경 금지
- 새 display field 필요 시 → **별도 operator-approved engine work** (UI reset 범위 밖)

Account/onboarding controller freeze 기록은 pre-demolition history다. Phase R에서 새 bridge/contract model을 정의한다.

---

## Auto Bet boundary

- `CasinoPageControllerView`: `autoBet()` pipeline · `available` balance
- `useAutoBetQueue`: session UI state (remaining · cumulativeProfit · firesPlaced) — **ui-only-local**, ledger drive 금지
- Rebuild UI는 hook stats 표시 가능; payout/balance **재계산 불가**

---

## Wiring 변경 시

1. **즉시 중단** — engine freeze 위반 여부 확인
2. Phase R bridge/contract plan 확인
3. Deleted generated UI SSOT docs를 복구하지 않음
4. money path touched → local `db reset` · `test:sql` · `stack:push-remote` · advisor 0 (operator/CI)

---

## Safe legacy component rule (casino/games)

- engine wiring 포함 legacy component → **wiring 보존**, presentation만 rebuild
- 그 외 → in-place replace
- reuse 필수 시 → [`DECISION_LOG.md`](DECISION_LOG.md)에 wiring 사유 기록

---

## Engine Wave defer (Trade Desk · post-L9 · v6 L4)

> **출시 차단 아님.** defer slice 착수 = 본 표 ADR **Accepted** + [`TRADE_DESK_MIGRATION_VERIFICATION.md`](../OPERATIONS/TRADE_DESK_MIGRATION_VERIFICATION.md) P4-D 승인.  
> **원칙:** 1 ADR = 1 Engine Wave slice · migration 무단 착수 **FAIL** (`engine-p0-no-migration`).

| Slice                      | 티어               | ADR                                                                 | SSOT / 근거                                                            | Launch RC substitute                     |
| -------------------------- | ------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| Synthetic → Real CLOB      | Engine Wave        | [005](../PRODUCT/ADR/005-engine-wave-clob-defer.md)                 | [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md) · P2-D disclosure/ack         | house fill · synthetic book              |
| Tier APY 표시↔정산 accrual | Engine Wave **E4** | [006](../PRODUCT/ADR/006-engine-wave-tier-accrual-defer.md)         | [`ENGINE_GAP_ADR.md`](../PRODUCT/ADR/ENGINE_GAP_ADR.md) E4 · P0-4/P1-C | `tierError` → claim blocked              |
| Accounting Invariant full  | Engine Wave        | [007](../PRODUCT/ADR/007-engine-wave-accounting-invariant-defer.md) | [`MONEY_CONSERVATION_FORMULA.md`](MONEY_CONSERVATION_FORMULA.md) §2    | Wallet Conservation (GRAND_TOTAL) only   |
| DB TX Race deep audit      | Engine Wave        | [008](../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md)           | S0 Race 3분류 · `oi_cap_race_test.sql` · position OI cap migration     | S0 UI/RPC idempotency · baseline SQL pin |

**S0 명시 (non-waivable):** S0 PASS = UI Race + RPC Race 검증 — **DB Transaction Race deep audit 미포함** ([`008`](../PRODUCT/ADR/008-engine-wave-db-tx-race-defer.md)).

**UX-only (Engine Wave 아님):** Tablet 768 · swipe — Trade Desk P2.

---

## 교차 참조

> Phase별 evidence report와 Batch 11 rebuild scope 문서는 워킹트리에서 삭제됨 (2026-07-04 정리 — 원문 git history). 상태·게이트 수치 = closeout 단일 참조.

- Engine Apex master closeout (유일 상태 정본): [`ENGINE_APEX_CLOSEOUT.md`](../ENGINE_APEX_CLOSEOUT.md)
- Operator gates: [`OPERATOR_GATES.md`](OPERATOR_GATES.md)
- Closed Beta readiness (prod rehearsal deferred): [`ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md`](../ENGINE_CLOSED_BETA_SCENARIO_MATRIX.md) · `closed_beta_readiness_test.sql` · prep `[x]` · prod exit operator-only
- Phase R 실행: [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) → 승인된 Phase R 플랜
