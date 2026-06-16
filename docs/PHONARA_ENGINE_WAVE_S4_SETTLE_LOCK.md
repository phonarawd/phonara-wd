# PHONARA Engine Wave-S4 · Settle / Void LOCK

> **상태:** LOCK DRAFT · **EXECUTE 0** — S3 GREEN  
> **Scope:** FT result ingest · `rpc_settle_sports_fixture` · `rpc_void_sports_market` · payout/refund · **Σ=0**  
> **MVP 완료 bar:** prematch 토토 **B5** ([`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §2)

---

## 아키텍처

```text
[Vendor scores/status or manual Admin]
  → settle worker or rpc_settle_sports_fixture (service_role)
  → per leg: won|lost|void|push
  → wallet credit payout OR full refund
  → sports_bets.status terminal
  → ledger audit row
```

---

## 산출물

| 산출 | 경로 |
|------|------|
| RPC | `rpc_settle_sports_fixture` · `rpc_void_sports_market` |
| cron/queue | unsettled fixture scanner |
| SQL test | `supabase/tests/sportsbook_settle_conservation_test.sql` |
| Admin | exception queue UI hook (read-only until admin wire) |

---

## i18n

`sports.errors.settle.*` · `sports.bet.status.won|lost|void|pending`

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | every settle/refund path **Σ=0** per currency |
| F2 | void → **full stake refund** · partial void leg rules LOCK에 표 |
| F3 | **service_role** settle · user RPC settle **금지** |
| F4 | idempotent settle replay → no double payout |
| F5 | audit log row **필수** (admin manual void) |
| F6 | result source: vendor feed **or** Admin with reason |

**FAIL =** double payout · unbalanced ledger · user-callable settle RPC

---

## Leg result rules (prematch MVP)

| Leg result | Bet impact |
|------------|------------|
| won | combo continues |
| lost | bet lost · stake consumed |
| void | leg treated as 1.0 odds (push) or whole bet void if policy LOCK |
| push (OU exact) | per market rules · document in migration comment |

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | S3 GREEN |
| 1 | RED: `sportsbook_settle_conservation_test.sql` |
| 2 | settle + void RPC |
| 3 | won path payout · Σ=0 |
| 4 | void/refund path · Σ=0 |
| 5 | idempotent replay test |
| 6 | unsettled > kickoff + 24h → admin queue flag |
| 7 | advisor 0 ERROR |
| 8 | §GREEN full block |

---

## §GREEN self-check (Step 8 · full block)

```bash
rg "rpc_settle_sports_fixture|rpc_void_sports_market" supabase/migrations/
test -f supabase/tests/sportsbook_settle_conservation_test.sql

supabase db reset
bun run test:sql -- supabase/tests/sportsbook_settle_conservation_test.sql
bun run test:sql -- supabase/tests/sportsbook_place_conservation_test.sql

rg "SECURITY DEFINER" supabase/migrations/*wave_s4* -A2 | rg "auth.uid" 
# settle must NOT be open to anon without admin check

rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md
```

**FAIL =** settle conservation fail · void without refund · missing audit on manual void

---

## §GREEN template

```text
Wave-S4 GREEN
- prematch settle/void: PASS
- conservation place+settle: PASS
- MVP prematch 토토 engine bar: B1–B5 met
- NEXT: S5 in-play OR product launch prep
```

---

## Defer

- cashout / partial cashout
- auto result without vendor (manual only until feed confirmed)
- sports affiliate GGR (Wave-2)

---

## paste adapter memo

- Bet history UI reads settled status from RPC · no client recompute payout

---

## 참고 Tier

A2 [betradar-uof-service](https://github.com/gdszyy/betradar-uof-service) settlement parser · A3 snapshot parity

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |

---

*EXECUTE 0 until S3 GREEN*
