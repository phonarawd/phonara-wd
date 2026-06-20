# LOVABLE_WORLD_CRUSH · L1-20 · K1 황금 지구 LOCK

> **상태:** **APPROVED** · operator **2026-06-21** · EXECUTE **GO**  
> **큐:** C-3 HEAD · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4 L1-20  
> **선행:** L1-16c ✅ · L1-18 ✅ · L1-24 ✅ · L1-GP FINAL ✅  
> **다음:** L1-21 K3 (L1-20 §GREEN 후)  
> **근거:** [`archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](archive/superseded-plans/PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) §9 K1  
> **담당:** Cursor presentation (`apps/web` · `packages/i18n` append only) · Lovable canvas **0**

---

## Scope (1줄)

`/home` · `today` 탭 fold0 hero를 **K1 황금 지구** 시그니처 탭 surface로 **교체** — tap→toast · scripted 공동 카운터 · N번째 mock 잭팟 modal · **RPC 0 · 엔진 0-touch**.

---

## World Crush bar

| ID | FAIL = |
|----|--------|
| WC-K1-1 | generic earn hero만 남고 황금 지구 tap surface 없음 |
| WC-K1-2 | 첫 3초 urgency/reward/density 전무 (mockNotice + counter + tap feedback 없음) |
| WC-K1-3 | fold0 `data-primary-cta` ≠ 1 · LiveWinMarquee 2줄화 |
| WC-K1-4 | mock counter/ticker를 실데이터·실시간으로 위장 (`mockNotice` 누락 · 「Live」단독) |

---

## §9 K1 원문 (정본 인용)

**§9.0 one-liner:** 0.1초 타임어택 · **황금 지구** — 전 유저가 하나의 거대 타깃을 같이 탭 · N번째 터치 잭팟 · Home hero **시그니처** · L1 mock ★★★★★ · **1순위**

**K1 · 전 국민 「황금 지구 / 디지털 저금통」 탭**

| 항목 | 내용 |
|------|------|
| UX | Home 메인 거대 **황금 지구** 또는 **디지털 저금통** · 탭 1회 = 1~2원 **연출** (display string) |
| FOMO | 전 국민 누적 터치 live 카운터 (라이브 속보 UI) · 「9,990만… 10만 남음!」 잭팟 임박 알림 · N번째 터치 잭팟 연출 (예: 100만 원 **예시**) |
| 소셜 | 「내 손가락 한 번에 대박」 — milestone countdown · L1-18 `fomo-tick` / pulse 재사용 |
| Surface | `/home` fold0 hero 또는 **오늘 벌기** 탭 primary · EarnPowerRow와 **역할 분리** (hero 1 유지) |
| L1 scope | tap handler → toast · `useScriptedCounter` bump · jackpot modal mock · **rpc 0** |
| L3 defer | `rpc_tap_contribute` · milestone ledger · anti-bot · conservation · KYC/이벤트 규정 |
| Visual ref | 돈이돼지 · Stake live ticker · TikTok urgency |

**§4 관계:** 「12-C v0.3 FOMO/tier → **§9 K1/K3가 Earn hero 승계**」

**§9.2 i18n prefix:** `earn.goldenEarth.*`

---

## L1 vs L3 경계

| 영역 | L1-20 (이번) | L3 (defer · operator Engine GO) |
|------|--------------|-------------------------------|
| 탭 입력 | `onClick` / Enter → local state | `rpc_tap_contribute` · idempotency key |
| 금액 연출 | toast display string (+1~2원 **연출**) | wallet credit · ledger Σ=0 |
| 공동 카운터 | `useScriptedCounter` + `useLiveCount` seed walk | server aggregate · realtime channel |
| 잭팟 | mock modal · scripted N번째 | milestone ledger · prize pool · KYC gate |
| FOMO 임박 | i18n + scripted threshold (≥9,900,000) | server milestone timestamp |
| anti-bot | 없음 | rate limit · device fingerprint |
| 네트워크 | **RPC 0** · fetch 0 | Supabase RPC + RLS |
| i18n | `earn.goldenEarth.*` **append only** | error code keys (별도 L3) |

---

## Surface · fold0 배치

| 항목 | 고정 |
|------|------|
| Route | `/home` · tab `today` (`home.tab.today`) |
| 파일 | `apps/web/src/components/home/panels/HomeTodayPanel.tsx` L57–86 **교체** |
| Hero 관계 | **Replace** — generic gradient hero + `/earn/missions` Link CTA → `GoldenEarthHero` |
| `data-primary-cta` | **×1** — `data-primary-cta="home-golden-earth-tap"` on tap button |
| NO-TOUCH | `HomeEarnPowerRow` · `LiveWinMarquee` · `TierProgressChip` · `HomeCategoryRow` ×3 |

```text
fold0 (today) — EXECUTE 후
CompactWalletStrip
→ GoldenEarthHero          ← NEW (replaces hero band L57–86)
→ HomeEarnPowerRow         ← NO-TOUCH
→ LiveWinMarquee           ← NO-TOUCH (exactly 1 lane)
→ TierProgressChip         ← NO-TOUCH
→ CategoryRow ×3           ← NO-TOUCH
```

---

## 화면 설계 (와이어)

### 1. 거대 지구 비주얼

**Default (D1):** 황금 지구 **SVG** — §9 「또는」 중 지구 1안 고정.

| 요소 | L1 구현 | 토큰 |
|------|---------|------|
| 지구 본체 | `GoldenEarthGlobe.tsx` — inline SVG · gradient fill · meridian arcs · subtle rotate | `--color-rocket-gold` · `--rocket-gradient-gold` (`theme.css`) · `color-mix(in oklab, var(--primary) …)` |
| 글로우 halo | CSS `radial-gradient` + `box-shadow: var(--shadow-glow-cta)` | `--gradient-cta` 주변 radial only · **신규 hex 금지** |
| 외부 이미지 | **0** | poster import 금지 |
| 저금통 variant | defer — `variant="earth"\|"piggy"` prop slot only | operator GO 시 SVG swap |

**크기:** mobile tap target ≥ **120×120px** (hero button `min-h-44`). Desktop globe column ~160–200px.

### 2. 탭 상호작용

```text
Tap / Enter / Space
  → active:scale-[0.96]
  → CSS ripple ring (::after 300ms)
  → counter animate-fomo-tick (L1-18)
  → toast +{1|2}원 연출
  → personalTaps % 50 === 0 → JackpotModal
  → global crosses 10_000_000 while tapping → JackpotModal (1회)
```

- `<button type="button">` · `aria-label={t('earn.goldenEarth.tap.aria')}`
- `navigator.vibrate?.(10)` — optional · reduced-motion 시 skip
- focus ring `ring-2 ring-primary`

### 3. 공동 카운터 (scripted)

- Hook: `useScriptedCounter` — seed **9_872_341** (D4) · milestone **10_000_000** · urgency **9_900_000**
- Background: 기존 `useLiveCount` (+0.8~3% / 1.2–2.5s) · user tap **+1** instant bump
- Format: `Intl.NumberFormat` · `tabular-nums`
- **Always visible:** `earn.goldenEarth.mockNotice` — 「이벤트 연출 · 실제 적립/당첨 아님」

### 4. N번째 잭팟 modal (mock)

| 항목 | L1 고정 (D3) |
|------|--------------|
| Trigger A | `personalTaps % 50 === 0` (50번째 tap) |
| Trigger B | global scripted count crosses `10_000_000` while user tapping (session 1회) |
| Component | `@phonara/ui` `Modal` · `data-testid="golden-earth-jackpot-modal"` |
| Prize copy | §9 예시 **100만 원** · `earn.goldenEarth.jackpot.prizeExample` · tabular-nums |
| Confetti | `lib/confetti.ts` · reduced-motion = no confetti |
| Dismiss | toast `earn.goldenEarth.jackpot.dismissToast` (display-only) |
| Re-show guard | `sessionStorage` key `phonara_golden_earth_jackpot_seen` |

### 5. FOMO (mock integrity)

| §9 FOMO | L1 | 위장 방지 |
|---------|-----|-----------|
| 잭팟 임박 | `GoldenEarthUrgencyStrip` count ≥ 9.9M | 「실시간」**금지** · 「연출」필수 |
| live 속보 | hero 내부 1줄 `GoldenEarthTapTicker` (3–4 scripted) | `earn.goldenEarth.ticker.demo` prefix · LiveWinMarquee 중복 lane **0** |
| milestone | `earn.goldenEarth.milestone.remaining` | `{remaining}` = `10_000_000 - count` |
| pulse | `animate-fomo-tick` on urgency only | reduced-motion = static |

### 6. 레이아웃

**Mobile (< md):**

```text
┌─────────────────────────────┐
│ mockNotice (10px muted)     │
│ 전국민 누적 NNN,NNN,NNN 탭   │
│ ┌─────────────────────┐     │
│ │   SVG globe (tap)    │     │  min-h 176px
│ │   [ TAP! ]           │     │
│ └─────────────────────┘     │
│ urgency chip (연출)          │
│ mini tap ticker 1 line      │
│ 미션 더 보기 → (text link)   │  NOT data-primary-cta
└─────────────────────────────┘
```

**Desktop (≥ md):**

```text
┌──────────────────────────────────────────┐
│ mockNotice                               │
│ grid md:grid-cols-[minmax(140px,200px)_1fr]
│ ┌──────────────┐  ┌───────────────────┐  │
│ │ SVG globe    │  │ counter + urgency │  │
│ │ (tap btn)    │  │ milestone bar     │  │
│ └──────────────┘  │ mini ticker       │  │
│                   └───────────────────┘  │
│ 미션 더 보기 →                            │
└──────────────────────────────────────────┘
```

Shell: `rounded-xl border border-border` · 기존 hero radial gradient background 유지.

---

## Architecture

```text
HomeTodayPanel
└── GoldenEarthHero                    components/home/golden-earth/
    ├── GoldenEarthGlobe               SVG visual
    ├── GoldenEarthCounter             global + personal counts
    ├── GoldenEarthUrgencyStrip        ≥9.9M chip
    ├── GoldenEarthTapTicker           1-line scripted feed
    └── GoldenEarthJackpotModal        Modal wrapper

hooks/
├── useScriptedCounter.ts              global walk + tap bump
└── useGoldenEarthTap.ts               personal taps · modal · toast
```

### Props / state 계약 (EXECUTE 시)

```typescript
// useScriptedCounter.ts
type ScriptedCounterConfig = {
  seed: number;              // default 9_872_341
  milestone: number;         // default 10_000_000
  urgencyThreshold: number;  // default 9_900_000
};
type ScriptedCounter = {
  globalCount: number;
  remainingToMilestone: number;
  isUrgent: boolean;
  bump: () => void;
};

// useGoldenEarthTap.ts
type GoldenEarthTap = {
  personalTaps: number;
  onTap: () => void;
  jackpotOpen: boolean;
  dismissJackpot: () => void;
};

// GoldenEarthHero.tsx
type GoldenEarthHeroProps = {
  className?: string;
  /** import.meta.env.DEV only — production uses defaults */
  mockEvery?: number;
};
```

---

## Files

| ID | Path | Action |
|----|------|--------|
| F-01 | `apps/web/src/components/home/golden-earth/GoldenEarthHero.tsx` | NEW |
| F-02 | `apps/web/src/components/home/golden-earth/GoldenEarthGlobe.tsx` | NEW |
| F-03 | `apps/web/src/components/home/golden-earth/GoldenEarthCounter.tsx` | NEW |
| F-04 | `apps/web/src/components/home/golden-earth/GoldenEarthUrgencyStrip.tsx` | NEW |
| F-05 | `apps/web/src/components/home/golden-earth/GoldenEarthTapTicker.tsx` | NEW |
| F-06 | `apps/web/src/components/home/golden-earth/GoldenEarthJackpotModal.tsx` | NEW |
| F-07 | `apps/web/src/components/home/golden-earth/index.ts` | NEW |
| F-08 | `apps/web/src/hooks/useScriptedCounter.ts` | NEW |
| F-09 | `apps/web/src/hooks/useGoldenEarthTap.ts` | NEW |
| F-10 | `apps/web/src/components/home/panels/HomeTodayPanel.tsx` | EDIT — swap hero L57–86 |
| F-11 | `apps/web/src/components/home/__tests__/HomeTodayPanel.test.tsx` | EDIT — golden-earth testids |
| F-12 | `apps/web/src/components/home/__tests__/golden-earth/GoldenEarthHero.test.tsx` | NEW |
| F-13 | `apps/web/src/components/home/__tests__/golden-earth/useScriptedCounter.test.tsx` | NEW |
| F-14 | `packages/i18n/src/locales/lovable-ko.ts` | EDIT — append `earn.goldenEarth.*` |
| F-15 | `packages/i18n/src/locales/lovable-en.ts` | EDIT — append `earn.goldenEarth.*` |

**NO-TOUCH:** `supabase/*` · `packages/{money,trading-engine,game-engine,wallet-ledger}` · `apps/web/src/domain/**` · `features/*/use-*.ts` · `HomeEarnPowerRow` · `LiveWinMarquee` · engine E2E paths.

---

## i18n (`earn.goldenEarth.*` · append only)

| Key | ko | en |
|-----|----|----|
| `earn.goldenEarth.eyebrow` | 전국민 탭 이벤트 | National tap event |
| `earn.goldenEarth.headline` | 황금 지구를 탭하세요 | Tap the golden earth |
| `earn.goldenEarth.subline` | 함께 모으면 잭팟 연출이 열려요 | Tap together to unlock the jackpot show |
| `earn.goldenEarth.mockNotice` | 이벤트 연출 · 실제 적립/당첨 아님 | Event demo · not real earnings or prizes |
| `earn.goldenEarth.counter.label` | 전국민 누적 탭 | Total taps (demo) |
| `earn.goldenEarth.counter.personal` | 내 탭 {count}회 | Your taps: {count} |
| `earn.goldenEarth.tap.label` | 탭! | Tap! |
| `earn.goldenEarth.tap.aria` | 황금 지구 탭하기 · 이벤트 연출 | Tap golden earth · event demo |
| `earn.goldenEarth.toast.bump` | +{amount}원 연출 | +{amount} demo |
| `earn.goldenEarth.urgency` | {remaining} 남음 · 잭팟 임박 (연출) | {remaining} left · jackpot near (demo) |
| `earn.goldenEarth.milestone.remaining` | 다음 잭팟까지 {remaining} | {remaining} until demo jackpot |
| `earn.goldenEarth.ticker.demo` | 방금 · {user}님 탭 +1 | Demo · {user} tapped +1 |
| `earn.goldenEarth.jackpot.title` | 잭팟 연출! | Demo jackpot! |
| `earn.goldenEarth.jackpot.body` | {nth}번째 탭 연출 · 축하해요 | Tap #{nth} demo · congrats |
| `earn.goldenEarth.jackpot.prizeExample` | 예시 상금 {amount} | Example prize {amount} |
| `earn.goldenEarth.jackpot.cta` | 확인 | Got it |
| `earn.goldenEarth.jackpot.dismissToast` | 연출 종료 · 미션에서 더 모아보세요 | Demo ended · earn more in missions |
| `earn.goldenEarth.link.missions` | 미션 더 보기 | See missions |

**FAIL =** `home.hero.*` 수정/삭제 · JSX inline 한/영 hardcode · 「실시간」「Live」「당첨 확정」 without demo qualifier.

**§GREEN catalog baseline:** KO=EN · record Δ (L1-GP baseline ~2712/2712 · +18 keys expected).

---

## 접근성 · 반응형 · 안전

| 항목 | 고정 |
|------|------|
| Touch target | hero button ≥ 48×48 (globe ≥120px) |
| Keyboard | focusable · Enter/Space · Modal focus trap |
| ARIA | counter `aria-live="polite"` · modal `labelledBy`/`describedBy` |
| reduced-motion | `useReducedMotionGuard` — no globe spin · no confetti · no vibrate · `useLiveCount` walk off |
| Color contrast | `text-foreground` on card · urgency `bg-warn/15` |
| 책임/오해 방지 | `mockNotice` always above fold · toast/modal 「연출」「예시」필수 |
| 사행성 오인 | 잭팟 = demo show · casino link 0 · no odds · no bet CTA |

---

## Tests (EXECUTE)

| Test | Assert |
|------|--------|
| `GoldenEarthHero.test.tsx` | render · tap → counter bump · mockNotice visible |
| `GoldenEarthHero.test.tsx` | 50 taps → modal open · dismiss |
| `GoldenEarthHero.test.tsx` | reduced-motion → no infinite animation class |
| `useScriptedCounter.test.tsx` | bump +1 · urgency threshold · remaining |
| `HomeTodayPanel.test.tsx` | `data-primary-cta` ×1 · `data-testid="golden-earth-hero"` |
| `HomeTabShell.test.tsx` | carry — exactly one primary CTA on today |

---

## LOCK Footer

| # | Rule |
|---|------|
| #F1 | Engine/SQL/domain diff **0** |
| #F2 | 잭팟/탭 **RPC·fetch·supabase 0** |
| #F3 | i18n **append only** — `earn.goldenEarth.*` · `home.hero.*` 불변 |
| #F4 | mock **mock답게** — `mockNotice` 필수 · 실데이터 위장 금지 |
| #F5 | fold0 `data-primary-cta` **= 1** · LiveWinMarquee **= 1 lane** · EarnPowerRow 유지 |
| #F6 | `/home` non-today tabs · CategoryRow ×3 **회귀 0** |
| #F7 | `prefers-reduced-motion` 준수 |
| #F8 | 사용자 문구 **i18n key only** — JSX inline copy 0 |

---

## EXECUTE Steps

| Step | Action |
|------|--------|
| **0** | operator **「L1-20 EXECUTE GO」** 1줄 · 본 LOCK **APPROVED** 확인 |
| **1** | `useScriptedCounter` · `useGoldenEarthTap` hooks |
| **2** | `golden-earth/*` components (Globe → Hero → Modal) |
| **3** | `HomeTodayPanel` hero swap · missions text link (non-primary-cta) |
| **4** | i18n append ko/en · `check:i18n` |
| **5** | vitest — golden-earth + HomeTodayPanel + HomeTabShell |
| **6** | `typecheck` |
| **7** | Manual 9b-H — `/home` tap 3 · 50 · Network RPC 0 · 390px + 1280px |
| **8** | **§GREEN full block** (아래) · evidence report |

---

## §GREEN full block (Step 8 · mandatory)

```bash
# Render anchors
rg "GoldenEarthHero|golden-earth-jackpot|home-golden-earth-tap|golden-earth-hero" apps/web/src/components/home/

# RPC 0
rg "rpc_|supabase|useQuery|fetch\(" apps/web/src/components/home/golden-earth/ apps/web/src/hooks/useScriptedCounter.ts apps/web/src/hooks/useGoldenEarthTap.ts

# i18n append only — home.hero.* must not appear in diff as changed lines
rg "earn\.goldenEarth\." packages/i18n/src/locales/lovable-ko.ts packages/i18n/src/locales/lovable-en.ts
git diff packages/i18n/src/locales/lovable-ko.ts packages/i18n/src/locales/lovable-en.ts

# primary CTA invariant
bun run test -- apps/web/src/components/home/__tests__/HomeTodayPanel.test.tsx apps/web/src/components/home/__tests__/HomeTabShell.test.tsx

# Engine 0
git diff --name-only supabase/ packages/money/ packages/trading-engine/ packages/game-engine/ packages/wallet-ledger/ apps/web/src/domain/

# Gates
bun run typecheck
bun run test -- apps/web/src/components/home/__tests__/golden-earth/
bun run check:i18n
```

**Manual (operator 1회):** `/home` → today · tap 3회 → toast + counter bump · 50 tap → jackpot modal · DevTools Network 잭팟/탭 RPC **0** · mobile 390px + desktop 1280px.

**§GREEN template:**

```text
L1-20 K1 황금 지구 §GREEN
- /home today: GoldenEarthHero render OK
- tap → toast + counter bump OK
- 50th tap → jackpot modal OK
- data-primary-cta = 1 · LiveWinMarquee = 1 lane · EarnPowerRow 5 cards carry
- typecheck PASS · vitest PASS · check:i18n PASS · catalog KO=___ EN=___ Δ=+18
- engine/SQL/domain diff 0 · RPC 0
- FAIL = (none)
```

---

## 신규 결정 — operator 확인 (§7)

> **APPROVED:** 아래 default로 LOCK 고정. REVISE 시 해당 #만 재작성.

| # | 결정 | LOCK default | §9 근거 | operator |
|---|------|--------------|---------|----------|
| D1 | 비주얼: 지구 vs 저금통 | **황금 지구 SVG** | 「또는」 | **APPROVED** |
| D2 | Hero: 교체 vs 병행 | **교체** (generic hero 제거) | hero 승계 · hero 1 | **APPROVED** |
| D3 | Mock jackpot trigger N | **personal every 50 taps** + global 10M cross | N번째 터치 | **REVISE=50 APPROVED** |
| D4 | Scripted seed count | **9,872,341** | 9,990만… 예시 근접 | **APPROVED** |
| D5 | Secondary `/earn/missions` link | **text link** (non-primary-cta) | EarnPowerRow 분리 | ✅ LOCK default |
| D6 | `home.hero.*` keys | **유지** (unused OK) · delete 금지 | i18n copy-only | ✅ LOCK default |
| D7 | Tap reward display | **+1 or +2원 random** toast | 1~2원 연출 | ✅ LOCK default |
| D8 | Doc path | `docs/LOVABLE_WORLD_CRUSH_L1-20_GOLDEN_EARTH_LOCK.md` | contract §3.1.4 | ✅ LOCK default |

**operator 회신 형식:** `APPROVE` / `REVISE D3=50` / `REJECT` + FAIL 1줄.

---

## Defer · L3 paste memo

| Item | Track |
|------|-------|
| `rpc_tap_contribute` · milestone ledger · conservation | L3 Engine · operator GO |
| anti-bot · KYC · prize pool | L3 |
| 저금통 SVG variant | operator GO on D1 REVISE |
| Trade UI 전면 재설계 | post-C-3 backlog |
| ZIP 발행 | operator 「ZIP 발행 GO」 전 **0** |

**paste adapter memo (L2):** K1 hero는 presentation-only — paste 시 `HomeTodayPanel` hero slot 그대로 흡수. L3 wire 시 `useGoldenEarthTap` 내부만 RPC swap · UI shell 유지.

---

## 변경 이력

| Date | Change |
|------|--------|
| 2026-06-21 | **APPROVED** — operator D1/D2/D4/D5–D8 APPROVE · D3 REVISE=50 · EXECUTE GO · §GREEN |
