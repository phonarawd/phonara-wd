# Phase 12-A Casino World-Class Hub — LOCK v0.1 FINAL (정본)

> **GAP:** #2·#3 P0 · **선행:** 12-F GREEN · catalog **1177** → **1201**  
> **defer:** `src/games/**` Pixi → **12-A v0.2**

---

## 2. Files

**CREATE (8):** `src/components/casino/`

| file | spec | data-hub-id |
|------|------|-------------|
| FeaturedCarousel | 3-slide auto hero | casino-featured |
| LiveWinTicker | win marquee | casino-ticker |
| ProvablyFairBadge | PF + tooltip | casino-pf |
| GameCardHover | hover preload · RTP/volatility | casino-hover |
| CategoryRail | Slots/Live/Crash/Table | casino-rail |
| JackpotMeter | jackpot counter | casino-jackpot |
| RTPChip | RTP% chip | casino-rtp |
| CasinoHub | 7 조립 + catalog grid embed | casino-hub |

**EDIT:** `casino.index.tsx` (component swap · head Δ=0) · `locales/ko.json` · `en.json` (+24)

**NO-TOUCH:** casino game routes · ImportedCasino pages · games engine · trade/home/earn

---

## 4. Gates

| ID | 규칙 |
|----|------|
| R-A1 | casino.index head Δ=0 |
| R-A2 | `data-hub-id="casino-*"` = **8** |
| R-A3 | game routes + src/games quiet |

**§GREEN:** catalog **1201** · vitest **356/356** · sitemap **43**

---

*v0.1 FINAL · 2026-06-15*
