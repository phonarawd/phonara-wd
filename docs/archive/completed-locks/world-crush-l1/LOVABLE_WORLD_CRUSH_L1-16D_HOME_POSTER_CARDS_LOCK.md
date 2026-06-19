# LOVABLE World Crush · Home Poster Cards LOCK — L1-16d v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · **16/16 posters** · 6 new + 10 mapped · cover+gradient+glow hover · **L1-17 unblocked**  
> **큐 ID:** **L1-16d** (CategoryRow poster images · visual layer only)  
> **의존:** L1-16c ✅ · vitest **540/544** · catalog **2591/2591**  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16C_HOME_STAKE_LOBBY_LOCK.md)

---

## Scope (1줄)

`/home` `HomeCategoryRow` 카드를 text-only gradient → **포스터 이미지 카드**로 교체 · **16장 `.asset.json`** (기존 10 + 신규 6) resolve · to/title/badge **값 변경 0** · 시각 레이어만 · rpc/i18n **0-touch**.

---

## World Crush bar

| # | 필수 | FAIL |
|---|------|------|
| D1 | Every category card has **poster `<img>`** + bottom gradient overlay | text-only gradient cards remain |
| D2 | **16/16** `.asset.json` resolve · **0 broken** image | 404 · missing import |
| D3 | Poster tone = **dark-neon casino/finance** · matches 16c stake-lobby | flat placeholder · off-brand |
| D4 | hover `scale-105` on image · lazy load | no hover · layout shift break |
| D5 | `data-primary-cta`=**1** · fold0 stack **unchanged** | CTA count change |
| D6 | overflow-x / SideNav / WalletStrip / EarnPowerRow **unchanged** | 16c regression |

---

## Asset inventory (16 total)

### 기존 (10) — `src/assets/casino/*.jpg.asset.json`

| slug | file |
|------|------|
| crash | `crash.jpg` |
| plinko | `plinko.jpg` |
| mines | `mines.jpg` |
| dice | `dice.jpg` |
| roulette | `roulette.jpg` |
| blackjack | `blackjack.jpg` |
| hilo | `hilo.jpg` |
| limbo | `limbo.jpg` |
| gold-rush | `gold-rush.jpg` |
| mint-reels | `mint-reels.jpg` |

### 신규 (6) — generate + `lovable-assets create`

| slug | file | subject hint |
|------|------|--------------|
| tournaments | `tournaments.jpg` | tournament trophy · neon prize pool |
| fairness | `fairness.jpg` | provably fair · shield/hash aesthetic |
| spot | `spot.jpg` | spot trading · chart candles |
| staking | `staking.jpg` | staking pools · APR glow |
| tier | `tier.jpg` | VIP tier ladder · gold accent |
| sports | `sports.jpg` | sportsbook · live odds rhythm |

**Generation spec (신규 6 only):**

```text
tool: imagegen--generate_image
model: fast
size: 512×384
format: jpg
tone: casino/finance dark-neon poster — match existing stake-lobby casino assets
pipeline: lovable-assets create → src/assets/casino/{slug}.jpg → .asset.json sibling
```

**FAIL =** 신규 6 중 `.asset.json` 없음 · broken url · 톤이 flat gray placeholder

---

## Card markup (HomeCategoryRow · H16d-1)

`CategoryCard` type adds **`poster: string`** (resolved asset url).

```tsx
// CategoryCard inner (visual layer only — to/title/badge props unchanged)
<div className="relative overflow-hidden rounded-xl …">
  <img
    src={poster}
    className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
    loading="lazy"
    alt=""
    aria-hidden
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
  <div className="relative z-10 …">{/* title · badge — existing */}</div>
</div>
```

**FAIL =** poster 없이 gradient-only 카드 잔존 · `alt`에 한국어 literal (i18n NO-TOUCH → decorative `alt=""`)

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16d-1 | `src/components/home/HomeCategoryRow.tsx` | **EDIT** — `poster` field · img + overlay + hover |
| H16d-2 | `src/components/home/panels/HomeTodayPanel.tsx` | **EDIT** — import **16** `.asset.json` · inject `poster: posterX.url` per card · **to/title/badge unchanged** |
| H16d-3 | `src/assets/casino/{tournaments,fairness,spot,staking,tier,sports}.jpg` | **NEW** (+ `.asset.json` via lovable-assets) |
| H16d-4 | `src/components/home/__tests__/HomeTodayPanel.test.tsx` | **EDIT** — per row: `<img>` count === cards length |

**Touch count = 4 files** (+ 6 asset pairs) · **DELETE 0**

---

## Poster mapping (HomeTodayPanel · values frozen)

**Rule:** map posters to existing card slots by row — **do not change** `to` · `title` · `badge` · card count per row (Casino 6 · Games 6 · Trade 3 = **15 cards** · **16 assets** = full library; unused 1 asset may attach to duplicate slot or reserve card only if row already had 6+6+3 — document choice in §GREEN).

**Suggested mapping (adjust only if feed ids differ · titles stay):**

| Row | cards | poster source |
|-----|-------|---------------|
| Casino | 6 | top 6 from `casino-feed.ts` → matching game slugs from existing 10 |
| Games | 6 | remaining game slugs + tournaments/fairness as feed order dictates |
| Trade | 3 | `spot` · `staking` · `sports` or chart card → `spot` |

**§GREEN must state:** 16/16 `.asset.json` import resolve · 0 broken · mapping table 1 line.

---

## NO-TOUCH

`/trade` · admin · games **rpc/engine** · BottomNav · SideNav · WalletStrip · EarnPowerRow · TierChip · LiveWinMarquee · Marquee · Hero · **i18n catalog** (append **0**) · 5 tabs · fold0 order · `data-primary-cta` location · ZIP

---

## LOCK Footer H16d-F1 ~ H16d-F7

| # | 고정 | FAIL |
|---|------|------|
| F1 | `CategoryCard.poster` rendered on **all** row cards | any text-only card |
| F2 | **16** asset.json files resolve | <16 or broken url |
| F3 | 신규 6 jpg + asset.json present | missing slug |
| F4 | `data-primary-cta` **= 1** on today | ≠1 |
| F5 | vitest **541/545 carry** (+1 test · 4 NO-TOUCH) | regression |
| F6 | i18n **DIFF=0** · catalog **2591** carry | key append |
| F7 | 16c layout/shell **0 regression** | overflow-x break |

---

## EXECUTE Steps 0→5

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 540/544 · 2591 |
| 1 | H16d-3 — generate 6 posters · `lovable-assets create` · verify 16 `.asset.json` |
| 2 | H16d-1 — HomeCategoryRow poster markup |
| 3 | H16d-2 — HomeTodayPanel imports + poster injection |
| 4 | H16d-4 — img count test per row |
| 5 | vitest home + full · §GREEN + **9b-Hd manual screenshots** |

---

## §GREEN full block

```bash
bunx vitest run src/components/home/
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print('DIFF',len(ko^en))"

rg -n 'poster' src/components/home/HomeCategoryRow.tsx
rg -c 'data-primary-cta' src/components/home/panels/HomeTodayPanel.tsx
rg -n '\.asset\.json' src/components/home/panels/HomeTodayPanel.tsx | wc -l
ls src/assets/casino/*.jpg.asset.json | wc -l
```

**PASS:** vitest **541/545 carry** (+1 OK) · DIFF=**0** · catalog **2591** · `ls` asset.json **≥16** · primary-cta=**1** · all row cards show poster img · 0 broken.

**§GREEN template:**

```text
L1-16d §GREEN — CategoryRow poster cards · 16 asset.json resolve · 6 new posters · vitest N/N carry · DIFF=0 · 9b-Hd PASS · L1-17 unblocked · ZIP defer.
```

---

## 9b-Hd manual (Preview device toggle)

1. **PC 1280px** — Casino/Games/Trade rows: every card shows poster (no broken icon)
2. **Mobile 390px** — same · horizontal row scroll intact · no page overflow-x
3. hover scale on desktop spot-check
4. fold0 unchanged · CTA=1 · SideNav/drawer OK
5. en mode Korean 0

**FAIL =** broken image · text-only card visible · poster missing on any slot

---

## Defer

- L1-17 Trade split — **blocked until 16d §GREEN**
- WebP/retina `@2x` — optional future slice
- i18n alt text for posters — defer (decorative aria-hidden)

---

## paste adapter memo (PHONARA L2)

- Copy `src/assets/casino/*.jpg` + `.asset.json` with presentation-import zone
- Vite asset import pattern unchanged

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — poster cards · 6 new assets |

---

*L1-17 blocked until 16d §GREEN · Lovable canvas only*
