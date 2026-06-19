# LOVABLE World Crush · FOMO Motion V2 LOCK — L1-18 v0.2 dedup EXECUTE

> **상태:** **✅ §GREEN** · operator report 2026-06-17 · vitest **580/580** (+3) · catalog **Δ=0** DIFF=0 · G-WC3 ✅ · ZIP defer  
> **큐 ID:** **L1-18** (platform FOMO rhythm · Lovable 전용)  
> **의존:** L1-16 ✅ · L1-17 ✅ · catalog **~2617+** · i18n DIFF=0  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4

---

## Scope (1줄)

**3개 surface**에 **120–320ms 단발** motion 추가. `prefers-reduced-motion`은 `styles.css` 글로벌 `*` **0.001ms** guard로 자동 처리 (중복 미디어 쿼리 **0**). 엔진/RPC/L1-17 IA **0-touch**.

---

## 중복 제거 audit (dedup)

| 후보 | 기존 상태 | 결정 |
|------|-----------|------|
| Home `LiveWinMarquee` row tick | 정적 loop · 진짜 insert 없음 + marquee 애니 이미 있음 | **제외 · NO-TOUCH** |
| Casino `LiveWinTicker` `animate-fade-in` | row insert에 이미 fade-in | `animate-fomo-pulse`로 **교체** (스택 **0**) |
| reduced-motion 미디어 쿼리 | `styles.css` 글로벌 `*` 0.001ms 강제 존재 | 신규 utility용 별도 `@media` **추가 안 함** |
| `useReducedMotionGuard` | `src/games/shared/hooks/` 존재 | **REUSE** · 신규 훅/shim **0** |
| `CountdownTimer` 초 변경 | 매초 setState · 숫자만 (애니 0) | tick utility **추가 (신규)** |
| Trade Futures 가격 셀 | tone 색만 flip (opacity flash 0) | tick utility **추가 (신규)** |
| Casino `TournamentStrip` | 현재 motion 0 | **scope 제외** (LiveWinTicker로 충분) |

---

## World Crush bar (G-WC3)

| # | 필수 | FAIL |
|---|------|------|
| M1 | Home countdown **초 단위 tick** (`CountdownTimer`) | static digits |
| M2 | Casino `LiveWinTicker` rotating row **pulse** (insert emphasis) | fade-in only · pulse stacked |
| M3 | Trade Futures 헤더 price subtle tick · synthetic display-only label **유지** | fake matching motion |
| M4 | reduced-motion: **글로벌 가드** 자동 처리 | duplicate `@media` added |
| M5 | single-shot **120–320ms** · infinite bounce **0** | bounce spam |
| M6 | vitest **577/577 carry** · ko=en DIFF=**0** (i18n Δ=0) · console prod **0** | regression |

**Crash FROZEN md5 · game core timing = NO-TOUCH.**

---

## Motion tokens (M18-A)

`src/styles.css` `@layer utilities` 블록 안에 **2 keyframes + 2 utilities만** APPEND:

```css
@keyframes fomo-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.92;transform:scale(1.02)} }
@keyframes fomo-tick  { from{opacity:.55} to{opacity:1} }
.animate-fomo-pulse { animation: fomo-pulse 200ms ease-out 1; }
.animate-fomo-tick  { animation: fomo-tick 160ms ease-out 1; }
```

별도 reduced-motion 가드 **추가 안 함** — 기존 글로벌 `*` 0.001ms 가드가 자동 무력화.

**FAIL =** global `*` animation override · infinite bounce on shells · `animate-fade-in` + `animate-fomo-pulse` **동시 스택** on LiveWinTicker row.

---

## Files (additive · dedup 후 4 touch + 1 test)

| ID | path | action | 이유 |
|----|------|--------|------|
| M18-A | `src/styles.css` | APPEND 2 keyframes + 2 utilities | 토큰 SOT |
| M18-B | `src/components/fomo/CountdownTimer.tsx` | 초 셀 `key={s}` + `.animate-fomo-tick` | 매초 시각 피드백 (신규) |
| M18-C | `src/components/casino/LiveWinTicker.tsx` | `animate-fade-in` → `animate-fomo-pulse` **교체** | insert emphasis (스택 X) |
| M18-D | `src/components/trade/panels/TradeFuturesPanel.tsx` | 헤더 price 셀 `key={priceDisplay}` + `.animate-fomo-tick` | display-only flash (신규) |
| M18-F | `src/components/motion/__tests__/fomo-motion.test.tsx` | **NEW** | regression guard |

**M18-E 제거** — `useReducedMotion` 신규 훅 / re-export shim **0**. 기존 `useReducedMotionGuard`는 games 경로에서 그대로; **본 슬라이스는 글로벌 CSS 가드만** — 컴포넌트 레벨 분기 불필요.

**DELETE 0** · packages/* 0 · Crash FROZEN 0 · L1-17 IA 0 · **LiveWinMarquee NO-TOUCH** · **TournamentStrip NO-TOUCH**

---

## LOCK Footer M18-F1 ~ F6

| # | 고정 | FAIL |
|---|------|------|
| F1 | **3 surfaces** — CountdownTimer · LiveWinTicker · TradeFuturesPanel price | LiveWinMarquee touch |
| F2 | LiveWinTicker **`animate-fade-in` → `animate-fomo-pulse` 교체** (스택 0) | both classes on row |
| F3 | reduced-motion via **global guard only** — no new `@media` | duplicate media query |
| F4 | Crash FROZEN · game timing **0-touch** | engine touch |
| F5 | vitest **577/577 carry** · DIFF=**0** | regression |
| F6 | L1-17 TradeModeShell segment IA **0-touch** | segment logic change |

---

## Tests (M18-F)

| # | assert |
|---|--------|
| T1 | `styles.css` 문자열에 `fomo-pulse` + `fomo-tick` 정의 포함 |
| T2 | `LiveWinTicker` row — `animate-fomo-pulse` 보유 · **`animate-fade-in` 부재** (교체 검증) |
| T3 | `CountdownTimer` 초 셀 mount 시 `animate-fomo-tick` 존재 |
| T4 | vitest **577/577 carry** (+new OK) |
| T5 | i18n DIFF=**0** |

---

## EXECUTE Steps 0→7

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline **577/577** |
| 1 | M18-A `styles.css` 2 tokens |
| 2 | M18-B `CountdownTimer` 초 tick |
| 3 | M18-C `LiveWinTicker` fade-in→pulse **교체** |
| 4 | M18-D `TradeFuturesPanel` price tick |
| 5 | M18-F tests |
| 6 | full vitest |
| 7 | §GREEN + **9b-M18 manual** |

---

## §GREEN full block

```bash
bunx vitest run src/components/home/ src/components/casino/ src/components/trade/ src/components/motion/
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -n 'animate-fomo-pulse|animate-fomo-tick' src/
rg -n 'animate-fade-in' src/components/casino/LiveWinTicker.tsx
rg -n 'console\.(log|warn|error)' src/components/home src/components/casino src/components/trade --glob '*.tsx'
```

**PASS:** vitest **577/577 carry** · DIFF=**0** · fade-in **0** on LiveWinTicker · fomo tokens in styles.css · console prod 0.

**§GREEN template:**

```text
L1-18 §GREEN — FOMO motion V2 countdown+casino-ticker+trade-price · global reduced-motion guard reused · vitest N/N · catalog Δ=0 DIFF=0 · 9b-M18 PASS · G-WC3 · ZIP defer.
```

**Next:** operator 「ZIP 발행 GO」 after G-WC3 (+ L1-16f chase 권장)

---

## 9b-M18 manual (operator 60초)

1. Home — countdown **초 digit tick** visible each second
2. Casino hub — LiveWinTicker row **pulse** on rotate (no double fade+pulse)
3. `/trade` futures — header price cell subtle tick · **3-mode segment unchanged**
4. OS reduced-motion ON — motion effectively off (global 0.001ms)
5. en mode Korean 0

**FAIL =** LiveWinMarquee touched · fade-in stacked with pulse · Trade segment broken · bounce spam

---

## NO-TOUCH

Crash FROZEN · P2-Games engine · L1-17 TradeModeShell IA · **LiveWinMarquee** · **TournamentStrip** · `/trade/hub` · admin · sports · wallet · rpc/supabase/packages · 새 i18n key **0**

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 DRAFT — G-WC3 |
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO |
| 2026-06-17 | v0.2 — 4-surface file list (superseded) |
| 2026-06-17 | **v0.2 dedup** — 3 surfaces · LiveWinMarquee/TournamentStrip 제외 · fade-in→pulse 교체 · M18-E 제거 |
| 2026-06-17 | **§GREEN** — countdown+casino-ticker+trade-price · vitest **580/580** (+3) · G-WC3 ✅ · ZIP defer |

---

*Lovable canvas only · G-WC3 · ZIP after operator GO*
