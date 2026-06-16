# PHONARA Sportsbook E2E Matrix — Planning → EXECUTE

> **단계:** Planning spec · Playwright 구현은 **S3 GREEN 후** (prematch) · S4/S5 확장  
> **실행 주체:** spec 파일·E2E = **Cursor only** · UI scenario = Lovable paste 후 Cursor wire  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) §0.1

---

## 0. Scope (1줄)

스포츠북 money path **브라우저 + local Supabase** 검증 시나리오 표 — conservation은 **DB Σ=0** assert.

---

## 1. 실행 게이트

| Gate | 시점 |
|------|------|
| Local Supabase + `bun run test:e2e` wrapper | all specs |
| S2 ingest seed fixture | prematch odds specs |
| S3 `rpc_place_sports_bet` | place specs |
| S4 settle RPC | settle specs |
| S5 live | in-play specs · **defer** |

**FAIL =** E2E without DB conservation assert on money specs

---

## 2. Spec 파일 (예정 · EXECUTE 시 생성)

| Spec | 경로 (예정) | Wave |
|------|-------------|------|
| prematch smoke | `tests/e2e/sports-prematch-smoke.spec.ts` | S3 |
| place + conservation | `tests/e2e/sports-place-conservation.spec.ts` | S3 |
| RG negative | `tests/e2e/sports-rg-negative.spec.ts` | S3 |
| settle payout | `tests/e2e/sports-settle-conservation.spec.ts` | S4 |
| void refund | `tests/e2e/sports-void-refund.spec.ts` | S4 |
| in-play suspend | `tests/e2e/sports-inplay-suspend.spec.ts` | S5 |
| i18n en mode | `tests/e2e/sports-i18n-en.spec.ts` | UI |

---

## 3. 시나리오 매트릭스

### 3.1 Prematch smoke (S3 · P0)

| ID | Steps | Assert |
|----|-------|--------|
| E1 | login → `/sports` | fixture list visible |
| E2 | open fixture | 1X2 + OU markets |
| E3 | add leg to slip | slip count |
| E4 | enter stake · confirm | success toast · bet id |
| E5 | DB | `sports_bets` row · wallet locked delta |

### 3.2 Conservation (S3 · P0 · money)

| ID | Steps | Assert |
|----|-------|--------|
| M1 | place single 1X2 | Σ wallet+system = 0 per currency |
| M2 | duplicate idempotency key | same bet id · no extra debit |
| M3 | insufficient balance | reject · no bet row |

### 3.3 Odds / time negative (S3 · P0)

| ID | Steps | Assert |
|----|-------|--------|
| N1 | tamper client odds | server reject `odds_changed` |
| N2 | place after kickoff | reject `kickoff_passed` |
| N3 | kill switch on | reject · no debit |

### 3.4 Combo (S3 · P1)

| ID | Steps | Assert |
|----|-------|--------|
| C1 | 2-leg combo | combined odds display from server |
| C2 | 9-leg attempt | UI/RPC reject ≤8 |

### 3.5 Settle (S4 · P0)

| ID | Steps | Assert |
|----|-------|--------|
| S1 | win single | payout credit · Σ=0 |
| S2 | lose combo | stake consumed · Σ=0 |
| S3 | void market | full refund · Σ=0 |
| S4 | duplicate settle job | no double payout |

### 3.6 Admin / security (S4 · P1)

| ID | Steps | Assert |
|----|-------|--------|
| A1 | normal user call settle RPC | 403/insufficient |
| A2 | admin void with reason | audit row |

### 3.7 In-play (S5 · defer)

| ID | Steps | Assert |
|----|-------|--------|
| L1 | live odds tick | display updates |
| L2 | suspend window | place rejected |
| L3 | after suspend | place allowed with new quote |

### 3.8 i18n / PWA (UI · P1)

| ID | Steps | Assert |
|----|-------|--------|
| I1 | locale en | no Korean visible |
| I2 | mobile viewport | slip usable · safe-area |

---

## 4. DB conservation helper (EXECUTE 패턴)

```typescript
// tests/e2e/helpers/sports-conservation.ts
// SUM(user wallets) + SUM(system accounts) per currency === 0 after place/settle
// Use delta from baseline — not absolute balance values (30-audit-discipline)
```

---

## 5. Fixture strategy

| Method | When |
|--------|------|
| ingest test league | preferred post-S2 |
| SQL test seed in spec setup | allowed if ROLLBACK / isolated user |
| hardcoded UUID in repo | **금지** (80-release-readiness) |

---

## 6. EXECUTE order

| Step | Action |
|------|--------|
| 0 | S3 GREEN |
| 1 | `sports-prematch-smoke.spec.ts` |
| 2 | `sports-place-conservation.spec.ts` |
| 3 | `sports-rg-negative.spec.ts` |
| 4 | S4 GREEN → settle specs |
| 5 | S5 GREEN → in-play spec |
| 6 | `bun run test:e2e` full · teardown per 77 |

---

## 7. §GREEN self-check (matrix complete)

```bash
test -f docs/PHONARA_SPORTSBOOK_E2E_MATRIX.md
rg "sports-prematch-smoke|sports-place-conservation" docs/PHONARA_SPORTSBOOK_E2E_MATRIX.md

# after IMPLEMENT:
# ls tests/e2e/sports-*.spec.ts
# bun run test:e2e -- tests/e2e/sports-prematch-smoke.spec.ts

rg "[\u4e00-\u9fff]" docs/PHONARA_SPORTSBOOK_E2E_MATRIX.md
```

**FAIL =** money spec without Σ=0 assert · raw playwright without wrapper · orphan ports after E2E

---

## 8. CI / hygiene

- `bun run test:e2e` only ([`77-e2e-lifecycle.mdc`](../.cursor/rules/77-e2e-lifecycle.mdc))
- post: `bun run e2e:kill` · `bun run check:hygiene`

---

## 9. Defer

- Visual regression
- Load test ingest
- Multi-browser matrix beyond chromium smoke

---

## 10. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | 초판 — scenario matrix · spec paths |

---

*Planning spec · spec files created at S3 EXECUTE*
