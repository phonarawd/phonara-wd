# Phase 12-F.2 + 12-H-Theme — Home Bento + Aurora Ember LOCK v0.2.1 FINAL (정본)

> **Theme SOT:** [`LOVABLE_ZENITH_PHASE12_H_THEME_LOCK.md`](LOVABLE_ZENITH_PHASE12_H_THEME_LOCK.md)  
> **operator GO (2026-06-15):** **§A → §B 순차** · amend 4건 baked  
> **baseline:** catalog **1227** → **1233** (Δ +6) · sitemap **44** · vitest **356/356**

---

## 0. operator amend (v0.2.1)

| # | amend |
|---|--------|
| 1 | ID: **12-H-Theme** · Admin = **12-H-Admin defer** |
| 2 | i18n: **`src/i18n/ko.ts` + `en.ts`** (locales/*.json 폐기) |
| 3 | 순서: **① Aurora 토큰 → gate ② Bento → gate** (분리 revert) |
| 4 | Casino bento = **`/casino`** · **HomeGamesTeaserCard** full-width `/games` (Footer 위 · 12-C H6 carry) |

---

## 1. 실행 순서

```text
§A 12-H-Theme (styles.css) → Step 1 GATE → PASS
§B 12-F.2 Bento HomeHub      → Step 2 GATE → PASS
  → operator 「§C OK」 → 12-A 대기
FAIL §A → §A revert · §B 미진입
FAIL §B → §B revert · §A carry
```

---

## 2. §B 구조

```text
HomeHeroBar (sticky h-20)
LiveWinMarquee (h-9)
Bento 6-cell (2/3/4 col) — LimitedDrop|Check-in · Mission|Referral · Trade|Casino
HomeGamesTeaserCard (full-width secondary → /games)
HomeHubFooter
```

`data-hub-id="home-*"` **≥9** · 재배치만 · 제거 0

---

## 3. §B Files

**CREATE:** `HomeHeroBar.tsx` · `LiveWinMarquee.tsx` · `BentoCell.tsx`

**EDIT:** `HomeHub.tsx` · `StreakRing.tsx` (compact) · 4 teaser BentoCell wrap · `ko.ts`/`en.ts` +6

**PRESERVE (미사용 OK):** `HomeWelcomeCard.tsx` · `LiveActivityFeed.tsx` · `LimitedDropCard.tsx`

**i18n +6 keys:** `home.hero.balance` · `home.hero.todayEarned` · `home.hero.streakLabel` · `home.marquee.title` · `home.bento.dropBadge` · `home.bento.casinoLabel`

---

## 4. Step 2 GATE (R-F2.1 ~ R-F2.10)

| ID | 규칙 |
|----|------|
| R-F2.1 | `home.tsx` head Δ=0 |
| R-F2.2 | `data-hub-id="home-*"` ≥ 9 |
| R-F2.3 | `/trade` · `/trade/hub` · `/casino` route diff = 0 |
| R-F2.4 | HeroBar + Marquee + Bento + HomeGamesTeaserCard in HomeHub |
| R-F2.5 | HomeGamesTeaserCard → `/games` |
| R-F2.6 | Casino bento → `/casino` |
| R-F2.7 | i18n **1233** ko=en |
| R-F2.8 | sitemap **44** |
| R-F2.9 | vitest **356/356** |
| R-F2.10 | 390×844 첫 화면 Hero+Marquee+2 bento · 1280 bento 3col |

---

## 5. §D 통합 FAIL (Theme + Bento)

- light `@theme` / `:root` / `prefers-color-scheme: light` 잔존
- `html.dark` 미강제
- `bg-[#` · `text-white` · `bg-black` 하드코딩 신규
- vitest < 356 · ko≠en · home-hub-id < 9

---

## 6. NO-TOUCH

결제/원장/RPC · ImportedPages 40 · 8 Trade* · 8 Casino hub · 7 legacy FOMO · **12-G 14 route head()**

---

*v0.2.1 FINAL · operator GO · 2026-06-15*
