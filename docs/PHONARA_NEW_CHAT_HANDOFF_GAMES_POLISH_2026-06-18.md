# PHONARA — Games Polish L1-GP · 새 채팅 인계 (2026-06-18)

> **용도:** 새 Cursor/Lovable 채팅 **첫 메시지**에 통째로 붙여넣기  
> **정본:** `docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.1.5 · Desktop `PHONARA-lovable-master-prompt.md`  
> **이전:** `PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-17.md` (G#1–G#5 구간)

---

## 0. 한 줄

Lovable canvas casino **12 originals** UI/UX polish — **L1-GP G#1–G#10 ✅ FINAL §GREEN** (658/658).  
**Cursor** = LOCK · §GREEN · Lovable dispatch · docs 동기화. **PHONARA paste/ZIP = operator GO 전 0.**

---

## 1. 역할 · 경계

| 주체 | 하는 일 | 금지 |
|------|---------|------|
| **Lovable** | `src/games/**` UI · vitest · Playwright §3 | engine · ZIP · paste |
| **Cursor** | Plan APPROVE 검토 · §GREEN 판정 · dispatch 조립 · docs | Lovable 코드 · paste |
| **operator** | EXECUTE GO · §GREEN APPROVE · ZIP GO | — |

**고정 규칙**

- Engine NO-TOUCH: `packages/game-engine/**` · `supabase/**` · `useAutoBetQueue` · `AutoBetPanel` · `BetModeTabs`
- ZIP: operator 「ZIP 발행 GO」 전 **0**
- LAW 3: fake live feed 금지 (FOMO string display props는 presentation 허용)
- **G#n §GREEN → G#n+1만** (G#5-C parallel은 종료)

---

## 2. Baseline carry (Lovable canvas)

| 항목 | 값 |
|------|-----|
| vitest | **658/658** (G#10 FINAL §GREEN carry) |
| i18n | **2712/2712 DIFF=0 DUP=0** |
| §3.10 funded autobet | **INCONCLUSIVE defer** (funded env 필요 — carry) |
| harness | auto-commit · diff empty-by-design OK |
| PHONARA repo games | `deepshaft/**` · `momentum/**` = **PresentationImportPlaceholder** (paste 전) |

**G#10 carry:** vitest **658/658** · G#10-W0.5 · G#10-R · G#10-FINAL ✅

---

## 3. 큐 전체

| # | Game | 상태 | 핵심 |
|---|------|------|------|
| — | plinko · mines | ✅ signed-off | regression only |
| G#1 | crash | ✅ §GREEN | withAlpha · CrashAutoSlot · §3.1 dual |
| G#2 | dice | ✅ §GREEN | DiceAutoSlot · multiplier.ts reuse |
| G#3 | limbo | ✅ §GREEN | polish-only · fast-ramp |
| G#4 | hilo | ✅ §GREEN | outcome-leak 3 · Path B N/A |
| G#5 | roulette | ✅ §GREEN + W | board · wheel · pre-settle leak |
| G#5-C | promo overflow | ✅ §GREEN | §3.7 0/0/0 · GameDetailFrame sm→md |
| G#6 | mint_reels | ✅ §GREEN | contract-gap FLAG · 618/618 |
| G#7 | gold_rush | ✅ §GREEN | gold-premium · contract-gap · 621/621 |
| G#8 | blackjack | ✅ §GREEN | 4-state banner · LOSS=0 · 625/625 |
| G#9 | deepshaft | ✅ §GREEN | LAW 4 FULL · greenfield · 630/630 · poster |
| **G#10** | **momentum** | **✅ FINAL §GREEN** | G#10-W0.5 · G#10-R roll-reveal · G#10-FINAL · 658/658 · AutoSlot 2/5/10 |

**L1-GP:** **✅ COMPLETE** (G#1–G#10) · operator 「Lovable 100%」· ZIP GO · L2 paste = **별도 GO**  
**L1 HEAD (World Crush):** **L1-20 K1** · ~~L1-16f~~ **CANCELLED** (operator 2026-06-18)

---

## 4. G#10 Momentum — 완료 기록 (LOCK v0.1 · W0.5 · R · FINAL)

> **LOCK:** [`PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md`](PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md)  
> **§GREEN:** G#10-W0.5 · **G#10-R** · **G#10 FINAL** — vitest **658/658** · i18n **2712/2712** · WC shots carry-defer

### Engine contract — **NOT contract-gap**

```ts
// Selection
{ comboBefore: 0..15; cashOut: boolean }

// Result (full — honest replay)
{ won, roll, comboBefore, comboAfter, comboMultiplier, cashedOut, totalMultiplier }
```

| Path | `cashOut` | UI |
|------|-----------|-----|
| **Play** | `false` | roll 0–99 reveal → win/loss → comboAfter; `totalMultiplier=0` |
| **Cash out** | `true` | roll skip · `totalMultiplier` banner only |

### LAW 4 scope

- Deepshaft cell grid **아님** → **roll-reveal quarantine**
- `bet=null` / in-flight: roll digits·win/loss·comboAfter DOM leak **0**
- reveal cap **≤900ms** · timer teardown on unmount
- `prefers-reduced-motion`: jump to final state

### Identity (anti-clone)

Electric cyan **momentum arc** + combo nodes 1..15 + roll readout + **52.00 threshold** — Dice slider / Crash curve / Deepshaft shaft / slot reels / blackjack felt **금지**

### MomentumAutoSlot (§3.1 applicable)

| Policy | targetCombo |
|--------|-------------|
| early | 2 |
| mid | 5 |
| greedy | 10 |

1280×1800 + 390×844 live render 필수

### Greenfield

canvas에 `src/games/momentum/**` 없으면 G#9 precedent로 **CREATE** · poster + og + grid card

### Outcome-leak tests (+5 → 635/635)

1. bet=null  
2. pending (no result)  
3. play loss  
4. play win (comboAfter post-reveal)  
5. cashOut (no roll anim)

### §GREEN template (목표)

```text
Momentum Polish G#10 §GREEN — vitest 635/635 carry — full engine replay NOT contract-gap — LAW 4 roll-reveal PASS — timer teardown — G10-D1 D1–D10 PASS — §3.1 AutoSlot 1280+390 early/mid/greedy — poster generated + wired — perf OK — mobile 0/0/0 — WC shots 6 — §3.7 G#5-C scope-out — §3.10 defer — L1-GP COMPLETE defer GATE — ZIP defer.
```

---

## 5. 완료 슬라이스 요약 (§GREEN 근거)

**G#9 Deepshaft (2026-06-18)** — vitest 630/630 · LAW 4 FULL 5/5 · engine-vs-mock · AutoSlot 1280+390 · poster/grid · timer teardown

**G#5-C Promo (2026-06-18)** — `/casino/roulette` §3.7 0/0/0 · `GameDetailFrame` sm→md · wheel/board NO-TOUCH

**G#8 Blackjack** — contract-gap FLAG · decorative cards · 4-state banner · LOSS=0 via `<1`

**G#6–G#7** — contract-gap (totalMultiplier only) · honest partial · FLAG 필수

**G#5 Roulette** — per-leg invent 금지 · G5-B1-W wheel only · promo → G#5-C 분리

---

## 6. 게임 유형별 패턴 (Cursor §GREEN 기준)

| 유형 | 게임 | Cursor 판정 포인트 |
|------|------|-------------------|
| Contract-gap | mint_reels · gold_rush · blackjack | FLAG verbatim · decorative · settle = totalMultiplier only |
| LAW 4 FULL | deepshaft · mines | hidden cell quarantine · engine-vs-mock branch |
| LAW 4 roll-reveal | **momentum** | pre-reveal roll leak · play vs cashOut branch |
| Path B N/A | hilo · blackjack | pre-committed / table tree — AutoSlot not-applicable 명시 |
| Parallel amend | G#5-C | page shell only · game Stage NO-TOUCH |

---

## 7. §3 blocking 체크리스트

- §3.1 Auto-slot 1280+390 **OR** Path B N/A + auto.wiring green
- §3.2 outcome-leak (해당 게임)
- NO-TOUCH empty · vitest carry · i18n DIFF=0 · §3.7 overflow 0
- WC shots · §3 raw — **미제공 시 non-blocking carry-defer** (G#6–G#9 동일)
- LAW 3 · harness diff empty OK

---

## 8. LOCK · docs 정본

| 문서 | 용도 |
|------|------|
| `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.1.5 | 큐 head |
| `PHONARA_LOVABLE_GAMES_POLISH_MASTER.md` | standing laws · §10 Momentum |
| `PHONARA_DEEPSHAFT_MOMENTUM_ENGINE_DELIVERABLE.md` | Momentum result contract |
| `PHONARA_LOVABLE_GAMES_POLISH_G{1..9}_*_LOCK.md` | 완료 LOCK |
| `PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md` | HEAD · EXECUTE GO |
| `PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md` | parallel amend |
| `LOVABLE_OPERATOR_PROMPT_DISPATCH.md` · rule `93` | dispatch 조립 |
| `CURRENT_STATUS.md` | 경량 대시보드 |

---

## 9. Cursor 트리거

| operator | Cursor |
|----------|--------|
| §GREEN template 한 줄 붙임 | §GREEN/§AMBER 판정 + contract/handoff/CURRENT_STATUS 갱신 |
| 「G#N 프롬프트」 | Lovable dispatch 전체 블록 조립 |
| Lovable partial DELIVER | CONTINUE 순서 (i18n first 등) |
| 「새 채팅 인계」 | 본 문서 갱신 |

---

## 10. 잔여 로드맵

```text
L1-GP G#1–G#10 ✅ FINAL §GREEN
→ operator 「Lovable 100%」
→ ZIP GO (operator 명시)
→ L2 PHONARA paste GO (별도)
```

**Parallel L1 (World Crush):** L1-20 K1 HEAD · ~~L1-16f desktop~~ **CANCELLED**

---

## 11. 새 채팅 첫 메시지 (복붙)

```text
PHONARA Games Polish L1-GP 이어가기.

HEAD: G#10 Momentum EXECUTE (L1-GP FINAL slice)
Baseline: vitest 630/630 · i18n DIFF=0 · G#5-C ✅ · §3.10 defer
G#10: LOCK v0.1 FULL APPROVE · dispatch 발송됨 — Lovable §GREEN 대기

Cursor = LOCK/§GREEN/dispatch/docs only · paste 0 · engine 0 · ZIP 0

정본: docs/PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-18.md
```

---

## 12. §GREEN 회신 시 Cursor 동기화 체크

- [ ] `PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md` §3.1.5 HEAD → GATE 또는 다음 큐
- [ ] 본 handoff §3 G#10 ✅
- [ ] `CURRENT_STATUS.md` L1-GP 줄
- [ ] (선택) `PHONARA_LOVABLE_GAMES_POLISH_G10_MOMENTUM_LOCK.md` 생성 + review log

---

**Tip:** §GREEN 판정은 Lovable §GREEN template + §3 raw(있으면) 붙여 주세요. WC shots 미제공은 G#6–G#9와 동일하게 carry-defer.

*갱신: 2026-06-18 · G#10 LOCK v0.1 정본 생성 · EXECUTE 대기*
