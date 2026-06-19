# LOVABLE World Crush · Home IA LOCK — L1-16 v0.2 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator evidence · vitest **529/533** · catalog **2552/2552** · G-WC1 · ZIP defer  
> **큐 ID:** **L1-16** (Home 1차/2차 탭 · hero 1 · FOMO hierarchy · Lovable 전용 · **G-WC1**)  
> **의존:** L1-15-UX-Plain ✅ · canvas vitest **525/529** · catalog **2535/2535**  
> **상위:** [`PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md`](PHONARA_WORLD_CRUSH_PLATFORM_UI_PLAN.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.4

---

## Target (operator amend · 고정)

| route | component | L1-16 |
|-------|-----------|-------|
| **`/home`** | `src/components/home/HomeHub.tsx` | **EXECUTE 대상** — flat scroll dump → `HomeTabShell` |
| **`/`** | `ImportedLandingPage` | **NO-TOUCH** (marketing landing) |

**H16-7 정본:** `HomeHub.tsx` — flat dump 제거 · `<HomeTabShell />` mount · `AppShell` wrapper 유지.

**13 existing widgets** → **5 tab panels**로 **relocate only** (delete 0).

---

## Scope (1줄)

HomeHub flat dump → **1차 탭 5** (`today` default) + 2차 서브탭 · above-fold **hero 1 + CTA 1 + FOMO lane 1** · 기존 12-C/FOMO 위젯 재배치 (삭제 0) · rpc/hook 0-touch.

---

## World Crush bar (FAIL = REVISE)

```text
첫 3초 = 「부업·부수입 FOMO」 + 「지금 1탭이면 벌 것 같음」
```

| # | enforce | FAIL |
|---|---------|------|
| WC1 | `HomeTodayPanel` above-fold **`data-primary-cta` count = 1** (test assert) | 2+ green CTA above fold |
| WC2 | `HomeTabShell` tabs **sticky mobile** `sticky top-0` · scroll 전 visible | tier+wheel+rank+invite fold0 dump |
| WC3 | `HomeTodayPanel` **exactly 1** FOMO lane = `LiveWinMarquee` · countdown/slots/streak → missions | 3 FOMO fold0 |
| WC4 | tab targets **`min-h-12 px-4`** (≥48px touch) | trade density on Home |
| WC5 | every panel mounts **real existing widgets** · no coming soon | placeholder · generic dashboard |

**Motion = L1-18 defer.**

---

## §Visual References (pattern only · code import 0)

- https://stake.com — home urgency · live wins
- Toss gamification · TikTok streak — mission tab clarity
- Internal: 12-C widgets listed in panel map below

---

## IA (1차 탭 · 1:1)

| tabId | ko | en | default | secondary |
|-------|----|----|---------|-----------|
| `today` | 오늘 벌기 | Earn today | **✅** | — |
| `missions` | 미션 | Missions | | checkin · wheel · season |
| `rank` | 랭킹 | Rank | | weekly · vip |
| `invite` | 친구초대 | Invite | | — |
| `live` | 라이브 | Live | | live-wins · feed |

---

## Above-fold (`today` · 고정)

- **HeroBar:** `home.hero.headline` · `home.hero.subline`
- **Single CTA:** `<Link>` · `data-primary-cta` · `min-h-12` · `gradient-cta` · `home.hero.cta`
- **FOMO lane 1:** `LiveWinMarquee` (default ticker) — hero 바로 아래
- **Below hero (still today, not 2nd CTA):** max 3 mission chips + `TierProgressPanel` compact
- **Below fold (today):** orphaned teasers — `HomeTradeTeaserCard` · `HomeCasinoBentoCard` · `HomeGamesTeaserCard` · `HomeWelcomeCard` — compact links · **no above-fold CTA conflict**

---

## Tab panel · widget relocate map (delete 0)

| Panel | widgets |
|-------|---------|
| **HomeTodayPanel** | Hero + `LiveWinMarquee` + mission chips (max 3) + `TierProgressPanel` compact + below-fold teasers (4 cards) |
| **HomeMissionsPanel** | sub checkin → `HomeCheckInMirrorCard` · wheel → `LimitedDropCard` · season → `HomeMissionTeaserCard` + `StreakBonusCallout` |
| **HomeRankPanel** | sub weekly → `FomoFullSection` leaderboard slice · vip → `TierProgressPanel` |
| **HomeInvitePanel** | `HomeReferralTeaserCard` + `ReferralShareCard` · **single primary share CTA** |
| **HomeLivePanel** | sub live-wins → `LiveWinMarquee` · feed → `LiveActivityFeed` |

**NO new hooks.** Old `HomeHub` flat imports → panels only.

---

## Files

| ID | path | action |
|----|------|--------|
| H16-1 | `src/components/home/HomeTabShell.tsx` | NEW — 5 primary tabs (sticky mobile) · per-tab secondary subtabs · useState |
| H16-2 | `src/components/home/panels/HomeTodayPanel.tsx` | NEW — hero + 1 FOMO + chips + tier + below-fold relocates |
| H16-3 | `src/components/home/panels/HomeMissionsPanel.tsx` | NEW — checkin/wheel/season |
| H16-4 | `src/components/home/panels/HomeRankPanel.tsx` | NEW — weekly/vip |
| H16-5 | `src/components/home/panels/HomeInvitePanel.tsx` | NEW — referral + single share CTA |
| H16-6 | `src/components/home/panels/HomeLivePanel.tsx` | NEW — live-wins/feed |
| H16-7 | `src/components/home/HomeHub.tsx` | EDIT — flat dump → `<HomeTabShell />` · AppShell keep |
| H16-8 | `src/i18n/ko.ts` + `en.ts` | APPEND — see i18n block |
| H16-9 | `src/components/home/__tests__/HomeTabShell.test.tsx` | NEW — 5 tabs · default today · CTA=1 · tab switch |

**Zero file deletion.** `/` landing · admin · P2-Games · Crash FROZEN · `/trade` **0-touch**.

---

## i18n (append · rename/delete 0 · ko=en 동시)

```text
home.tab.* (5): today · missions · rank · invite · live
home.subtab.* (7): checkin · wheel · season · weekly · vip · live-wins · feed
home.hero.headline · home.hero.subline · home.hero.cta
home.fomo.lane.ticker.label
```

**FAIL =** JSX `[가-힣]` · existing `home.*` / `fomo.*` rename/delete

---

## Tests

| # | assert |
|---|--------|
| T1 | 5 primary tabs render · default = `today` |
| T2 | `data-primary-cta` count = **1** in fold0 / TodayPanel |
| T3 | tab switch mounts target panel |
| T4 | vitest full **≥525/529 carry** |
| T5 | ko=en **DIFF=0** |
| T6 | admin · wallet · sports **회귀 0** |
| T7 | `HomeTabShell` in `HomeHub.tsx` |
| T8 | home JSX Hangul **0** (new) |

---

## LOCK Footer H16-F1 ~ H16-F7

| # | 고정 |
|---|------|
| F1 | target **`/home` HomeHub** · `/` landing 0-touch |
| F2 | tab 5 · default `today` |
| F3 | CTA **1** · FOMO lane **1** (`LiveWinMarquee`) |
| F4 | 13 widgets relocate · **0 delete** |
| F5 | vitest 525/529 carry · DIFF=0 |
| F6 | WC1–WC5 enforced |
| F7 | orphaned 4 teasers **below fold today only** |

---

## EXECUTE Steps 0→8

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline 525/529 · 2535/2535 |
| 1 | H16-1 HomeTabShell |
| 2 | H16-2 HomeTodayPanel |
| 3 | H16-3~6 panels |
| 4 | H16-7 HomeHub edit |
| 5 | H16-8 i18n |
| 6 | H16-9 vitest |
| 7 | home + admin + wallet + sports + full |
| 8 | §GREEN + 9b-H |

---

## §GREEN full block

```bash
bunx vitest run src/components/home/
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -c 'data-primary-cta' src/components/home/panels/HomeTodayPanel.tsx
rg -n 'home\.tab\.' src/i18n/ko.ts src/i18n/en.ts
rg -n '[가-힣]' src/components/home/ --glob '!**/i18n/**'
rg -l 'HomeTabShell' src/components/home/HomeHub.tsx
```

**PASS:** vitest **529/533** (525 baseline + 4 home tests · 4 NO-TOUCH carry) · DIFF=**0** (2552/2552) · `data-primary-cta`=**1** · home Hangul=0 · HomeTabShell in HomeHub · admin/wallet/sports regression=0.

## §GREEN evidence (2026-06-17 · operator)

| # | assert | result |
|---|--------|--------|
| E1 | vitest full | **529/533** ✓ (4 NO-TOUCH carry) |
| E2 | ko=en catalog | **2552/2552** DIFF=0 ✓ |
| E3 | `data-primary-cta` HomeTodayPanel | **1** ✓ WC1 |
| E4 | home JSX `[가-힣]` | **0** ✓ |
| E5 | HomeTabShell in HomeHub | ✓ |
| E6 | `home.tab.*` keys | 5 ✓ |
| E7 | 12-C widgets | relocate · **delete 0** ✓ |
| E8 | admin/wallet/sports | 회귀 0 ✓ |
| E9 | 9b-H | operator PASS |

**§GREEN template (closed):**

```text
L1-16 §GREEN — /home HomeTabShell · tab 5+sub · hero 1 · CTA 1 · LiveWinMarquee lane 1 · 13 widgets relocate 0-delete · vitest 529/533 · catalog 2552 DIFF=0 · 9b-H PASS · G-WC1 ✅ · ZIP defer.
```

**Next HEAD:** **L1-17** Trade Spot|Futures|Staking (G-WC2) — **ZIP = G-WC2~3 + operator explicit GO**

---

## 9b-H manual (60s)

1. `/home` — 1차 탭 5 · default **오늘 벌기** · `/` landing unchanged
2. fold0: hero · **CTA 1** · **LiveWinMarquee 1**
3. 미션/랭킹/친구초대/라이브 + 서브탭 전환
4. 탭만 보고 「다음 벌 돈 행동」1문장
5. en: Korean 0

---

## NO-TOUCH

Admin L1-15 · P2-Games · Crash FROZEN md5 · `/trade` · `/` ImportedLandingPage · L1-18 motion · rpc/supabase · ZIP · 12-C **file** deletes

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 DRAFT |
| 2026-06-17 | APPROVE · EXECUTE GO dispatch |
| 2026-06-17 | **v0.2** — operator amend: `/home`+HomeHub · widget map |
| 2026-06-17 | **§GREEN** — vitest 529/533 · catalog 2552 · G-WC1 · 9b-H PASS |

---

*Lovable canvas only · G-WC1 · ZIP = operator explicit GO after G-WC1~3*
