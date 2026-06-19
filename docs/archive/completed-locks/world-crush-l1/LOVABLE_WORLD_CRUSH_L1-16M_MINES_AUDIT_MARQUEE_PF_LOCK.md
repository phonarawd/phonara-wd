# LOVABLE World Crush · Mines Audit + Presence Marquee + PF Badge LOCK — L1-16m v0.1 EXECUTE

> **상태:** **✅ §GREEN** · operator report 2026-06-17 · vitest **572/572** · Cursor doc sync  
> **큐 ID:** **L1-16m** (Part 1 audit doc ✅ PHONARA · Part 2–3 Lovable canvas)  
> **의존:** L1-16l ✅ · vitest **572/572** · L1-16g MobileGameFrame ✅  
> **감사 정본:** [`docs/checkpoints/probability-audit.md`](../checkpoints/probability-audit.md)

---

## Scope (1줄)

**Part 1** Mines 22/22 audit doc (0 code) · **Part 2** LIVE chip `PresenceMarquee` · **Part 3** PF badge header→meta footer on mobile · **engine/payout 0-touch**.

---

## Part 1 — Probability audit (PHONARA · ✅ DONE)

- **File:** `docs/checkpoints/probability-audit.md`
- 10-game payout + 1% edge mapping · Mines 2,277× worked example
- **FAIL =** engine code changed this slice

---

## Part 2 — PresenceMarquee (Lovable)

### H16m-1 — NEW `src/games/shared/presence/PresenceMarquee.tsx`

- Single track + **2× content duplicate** · `translateX(-50%)` at 50% loop
- `hover` / `focus` → `animation-play-state: paused`
- `prefers-reduced-motion: reduce` → static (no animation)
- Mount: **`useInView({ once: false })`** + **`usePageVisible()`** → off-screen / hidden tab **stop**
- Keep **`data-testid="casino-presence-ghost"`** — 9 testid regression **0**

### H16m-2 — styles.css

```css
@keyframes pf-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: pf-marquee 28s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-marquee { animation: none; }
}
```

### H16m-3 — Replace LIVE chip row in **7** HUD files

| file |
|------|
| `src/games/mines/HUD.tsx` |
| `src/games/crash/HUD.tsx` |
| `src/games/plinko/HUD.tsx` |
| `src/games/dice/HUD.tsx` |
| `src/games/limbo/HUD.tsx` |
| `src/games/blackjack/HUD.tsx` |
| `src/games/roulette/HUD.tsx` |

Replace:

```tsx
<div className="flex … overflow-x-auto …">LIVE + chips…</div>
```

With:

```tsx
<PresenceMarquee ghosts={ghosts} />
```

Ghost data · up/down color tokens — **unchanged**.

**FAIL =** manual horizontal scroll still required · testid missing · animation runs off-screen (FPS waste)

---

## Part 3 — PF badge separation (Lovable)

### H16m-4 — `src/components/casino/detail/MobileGameFrame.tsx`

- **Remove** `<ProvablyFairBadge />` from header (~line 151)
- **Add** meta footer **below Stage**, outside game box:

```tsx
<div className="flex items-center justify-between gap-2 px-1 py-1 text-[11px] text-muted-foreground">
  <ProvablyFairBadge />
  <RTPChip value={...} subtle />
</div>
```

- **RTPChip** in header — **KEEP** (top-right density)

### H16m-5 — `GameDetailFrame.tsx`

- Desktop poster card PF placement — **NO CHANGE** (line ~234–236 OK)

**FAIL =** PF still inside mobile game header · `data-testid="fair"` removed

---

## LOCK Footer H16m-F1 ~ F7

| # | 고정 | FAIL |
|---|------|------|
| F1 | vitest **572/572** · **0 new fail** | regression |
| F2 | Mobile header **no PF badge** · meta line below stage | header PF |
| F3 | LIVE chips auto-scroll R→L · hover pause | overflow-x manual |
| F4 | Mines 22/22 still **2,277.00×** | payout drift |
| F5 | `casino-presence-ghost` testid **9** preserved | testid break |
| F6 | engine · payout · RNG · routes **0-touch** | scope creep |
| F7 | `MobileGameFrame.test.tsx` `data-testid="fair"` still passes | selector break |

---

## EXECUTE Steps 0→5

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · Part 1 audit doc confirm |
| 1 | H16m-1 PresenceMarquee + hooks |
| 2 | H16m-2 styles.css keyframes |
| 3 | H16m-3 HUD ×7 swap |
| 4 | H16m-4 MobileGameFrame PF move |
| 5 | vitest + §GREEN + 9b-Hm manual |

---

## §GREEN full block

```bash
bunx vitest run
bun run build

rg "overflow-x-auto" src/games/*/HUD.tsx
rg "ProvablyFairBadge" src/components/casino/detail/MobileGameFrame.tsx
rg "PresenceMarquee" src/games/
rg "casino-presence-ghost" src/games/
```

**PASS:** vitest **572/572** · HUD overflow-x-auto **0** (marquee only) · PF in meta footer · manual 9b-Hm.

**§GREEN template:**

```text
L1-16m §GREEN — audit doc · PresenceMarquee ×7 HUD · PF meta footer · vitest 572/572 · mines 2277× carry · L1-17 HEAD · ZIP defer.
```

---

## 9b-Hm manual

1. Mobile any game — header **no** PF badge · meta line **below** game card
2. LIVE chips scroll automatically · hover pauses
3. Reduced motion — static chips
4. Mines 3/22 all safe — **2,277.00×**
5. Desktop GameDetailFrame — unchanged

---

## NO-TOUCH

`src/games/**` engine logic · payout formulas · RNG · routes · BottomNav · TopBar · HomeSideNav · AppShell · design tokens · **i18n keys** · **9 money testid** · e2e selectors (except presence ghost carry)

---

## Defer

- Mint Reels / Gold Rush HUD — **not in 7** (no LIVE row pattern) · add if pattern appears
- L1-17 Trade — **HEAD** unless operator **`16m HEAD`**

---

## paste adapter memo

- `PresenceMarquee` → `presentation-import` shared presence
- PF footer pattern → all mobile game routes via MobileGameFrame

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · Part 1 audit PHONARA done |
| 2026-06-17 | **§GREEN** — Part 2–3 Lovable · vitest 572/572 · Cursor doc sync |

---

*Lovable Part 2–3 · engine 0-touch*
