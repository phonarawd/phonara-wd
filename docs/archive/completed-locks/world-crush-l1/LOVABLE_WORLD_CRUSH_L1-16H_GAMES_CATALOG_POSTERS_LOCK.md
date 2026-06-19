# LOVABLE World Crush · Game Poster Live Counts LOCK — L1-16h v0.2 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · GameCard `/games` · live seeds ~79k · vitest carry **4 NO-TOUCH mint-reels auto.wiring** · DIFF=0  
> **큐 ID:** **L1-16h** (`/games` + `/casino` · GameCard unify · live bot counts · 1M-scale seeds)  
> **의존:** L1-16d ✅ · L1-16g ✅ · vitest carry **544/548+** · catalog **2595+** (i18n **0-touch**)  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

**10게임 poster + live player counter** — `/games` catalog → **`GameCard`** (poster · RTP · `useLiveCount`) · `/casino` lobby **seed scale bump** (~79k total concurrent feel) · **`useLiveCount` behavior NO-TOUCH** · i18n **0**.

---

## Problem

| surface | 현재 | 목표 |
|---------|------|------|
| `/games` | icon tiles · no poster · no live count | **GameCard** poster + ticking 🟢 count |
| `/casino` | posters tick ✓ · seeds ~500–3,100 | **same UX** · seeds **1M-platform scale** |

```text
┌──────────────────────────┐
│ [POSTER]   🟢 12,438 playing │  ← useLiveCount ±0.5–2.5% / 1.4–2.8s
│ Crash             RTP 99   │
└──────────────────────────┘
```

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16h-1 | `src/components/pages/ImportedGamesCatalogPage.tsx` | **EDIT** — GameCard · poster + live + rtp · favorite wrapper |
| H16h-2 | `src/components/casino/HotGamesRow.tsx` | **EDIT** — `live` seed bump only |
| H16h-3 | `src/components/pages/ImportedCasinoPage.tsx` | **EDIT** — `GAMES` array `live` seeds |

**Touch = 3 files** · **DELETE 0** · **new assets 0** · **`useLiveCount` hook NO-TOUCH**

---

## H16h-1 — `/games` catalog → `GameCard`

1. Import **10** `src/assets/casino/*.jpg.asset.json`
2. Extend **`GameMeta`:** `poster: string` · `live: number` · `rtp` (copy casino lobby values)
3. **Drop** per-tile `Icon` / `hue` rendering
4. Replace custom `aspect-square` tile with:

```tsx
<div className="relative">
  <GameCard to={...} name={...} rtp={...} live={...} poster={...} tone={...} />
  {/* existing favorite star — absolute overlay, unchanged behavior */}
</div>
```

5. **Coming Soon:** `!enabled` → disabled duplicate without `<Link>` (same as today)
6. **`GameCard`** already wires `useLiveCount` + `useInView` + poster + RTPChip + PF badge — **no duplicate logic**

**FAIL =** custom live count hook · icon-only tiles on enabled games

---

## Seed scale (H16h-1/2/3 · fixed table)

| Game | Old (lobby) | **New seed** |
|------|-------------|--------------|
| Crash | 3,128 | **18,420** |
| Plinko | 2,475 | **14,260** |
| Mines | 1,982 | **11,840** |
| Dice | 1,647 | **9,730** |
| Limbo | 1,284 | **7,510** |
| Hi-Lo | 932 | **5,840** |
| Blackjack | 612 | **4,120** |
| Roulette | 487 | **3,260** |
| Mint Reels | 318 | **2,180** |
| Gold Rush | 274 | **1,860** |

**Total ≈ 79k** concurrent — credible for 1M+ user platform (5–10% concurrency narrative).

Update in **all 3 files** · values **must match** across surfaces.

**FAIL =** old ~500–3,100 seeds remain on any of 10 games on `/casino` or `/games`

---

## `useLiveCount` (NO-TOUCH)

Already: ±0.5–2.5% · interval 1.4–2.8s · slight upward drift · pause off-screen / tab hidden / reduced-motion.

**Do not change hook** — vitest for `useLiveCount` must stay green.

---

## LOCK Footer H16h-F1 ~ H16h-F8

| # | 고정 | FAIL |
|---|------|------|
| F1 | `/games` **10** tiles use **GameCard** with poster + live badge | icon tiles |
| F2 | `/casino` + `/games` seeds = **v0.2 table** | old small seeds |
| F3 | Live count **ticks** ~2s on both surfaces (in-view) | static count |
| F4 | Favorite · HOT/NEW · Coming Soon **unchanged** | overlay regression |
| F5 | **i18n DIFF=0** · no new keys | key append |
| F6 | `useLiveCount` **unmodified** | hook edit |
| F7 | vitest carry · `useLiveCount` tests green | fail |
| F8 | engines · routes · MobileGameFrame · GameDetailFrame · Home **0-touch** | scope creep |

---

## EXECUTE Steps 0→4

| Step | 작업 |
|------|------|
| 0 | LOCK ACK v0.2 · baseline |
| 1 | H16h-2 + H16h-3 casino seed bump |
| 2 | H16h-1 GameCard migration + favorite wrapper |
| 3 | Visual `/games` + `/casino` · tab blur pause check |
| 4 | vitest full · §GREEN + **9b-Hh manual** |

---

## §GREEN full block

```bash
bunx vitest run
bunx vitest run useLiveCount

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print('DIFF',len(ko^en))"

rg -n 'GameCard' src/components/pages/ImportedGamesCatalogPage.tsx
rg -n '18420|14260|11840' src/components/casino/HotGamesRow.tsx src/components/pages/ImportedCasinoPage.tsx
```

**PASS:** vitest carry · DIFF=**0** · `/games` + `/casino` poster + live tick · seeds ≥ table · useLiveCount tests green.

**§GREEN template:**

```text
L1-16h §GREEN v0.2 — GameCard on /games · live seeds 79k scale · casino+games unified · useLiveCount 0-touch · vitest carry · DIFF=0 · 9b-Hh PASS · ZIP defer.
```

---

## 9b-Hh manual

1. **`/games`** — 10 posters + 🟢 playing count · ticks every ~2s
2. **`/casino`** — same scale numbers · ticks
3. Tab blur → counts pause · return → resume
4. Category tabs on `/games` — posters + live OK
5. Favorite star still works

**FAIL =** icon tile · static count · old small seeds · hook behavior changed

---

## NO-TOUCH

`src/games/*` engines · routes · **i18n keys** · `useLiveCount` implementation · MobileGameFrame · GameDetailFrame · HomeSideNav · HomeTabShell · `/trade` · admin · sports · wallet · BottomNav · ZIP · rpc

---

## Defer

- L1-18 FOMO — after L1-17 §GREEN
- operator **`16h HEAD`** → run before L1-17

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 — poster-only catalog (superseded) |
| 2026-06-17 | **v0.2** — GameCard + live counts + 1M-scale seeds · 3 files |

---

*Default queue: after L1-17 §GREEN · Lovable canvas only*
