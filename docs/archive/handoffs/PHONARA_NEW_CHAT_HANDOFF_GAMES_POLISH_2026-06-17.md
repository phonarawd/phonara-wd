# PHONARA · 새 채팅 인계 — Games Polish L1-GP (2026-06-17)

> **용도:** 새 Cursor 채팅 **첫 메시지**에 통째로 붙여넣기 — L1-GP 12 originals UI/UX polish 이어가기  
> **정본:** `docs/PHONARA_LOVABLE_GAMES_POLISH_MASTER.md` · `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.1.5  
> **desktop master:** `PHONARA-lovable-master-prompt.md` (operator Desktop)

---

## 0. 지금 무엇을 하고 있나 (한 줄)

**Lovable canvas**에서 casino **12 originals** UI/UX를 Stake 압살 · 렉 0 · 엔진 오차 0으로 **게임 1개씩** polish 중.  
**Cursor(PHONARA repo)**는 LOCK 검토 · §GREEN 교차검증 · Lovable dispatch 프롬프트 조립 · docs 동기화만 — **paste/구현 0**.

---

## 1. 역할 · 절대 경계

| 주체 | 하는 일 | 금지 |
|------|---------|------|
| **Lovable AI** | `src/games/**` presentation · vitest canvas · Playwright §3 | PHONARA repo paste · engine/RPC · ZIP |
| **Cursor** | Plan APPROVE/REJECT · §GREEN 검증 · 프롬프트 조립 · docs | Lovable canvas 코드 작성 |
| **operator** | EXECUTE GO · §GREEN APPROVE · 「ZIP 발행 GO」 | — |

- **Engine NO-TOUCH:** `packages/game-engine/**` · `supabase/**` · `useCasinoRoundPipeline` · shared auto-bet CORE 3파일
- **ZIP:** operator 「ZIP 발행 GO」 전 **0** (`92-lovable-lock-execute.mdc`)
- **PHONARA paste:** L1 100% + ZIP GO 후 L2

---

## 2. Canvas baseline (최신)

| 항목 | 값 |
|------|-----|
| vitest | **615/615** (G#5 Roulette + amend W carry) |
| i18n | **KO=EN=2639 DIFF=0** |
| L1-GP HEAD | **G#6 Mint Reels PLAN** (G#5 Roulette ✅ §GREEN) |

---

## 3. L1-GP 큐 상태 (12 originals)

| # | Game | 상태 | 비고 |
|---|------|------|------|
| — | plinko · mines · shell | ✅ signed-off | regression only |
| G#1 | crash | ✅ **§GREEN** | Stage `withAlpha` approved · §3.1 1280+390 |
| G#2 | dice | ✅ **§GREEN** | DiceAutoSlot · 608/608 |
| G#3 | limbo | ✅ **§GREEN** | fast-ramp · §3.10 funded autobet defer |
| G#4 | hilo | ✅ **§GREEN** | outcome-leak 3 tests · §3.1 not-applicable |
| G#5 | roulette | ✅ **§GREEN + W** | G5-B1 · G5-B1-W · **G#5-C promo overflow PLAN** |
| **G#6** | **mint_reels** | **⏳ EXECUTE** | contract gap · HEAD |
| G#7 | gold_rush | PLAN | 5-reel slot |
| G#8 | blackjack | PLAN | contract gap |
| G#9 | deepshaft | PLAN | LAW 4 FULL |
| G#10 | momentum | PLAN | combo/streak |

**규칙:** G#n §GREEN 전 G#n+1 **금지**.

**LOCK:** `PHONARA_LOVABLE_GAMES_POLISH_G{1,2,3}_*_LOCK.md` · master `PHONARA_LOVABLE_GAMES_POLISH_MASTER.md`

---

## 4. 지금 할 일 (즉시)

### A) G#5 Roulette ✅ + amend W ✅ (2026-06-17)

615/615 · wc5 · §AMBER promo overflow → **G#5-C 별도 슬라이스 PLAN** ([`PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md)).

### B) G#6 Mint — EXECUTE GO (Plan APPROVED 2026-06-17)

### C) G#5-C Promo overflow — **parallel PLAN** (G#6 차단 아님)

operator 「G#5-C 프롬프트」→ Cursor dispatch.

### D) parallel (non-blocking)

L1-20 K1 · L1-16f desktop §GREEN pending

---

## 5. 매 게임 워크플로

```text
Cursor LOCK 검토 → APPROVE + EXECUTE GO
→ Lovable EXECUTE → §3 raw → §GREEN/§AMBER
→ Cursor 교차검증 → docs 갱신 → 다음 G# 프롬프트
```

### §3 blocking

- §3.1 Auto-slot **1280 AND 390**
- NO-TOUCH empty · vitest carry · i18n DIFF=0
- LAW 3 fake feed 금지

### 7 LAWS

Engine replay only · NO-TOUCH styles+engine+shared-core · no fake data · outcome-leak (Mines/Deepshaft) · perf 렉0 · autoSlot dual viewport · autobet core 유지

---

## 6. 엔진 mirror (invent 금지)

`packages/game-engine/src/games/*.ts` — `cashoutMultiplier` not `cashoutMult`

---

## 7. Cursor 트리거

- 「G#N 프롬프트」 / 「lovable 프롬프트」 → 복붙 블록
- Lovable §4 DELIVER → §GREEN 판정
- 본 문서 → 새 채팅 인계

**PHONARA `apps/web`:** placeholder only · paste 0

---

## 8. 교훈

- §3.1 dual viewport 필수
- Crash: getComputedStyle loop 금지 · color-mix withAlpha
- Dice: multiplier.ts reuse · no rAF
- Limbo: AutoSlot wired · one-shot rAF §3.5 disclose
- shared-core lockout → escalate

---

## 9. 남은 순서

G#3 Limbo → G#4 HiLo → G#5 Roulette → G#6 Mint → G#7 Gold Rush → G#8 Blackjack → G#9 Deepshaft → G#10 Momentum → ZIP GO → L2 paste

---

## 10. 새 채팅 첫 지시 예시

```text
PHONARA Games Polish L1-GP 이어가기.
HEAD G#3 Limbo — §4 DELIVER 있으면 §GREEN 판정.
G#3 §GREEN 후 HiLo G#4 프롬프트.
정본: PHONARA_LOVABLE_GAMES_POLISH_MASTER.md
```

---

*갱신: 2026-06-17 · G#1–G#5 ✅ §GREEN · G#6 Mint PLAN*
