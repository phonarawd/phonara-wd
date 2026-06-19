# LOVABLE World Crush · Mobile Game Frame Controls LOCK — L1-16g v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · MobileGameFrame tests **3/3** · i18n **+4×2** · engine **NO-TOUCH** · **L1-17 unblocked**  
> **큐 ID:** **L1-16g** (MobileGameFrame · bet collapse + fullscreen · wrapper CSS only)  
> **의존:** L1-16f (desktop detail) · vitest carry **541/545+** · catalog **2598+** (post-16f +7 keys)  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16F_GAME_DETAIL_DESKTOP_LOCK.md)

---

## Scope (1줄)

`MobileGameFrame` — stake.com 모바일 **bet collapse** + **fullscreen** 2 controls · **wrapper `data-bet` / `data-fs` + scoped CSS** · 10게임 `[data-game-id$="-panel-mobile"]` 일괄 숨김 · **게임 엔진 0-touch**.

---

## Discovery (fixed)

All 10 games expose stable mobile bet selectors:

- `[data-game-id$="-panel-mobile"]` — bet controls
- `[data-game-id$="-panel-mobile-spacer"]` — safe-area spacer

**Mechanism:** parent `data-bet="collapsed"` → scoped CSS hides all panels · **no engine edits**.

---

## Header layout (after change)

```text
[name · ProvablyFair]   [RTP] [⌃ collapse-bet] [⛶ fullscreen]
```

- Icons: `ChevronDown/ChevronUp` (collapse) · `Maximize2/Minimize2` (fullscreen)
- **36×36** icon buttons · `aria-pressed` · i18n `aria-label`

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16g-1 | `src/components/casino/detail/MobileGameFrame.tsx` | **EDIT** — header icons · data attrs · scoped `<style>` · fullscreen ref/listeners |
| H16g-2 | `src/i18n/ko.ts` + `en.ts` | **APPEND** 4 keys |
| H16g-3 | `src/components/casino/detail/__tests__/MobileGameFrame.test.tsx` | **NEW** |

**Touch = 1 edit + i18n + test** · **DELETE 0**

---

## Bet collapse (H16g-1)

**Root attribute:**

```tsx
data-bet={collapsed ? "collapsed" : "expanded"}
```

**Scoped style (same file):**

```html
<style>{`
  [data-skin="mobile-crush"][data-bet="collapsed"] [data-game-id$="-panel-mobile"],
  [data-skin="mobile-crush"][data-bet="collapsed"] [data-game-id$="-panel-mobile-spacer"]
  { display: none !important; }
`}</style>
```

- Default: **expanded**
- Persist: `localStorage` key `phonara.mobile.bet.collapsed`

**FAIL =** per-game engine edit to hide bet panel

---

## Fullscreen (H16g-1)

```ts
const el = ref.current as HTMLElement & { webkitRequestFullscreen?: () => void };
(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
// exit: document.exitFullscreen() + webkitExitFullscreen fallback
```

- Listen: `fullscreenchange` + `webkitfullscreenchange` → sync `isFs`
- `isFs` → root `data-fs="true"` · scoped CSS hides header / sidestack / disclaimer · game card full bleed
- **iOS fallback:** if `!requestFullscreen && !webkitRequestFullscreen` → `data-fs-fallback="true"` + `position:fixed; inset:0; z-index:100`

**FAIL =** engine surface resize logic touched

---

## i18n (append · ko=en · 4 keys)

```text
casino.detail.collapseBet
casino.detail.expandBet
casino.detail.enterFullscreen
casino.detail.exitFullscreen
```

---

## Tests (H16g-3)

| # | assert |
|---|--------|
| T1 | 4 icon buttons with i18n aria-labels present |
| T2 | collapse click → root `data-bet="collapsed"` |
| T3 | fullscreen click → `requestFullscreen` mock called (jsdom: use fallback branch if needed) |

**vitest:** carry + **3** new tests in file (+3 total suite)

---

## LOCK Footer H16g-F1 ~ H16g-F7

| # | 고정 | FAIL |
|---|------|------|
| F1 | Root `data-bet` toggles collapsed/expanded | engine panel hide |
| F2 | Collapsed hides `-panel-mobile` + spacer via CSS | panel visible when collapsed |
| F3 | Fullscreen toggles `data-fs` or fallback | no fullscreen path |
| F4 | **10 game engines** untouched | `src/games/*` edit |
| F5 | Desktop `GameDetailFrame` **0 regression** | desktop mobile branch bleed |
| F6 | vitest carry · DIFF=**0** (+4 keys) | fail |
| F7 | `/trade` · admin · Home **0-touch** | scope creep |

---

## EXECUTE Steps 0→5

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline post-16f vitest/catalog |
| 1 | H16g-1 MobileGameFrame — collapse + fullscreen + scoped CSS |
| 2 | H16g-2 i18n 4 keys |
| 3 | H16g-3 tests |
| 4 | vitest detail + full |
| 5 | §GREEN + **9b-Hg manual** |

---

## §GREEN full block

```bash
bunx vitest run src/components/casino/detail/
bunx vitest run src/components/home/
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print('DIFF',len(ko^en))"

rg -n 'data-bet=' src/components/casino/detail/MobileGameFrame.tsx
rg -n 'phonara\.mobile\.bet\.collapsed' src/components/casino/detail/
rg -n 'casino\.detail\.collapseBet' src/i18n/ko.ts
```

**PASS:** vitest carry **+3** · DIFF=**0** · collapse hides bet panel mobile preview · fullscreen works or fallback · desktop unchanged.

**§GREEN template:**

```text
L1-16g §GREEN — MobileGameFrame bet collapse + fullscreen · wrapper CSS · engine 0-touch · vitest N/N carry · catalog Δ=+4 DIFF=0 · 9b-Hg PASS · L1-17 unblocked · ZIP defer.
```

---

## 9b-Hg manual (mobile 390×844)

1. Any `/casino/*` mobile — collapse → **game canvas only** · expand → bet panel returns
2. Fullscreen → game full bleed · exit → chrome returns
3. Refresh — collapse state from localStorage OK
4. Desktop same route — **no change** vs pre-16g
5. en Korean 0

**FAIL =** bet panel still visible when collapsed · desktop layout changed

---

## NO-TOUCH

`src/games/*` (10 engines) · `GameDetailFrame` desktop (16f) · `MobileSideStack` source (hidden via fs CSS only) · route files · casino hub · `/trade` · admin · HomeSideNav · HomeTabShell · BottomNav · ZIP · rpc

---

## Defer

- L1-17 Trade — **blocked until 16g §GREEN** (after 16f §GREEN)
- Per-game custom collapse UX — not needed (global selector works)

---

## paste adapter memo

- `phonara.mobile.bet.collapsed` localStorage key stable for PHONARA paste
- Scoped `<style>` in component — consider extract to CSS module post-paste if lint requires

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — mobile bet collapse + fullscreen |

---

*Queue: L1-16f §GREEN → L1-16g EXECUTE → L1-17*
