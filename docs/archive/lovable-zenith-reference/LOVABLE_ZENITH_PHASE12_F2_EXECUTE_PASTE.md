# Phase 12-F.2 + 12-H-Theme EXECUTE GO — Lovable 붙여넣기 (v0.2.1)

> **LOCK:** [`LOVABLE_ZENITH_PHASE12_F2_LOCK.md`](LOVABLE_ZENITH_PHASE12_F2_LOCK.md) · Theme: [`LOVABLE_ZENITH_PHASE12_H_THEME_LOCK.md`](LOVABLE_ZENITH_PHASE12_H_THEME_LOCK.md)

---BEGIN---

# 12-F.2 + 12-H-Theme EXECUTE GO · Aurora Ember + Home Bento (v0.2.1)

operator 확정: **§A → §B 순차** · FAIL=해당 단계만 revert · **ZIP/paste 금지**.

**첫 응답 1줄:** `12-F.2 + 12-H-Theme EXECUTE GO 수령 · §A Aurora 토큰 착수.`

**i18n 정본:** `src/i18n/ko.ts` · `src/i18n/en.ts` (+6 · catalog **1227→1233**)

---

# §A · 12-H-Theme — Aurora Ember (Step 1)

## A1 — `src/styles.css`

`:root` 토큰 블록 교체 (shadcn 이름 보존):

```css
:root {
  --background: oklch(0.12 0.025 285);
  --foreground: oklch(0.96 0.01 80);
  --card: oklch(0.16 0.035 280);
  --card-foreground: oklch(0.96 0.01 80);
  --popover: oklch(0.18 0.04 280);
  --popover-foreground: oklch(0.96 0.01 80);
  --muted: oklch(0.22 0.03 280);
  --muted-foreground: oklch(0.68 0.02 280);
  --border: oklch(0.25 0.04 280);
  --input: oklch(0.22 0.035 280);

  --primary: oklch(0.72 0.20 45);
  --primary-foreground: oklch(0.12 0.02 285);
  --primary-glow: oklch(0.82 0.18 65);
  --secondary: oklch(0.86 0.17 95);
  --secondary-foreground: oklch(0.12 0.02 285);
  --accent: oklch(0.78 0.18 55);
  --accent-foreground: oklch(0.12 0.02 285);

  --destructive: oklch(0.65 0.22 25);
  --destructive-foreground: oklch(0.96 0.01 80);
  --success: oklch(0.78 0.18 155);
  --warning: oklch(0.82 0.18 75);
  --ring: oklch(0.72 0.20 45);

  --gradient-ember: linear-gradient(135deg, oklch(0.72 0.20 45), oklch(0.86 0.17 95));
  --gradient-sunset: linear-gradient(180deg, oklch(0.16 0.035 280), oklch(0.22 0.06 35));
  --shadow-ember: 0 10px 40px -10px color-mix(in oklab, oklch(0.72 0.20 45) 40%, transparent);
  --shadow-soft: 0 4px 20px -8px oklch(0.08 0.02 285 / 0.5);

  --radius: 1rem;
}
```

**삭제:** `.dark { ... }` 중복 · `@media (prefers-color-scheme: light)` · light 토큰  
**유지:** `@theme inline { --color-*: var(--*) }`

## A2 — `index.html`

`<html class="dark" lang="ko">` 강제 · OS light 추종 OFF

## A3 — Step 1 GATE

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }

rg -n '@media \(prefers-color-scheme: light\)' src/ \
  && fail "R-H2 light media" || echo "OK R-H2"
rg -n 'class="dark"' index.html || fail "R-H3 html.dark"
rg -n 'bg-\[#|text-\[#|text-white\b|bg-black\b' src/components src/routes \
  && fail "R-H4 hardcode" || echo "OK R-H4"

VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1 | rg '356 passed \(356\)' || fail "vitest"

[ $RED -eq 0 ] && echo "===== §A GREEN 12-H-Theme =====" || { echo "===== §A RED — revert §A only ====="; exit 1; }
```

**§A GREEN 보고:** mobile 390 + desktop 1280 screenshot · ember 적용 · `/earn` `/casino` `/trade` inherit smoke.

**§A RED → §B 미진입.**

---

# §B · 12-F.2 — Home Bento (Step 2 · §A GREEN 후)

## B0 — Pre-flight

```bash
test -f src/components/home/HomeHub.tsx || exit 1
git diff --quiet -- src/routes/trade.tsx src/routes/trade.hub.tsx src/routes/casino.index.tsx || exit 1
echo "OK B0"
```

## B1 — CREATE

- `HomeHeroBar.tsx` — sticky · balance · todayEarned · StreakRing compact · `home-welcome` id carry
- `LiveWinMarquee.tsx` — CSS marquee 1줄
- `BentoCell.tsx` — min-h-[140px] wrapper

## B2 — EDIT HomeHub

```text
HomeHeroBar → LiveWinMarquee → Bento(6) → HomeGamesTeaserCard(/games) → HomeHubFooter
```

| Bento | Link |
|-------|------|
| Limited Drop | (셀 내부) |
| Check-in | earn |
| Mission | earn/missions |
| Referral | /referral |
| Trade | /trade |
| **Casino** | **/casino** |

**HomeGamesTeaserCard:** full-width secondary · **`/games`** (12-C H6 · Footer 위)

**BentoCell wrap (텍스트 0):** CheckIn · Mission · Referral · Trade teasers  
**StreakRing:** `compact?: boolean`  
**파일 보존:** HomeWelcomeCard · LiveActivityFeed · LimitedDropCard (import 제거 OK)

## B3 — i18n +6 (`ko.ts` / `en.ts`)

`home.hero.balance` · `home.hero.todayEarned` · `home.hero.streakLabel` · `home.marquee.title` · `home.bento.dropBadge` · `home.bento.casinoLabel`

## B4 — Step 2 GATE

```bash
set -u; RED=0; fail(){ echo "FAIL $*"; RED=1; }

git diff src/routes/home.tsx | rg "^[+-].*\b(head|meta|canonical|ld\+json)\b" \
  && fail "R-F2.1" || echo "OK R-F2.1"

HUB_IDS=$(rg -oN 'data-hub-id="home-[^"]+"' src/components/home/ | wc -l | tr -d ' ')
[ "$HUB_IDS" -ge 9 ] || fail "R-F2.2 ids=$HUB_IDS"

git diff --quiet -- src/routes/trade.tsx src/routes/trade.hub.tsx src/routes/casino.index.tsx \
  || fail "R-F2.3 route drift"

rg -n 'HomeHeroBar|LiveWinMarquee|BentoCell|HomeGamesTeaserCard' src/components/home/HomeHub.tsx \
  || fail "R-F2.4 layout"
rg -n 'to="/games"' src/components/home/HomeGamesTeaserCard.tsx || fail "R-F2.5 games"
rg -n 'to="/casino"' src/components/home/ | rg -v GamesTeaser || true
# Casino bento cell must link /casino — verify in LimitedDrop row partner or dedicated casino teaser

bash scripts/i18n-parity.sh || fail "i18n 1233"
URLN=$(rg -c '<url>' public/sitemap.xml); [ "$URLN" = "44" ] || fail "sitemap"

VLOG=$(mktemp); set +e; bunx vitest run 2>&1 | tee "$VLOG"; set -e
rg 'Tests\s+[0-9]+ passed \([0-9]+\)' "$VLOG" | tail -1 | rg '356 passed \(356\)' || fail "vitest"

[ $RED -eq 0 ] && echo "===== §B GREEN 12-F.2 catalog=1233 =====" || { echo "===== §B RED — revert §B only ====="; exit 1; }
```

## B5 — §GREEN 보고

1. `/home` 390×844 · 1280 screenshot  
2. 첫 화면: HeroBar + Marquee + **≥2 bento**  
3. HomeGamesTeaserCard **`/games`** ✓  
4. §A Aurora **carry** ✓  

**NEXT:** operator 「§C OK」→ **12-A** · ZIP 금지

---END---
