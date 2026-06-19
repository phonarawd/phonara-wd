# LOVABLE World Crush · Global Sidebar Unify LOCK — L1-16k v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · SideNav import **0** · global HomeSideNav 6+search+promo · vitest carry **572/572**  
> **큐 ID:** **L1-16k** (AppShell `SideNav` → `HomeSideNav` global · legacy deprecate)  
> **의존:** L1-16e ✅ (HomeSideNav 6 items) · vitest **572/572**  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16E_HOME_NAV_HOTFIX_LOCK.md)

---

## Scope (1줄)

Replace **legacy `shell/SideNav`** (8+2 Earn/Referral/Rank/Account/Settings) with **`HomeSideNav`** (6 items + search + promo) on **all desktop pages** via `AppShell` · **`hideSideNav` on `/home` unchanged** · SideNav **@deprecated** · DELETE 0.

---

## Diagnosis (locked)

| component | mount | problem |
|-----------|-------|---------|
| `shell/SideNav.tsx` | `AppShell` all routes except `/home` hide | **old** 8+2 nav on `/casino` `/sports` `/trade` … |
| `HomeSideNav.tsx` | `/home` only via `HomeShellFrame` + `hideSideNav` | new nav **not global** |

**Target:** desktop sticky sidebar = **HomeSideNav everywhere** · `/home` no duplicate (hideSideNav carry).

---

## Changes

### H16k-1 — AppShell swap

**File:** `src/components/shell/AppShell.tsx`

```tsx
// remove: import { SideNav } from ...
import { HomeSideNav } from "@/components/home/HomeSideNav";

// replace <SideNav /> with:
<aside className="sticky top-0 hidden h-dvh w-56 shrink-0 md:block">
  <HomeSideNav />
</aside>
```

- **`hideSideNav` prop** — **keep** · `/home` passes `true` (HomeShellFrame already renders HomeSideNav)
- **`HomeSideNav` uses `h-full`** — **must** wrap in sticky `h-dvh` container (operator memo)

**FAIL =** `SideNav` still imported/rendered in AppShell

### H16k-2 — Legacy deprecate

**File:** `src/components/shell/SideNav.tsx`

- Top **`@deprecated`** JSDoc — superseded by HomeSideNav · remove next cycle
- **DELETE 0** this slice

### H16k-3 — verify no orphan imports

```bash
rg "from .*shell/SideNav" src/
```

**PASS =** 0 hits (except deprecated file itself if self-ref — should be 0 imports)

---

## LOCK Footer H16k-F1 ~ F6

| # | 고정 | FAIL |
|---|------|------|
| F1 | AppShell renders **HomeSideNav** in desktop aside | SideNav mounted |
| F2 | `/home` **no double sidebar** (`hideSideNav` works) | 2 sidebars |
| F3 | `/casino` `/sports` `/trade` `/wallet` show **new 6-item** nav | old 8+2 labels |
| F4 | `rg` SideNav imports **0** | stale import |
| F5 | vitest **572/572** | regression |
| F6 | HomeSideNav items/i18n · BottomNav · TopBar · routes **0-touch** | scope creep |

---

## EXECUTE Steps 0→3

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 572/572 |
| 1 | H16k-1 AppShell swap |
| 2 | H16k-2 SideNav @deprecated |
| 3 | rg + vitest · §GREEN + **9b-Hk manual** |

---

## §GREEN full block

```bash
bunx vitest run

rg "from .*shell/SideNav" src/
rg -n 'HomeSideNav' src/components/shell/AppShell.tsx
```

**PASS:** vitest **572/572** · SideNav import **0** · visual 4 routes new sidebar · `/home` single sidebar.

**§GREEN template:**

```text
L1-16k §GREEN — AppShell HomeSideNav global · SideNav deprecated · hideSideNav /home OK · vitest 572/572 · 9b-Hk PASS · ZIP defer.
```

---

## 9b-Hk manual (desktop ≥md)

1. `/casino` · `/sports` · `/trade` · `/wallet` — left **6 items** + search + promo (not Earn/Referral/Rank/Account/Settings old set)
2. `/home` — **one** sidebar only (HomeShellFrame)
3. Mobile — **BottomNav** unchanged · drawer if applicable
4. en mode — labels from i18n keys only

**FAIL =** old SideNav labels visible · double sidebar on `/home`

---

## NO-TOUCH

`HomeSideNav.tsx` structure/items/i18n · BottomNav · TopBar · game engines · routes · design tokens · HomeShellFrame layout logic (except hideSideNav already set)

---

## Defer

- `SideNav.tsx` file DELETE — after one cycle zero imports
- L1-16j casino route — independent · can run before/after 16k

---

## Relationship to L1-16e

L1-16e fixed **SideNav vs Tab label overlap on `/home`**. L1-16k **extends HomeSideNav to global shell** — complementary · not duplicate.

---

## paste adapter memo

- Single sidebar component post-paste: `HomeSideNav` in app shell slot
- Deprecate `SideNav` in PHONARA `apps/web` if paste brings both

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — global sidebar unify |

---

*Default: after L1-16j §GREEN or `16k HEAD` · Lovable canvas only*
