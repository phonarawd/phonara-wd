import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const doc = `# PHONARA · Games Polish L1-GP — 통합 인계 (2026-06-18)

> **용도:** 새 Cursor/Lovable 채팅 **첫 메시지**에 통째로 붙여넣기  
> **정본:** \`docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md\` §3.1.5 · \`PHONARA-lovable-master-prompt.md\` (Desktop)  
> **갱신:** 2026-06-18 · 본 대화 세션 전체 압축 인계

---

## 0. 한 줄 요약

**Lovable canvas**에서 casino **12 originals** UI/UX를 Stake 압살 · **렉 0** · 엔진 오차 0으로 **게임 1 pass** polish 중.  
**Cursor(PHONARA repo)** = LOCK 검토 · §GREEN 교차검증 · Lovable dispatch · docs만 — **\`apps/web\` paste/구현 0**.

---

## 1. 역할 · 절대 경계

| 주체 | 하는 일 | 금지 |
|------|---------|------|
| **Lovable AI** | \`src/games/**\` presentation · vitest · Playwright §3 | engine · ZIP · PHONARA paste |
| **Cursor** | APPROVE/REJECT · §GREEN · dispatch · docs | Lovable 코드 작성 |
| **operator** | EXECUTE GO · §GREEN APPROVE · 「ZIP 발행 GO」 | — |

- **Engine NO-TOUCH:** \`packages/game-engine/**\` · \`supabase/**\` · shared auto-bet 3파일 (\`useAutoBetQueue\` · \`AutoBetPanel\` · \`BetModeTabs\`)
- **ZIP:** operator 「ZIP 발행 GO」 전 **0**
- **LAW 3:** fake live feed / mock ticker **금지**
- **G#n §GREEN 전 G#n+1 금지** (parallel amend G#5-C는 예외)

---

## 2. Canvas baseline (carry)

| 항목 | 값 |
|------|-----|
| vitest | **615/615** (G#5 Roulette + amend W 후) |
| i18n | **KO=EN=2639 DIFF=0** |
| G#6 target | **616/616** (+1 outcome-leak, EXECUTE 중) |
| harness | auto-commit · working-tree diff empty-by-design (G#1–G#5 패턴) |
| §3.10 funded autobet | **INCONCLUSIVE defer** (G#1–G#5 공통) |

---

## 3. L1-GP 큐 — 완료 · 진행 · 대기

| # | Game | 상태 | LOCK / 비고 |
|---|------|------|-------------|
| — | plinko · mines | ✅ signed-off | regression only |
| G#1 | crash | ✅ **§GREEN** | \`PHONARA_LOVABLE_GAMES_POLISH_G1_CRASH_LOCK.md\` · withAlpha · §3.1 dual |
| G#2 | dice | ✅ **§GREEN** | G2 LOCK · DiceAutoSlot · 608→carry |
| G#3 | limbo | ✅ **§GREEN** | polish-only · \`casino-auto-limbo-target\` · fast-ramp · one-shot rAF §3.5 |
| G#4 | hilo | ✅ **§GREEN** | outcome-leak 3 · §3.1 Path B not-applicable (pre-committed guesses) |
| G#5 | roulette | ✅ **§GREEN + W** | G5-B1 board · G5-B1-W wheel · §3.1 Path B · §3.2 pre-settle leak |
| **G#5-C** | roulette promo | **PLAN (parallel)** | \`PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md\` · §AMBER 390=146/414=122 |
| **G#6** | **mint_reels** | **⏳ EXECUTE GO** | Plan **APPROVED** · contract-gap · \`PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md\` |
| G#7 | gold_rush | PLAN | Mint와 동형 contract gap (\`totalMultiplier\` only) |
| G#8 | blackjack | PLAN | contract gap (\`totalMultiplier\` only · hands 미노출) |
| G#9 | deepshaft | PLAN | **LAW 4 FULL** outcome-leak |
| G#10 | momentum | PLAN | combo/streak |

**HEAD (formal):** **G#6 Mint Reels EXECUTE**  
**Parallel (G#6 차단 아님):** **G#5-C** promo overflow

---

## 4. 게임별 핵심 교훈 (§GREEN 검증 시 참고)

### G#1 Crash
- getComputedStyle loop 금지 · color-mix withAlpha
- CrashAutoSlot · §3.1 1280+390

### G#2 Dice
- \`multiplier.ts\` reuse · no rAF invent

### G#3 Limbo
- LimboAutoSlot 재작성 0 · \`casino-auto-limbo-target\` rename
- pre-existing one-shot rAF → §3.5 disclose

### G#4 HiLo
- leak window = **selection-building** (\`bet===null\`), not mid-round Stake-style
- Path B auto-slot · outcome-leak vitest 3/3

### G#5 Roulette
- **CONTRACT LIMIT:** per-leg win highlight **invent 금지** — \`winningNumber\` + \`totalMultiplier\` only
- G5-B1: \`RouletteBoard\` in Controls.shared · B1–B10 · wc4_board_legibility
- G5-B1-W: Stage wheel W1–W9 · \`POCKET_ORDER\`/`targetRotation` 0-touch
- §AMBER: page promo overflow → **G#5-C** 별도 슬라이스

### G#6 Mint Reels (EXECUTE 중)
- Result: **\`totalMultiplier\` ONLY** — no \`stops\`/\`window\`
- **CONTRACT-GAP FLAG** DELIVER 필수
- Decorative \`seedToGrid\` OK · engine-authentic reel stops **금지**
- Path B auto-slot (lines pre-committed)
- Perf: transform/opacity only · rAF/getComputedStyle **0** · spin ≤900ms
- Target vitest **616/616** (+ outcome-leak)

---

## 5. §3 blocking 체크리스트 (공통)

- §3.1 Auto-slot **1280 AND 390** OR Path B \`not-applicable\` + reason + auto.wiring green
- §3.2 outcome-leak (해당 게임: HiLo selection-build · Roulette pre-settle · Mint leak test)
- NO-TOUCH empty · vitest carry · i18n DIFF=0
- §3.7 mobile overflow 0 (G#5-C promo는 별도 fix)
- LAW 3 fake feed 0
- harness diff empty-by-design OK

---

## 6. 지금 즉시 할 일 (우선순위)

### A) G#6 Mint — Lovable EXECUTE (HEAD)

- Plan **APPROVED** · operator가 EXECUTE GO 발송됨(또는 발송 필요)
- **대기:** Lovable §4 DELIVER + §3 raw → Cursor **§GREEN 판정**
- 검증: contract-honest rg · CONTRACT-GAP FLAG · G6-S1 · 616/616 · WC 5

### B) G#5-C Promo overflow — parallel

- LOCK: \`docs/PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md\`
- Goal: \`/casino/roulette\` §3.7 **375/390/414 = 0/0/0**
- Fix: promo \`grid sm:grid-cols-[200px_1fr]\` → mobile stack · wheel/board **0-touch**
- Trigger: operator 「**G#5-C 프롬프트**」

### C) G#6 §GREEN 후 순서

\`\`\`text
G#7 Gold Rush → G#8 Blackjack → G#9 Deepshaft → G#10 Momentum
→ operator 「Lovable 100%」→ 「ZIP 발행 GO」→ L2 paste
\`\`\`

---

## 7. 미래 슬라이스 요약 (G#7–G#10)

| # | Game | 특이사항 |
|---|------|----------|
| G#7 | gold_rush | Mint 동형 · \`totalMultiplier\` only · honest reveal + FLAG |
| G#8 | blackjack | \`totalMultiplier\` only · hands 미노출 · table UI + FLAG |
| G#9 | deepshaft | **LAW 4 FULL** · unrevealed depth quarantine vitest+PW |
| G#10 | momentum | combo/streak · \`roll\` · \`comboBefore/After\` replay |

**Contract-gap games (G#6–8):** beautiful fake **금지** · honest partial + FLAG > LAW 위반 완성

---

## 8. Parallel L1 (Games Polish와 무관 · 차단 아님)

- **L1-20** K1 황금 지구 (HEAD) · ~~L1-16f~~ **CANCELLED** (operator 2026-06-18)
- **L1-GP** = operator priority parallel queue

---

## 9. LOCK 파일 인덱스

| ID | Path |
|----|------|
| Master | \`docs/PHONARA_LOVABLE_GAMES_POLISH_MASTER.md\` (desktop 흡수) |
| Sequential | \`docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md\` §3.1.5 |
| G#1–G#5 | \`docs/PHONARA_LOVABLE_GAMES_POLISH_G{1..5}_*_LOCK.md\` |
| G#5-C | \`docs/PHONARA_LOVABLE_GAMES_POLISH_G5C_PROMO_OVERFLOW_LOCK.md\` |
| G#6 | \`docs/PHONARA_LOVABLE_GAMES_POLISH_G6_MINT_REELS_LOCK.md\` |
| Dispatch | \`docs/LOVABLE_OPERATOR_PROMPT_DISPATCH.md\` · rule \`93-lovable-prompt-dispatch.mdc\` |

---

## 10. Cursor 트리거 (operator → AI)

| 말하면 | AI가 할 일 |
|--------|------------|
| Lovable §4 DELIVER + §3 raw 붙임 | §GREEN/§AMBER 판정 |
| 「G#N 프롬프트」 / 「lovable 프롬프트」 | dispatch 복붙 블록 1개 조립 |
| 「G#5-C 프롬프트」 | promo overflow amend dispatch |
| 본 문서 붙임 | 세션 이어가기 |

---

## 11. §GREEN line 템플릿 (최근)

**G#5 amend W:**
\`\`\`text
Roulette Polish G#5 amend W §GREEN — vitest 615/615 · §3.2 PASS · G5-B1-W PASS · wc5 · §AMBER promo scope-out · ZIP defer.
\`\`\`

**G#6 (목표):**
\`\`\`text
Mint Reels Polish G#6 §GREEN — vitest 616/616 · contract-honest · contract-gap FLAG · G6-S1 PASS · §3.1 N/A · perf OK · WC 5 · §3.10 defer · ZIP defer.
\`\`\`

**G#5-C (목표):**
\`\`\`text
Roulette G#5-C promo-overflow §GREEN — §3.7 0/0/0 · NO-TOUCH wheel/board · vitest 615 carry · DIFF=0 · ZIP defer.
\`\`\`

---

## 12. 새 채팅 첫 지시 (복붙)

\`\`\`text
PHONARA Games Polish L1-GP 이어가기.
정본: docs/PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-17.md (본 통합 인계)

HEAD G#6 Mint EXECUTE — §4 DELIVER 있으면 §GREEN 판정.
Parallel G#5-C promo overflow PLAN 대기.
G#6 §GREEN 후 Gold Rush G#7 프롬프트.
Cursor = LOCK/§GREEN/dispatch/docs only · PHONARA paste 0 · ZIP 0.
\`\`\`

---

*갱신: 2026-06-18 · G#1–G#5 ✅+W · G#6 EXECUTE APPROVED · G#5-C parallel PLAN*
`;

writeFileSync(join(import.meta.dir, '..', 'docs', 'PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-17.md'), doc, 'utf8');
console.log('wrote', doc.length);
