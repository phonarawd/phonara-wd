# LOVABLE World Crush · Dead Code & Dedup Sweep LOCK — L1-16l v0.1 EXECUTE

> **상태:** **✅ §GREEN** · operator report 2026-06-17 · vitest **572/572** · **L1-17 HEAD next**  
> **큐 ID:** **L1-16l** (delete-only · no features · world-class 1-tier hygiene)  
> **의존:** L1-16k ✅ · L1-16h/i ✅ · vitest **572/572**  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

**Delete-only sweep** — sidebar Games dup · orphan casino components · legacy routes · deprecated SideNav · unused `/casino/games` catalog · **no engine/feature/i18n-delete** · vitest carry green.

---

## A. UX dedup (visible)

### A1 — HomeSideNav 5 items

**File:** `src/components/home/HomeSideNav.tsx`

- Remove `/games` NAV entry · remove `Joystick` import
- **5 items:** 홈 · 카지노 · 스포츠 · 거래 · 지갑

**FAIL =** sidebar still shows separate "게임" → `/games`

### A2 — i18n

- `home.side.nav.games` — **NO DELETE this slice** · memo only for next i18n cleanup cycle
- **FAIL =** ko/en key removed (parity break)

---

## B. Route slim

### B1 — Keep `/games` redirect chain

**KEEP:**
- `games.tsx` (layout)
- `games.index.tsx` → `/casino` redirect (bookmarks)
- `games.$gameId.tsx` → deep link compat

**DELETE:**
- `src/routes/games.fairness.tsx`
- `src/routes/games.history.tsx`
- `src/routes/games.tournaments.tsx`

### B2 — DELETE

- `src/routes/casino.hub.tsx`

### B3 — DELETE unused catalog (supersedes L1-16j)

- `src/routes/casino.games.tsx`
- `src/components/pages/ImportedGamesCatalogPage.tsx`

**Rationale:** no inbound links · `/casino` ImportedCasinoPage tabs sufficient · dual catalog = confusion

**L1-16j status:** **SUPERSEDED / CANCELLED** — do not wire ImportedGamesCatalogPage

---

## C. Orphan casino components — DELETE

| file | reason |
|------|--------|
| `src/components/casino/CasinoHub.tsx` | dead |
| `src/components/casino/CategoryRail.tsx` | CasinoHub only |
| `src/components/casino/GameCardHover.tsx` | CategoryRail only |
| `src/components/casino/FeaturedCarousel.tsx` | CasinoHub only |
| `src/components/casino/RecentlyPlayed.tsx` | CasinoHub only |
| `src/components/casino/BigWinHero.tsx` | unused |
| `src/components/casino/JackpotCountdown.tsx` | unused |

**KEEP (in use):**
- `JackpotMeter.tsx` ← FomoFullSection
- `LeaderboardPanel.tsx` ← TournamentsSection

**Delete order (leaves first):** BigWinHero · JackpotCountdown · GameCardHover → CategoryRail · FeaturedCarousel · RecentlyPlayed → CasinoHub

---

## D. Shell — DELETE

- `src/components/shell/SideNav.tsx` (post-16k · import 0)

---

## E. Auto-generated

- `routeTree.gen.ts` — **regenerate only** · manual edit **FORBIDDEN**
- `.lovable/plan.md` — update with this plan

---

## LOCK Footer H16l-F1 ~ F8

| # | 고정 | FAIL |
|---|------|------|
| F1 | Sidebar **5** items · no `/games` nav | 6 items or games link |
| F2 | `rg` dead components **0** hits (excl routeTree.gen) | orphan import |
| F3 | `rg` SideNav · `/casino/hub` · `/casino/games` **0** (excl gen) | stale ref |
| F4 | `/casino` → **ImportedCasinoPage** loads | CasinoHub |
| F5 | `/games` · `/games/crash` redirect OK | broken redirect |
| F6 | vitest **572 carry** or Δ=deleted tests only · **0 new fail** | regression |
| F7 | engines · GameDetailFrame · BottomNav **0-touch** | scope creep |
| F8 | i18n keys **not deleted** this slice | parity break |

---

## EXECUTE Steps 0→6

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline vitest |
| 1 | A1 HomeSideNav 5 items |
| 2 | B1–B3 route deletes · regen routeTree |
| 3 | C orphan casino deletes (leaf→root order) |
| 4 | D SideNav delete |
| 5 | rg full self-check block |
| 6 | vitest + build · §GREEN + **9b-Hl manual** |

---

## §GREEN full block

```bash
bunx vitest run
bun run build

rg "CasinoHub|CategoryRail|GameCardHover|FeaturedCarousel|RecentlyPlayed|BigWinHero|JackpotCountdown" src/ --glob '!**/routeTree.gen.ts'
rg "shell/SideNav|/casino/hub|/casino/games|ImportedGamesCatalogPage" src/ tests/ --glob '!**/routeTree.gen.ts'
rg "Joystick" src/components/home/HomeSideNav.tsx
```

**PASS:** rg **0** (excl routeTree.gen) · vitest no new fails · build OK · manual checks F1/F4/F5.

**§GREEN template:**

```text
L1-16l §GREEN — dead code sweep · sidebar 5 · routes slim · orphans deleted · SideNav gone · vitest N/N · build OK · L1-17 HEAD · ZIP defer.
```

---

## 9b-Hl manual

1. Sidebar: **홈/카지노/스포츠/거래/지갑** (5)
2. `/casino` — ImportedCasinoPage · posters+live
3. `/games` → `/casino` · `/games/crash` → `/casino/crash`
4. No `/casino/games` · no old SideNav labels on any page
5. e2e spec strings — spot-check no broken paths

---

## NO-TOUCH

`src/games/**` · `/casino/<game>` ×10 routes · GameDetailFrame · BottomNav · TopBar · HomeSideNav search/promo · AppShell structure · **i18n key delete** · design tokens · admin · sports · trade · wallet

---

## Risks

| risk | mitigation |
|------|------------|
| e2e references deleted routes | rg `tests/e2e` after delete |
| lazy import strings | rg component filenames |
| routeTree drift | dev regen · no hand edit |

---

## Defer

- `home.side.nav.games` i18n key removal — **next slice**
- L1-17 Trade — **HEAD after 16l §GREEN** (or parallel if operator OK)

---

## paste adapter memo

- PHONARA paste: do not restore CasinoHub · SideNav · games.* subroutes
- Single catalog SOT: `/casino` ImportedCasinoPage

---

## §GREEN evidence (2026-06-17)

| check | result |
|-------|--------|
| vitest | **572/572** |
| sidebar | **5** items · "게임" dup removed |
| routes deleted | **6** (games.* sub · casino.hub · casino.games 등) |
| orphans deleted | **8** (CasinoHub tree + SideNav + catalog page) |
| `/casino` | ImportedCasinoPage OK |
| `/games` · `/games/crash` | redirect OK |
| i18n | `home.side.nav.games` **retained** (defer delete) |

```text
L1-16l §GREEN — dead code sweep · sidebar 5 · routes slim · orphans deleted · SideNav gone · vitest 572/572 · build OK · L1-17 HEAD · ZIP defer.
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO · supersedes L1-16j |
| 2026-06-17 | **§GREEN** · operator canvas report · 572/572 |

---

*Delete-only · Lovable canvas · L1-16j CANCELLED*
