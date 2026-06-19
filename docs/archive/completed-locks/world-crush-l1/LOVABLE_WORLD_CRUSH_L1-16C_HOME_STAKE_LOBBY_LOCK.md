# LOVABLE World Crush · Home Stake-Lobby Restructure LOCK — L1-16c v0.1 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · vitest **540/544** · catalog **2591** · **L1-17 unblocked**  
> **큐 ID:** **L1-16c** (Stake-lobby primitives · Earn-killer fold · G-WC1.5)  
> **의존:** L1-16 ✅ · L1-16b ✅ (vitest baseline) · vitest **533/537** · catalog **2557/2557**  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md) · [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md)

---

## Scope (1줄)

`/home` — stake.com **layout primitives only** (sidebar · compact wallet strip · horizontal card rows · hero band)로 PC·모바일 **earn-first casino lobby** 리빌드 · **5-tab HomeTabShell 유지** · fold0 Earn-killer · page `overflow-x: hidden` · rpc 0.

---

## World Crush bar (G-WC1.5)

| # | 필수 | FAIL |
|---|------|------|
| C1 | PC **fixed dark sidebar ~220px** · mobile **drawer** | generic dashboard · sidebar 없음 |
| C2 | **CompactWalletStrip** fold0 — balance · today earn · streak · online · withdraw | L1-16b snapshot card만 stack |
| C3 | **EarnPowerRow** 5 cards horizontal snap | vertical widget pile |
| C4 | **CategoryRow** Casino/Games/Trade below fold · stake식 row scroll | page horizontal scroll |
| C5 | fold0 **primary-cta = 1** · tier chip 1 line · rank/vip full tier **유지** | CTA 다중 · today tier ladder |
| C6 | **overflow-x: hidden** on page root · row 내부만 `overflow-x-auto snap-x` | 가로 페이지 스크롤 |
| C7 | generic/MVP feel | urgency/density 전무 |

**Visual ref (pattern only · code import 0):** https://stake.com · Toss mission clarity · TikTok streak rhythm

---

## Architecture

```text
AppShell (hideSideNav on /home · hideAssets carry · BottomNav mobile)
  └─ HomeHub
       └─ HomeShellFrame (grid md:220px+1fr · drawer mobile)
            ├─ HomeSideNav (8 items + search)
            └─ main
                 └─ HomeTabShell (5 tabs · h-10 sticky)
                      └─ HomeTodayPanel (rebuilt stack)
                           ├─ HomeCompactWalletStrip
                           ├─ Hero band (h-28/32) + data-primary-cta ×1
                           ├─ HomeEarnPowerRow (5 cards)
                           ├─ LiveWinMarquee
                           ├─ TierProgressChip
                           └─ HomeCategoryRow ×3 (Casino · Games · Trade)
```

**L1-16b carry:** `TierProgressChip` · rank›vip `TierProgressPanel` · `HomeTabContext` 「등급 보기」 wiring **유지** · `HomeWalletSnapshotCard` **today에서 사용 중지** (파일 DELETE 0).

---

## Layout ASCII (fold0 target)

```text
PC 1440×900                              Mobile 390×844
┌──────┬─────────────────────────────┐   ┌─────────────────────┐
│ Side │ TopBar (system·bell·avatar) │   │ ☰ TopBar           │
│ Nav  ├─────────────────────────────┤   ├─────────────────────┤
│ 220  │ HomeTabShell tabs (sticky)  │   │ Tabs (h-sticky)     │
│ dark │ ─────────────────────────── │   │ ─────────────────── │
│      │ CompactWalletStrip          │   │ CompactWalletStrip  │
│      │ balance·earn·streak·online  │   │ (2 row, dense)      │
│      │ · withdraw                  │   │                     │
│      │ ─────────────────────────── │   │ ─────────────────── │
│      │ Hero (h-28) + primary-cta 1 │   │ Hero (h-32)         │
│      │ ─────────────────────────── │   │ ─────────────────── │
│      │ EarnPowerRow → 5 cards 가로 │   │ EarnPowerRow 가로   │
│      │ ─────────────────────────── │   │ ─────────────────── │
│      │ LiveWinMarquee 1줄          │   │ Marquee 1줄         │
│      │ ─────────────────────────── │   │ ─────────────────── │
│      │ TierChip 1줄                │   │ TierChip 1줄        │
│      └─────────────────────────────┘   └─────────────────────┘
                  (page scroll ↓ CategoryRows)
```

**Height tokens (fold0 압축):** hero `h-28` (mobile `h-32`) · marquee `h-9` · tier chip `h-9` · earn row `h-28` · wallet strip `h-14` (mobile 2-row).

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16c-1 | `src/components/home/HomeSideNav.tsx` | **NEW** — dense dark column · PC fixed 220px · mobile drawer · 8 nav + divider + search input · lucide icons |
| H16c-2 | `src/components/home/HomeShellFrame.tsx` | **NEW** — `<aside HomeSideNav /> + <main>{children}</main>` · `md:grid-cols-[220px_minmax(0,1fr)]` · mobile hamburger drawer state |
| H16c-3 | `src/components/home/HomeCompactWalletStrip.tsx` | **NEW** — balance · today earn · StreakRing(compact) · OnlineBadge · withdraw ghost · 1 row PC / 2 row mobile · `data-testid="home-wallet-strip"` |
| H16c-4 | `src/components/home/HomeEarnPowerRow.tsx` | **NEW** — horizontal 5 cards 160×96 · reward badge · `snap-x` · `data-testid="home-earn-card"` per card |
| H16c-5 | `src/components/home/HomeCategoryRow.tsx` | **NEW** — reusable row: title + 6 cards + see-all · internal `overflow-x-auto snap-x` |
| H16c-6 | `src/components/home/panels/HomeTodayPanel.tsx` | **EDIT** — strip + hero + EarnPowerRow + marquee + TierChip + 3 CategoryRows · **stop using** HomeWalletSnapshotCard · HomeTradeTeaserCard · HomeCasinoBentoCard · HomeGamesTeaserCard (DELETE 0) |
| H16c-7 | `src/components/home/HomeHub.tsx` | **EDIT** — wrap in `HomeShellFrame` · `HomeTabShell` inside main · AppShell chrome carry |
| H16c-8 | `src/components/shell/AppShell.tsx` | **EDIT** — `hideSideNav?: boolean` · `/home` passes true (BottomNav mobile **유지**) |
| H16c-9 | `src/components/home/HomeTabShell.tsx` | **EDIT** — nav `h-10` compress · primary-cta count 영향 0 |
| H16c-10 | `src/i18n/ko.ts` + `en.ts` | **APPEND** keys below |
| H16c-11 | `src/components/home/__tests__/HomeTodayPanel.test.tsx` | **EDIT** — wallet strip · CTA=1 · EarnPowerRow · no page-root horizontal overflow |
| H16c-12 | `src/components/home/__tests__/HomeSideNav.test.tsx` | **NEW** — 8 nav · active · search input · drawer toggle |
| H16c-13 | `src/components/home/__tests__/HomeEarnPowerRow.test.tsx` | **NEW** — 5 cards · snap class |

**DELETE 0** · 12-C/12-F widget **files** 보존 · **5 tabs unchanged** · `/` landing · `/trade` · admin · games engine · rpc · ZIP **0-touch**

---

## Mock data (display-only · rpc 0)

### HomeSideNav (8 items)

| key | route | icon |
|-----|-------|------|
| home.side.home | `/home` | home |
| home.side.casino | `/casino` | dice/spade |
| home.side.games | `/casino` or games hub | gamepad |
| home.side.trade | `/trade` | chart |
| home.side.wallet | `/wallet` | wallet |
| home.side.missions | `/earn/missions` | target |
| home.side.rank | `/home` + tab rank | trophy |
| home.side.referral | `/referral` | users |

### EarnPowerRow (5 cards)

| card | label key | reward display | link |
|------|-----------|----------------|------|
| 출석체크 | `home.earn.power.checkin` | +500P | `/earn/missions` |
| 오늘 미션 3 | `home.earn.power.missions` | +2,000P | `/earn/missions` |
| 럭키 휠 | `home.earn.power.wheel` | 최대 50,000P | `/earn/missions` |
| 한정 드롭 | `home.earn.power.drop` | 오늘만 | `/earn/missions` |
| 친구초대 | `home.earn.power.referral` | +10,000P | `/referral` |

### HomeCategoryRow

| row | title key | data source | count |
|-----|-----------|---------------|-------|
| Casino | `home.row.casino.title` | existing `casino-feed.ts` top 6 | 6 |
| Games | `home.row.games.title` | existing game list 6 | 6 |
| Trade | `home.row.trade.title` | chart / swap / staking 3 cards | 3 |

---

## Scroll rules (FAIL = C6)

```tsx
// page root (HomeShellFrame main or HomeHub outer)
className="overflow-x-hidden"

// row containers only
className="overflow-x-auto snap-x snap-mandatory flex gap-2"
```

**FAIL =** `document.documentElement` or page wrapper triggers **horizontal page scroll** at 1440×900 or 390×844.

---

## Mobile

- `HomeSideNav` default hidden · hamburger (TopBar left slot **or** `HomeShellFrame` trigger) opens drawer
- **BottomNav 유지** · tab switch = `HomeTabShell`
- Wallet strip **2-row** dense on `< md`

---

## i18n (append · ko=en)

```text
home.side.brand
home.side.home
home.side.casino
home.side.games
home.side.trade
home.side.wallet
home.side.missions
home.side.rank
home.side.referral
home.side.searchPlaceholder
home.compact.withdrawCta
home.earn.power.title
home.earn.power.checkin
home.earn.power.checkinReward
home.earn.power.missions
home.earn.power.missionsReward
home.earn.power.wheel
home.earn.power.wheelReward
home.earn.power.drop
home.earn.power.dropReward
home.earn.power.referral
home.earn.power.referralReward
home.row.casino.title
home.row.games.title
home.row.trade.title
home.row.seeAll
```

**FAIL =** JSX/TSX `[가-힣]` literal (comments only OK per 16b precedent).

---

## LOCK Footer H16c-F1 ~ H16c-F8

| # | 고정 | FAIL |
|---|------|------|
| F1 | `HomeSideNav` + `HomeShellFrame` mounted on `/home` | sidebar missing PC |
| F2 | `HomeCompactWalletStrip` `data-testid="home-wallet-strip"` fold0 | snapshot card still primary |
| F3 | `HomeEarnPowerRow` **5** cards · `data-testid="home-earn-card"` | ≠5 cards |
| F4 | `data-primary-cta` count **= 1** on today | ≠1 |
| F5 | page root **overflow-x hidden** · row internal scroll only | horizontal page scroll |
| F6 | rank›vip full tier **unchanged** from 16b | tier ladder back on today |
| F7 | vitest **533/537 carry** (+new tests) · DIFF=0 | regression |
| F8 | 5 tab IDs · `/` landing · `/trade` **0-touch** | new tab/route |

---

## EXECUTE Steps 0→8

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline vitest 533/537 · catalog 2557 |
| 1 | H16c-1 HomeSideNav · H16c-2 HomeShellFrame |
| 2 | H16c-3 CompactWalletStrip · H16c-8 AppShell hideSideNav |
| 3 | H16c-4 EarnPowerRow · H16c-5 CategoryRow |
| 4 | H16c-6 HomeTodayPanel rebuild · H16c-7 HomeHub wire |
| 5 | H16c-9 HomeTabShell h-10 · retain TierChip + rank/vip |
| 6 | H16c-10 i18n · H16c-11/12/13 tests |
| 7 | home + admin + wallet + sports + full vitest |
| 8 | §GREEN + **9b-Hc manual** |

---

## §GREEN full block

```bash
bunx vitest run src/components/home/
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print('DIFF',len(ko^en))"

rg -n 'HomeSideNav|HomeCompactWalletStrip|HomeEarnPowerRow|HomeCategoryRow' src/components/home/
rg -c 'data-primary-cta' src/components/home/panels/HomeTodayPanel.tsx
rg -n 'overflow-x-hidden' src/components/home/
rg -n 'HomeWalletSnapshotCard' src/components/home/panels/HomeTodayPanel.tsx
rg -n '[가-힣]' src/components/home/ --glob '!**/__tests__/**' --glob '!*.md'
```

**PASS:** vitest **533/537 carry** (+new OK) · DIFF=**0** · 4 new components mounted · primary-cta=**1** · today panel **no** HomeWalletSnapshotCard import · home JSX Hangul **0** (comments only) · page overflow-x hidden hit.

**§GREEN template:**

```text
L1-16c §GREEN — Stake-lobby sidebar+wallet strip+EarnPowerRow · fold0 earn-killer · overflow-x 0 · vitest N/N carry · catalog Δ=+K DIFF=0 · 9b-Hc PASS · L1-17 unblocked · ZIP defer.
```

---

## 9b-Hc manual (PC 1280×800 + mobile 390×844)

1. PC: left **SideNav visible** · fold0 wallet strip + hero + earn row + marquee + tier chip **visible without scroll for tier block**
2. **No horizontal page scroll** — only row-internal scroll
3. Mobile: hamburger → drawer open/close · **BottomNav** intact · fold0 wallet + hero + earn row visible
4. **5 tabs** switch OK · rank›vip full tier **maintained** · 「등급 보기」→ vip
5. en mode: Korean **0**

**FAIL =** generic dashboard · page horizontal scroll · sidebar missing PC · earn row vertical stack · CTA≠1

---

## NO-TOUCH

`/trade` L1-17 · admin · games **engine** · rpc · ZIP · `/` landing · 5-tab IDs · BottomNav · 12-C widget files (usage stop OK · delete 0) · Crash FROZEN

---

## Defer

- L1-17 Trade split — **blocked until 16c §GREEN**
- L1-18 FOMO motion — after L1-17
- Sidebar on **non-/home routes** — future L1-19 shell density (optional)

---

## paste adapter memo (PHONARA L2)

- `HomeShellFrame` grid may map to `AppShell` layout slot post-paste
- `hideSideNav` on `/home` only — global shell dedupe with L1-16b `hideAssets`
- EarnPower links → existing `/earn/missions` · `/referral` routes

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 APPROVE · EXECUTE GO — operator Stake-lobby restructure · 16b visual supersede |

---

*L1-17 blocked until 16c §GREEN · Lovable canvas only*
