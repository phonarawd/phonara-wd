# LOVABLE Sportsbook UI LOCK — L1-08 `/sports` · BetSlip v0.2.1

> **상태:** ✅ **§GREEN PASS** · L1-08 v0.2.1 + **V / V2 / V3** + **L1-09-S** · 2026-06-16  
> **Canvas catalog:** **1701/1701** · sports+nav **66/66** · ko=en DIFF=0  
> **Queue:** Sports **GATE close ✅** (2026-06-16) → ZIP Wave-1 대기 → paste Wave-1 → L1-10-W defer
> **분업:** UI/UX = Lovable canvas only · 엔진 = Cursor repo (S1–S22 GREEN) · paste 후 hook wire  
> **상위:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1

---

## Scope (1줄)

`/sports` 스포츠북 전체 UI surface — Hub(featured/live/upcoming/my-bets) · league chips(world-cup·mlb·epl·k-league) · FixtureRow · FixturePage(1X2/totals/spread/btts/props) · **BetSlipPanel** (single/combo≤8/sgp≤12 same-fixture/system disabled) · MyBetsList mock · presentation Live/suspend states · `sports.*` i18n (ko+en 동시 **+66 keys · catalog 1710 hard cap ±0**) · vitest BetSlip guards · **real RPC 0 · supabase 0 · client payout multiply 0**.

---

## GAP

- `/sports` route 0 · `src/components/sports/**` 0 · `sports.*` i18n key 0
- BottomNav 5-slot full → Sports 진입 surface 부재
- Cursor 엔진 S1–S22 GREEN + live ingest (world-cup 56 · mlb 17) — Lovable canvas는 mock JSON shape mirror만 (RPC 호출 0)

---

## Cursor 엔진 read-only contract (Lovable 호출 0 · shape mirror only)

| RPC (read) | Lovable mock loader shape |
|---|---|
| `rpc_list_sports_fixtures(league)` | `SportsFixtureSummary[]` |
| `rpc_get_fixture_markets(fixture_id)` | **`{ markets: SportsMarketSummary[] }`** wrapper |
| `rpc_get_live_fixture_state(fixture_id)` | live badge presentation |
| `rpc_list_sports_market_types()` | 10 market_type enum mirror |
| (write · paste 후 Cursor) | `rpc_place_sports_bet` · `rpc_list_my_sports_bets` · `rpc_get_sports_bet` · cashout |

Bet kinds: single · combo ≤8 · sgp ≤12 same fixture (`sports_sgp_max_legs=12`) · system (badge `sports.system.coming_soon` · disabled).

---

## IA diagram

```text
/sports
 ├─ AppShell density="app"
 ├─ SportsHubPage
 │   ├─ SportsTabs           [Featured · Live · Upcoming · My Bets]   ← ?status=
 │   ├─ SportsLeagueChips    [All · World Cup · MLB · EPL · K-League] ← ?league=
 │   ├─ list slot
 │   │   ├─ Featured  → hero + SportsFixtureRow[]
 │   │   ├─ Live      → SportsFixtureRow[ isLive ] + LiveBadge
 │   │   ├─ Upcoming  → grouped by date
 │   │   └─ My Bets   → MyBetsList (mock)
 │   └─ BetSlipFAB (mobile) · BetSlipPanel sticky (desktop ≥1024px)
 └─ BetSlipPanel (portal · global · testid="sports-slip-place")

/sports/fixture/:fixtureId
 ├─ Match header (teams · kickoff · LiveBadge)
 ├─ SportsMarketCard[ match_1x2 ]
 ├─ SportsMarketCard[ totals · totals_2_5 ]
 ├─ SportsMarketCard[ spread · handicap · asian_handicap ]
 ├─ SportsMarketCard[ btts ]
 ├─ SportsMarketCard[ prop_over_under · prop_yes_no ]
 └─ Suspended overlay if market.status === 'suspended'   ← F12

/sports/my-bets   → MyBetsList alias
```

---

## Touched files (신규 21 · 수정 4)

### 신규 (21)

| # | path | 역할 |
|---|---|---|
| N1 | `src/routes/sports.tsx` | hub route `/sports` (head meta noindex option · F6) |
| N2 | `src/routes/sports.fixture.$fixtureId.tsx` | `/sports/fixture/:fixtureId` |
| N3 | `src/routes/sports.my-bets.tsx` | `/sports/my-bets` alias |
| N4 | `src/components/sports/types.ts` | RPC shape mirror + paste SOT 주석 (F11/F13) |
| N5 | `src/components/sports/SportsHubPage.tsx` | tabs + league chips + list slot |
| N6 | `src/components/sports/SportsFixtureRow.tsx` | row · quick 1X2 3-button |
| N7 | `src/components/sports/SportsFixturePage.tsx` | header + market sections |
| N8 | `src/components/sports/SportsMarketCard.tsx` | grouped market · suspend overlay (F12) |
| N9 | `src/components/sports/SportsLeagueChips.tsx` | horizontal scroll chips |
| N10 | `src/components/sports/SportsTabs.tsx` | featured/live/upcoming/my-bets (router-sync `?status`) |
| N11 | `src/components/sports/SportsEmptyState.tsx` | i18n empty |
| N12 | `src/components/sports/SportsErrorBanner.tsx` | engine error code → i18n map |
| N13 | `src/components/sports/SportsLiveBadge.tsx` | live dot presentation |
| N14 | `src/components/sports/BetSlipPanel.tsx` | desktop sticky 360px · mobile 70vh · Place `data-testid="sports-slip-place"` |
| N15 | `src/components/sports/BetSlipLegRow.tsx` | leg row · remove |
| N16 | `src/components/sports/BetSlipStakeForm.tsx` | stake · tabular-nums · payout display prop |
| N17 | `src/components/sports/BetSlipModeTabs.tsx` | single/combo/sgp/system(disabled badge) |
| N18 | `src/components/sports/BetSlipProvider.tsx` | Context · guards B1–B8 · localStorage |
| N19 | `src/components/sports/MyBetsList.tsx` | mock rows · 5 status badges |
| N20 | `src/mocks/sports-fixtures-world-cup.json` | 8 mock fixtures (F12 enum) |
| N21 | `src/mocks/sports-fixtures-mlb.json` | 6 mock fixtures |

### 수정 (4)

| # | path | op |
|---|---|---|
| E1 | `src/components/shell/SideNav.tsx` | `nav.sports` (Casino 다음 · lucide `Goal`) |
| E2 | `src/components/shell/MoreMenu.tsx` | `/sports` row (mobile · BottomNav NO-TOUCH) |
| E3 | `src/i18n/ko.ts` | +66 keys append only |
| E4 | `src/i18n/en.ts` | mirror parity |

---

## `src/components/sports/types.ts` paste SOT (F11/F13)

```ts
// Paste wire SOT: PHONARA apps/web/src/features/sports/use-sports-betting.ts
// Field names: snake_case · RPC shape mirror · DO NOT camelCase rename (paste churn ban).

export interface SportsFixtureSummary {
  fixture_id: string;
  league_code: 'world-cup' | 'mlb' | 'epl' | 'k-league';
  home_name: string;
  away_name: string;
  kickoff_at: string;
  status: SportsFixtureStatus;
  match_1x2?: Record<'home'|'draw'|'away',
    { outcome_id: string; odds: string; captured_at: string }>;
}

export type SportsFixtureStatus = 'scheduled' | 'live' | 'finished' | 'void' | 'cancelled';

export type SportsMarketStatus = 'open' | 'suspended' | 'closed';

export interface SportsMarketOutcome {
  outcome_id: string;
  selection: string;
  line?: string | null;
  odds?: string | null;
  captured_at?: string | null;
}

export interface SportsMarketSummary {
  market_id: string;
  market_type:
    | 'match_1x2' | 'totals' | 'totals_2_5'
    | 'spread' | 'handicap' | 'asian_handicap'
    | 'btts' | 'prop_over_under' | 'prop_yes_no';
  status: SportsMarketStatus;
  line?: string | null;
  outcomes: SportsMarketOutcome[];
}

export interface GetFixtureMarketsResult { markets: SportsMarketSummary[] }
```

---

## Mock fixture vs market status (F12)

| pool | count | status |
|---|---|---|
| WC | 1 | `live` |
| WC | 1 | `finished` |
| WC | 6 | `scheduled` |
| MLB | 1 | `live` |
| MLB | 5 | `scheduled` |

- WC `live` fixture의 market 1건 → `market.status === 'suspended'` → overlay
- **`fixture.status: 'suspended'` 금지**

---

## BetSlip guards

| # | rule | trigger | toast key |
|---|---|---|---|
| B1 | combo ≤8 | 9th add | `sports.slip.combo_max` |
| B2 | sgp ≤12 same fixture | cross-fixture in sgp | `sports.slip.sgp_same_fixture` |
| B3 | dedupe outcome_id | re-tap toggle | (silent) |
| B5 | Place → ConfirmDialog → toast mock | place click | `sports.slip.place_mock_success` |
| B6 | combined odds display only | render | `sports.slip.preview_label` |

Persist: `phonara.sports.slip` (JSON · TTL 24h soft).

---

## i18n delta (+66 · catalog 1710 ±0)

| group | n | keys |
|---|---|---|
| nav | 1 | `nav.sports` |
| tabs | 4 | `sports.tab.featured · live · upcoming · myBets` |
| leagues | 5 | `sports.league.world_cup · mlb · epl · k_league · all` |
| fixture | 6 | `sports.fixture.kickoff · empty · loadingOdds · finished · scheduled · vs` |
| live (F9) | 3 | `sports.live.badge · sports.live.suspended · sports.live.stale` |
| market sections | 5 | `sports.market.match_1x2 · totals · spread · btts · props` |
| market outcomes | 6 | `sports.market.home · away · draw · over · under · line` |
| slip core | 10 | `sports.slip.title · empty · stake · combined · payout · place · clear · confirm · preview_label · currency` |
| slip mode | 4 | `sports.slip.mode.single · combo · sgp · system` |
| slip toast | 4 | `sports.slip.combo_max · sgp_same_fixture · place_mock_success · place_mock_hint` |
| slip confirm | 2 | `sports.slip.confirm.title · confirm.body` |
| bet status | 5 | `sports.bet.status.pending · won · lost · void · cashed_out` |
| cashout | 2 | `sports.cashout.preview · cashout.cta` |
| errors | 8 | `sports.errors.*` (odds_changed … unknown) |
| system defer | 1 | `sports.system.coming_soon` |
| **합계** | **66** | **1710 (±0)** |

---

## Visual References (Tier A · code import 0)

- https://github.com/richiekaroki/solami-sportsbook-landing
- https://github.com/LucasReisVillasBoas/openbet-core · https://openbet-core-shell.vercel.app
- https://github.com/nutcas3/lets-bet
- https://stake.com/sports
- **Tier E 금지:** bigfrankykevin/sportsbook · fairrustana/Sports-Betting-Sportsbook

---

## LOCK Footer

| # | rule |
|---|---|
| F1 | Place = toast mock only (paste 전) |
| F2 | Odds = display props · 「실시간 보장」 금지 |
| F3 | Imported tokens 1:1 · hex leak 0 |
| F4 | Vendor/API 이름 UI 금지 |
| F5 | Place 전 ConfirmDialog |
| F6 | `/sports` noindex meta option |
| F7 | Lovable EXECUTE only · Cursor /sports UI 창작 금지 |
| F8 | Hook/RPC wire = paste GO 후 Cursor |
| F9 | i18n live prefix `sports.live.*` 통일 |
| F10 | catalog hard cap 1710 ±0 · Δ=66 |
| F11 | types.ts snake_case · `{ markets:[] }` wrapper |
| F12 | fixture.status 5종 · suspended = market.status only |
| F13 | SportsMarketStatus = open \| suspended \| closed (`settled` 제거) |

**FAIL =** rpc_* in Lovable canvas · client odds multiply · fixture.status suspended · catalog ≠ 1710 · Place testid ≠ sports-slip-place · BottomNav 5-slot 변경

---

## NO-TOUCH

- ImportedSettingsPage · ImportedAccountPage (L1-13 FROZEN)
- `src/games/**` · Crash FROZEN · casino/trade components
- i18n lines 1–1644 append only
- casino/trade/wallet/earn/account/settings routes
- BottomNav · AppShell · SiteFooter
- `supabase/**` · `packages/**` · `features/sports/use-*.ts`

---

## EXECUTE order (Step 1→10)

1. SportsHubPage + tabs + chips + mock + types.ts (F11/F13)
2. SportsFixtureRow + SportsFixturePage + suspended overlay (F12)
3. BetSlipProvider + BetSlipPanel + `sports-slip-place` testid
4. MyBetsList mock + 5 status badges
5. Live tab + LiveBadge + suspended presentation
6. i18n +66 (F9/F10)
7. Motion
8. vitest guards B1·B2·B3 · testid
9. §GREEN full self-check + manual 1회
10. §GREEN report + next LOCK DRAFT · ZIP defer

---

## §GREEN self-check (Step 9 · full block)

```bash
rg -n 'createFileRoute\("/sports' src/routes/sports*.tsx

rg -n "supabase|@supabase|rpc_place_sports_bet|rpc_list_sports_fixtures|rpc_get_fixture_markets|rpc_get_live_fixture_state" \
  src/components/sports src/routes/sports* src/mocks/sports-*.json && echo FAIL || echo OK

rg -n "Decimal|BigNumber|@phonara/money" src/components/sports src/routes/sports* && echo FAIL || echo OK

rg -n "'settled'|\"settled\"" src/components/sports && echo FAIL || echo OK
rg -n "pending|won|lost|void|cashed_out" src/components/sports/MyBetsList.tsx | wc -l

rg -ni "bet365|1xbet|oddsportal|the[- ]?odds[- ]?api|pinnacle" \
  src/components/sports src/routes/sports* src/mocks && echo FAIL || echo OK

rg "[가-힣]" src/components/sports src/routes/sports* src/mocks/sports-*.json && echo FAIL || echo OK

rg -n '"live\.suspended"|"live\.badge"|"live\.stale"' src/i18n && echo FAIL || echo OK
rg -c '"sports\.live\.' src/i18n/ko.ts
rg -c '"sports\.live\.' src/i18n/en.ts

grep -c '"' src/i18n/ko.ts
grep -c '"' src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts | sort) \
     <(rg -o '^\s+"[^"]+":' src/i18n/en.ts | sort)

rg -n "Paste wire SOT" src/components/sports/types.ts
rg -n "GetFixtureMarketsResult|markets:\s*SportsMarketSummary" src/components/sports/types.ts
rg -n "'settled'" src/components/sports/types.ts && echo FAIL || echo OK

rg -n '"status":\s*"suspended"' src/mocks/sports-fixtures-*.json && echo FAIL || echo OK
rg -n "market\.status\s*===\s*'suspended'" src/components/sports/SportsMarketCard.tsx

rg -n 'data-testid="sports-slip-place"' src/components/sports | wc -l
rg -n 'data-testid="(sports-place|bet-slip-place)"' src/components/sports && echo FAIL || echo OK

rg -n "combo_max|sgp_same_fixture" src/components/sports/BetSlipProvider.tsx

git diff --stat src/components/pages src/games src/components/casino \
  src/components/trade src/routes/casino* src/routes/trade* src/routes/wallet* \
  src/routes/account.tsx src/routes/settings.tsx \
  src/components/shell/AppShell.tsx src/components/shell/BottomNav.tsx

bun run test
```

**§GREEN manual (1회):** Featured → World Cup → Live badge · combo 9th toast · sgp cross-fixture toast · Place → Confirm → mock success · refresh slip persist · market suspended overlay.

---

## paste adapter memo (Cursor · L2)

- Lovable: UI ZIP only · mock place 삭제는 paste wire 후
- Cursor: `presentation-import/` 1:1 흡수 · `use-sports-betting.ts` wire · 기존 `apps/web/src/routes/sports.tsx` 교체
- `packages/i18n` 기존 `sports.*`와 Lovable catalog merge/dedup · vendor subtitle 제거

---

## i18n §GREEN grep 표준 (Lovable canvas · 2-space 들여쓰기)

```bash
# NOT '^    "' (4-space) — false 9 hit
grep -c '^  "' src/i18n/ko.ts                              # 1701
grep -c '^  "' src/i18n/en.ts                              # 1701
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts   # 66 each
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts | sort) \
     <(rg -o '^\s+"[^"]+":' src/i18n/en.ts | sort)            # empty
```

---

## Next LOCK DRAFT

paste(L2) 후 engine wire · (선택) BottomNav Sports 슬롯 · L1-10+ realtime/cashout RPC

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | LOCK DRAFT 초판 |
| 2026-06-16 | **L1-08-V §GREEN** · Stake visual polish · lg:pr-[376px] · F14–F17 · combo chip defer |
| 2026-06-16 | **§GREEN PASS** · Step 6-R Option D · canvas 1701 · hydration formatKickoff UTC |
| 2026-06-16 | **L1-08-V2/V3 + L1-09-S §GREEN** · vitest 9/9 · mutex · tick · cashout · system matrix · i18n grep 2-space 표준 |

---

*Lovable canvas EXECUTE 1→10 · PHONARA repo paste 전 0-touch*
