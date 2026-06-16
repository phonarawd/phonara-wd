# PHONARA Engine Wave-S5 · In-Play LOCK

> **상태:** LOCK DRAFT · **EXECUTE 0** — S4 GREEN + **LEGAL in-play clearance** ([`PHONARA_SPORTSBOOK_LEGAL_GATE.md`](PHONARA_SPORTSBOOK_LEGAL_GATE.md) §5)  
> **Scope:** live odds · suspend on event · live place branch · WS fanout · **bar B6**

---

## 아키텍처

```text
[Vendor live WS: scores|status|odds]
  → ingest (S2 worker extended)
  → fixture status live + market suspend flags
  → rpc_place_sports_bet live branch (delay window · suspend check)
  → optional WS gateway → client odds tick (display only)
```

---

## 산출물

| 산출 | 경로 |
|------|------|
| migration | `sports_markets.suspended_at` · live place config |
| RPC | `rpc_place_sports_bet` live branch · `rpc_get_live_fixture_state` |
| ingest | B2 scores/status · B4 oddsWs payload shape |
| SQL test | `supabase/tests/sportsbook_inplay_place_test.sql` |

---

## i18n

`sports.live.suspended` · `sports.live.goal_lock` · `sports.errors.live_closed`

---

## LOCK Footer

| # | 규칙 |
|---|------|
| F1 | goal/red card → **suspend window** ms LOCK에 숫자 고정 |
| F2 | live place **re-quote** server-side · stale reject |
| F3 | prematch bets at kickoff → **reject new prematch** · open slips policy LOCK |
| F4 | LEGAL in-play clearance **날짜 기록** |
| F5 | presentation ticker **≠** live tradable odds (same hook, label i18n) |

**FAIL =** live place without suspend · LEGAL skip · client-only live odds

---

## Suspend pseudo (LOCK 고정)

```typescript
onEvent({ type: 'goal' | 'red_card' | 'var' }) {
  suspendMarkets(fixtureId, durationMs: 8000); // EXECUTE: operator tune
  rejectPlaces(fixtureId, until: now + durationMs);
}
```

참고: B2 · B4 · A3 api-lv

---

## EXECUTE

| Step | 작업 |
|------|------|
| 0 | S4 GREEN · LEGAL in-play clearance |
| 1 | vendor live channel enable (V2 or V1 scores) |
| 2 | market suspend columns + ingest |
| 3 | live branch place RPC + tests |
| 4 | negative: place during suspend · stale live odds |
| 5 | optional WS fanout to web (server auth) |
| 6 | advisor 0 ERROR |
| 7 | §GREEN full block |

---

## §GREEN self-check (Step 7 · full block)

```bash
rg "live|suspend" supabase/migrations/*wave_s5*
test -f supabase/tests/sportsbook_inplay_place_test.sql

supabase db reset
bun run test:sql -- supabase/tests/sportsbook_inplay_place_test.sql

rg "in-play|inplay" docs/PHONARA_SPORTSBOOK_LEGAL_GATE.md
# clearance must be dated in S5 LOCK header when EXECUTE

rg "[\u4e00-\u9fff]" docs/PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md
```

**FAIL =** place accepted during suspend test · in-play without LEGAL date · B6 bar claimed without live channel

---

## §GREEN template

```text
Wave-S5 GREEN
- live ingest: [vendor channel]
- suspend window: [N ms]
- inplay place tests: PASS
- LEGAL in-play ref: [date]
- bar B6 met
```

---

## Defer

- Bet Builder
- cashout
- 200+ markets (B7)

---

## paste adapter memo

- Live UI wire after S5 GREEN · mock live odds **0**
- [`LOVABLE_SPORTSBOOK_UI_LOCK.md`](LOVABLE_SPORTSBOOK_UI_LOCK.md) live tab gate

---

## 참고 Tier

B2 · B4 · B5 · A3 live · C1

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |

---

*EXECUTE 0 until S4 GREEN + LEGAL in-play cleared*
