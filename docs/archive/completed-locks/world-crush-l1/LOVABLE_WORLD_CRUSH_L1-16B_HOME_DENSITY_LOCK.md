# LOVABLE World Crush · Home Density Hotfix LOCK — L1-16b v0.2 EXECUTE

> **상태:** **✅ §GREEN APPROVE** · 2026-06-17 · vitest **533/537** · catalog **2557** · **L1-17 unblocked**  
> **큐 ID:** **L1-16b** · **의존:** L1-16 ✅ · vitest **529/533** · catalog **2552/2552**  
> **상위:** [`LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md`](LOVABLE_WORLD_CRUSH_L1-16_HOME_IA_LOCK.md)

---

## Scope (1줄)

Fix `/home` today **fold0 density**: tier ladder off today · balance → **WalletSnapshot card 1장** · shell 총자산 dedupe on `/home` · full tier UI → **`랭킹 › VIP` only** · rpc 0.

---

## Files

| ID | Path | Action |
|----|------|--------|
| H16b-1 | `src/components/home/HomeWalletSnapshotCard.tsx` | NEW — rounded-2xl card: balance (large tabular) · today earn · `OnlineCountBadge` |
| H16b-2 | `src/components/home/TierProgressChip.tsx` | NEW — 1-line tier chip + `등급 보기` (`onViewTier`) |
| H16b-3 | `src/components/home/panels/HomeTodayPanel.tsx` | EDIT — snapshot replaces balance stack; drop `TierProgressPanel`; `TierProgressChip` after marquee; **1** `data-primary-cta` |
| H16b-4 | `src/components/home/panels/HomeRankPanel.tsx` | EDIT — `vip` subtab: full `TierProgressPanel` + tier ladder cards (relocated) |
| H16b-5 | `HomeHub.tsx` + `AppShell.tsx` (+ `TopBar.tsx`) | EDIT — `hideAssets` on `/home`; remove duplicate `HomeHeroBar` (snapshot supersedes) |
| H16b-6 | `src/i18n/ko.ts` + `en.ts` | APPEND wallet + tier chip keys |
| H16b-7 | `src/components/home/__tests__/HomeTodayPanel.test.tsx` | NEW — snapshot present · no `TierProgressPanel` · CTA=1 |
| H16b-8 | `src/components/home/__tests__/HomeRankPanel.test.tsx` | NEW — vip subtab has `TierProgressPanel` |

**DELETE 0** · **5 tabs unchanged** · `/trade` · admin · games · rpc **0-touch**

---

## Layout (today fold0 · top→bottom)

1. `HomeTabShell` tabs (sticky) — existing
2. `HomeWalletSnapshotCard` (replaces `HomeHeroBar` balance row)
3. Hero section + single `data-primary-cta`
4. `LiveWinMarquee` (1 FOMO lane)
5. `TierProgressChip` (`등급 보기` → rank/vip)
6. Below-fold: Trade/Casino/Games teasers (may scroll)

**`HomeHeroBar` removed from `HomeHub`** — snapshot supersedes · **no duplicate balance fold0**.

---

## Tier relocation

| surface | rule |
|---------|------|
| **today** | **no** `TierProgressPanel` · **no** Bronze/Silver/Gold ladder cards |
| **rank › vip** | full `TierProgressPanel` + ladder cards (add if any were only on today) |

---

## Shell dedupe (H16b-5)

- `AppShell` prop **`hideAssets`** (default `false`)
- `HomeHub` passes **`hideAssets`**
- `TopBar` skips `shell.assets` + `fmtKRW(assets)` when `hideAssets`

**FAIL =** balance/total assets **2× fold0** on `/home`

---

## Tab switch wiring

- **`HomeTabContext`** (smallest diff): state in `HomeTabShell` · `setActive('rank')` + `setRankSub('vip')`
- `TierProgressChip` calls context on 「등급 보기」
- Alt: lift state to parent + `onViewTier` prop — either OK if §GREEN documents choice

---

## i18n (append · ko=en)

```text
home.wallet.balanceLabel
home.wallet.todayEarnLabel
home.wallet.onlineLabel
home.tier.viewGradeCta
home.tier.chipProgress   — {current} · {points}/{next} → {nextTier}
```

---

## EXECUTE 0→7

| Step | 작업 |
|------|------|
| 0 | baseline 529/533 · 2552 |
| 1 | H16b-1 snapshot |
| 2 | H16b-3 today strip tier + snapshot |
| 3 | H16b-4 rank vip full tier |
| 4 | H16b-2 chip + context wiring |
| 5 | H16b-5 shell dedupe · remove HomeHeroBar dup |
| 6 | H16b-6 i18n · H16b-7/8 tests |
| 7 | vitest + §GREEN |

---

## §GREEN

```bash
bunx vitest run src/components/home/
bunx vitest run src/components/admin/
bunx vitest run wallet
bunx vitest run sports
bunx vitest run

python3 -c "import re;ko=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/ko.ts').read()));en=set(re.findall(r'\"([^\"]+)\":',open('src/i18n/en.ts').read()));print(len(ko^en))"

rg -n 'HomeWalletSnapshotCard' src/components/home/
rg -n 'TierProgressPanel' src/components/home/panels/HomeTodayPanel.tsx
rg -n 'TierProgressPanel' src/components/home/panels/HomeRankPanel.tsx
rg -c 'data-primary-cta' src/components/home/panels/HomeTodayPanel.tsx
rg -n '[가-힣]' src/components/home/ --glob '!**/i18n/**'
```

**PASS:** vitest carry · DIFF=0 · snapshot in home · **no** TierProgressPanel on today · **yes** on rank/vip · CTA=1 · Hangul 0

**§GREEN template:**

```text
L1-16b §GREEN — WalletSnapshot · tier→rank/vip · HomeHeroBar removed · hideAssets /home · fold0 no ladder · vitest N/N · DIFF=0 · 9b-Hb PASS · L1-17 unblocked.
```

---

## 9b-Hb manual (PC 1280px)

1. `/home` today — fold0 **no tier 3-card** · no page scroll for tier block
2. WalletSnapshot 1 card · shell **no duplicate** total assets
3. rank › vip — full tier UI
4. 등급 보기 → vip tab
5. en Korean 0

---

## NO-TOUCH

`/trade` L1-17 · admin · games · rpc · ZIP · 5-tab IA · no new routes

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 initial |
| 2026-06-17 | **v0.2** — HomeHeroBar remove · HomeTabContext · hideAssets · test split H16b-7/8 |

---

*L1-17 blocked until 16b §GREEN*
