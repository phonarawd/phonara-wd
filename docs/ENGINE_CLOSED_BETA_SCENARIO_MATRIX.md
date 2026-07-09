# Closed Beta — Scenario Matrix (Engine Readiness)

> **상태:** 실제 돈 리허설 **보류 (DEFERRED)** — operator가 준비 완료를 명시하기 전까지 prod rehearsal 금지  
> **Plan todo:** `p6-closed-beta-money-rehearsal`  
> **증거:** `ENGINE_PHASE6_CLOSED_BETA_READINESS_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history · 상태 정본 [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md))

## 활성화 조건 (operator)

Closed Beta / prod real-money rehearsal를 시작하려면 **아래를 모두** 충족해야 한다.

1. 본 문서와 evidence report 검토 완료
2. 허용 계정 allowlist · currency별 상한 · feature gate 설정 (아래 Beta scope)
3. operator 채팅에 **명시적 승인** (예: 「Closed Beta gate 실행」)
4. L5–L8 gate ladder green — [`SSOT/OPERATOR_GATES.md`](SSOT/OPERATOR_GATES.md)
5. rollback / `system_readonly` 절차 숙지 — [`RUNBOOK.md`](RUNBOOK.md) emergency 섹션

**금지:** prod ledger tamper로 reconciliation mismatch 리허설 · 대규모 open access · operator 승인 없는 실제 입출금

---

## Beta scope (착수 시 operator 설정)

| 항목      | 의도                                                                              |
| --------- | --------------------------------------------------------------------------------- |
| 허용 계정 | 내부 operator + 지정 테스트 사용자만                                              |
| 허용 금액 | currency별 상한 — `app_config` 또는 risk config                                   |
| 허용 기능 | 소액 deposit · withdrawal request · casino/sports small stake · 제한 spot/futures |
| 금지      | 무제한 leverage · 대량 알림 · 외부 광고 유입 · prod reconciliation tamper         |

---

## Scenario matrix

로컬 SQL / E2E로 엔진 안전성을 **미리** 검증한다. prod rehearsal 전에 아래 `status=ready` 행의 gate가 green이어야 한다.

| scenario_id | domain         | path                                     | precondition                                   | action                                      | expected_db_state                                    | expected_rpc_response                               | expected_ops_event                       | test_file                                                                                                                                                             | status |
| ----------- | -------------- | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| CB-01       | deposit        | KRW/USDT ingest → ledger credit → notify | feature deposit enabled · matched transfer row | PG webhook or crypto watcher credits wallet | wallet_ledger append · Σ=0 · hash-chain intact       | stable success / idempotent replay                  | `ops.deposit.*` (if configured)          | `bank_pg_webhook_e1b_test.sql` · `crypto_hd_deposit_test.sql` · `phase5_deposit_test.sql` · `p0_edge_contracts_test.sql`                                              | ready  |
| CB-02       | withdrawal     | request → review → broadcast → settle    | approved withdrawal · claim worker             | claim batch → sign/broadcast → mark         | withdrawal status transition · no duplicate tx hash  | claim empty on replay · mark idempotent             | `ops.withdrawal.*` via `edge_ops_events` | `phase5_withdrawal_test.sql` · `krw_phon_withdrawal_test.sql` · `p0_edge_contracts_test.sql`                                                                          | ready  |
| CB-03       | casino         | bet → settle → reveal → verifier         | funded wallet · game enabled                   | place bet RPC → settle                      | conservation Σ=0 · seed hash/reveal                  | stable game error codes on cap/RG                   | optional casino ops events               | `conservation_test.sql` · `casino_parity_test.sql` · `casino_security_test.sql` · E2E `casino.spec.ts`                                                                | ready  |
| CB-04       | sportsbook     | place → snapshot odds → settle/void      | fixture open · sports enabled                  | place → settle or void RPC                  | global zero per currency · exposure within cap       | stale/duplicate rejected                            | sports ingest health                     | `sportsbook_place_conservation_test.sql` · `sportsbook_settle_conservation_test.sql` · `sportsbook_void_conservation_test.sql` · `sportsbook_place_negative_test.sql` | ready  |
| CB-05       | price_feed     | stale / provider outage                  | oracle sources configured                      | feed cron · degraded provider               | `provider_health` row · ops alert threshold          | stable HTTP error · no secret leak                  | `ops.<domain>.*` in `edge_ops_events`    | `oracle_feed_test.sql` · `edge_observability_test.sql` · `ops_alerts_test.sql`                                                                                        | ready  |
| CB-06       | reconciliation | mismatch detection (no prod tamper)      | local SQL or staging branch only               | run reconciliation RPC on known-good state  | `reconciliation_log` all match · hash-chain 0 broken | readonly trigger on mismatch (critical threshold 1) | critical ops alert                       | `solvency_reconciliation_test.sql` · `system_account_reconciliation_test.sql` · `closed_beta_readiness_test.sql`                                                      | ready  |

---

## Beta exit criteria (prod rehearsal DONE 판정)

> **엔진 prep `[x] DONE`.** 아래 checklist는 **prod real-money rehearsal 후 operator/CI 판정** — 엔진 구현 큐 아님 (E8 · operator 승인 전 blocked).

operator/CI가 prod rehearsal 후 아래를 확인한다.

- [ ] prod `reconciliation_log` all match (wallet · system · global_zero)
- [ ] notification 유실 0 — claim/complete two-phase · no silent `sent`
- [ ] withdrawal duplicate broadcast 0 — claim single-flight
- [ ] provider failure → stable ops alert + `provider_health` / `edge_ops_events`
- [ ] operator가 exception queue를 1인 운영 절차로 처리 가능
- [ ] rollback 또는 `system_readonly` 전환 절차 실행 리허설 완료 (staging/local)

---

## Readiness inventory test

엔진 prerequisite만 고정 (실제 돈 이동 없음):

```text
supabase/tests/closed_beta_readiness_test.sql
```

Operator gate (L5): `supabase db reset` → `bun run test:sql` — **99/99** green (2026-07-03 · Post-Apex 정본).

---

## Defer 사유

- operator 환경(allowlist · PG/crypto prod keys · 소액 cap) 미준비
- ~~Phase 8 final engine gates (`p6-final-gates`)~~ — **[x] DONE** (2026-07-03) `ENGINE_PHASE8_FINAL_GATES_EVIDENCE_REPORT.md` (2026-07-04 삭제 — git history)
- prod real-money rehearsal는 irreversible audit 이벤트 — 명시 승인 전 자동 착수 금지

---

## 교차 참조

- Engine phases 0–8 evidence: `docs/ENGINE_PHASE*_EVIDENCE_REPORT.md` · master [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md)
- P0 edge · Ops dashboard contract · Edge observability evidence report는 2026-07-04 삭제 — git history · 수치 정본 [`ENGINE_APEX_CLOSEOUT.md`](ENGINE_APEX_CLOSEOUT.md)
- Operator gates: [`SSOT/OPERATOR_GATES.md`](SSOT/OPERATOR_GATES.md)
