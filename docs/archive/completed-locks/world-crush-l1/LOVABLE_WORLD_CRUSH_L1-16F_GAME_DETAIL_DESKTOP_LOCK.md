# LOVABLE World Crush · Stake-Style Game Detail Desktop LOCK — L1-16f v0.1 ~~CANCELLED~~

> **상태:** **~~CANCELLED~~** · operator **2026-06-18** — 계획 제외 · Lovable EXECUTE **0** · L1-17은 이미 §GREEN (구 「16f blocked」 조건 무효)
> **큐 ID:** **L1-16f** (10× `/casino/*` desktop layout · stake.com homomorph)  
> **의존:** L1-16d ✅ · L1-16e ✅ · vitest **541/545+** carry · catalog **2591+**  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

10개 **`/casino/*`** 게임 **데스크탑** detail을 stake.com 동형으로 재구성 — **SlimTitleBar** + 풀폭 **GameSurface** + **4-tab strip** + **PairedRail** · **모바일·게임 엔진 NO-TOUCH**.

---

## Gap vs stake.com (desktop)

| 영역 | 현재 | stake.com | 조치 |
|------|------|-----------|------|
| Above game | `GameHeroStage` 200px poster + FX | Slim title bar **48px** | **교체** |
| Layout | `lg:grid-cols-[1fr_320px]` side rail | 풀폭 · rail 없음 | **제거** |
| Below game | StatsStrip + InfoTriad + PairedRail stack | 4 tabs + similar games | **탭화** |
| Mobile | `MobileGameFrame` ✓ | 동일 | **NO-TOUCH** |

---

## Desktop structure (GameDetailFrame)

```text
<SlimTitleBar gameId />          data-detail-titlebar · h-12 sticky
<GameSurface wide />             children · 풀폭 max-w-6xl
<GameDetailTabs gameId />        data-detail-tabs · 4 tabs
<PairedRail gameId />            existing lazy
```

**Remove from desktop branch:** `GameHeroStage` · `SidePanels` · `SidePanelsWide` · `InfoTriad` · `GameStatsStrip` (direct calls — **reuse inside tabs**).

**`GameHeroStage` file:** DELETE 0 · import removed from frame · `data-p13-id="casino-game-hero"` **absent on desktop DOM**.

**`wide` prop:** remove or ignore — all games full-width · `crash.tsx wide` **compat OK**.

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16f-1 | `src/components/casino/detail/GameDetailFrame.tsx` | **EDIT** — desktop branch restructure |
| H16f-2 | `src/components/casino/detail/SlimTitleBar.tsx` | **NEW** ~50 LOC |
| H16f-3 | `src/components/casino/detail/GameDetailTabs.tsx` | **NEW** ~80 LOC |
| H16f-4 | `src/i18n/ko.ts` + `en.ts` | **APPEND** 7 keys (see i18n) |
| H16f-5 | `src/components/casino/detail/__tests__/GameDetailFrame.test.tsx` | **NEW** |

**Touch = 2 new + 1 edit + i18n + test** · **DELETE 0**

---

## SlimTitleBar (H16f-2)

```text
Left:  name (meta.nameKey) · ProvablyFairBadge · RTPChip · Volatility
Right: ♥ favorite · □ theater · ⛶ fullscreen (icon-only lucide)
```

| control | behavior |
|---------|----------|
| favorite | localStorage toggle |
| theater | `data-theater="true"` on parent toggle |
| fullscreen | `requestFullscreen()` |

- `h-12` · `sticky top-0` · `bg-card/85 backdrop-blur`
- `data-detail-titlebar="true"`

---

## GameDetailTabs (H16f-3)

| tabId | i18n | content (reuse GameSidePanels exports) |
|-------|------|----------------------------------------|
| `description` | `casino.tab.description` | `HowToPlayCard` + GameStatsStrip meta text |
| `info` | `casino.tab.info` | `FairnessCard` + volatility/rtp/provider text |
| `live` | `casino.tab.live` | `LiveWinTheater` + `HotMultiplierStrip` |
| `high` | `casino.tab.highrollers` | `TopWin24hCard` |

- `role="tablist"` · **not sticky** · 4 buttons · active `border-b-2 border-primary`
- default active = **`description`**
- panels: **`IntersectionMount`** lazy (carry pattern)
- `data-detail-tabs="true"`

**FAIL =** new panel components invented · GameSidePanels internals edited

---

## i18n (append · ko=en · 7 keys)

```text
casino.tab.description
casino.tab.info
casino.tab.live
casino.tab.highrollers
casino.detail.favorite
casino.detail.theater
casino.detail.fullscreen
```

**FAIL =** JSX `[가-힣]` · DIFF≠0

---

## Tests (H16f-5)

| # | assert |
|---|--------|
| T1 | desktop (`useIsMobile=false`): `data-detail-titlebar` present |
| T2 | desktop: `data-detail-tabs` present |
| T3 | desktop: **`data-p13-id="casino-game-hero"` absent** (GameHeroStage not mounted) |
| T4 | mobile: `MobileGameFrame` · `data-skin="mobile-crush"` |
| T5 | 4 tab buttons · first tab `aria-selected=true` |

**vitest carry:** **541/545+** (+1 new file OK · 4 NO-TOUCH game carry)

---

## LOCK Footer H16f-F1 ~ H16f-F8

| # | 고정 | FAIL |
|---|------|------|
| F1 | Desktop **no** `GameHeroStage` in DOM | hero poster on desktop |
| F2 | `data-detail-titlebar`=**1** · `data-detail-tabs`=**1** | missing |
| F3 | 4 tabs · default **description** | ≠4 tabs |
| F4 | Mobile branch **unchanged** | mobile visual/structure change |
| F5 | 10 `/casino/*` routes **0 edit** | route file touch |
| F6 | Game engine imports **0-touch** | engine surface change |
| F7 | vitest carry · DIFF=**0** (+7 keys) | regression |
| F8 | `/trade` · admin · Home · BottomNav **0-touch** | scope creep |

---

## EXECUTE Steps 0→6

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 541/545+ · 2591+ |
| 1 | H16f-2 SlimTitleBar |
| 2 | H16f-3 GameDetailTabs (reuse GameSidePanels) |
| 3 | H16f-1 GameDetailFrame desktop rewire |
| 4 | H16f-4 i18n 7 keys |
| 5 | H16f-5 tests |
| 6 | vitest casino detail + full · §GREEN + **9b-Hf manual** |

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

rg -n 'SlimTitleBar|GameDetailTabs' src/components/casino/detail/GameDetailFrame.tsx
rg -n 'GameHeroStage' src/components/casino/detail/GameDetailFrame.tsx
rg -n 'data-detail-titlebar|data-detail-tabs' src/components/casino/detail/
rg -n 'casino\.tab\.' src/i18n/ko.ts
```

**PASS:** vitest **541/545+ carry** · DIFF=**0** · desktop no hero DOM · mobile unchanged · 10 routes build · tab role 4.

**§GREEN template:**

```text
L1-16f §GREEN — SlimTitleBar + GameDetailTabs desktop · GameHeroStage removed desktop · mobile 0-touch · vitest N/N carry · catalog Δ=+7 DIFF=0 · 9b-Hf PASS · L1-17 unblocked · ZIP defer.
```

---

## 9b-Hf manual (desktop 1280px · mobile 390px)

1. **Desktop** `/casino/crash` (or any of 10): slim title bar · full-width game · 4 tabs below · **no** giant hero poster
2. Tab switch: description/info/live/high content loads · lazy OK
3. favorite/theater/fullscreen toggles (display-only state OK)
4. **Mobile** same route: **identical to before** (MobileGameFrame · slim header · accordion)
5. en mode Korean 0

**FAIL =** desktop hero remains · side rail on desktop · mobile layout changed

---

## NO-TOUCH

10× `/casino/*` **route files** (head/seo/breadcrumb) · `MobileGameFrame` · `MobileSideStack` · `GameSidePanels` **internals** · Imported* game engines · `.lovableignore` · `/trade` · admin · HomeSideNav · HomeTabShell · BottomNav · ZIP · rpc

---

## Defer

- L1-17 Trade split — **blocked until 16f §GREEN**
- Similar Games carousel (stake below tabs) — optional 16f.1 if not in PairedRail already

---

## paste adapter memo (PHONARA L2)

- `GameDetailFrame` desktop branch maps to `presentation-import/casino/detail/` post-paste
- Tab i18n keys merge to `@phonara/i18n` append-only

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — stake desktop game detail |

---

*L1-17 blocked until 16g §GREEN · L1-16g blocked until 16f §GREEN · Lovable canvas only*
