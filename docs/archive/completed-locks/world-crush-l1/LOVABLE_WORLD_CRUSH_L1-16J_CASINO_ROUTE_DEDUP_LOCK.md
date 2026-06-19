# LOVABLE World Crush · Casino Route Dedup LOCK — L1-16j v0.1 EXECUTE

> **상태:** **CANCELLED** · superseded by [`LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16L_DEAD_CODE_SWEEP_LOCK.md) · 2026-06-17  
> **큐 ID:** **L1-16j** (`/casino` → ImportedCasinoPage · `/casino/games` catalog · CasinoHub deprecate)  
> **의존:** L1-16h ✅ · L1-16i ✅ · vitest **572/572** · catalog carry  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

Fix **orphan casino pages** — wire `/casino` → **`ImportedCasinoPage`** (posters + live + HOT/Slots/Live/New tabs) · add **`/casino/games`** → **`ImportedGamesCatalogPage`** · deprecate dead **`CasinoHub`** · SEO/game routes **unchanged**.

---

## Diagnosis (locked)

| route | current | problem |
|-------|---------|---------|
| `/casino` | `casino.index.tsx` → **`CasinoHub`** | old CategoryRail · no posters · no live counts |
| — | `ImportedCasinoPage` | **orphan** — not imported by any route |
| — | `ImportedGamesCatalogPage` | **orphan** — not imported |
| comment drift | `casino.hub.tsx` says ImportedCasinoPage | **not wired** |

**OK:** `/casino/<game>` 10 routes · `/games/*` → `/casino` redirect

---

## Changes

### H16j-1 — `/casino` wiring

**File:** `src/routes/casino.index.tsx`

- Remove `CasinoHub` import
- Import + render **`<ImportedCasinoPage />`**
- **`head()` SEO** — **unchanged**

**FAIL =** CasinoHub still default export on `/casino`

### H16j-2 — catalog route (new)

**File:** `src/routes/casino.games.tsx` (**NEW**)

```tsx
createFileRoute("/casino/games") → <ImportedGamesCatalogPage />
```

- Own `head()` · canonical · breadcrumb
- Full catalog (favorites · filters) — separate URL from hub; future "see all" CTA target

### H16j-3 — CasinoHub deprecate

**File:** `src/components/casino/CasinoHub.tsx`

- Add **`@deprecated`** JSDoc at top — "superseded by ImportedCasinoPage · remove next cleanup"
- **DELETE 0** this slice

### H16j-4 — tests

- `rg` — no dedicated CasinoHub unit tests (confirmed)
- If `ImportedCasinoPage` lacks `data-testid="casino-hub"`, **add** to match e2e expectations (only if `rg` shows consumers)
- HomeTabShell tests — **NO-TOUCH**

---

## LOCK Footer H16j-F1 ~ F6

| # | 고정 | FAIL |
|---|------|------|
| F1 | `/casino` renders **ImportedCasinoPage** (posters + live) | CasinoHub visible |
| F2 | `/casino/games` route exists · catalog page loads | 404 |
| F3 | `CasinoHub` **not imported** by any route | active import |
| F4 | `/casino/<game>` ×10 · `/games` redirect **unchanged** | route break |
| F5 | vitest **572/572** · build green | regression |
| F6 | i18n · engines · GameDetailFrame · BottomNav **0-touch** | scope creep |

---

## EXECUTE Steps 0→4

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 572/572 |
| 1 | H16j-1 casino.index swap |
| 2 | H16j-2 casino.games route |
| 3 | H16j-3 CasinoHub @deprecated |
| 4 | vitest + build · §GREEN + **9b-Hj manual** |

---

## §GREEN full block

```bash
bunx vitest run
bun run build

rg -n 'CasinoHub' src/routes/
rg -n 'ImportedCasinoPage' src/routes/casino.index.tsx
rg -n 'ImportedGamesCatalogPage' src/routes/casino.games.tsx
```

**PASS:** vitest **572/572** · build OK · `/casino` no CasinoHub import · manual: BottomNav "게임" → new tabbed hub with posters + live.

**§GREEN template:**

```text
L1-16j §GREEN — /casino→ImportedCasinoPage · /casino/games catalog · CasinoHub deprecated · vitest 572/572 · build OK · 9b-Hj PASS · ZIP defer.
```

---

## 9b-Hj manual

1. Home → BottomNav **게임** → `/casino` shows **HOT/Slots/Live/New tabs** + **10 posters** + **live counts**
2. Navigate `/casino/games` → full catalog · favorites · filters
3. `/casino/crash` (any game) — still works
4. `/games` redirect — unchanged
5. en mode — no regression

**FAIL =** old CategoryRail hub · orphan pages still unreachable

---

## NO-TOUCH

`src/games/*` engines · `/casino/<game>` route files (10) · GameDetailFrame · GameBackLink · HomeTabShell · HomeSideNav · BottomNav href targets (still `/casino`) · `/games` redirect route · MoreMenu · wallet · trade · sports · admin · **i18n keys** · design tokens

---

## Defer

- "전체 게임 보기" CTA from hub → `/casino/games` — optional next slice
- **CasinoHub.tsx DELETE** — next cleanup after design sign-off
- L1-17 Trade — **HEAD** unless `16j HEAD`

---

## paste adapter memo

- `casino.index` + `casino.games` map to PHONARA router post-paste
- Single `/casino` SOT avoids duplicate hub in `apps/web`

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — casino route dedup |

---

*Default: after L1-17 §GREEN · Lovable canvas only*
