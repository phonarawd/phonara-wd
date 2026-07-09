# Surface Blueprints (D2)

> **상태:** D2 complete (2026-06-30)  
> **역할:** D1/D1.5 reference를 **실제 화면 설계도**로 변환 — clone 지시 아님  
> **Route mapping:** [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md)  
> **Reference map:** [`UX_REFERENCE_CANON.md`](UX_REFERENCE_CANON.md)  
> **Domain UX:** `*_UX_CANON.md` · **Display fields:** [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md)

## Blueprint 사용 규칙 (non-waivable)

| 허용                                                                             | 금지                                                                         |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| blueprint는 PHONARA route · controller · engine boundary 안 **정보 구조**만 정의 | reference 제품 문구·로고·에셋·고유 visual identity **복제**                  |
| U-phase 구현 시 **Required modules 전부** wire                                   | blueprint에 없는 모듈 **임의 추가** (→ [`DECISION_LOG.md`](DECISION_LOG.md)) |
| 필수 모듈 **제거** 시 Decision Log + operator 인지                               | "Binance 느낌" 등 **모호한 감성만**으로 layout 결정                          |
| responsive 3-tier: mobile 390 · tablet 768 · desktop 1024                        | single mockup width만 기준으로 desktop/mobile 설계                           |

필수 모듈 추가/제거 · reference 변경 → Decision Log 기록.

---

## Blueprint 공통 형식

```text
Surface:
Routes:
Primary reference:
Secondary reference:
Desktop layout:
Mobile layout:
Required modules:
Priority order:
Forbidden patterns:
Completion signals:
```

---

## Auth

**Routes:** `/login` · `/signup` · `/reset-password` · `/auth/callback`  
**Domain canon:** [`AUTH_UX_CANON.md`](AUTH_UX_CANON.md)

**Primary reference:** Apple  
**Secondary reference:** Notion · Linear

### Desktop layout

- Centered form with strong brand trust cue
- Clear title, concise support copy, primary CTA
- Secondary actions below primary flow
- Error/help states close to inputs

### Mobile layout

- Single-column form
- Thumb-safe CTA (≥48px touch target)
- Minimal visual noise
- Recovery links visible but secondary

### Required modules

- Brand Trust Cue
- Email/Password or auth inputs (passkey/magic-link when supported)
- Primary CTA
- Secondary auth links (signup · reset)
- Inline Error State
- Loading State
- Recovery Path
- Security/Privacy Cue

### Priority order

1. Understand where I am
2. Enter credentials
3. Recover from error
4. Move to signup/reset when needed

### Forbidden patterns

- Decorative mockup shell
- Hidden error recovery
- Excessive marketing above form
- Toast-only errors without inline field feedback
- Inline hardcoded copy (i18n key only)

### Completion signals

- Fast entry — primary action obvious within 3 seconds
- Clear recovery — forgot password · support visible without hunt
- Accessible form labels, focus order, and keyboard flow
- U1 Auth pilot gate — controller/session wiring unchanged
- `gate:ai-impl -- --test` auth owner vitest green

---

## Home

**Routes:** `/home` (canonical Earn hub) · `/earn` redirect-only · `/earn/missions` → `/home/missions`  
**Domain canon:** [`HOME_UX_CANON.md`](HOME_UX_CANON.md)

**Primary reference:** Toss  
**Secondary reference:** Coinbase · Robinhood · Telegram Mini App

### Desktop layout

- Top: account status, balance/reward summary, next best action
- Main: personalized cards for Earn, Wallet, Trade/Sports/Casino entry (navigate only), events
- Side: activity feed, notifications, trust/status cues
- Bottom: educational or discovery modules (low density)

### Mobile layout

- Top: status summary and primary next action
- Feed: cards ordered by user value
- Sticky nav: canonical product areas (5-tab IA)

### Required modules

- Account/Status Summary
- Balance or Reward Snapshot (RPC display only)
- Next Best Action
- Product Entry Cards (Earn · Wallet · Trade · Sports · Casino — navigate only)
- Activity/Notification Feed
- Trust/Safety Cues (KYC · RG · halt · restriction)
- Onboarding/Restriction State

### Priority order

1. What is my current status?
2. What should I do next?
3. Where do I go for money/reward/bet flows?
4. What changed recently?

### Forbidden patterns

- Random promotional feed with no user state
- False activity or misleading social proof
- Multiple competing home hubs (`/earn` standalone rebuild)
- Client-side balance/reward recompute
- Duplicate Earn hub CTAs pointing to non-canonical URLs

### Completion signals

- User understands app value within seconds
- Canonical navigation obvious — `/home` single Earn hub
- Consolidation C1 — `check:ui-architecture` `dual-earn-hub` **0**
- [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md) `/home` canonical

---

## Trade

**Routes:** `/trade` · `/trade/futures` · `/trade/spot/$pair` · `/trade/positions` · `/trade/orders` — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md) §12.19 · §13.1.2  
**Domain canon:** [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)  
**Note:** `/staking` · `/staking/positions` = **Earn** chapter (`r0-staking-domain-sot-sync`) — not Trade.

**Primary reference:** Binance Desktop  
**Secondary reference:** Bybit Unified Trading · OKX · Coinbase motion

### Desktop layout

- Left (~20%): market selector, symbol list, watchlist, category filters
- Center (~45%): TradingView-style chart, symbol header, market context
- Right (~20%): order panel, buy/sell controls, order type, size, balance
- Bottom (full width): positions, open orders, order history, fills, risk/margin summary
- Supporting rail or collapsible area: order book and recent trades when density allows

### Mobile layout

- Top: symbol header, price, change, quick market selector
- Main: chart first, then order action tabs
- Bottom or sticky CTA: buy/sell entry (thumb-safe)
- Secondary tabs: positions, open orders, order history

### Required modules

- Market Selector
- Symbol Header
- TradingView-style Chart
- Order Book
- Recent Trades
- Order Panel
- Asset Balance
- Open Positions
- Open Orders
- Order History
- Margin/Risk Indicator
- Connection/market status (oracleStale · circuit breaker)

### Priority order

1. Price and selected market
2. Chart and market context
3. Order action
4. Positions and open orders
5. History and secondary analytics

### Forbidden patterns

- Card-only casual layout on desktop
- Hidden order panel
- Decorative chart without trading density
- Mobile-first simplified desktop
- Client-side recomputation of balances, odds, PnL, margin, fees
- Emoji or casual tone on financial controls
- Sports/Casino embed · bet slip · league tree · `?section=sports|casino` in Trade chrome
- External exchange settlement copy or API linkage (§13.1.2 — on-platform only)
- Using chart/WS feed for order settlement (display-only · ADR-0002)

### Platform settlement (§13.1.2)

- **UX:** exchange-grade density — real-time LWC chart · synthetic order book · recent trades · bottom dock
- **Settlement:** PHONARA engine only — spot/futures/staking RPC · house fill · ledger Σ=0
- **Display:** `DISPLAY_ONLY_FEED` · majors WS · PHON oracle candles — never order input
- **Contract:** `TRADE_PLATFORM_SETTLEMENT_MODEL` · `TRADE_REALTIME_MARKET_DATA_MATRIX`

### Beginner guide (§13.1.3)

- [`TRADE_BEGINNER_LANGUAGE_CANON.md`](TRADE_BEGINNER_LANGUAGE_CANON.md) — HowItWorks 3단계 · HelpTip 용어表
- Risk sheet (§32.5) **+** surface how-it-works — 기능 설명과 리스크 **분리**
- Todo: `p9-trade-beginner-help-layer`

### Completion signals

- Professional trader UI — fast scanning at desktop density
- Thumb-safe mobile order flow
- Controller/hook/RPC signature unchanged — [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)
- [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) trade rows exposed or decision logged
- See [`TRADE_UX_CANON.md`](TRADE_UX_CANON.md)

---

## Sports

> **갱신:** 2026-07-01 — Stake식 IA (sport tree · 3-column · slip always) · [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md) 정본

**Routes:** `/sports` · `/sports/prematch` · `/sports/live` · `/sports/my-bets` · `/sports/fixture/$fixtureId` · `/sports/rules`  
**Domain canon:** [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md)

**Primary reference:** Stake.com (IA: sport tree · 3-column · persistent bet slip · dense fixture rows)  
**Secondary reference:** bet365 · DraftKings · Pinnacle · Flashscore

### Desktop layout (1024+)

| Zone   | ~%     | Content                                                                                                                                                |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Left   | 18–22% | Sports **sport tree** (⚽축구 · ⚾야구 · 🏀농구 … 세로). 종목 click → league accordion. **always visible**. **≠** PHONARA global sidebar (HomeSideNav) |
| Center | 55–62% | Selected sport/league fixture list. **One row:** kickoff · league badge · teams · inline 1x2 odds — **dense, no giant gutter**                         |
| Right  | 20–24% | **Bet slip rail always mounted** — selection · stake · est. return · place bet. Empty: compact “select odds” state                                     |

- Odds cluster **right-aligned** on row — no flex-grow gap between team names and odds
- Center column **grid-bound** — row must not span full viewport alone
- Standalone `/sports` lg+: slip **rail only** (FAB/sheet-only desktop forbidden)
- Live: score · timer · status inline on row/header

### Mobile layout (390px)

**Sticky stack (order fixed):** sport tabs (horizontal scroll, internal only) → league chips under sport → featured/live/today/upcoming tabs

- Main: compact fixture list only
- Bet slip: bottom sheet — **open = betting first:** selected leg · stake · primary CTA above fold
- Onboarding: **? icon** → sheet; default hidden — no full-width plain-language strip in slip header
- Page root **`overflow-x: hidden`** — horizontal scroll **0** except sport tab / league chip rows

### Required modules

- Sport Tree (desktop left rail)
- Sport Tab Bar (mobile sticky)
- League Navigation (under selected sport — not flat global league list)
- Match Rows (dense scan)
- Odds Table (inline 1x2 minimum)
- Market Group Filters
- Live Score
- Timer
- Bet Slip Rail (desktop always mounted)
- Bet Slip Sheet (mobile)
- Slip Empty State (compact)
- Slip How-To (? collapsed only)
- Selection Summary
- Stake/Risk Confirmation
- Empty and suspended market states
- sportsBlocked/gate reason display

### Priority order

1. Sport/league context (3-tier: sport → league → fixture)
2. Match/odds scan (dense center)
3. Selection + stake + place bet (slip primary)
4. Live status and statistics
5. History/secondary markets · collapsed help

### Data dependencies · implementation order

**Order (non-waivable):** `sport_code` **engine work first** → sport tree UI wired to RPC payload with `sport_code`. Do **not** ship sport tree UI on client-side `league_code` derivation first.

| Item                                       | Status                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `sport_code` on `rpc_list_sports_fixtures` | **Missing** — see [`SPORT_CODE_IMPACT.md`](SPORT_CODE_IMPACT.md)                                                            |
| Sport tree UI                              | **After** RPC exposes `sport_code`                                                                                          |
| `league_code` → sport derivation           | **`sport_code` is canonical**; pre-RPC fallback concept only — not UI SSOT ([`SPORTS_DATA_AUDIT.md`](SPORTS_DATA_AUDIT.md)) |
| League catalog RPC                         | **Missing** — engine/catalog work for sport-scoped leagues                                                                  |
| Unmapped fixtures                          | **other** bucket — must not hide                                                                                            |

### Forbidden patterns

- Flat **`league_code` list only** without sport tier (current chips/rail pattern)
- **Sport tree UI before `sport_code` RPC** — league-derived client mapping as primary nav source
- Desktop center full-bleed rows with **giant empty gutter** between teams and odds
- lg+ bet slip **off-screen** · FAB-only · rail not mounted
- Mobile slip open with **tutorial/plain-language occupying 50%+ viewport**
- Mobile **page-body horizontal scroll**
- Odds hidden behind modal only
- Only card grid for desktop odds (table scan required)
- Detached bet slip that loses selections
- Ambiguous suspended/closed market states
- Client-side odds or payout recompute

### Completion signals

- [ ] sport → league → fixture 3-tier navigation — **RPC `sport_code` backed**
- [ ] lg+ right slip **always mounted** (compact empty OK)
- [ ] mobile sheet: stake + CTA above fold without scrolling past tutorial
- [ ] page root horizontal scroll **0** (chip/tab rows exempt)
- [ ] unmapped fixtures in **other** bucket visible
- [ ] major sportsbook scan density · server-trusted odds · live status trustworthy
- [ ] See [`SPORTS_UX_CANON.md`](SPORTS_UX_CANON.md)

---

## Wallet

**Routes:** `/wallet` · `/ledger` · `/rewards`  
**Domain canon:** [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md)

**Primary reference:** Toss  
**Secondary reference:** Revolut · Apple Wallet · Coinbase Wallet

### Desktop layout

- Top: total assets, available/locked split, primary CTA group
- Main: asset cards and balance details
- Side or secondary panel: deposit, withdraw, transfer, verification status
- Bottom: transaction timeline and filters

### Mobile layout

- Top: total asset summary
- Immediate CTA row: deposit, withdraw, transfer
- Cards: balances, pending settlement, restrictions
- Timeline: recent transactions with status

### Required modules

- Total Asset Summary
- Available/Locked Balance
- Deposit CTA
- Withdraw CTA
- Transfer CTA where supported
- Pending/Settled/Failed Status
- Transaction Timeline
- KYC/Restriction Notice
- Fee/Network/Settlement Explanation
- Provider cards per [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) (D3 complete)

### Priority order

1. User balance clarity — "how much can I use?"
2. Deposit/withdraw action
3. Pending or restricted state
4. Transaction history
5. Details and support

### Forbidden patterns

- Hiding locked balance
- Ambiguous pending status
- Small or buried deposit/withdraw CTAs
- Client-side money arithmetic
- Guaranteed settlement copy without RPC backing

### Completion signals

- Beginner can answer "how much can I use?" immediately
- Deposit/withdraw path obvious within 1–2 taps (mobile)
- Every transaction state explains what happened
- Money helpers and controller contracts unchanged
- [`WALLET_UX_CANON.md`](WALLET_UX_CANON.md) · [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) wallet rows exposed

---

## Earn

**Routes:** `/home` (hub) · `/home/missions` · `/referral` · `/tier/*` · `/earn/**` · `/share/earnings` · `/staking` · `/staking/positions` — **`/earn` hub redirect-only**  
**Domain canon:** [`EARN_UX_CANON.md`](EARN_UX_CANON.md)  
**Staking:** Earn subnav chip · `surface-domain-boundary` `earn` (`r0-staking-domain-sot-sync`)

**Primary reference:** Toss  
**Secondary reference:** Cashwalk · PanelNow · Obey · Coupang Partners · reward apps

### Desktop layout

- Top: today expected earnings, available reward, next cashout path
- Main: recommended missions and progress
- Sections: survey, app install, shopping, partner, referral, daily check-in
- Side: streak, tier, cashout eligibility, safety/explanation panel

### Mobile layout

- Top: today earnings and available reward
- Quick tabs: recommended, survey, app install, shopping, referral, check-in
- Mission cards: reward, time cost, difficulty, progress
- Bottom: cashout and referral CTA

### Required modules

- Today Earnings
- Available Reward
- Recommended Missions
- Mission Category Tabs
- Mission Card with reward/time/difficulty
- Progress and Completion State
- Partner/Referral Entry
- Cashout CTA
- Explanation for reward timing and eligibility

### Priority order

1. What can I earn today?
2. What should I do next?
3. How long and how hard is it?
4. When can I cash out?
5. How do referral/partner rewards work?

### Forbidden patterns

- Exaggerated rewards
- False urgency or false deadline
- Hidden eligibility conditions
- Confusing reward timing
- Activity feed as engine mutation (presentation display props only)

### Completion signals

- Novice understands action, reward, effort, and cashout path
- Repeat participation encouraged without deception
- FOMO copy restrained and truthful — [`COPYWRITING_CANON.md`](COPYWRITING_CANON.md)
- See [`EARN_UX_CANON.md`](EARN_UX_CANON.md)

---

## Casino

**Routes:** `/casino` · `/casino/*` · `/games/*` · 12 game routes  
**Domain canon:** [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md) (D1.5 game-specific detail)

**Primary reference:** Stake  
**Secondary reference:** BC.Game · Roobet · Shuffle · Rollbit responsiveness

### Casino Full Presentation Reset

- Every casino game presentation must be rebuilt completely.
- Existing layouts, JSX trees, component hierarchy, visual hierarchy, spacing, navigation, betting flow, HUD, animations, tabs, cards, side panels, dialogs, modals, auto bet UI, history UI, statistics UI, desktop layout, and mobile layout are **not** reference implementations.
- Do not preserve, modernize, or refactor legacy presentation as the final answer.
- Replace presentation completely, in place, while preserving engine wiring.

### Engine Freeze (presentation-only rebuild)

| Preserve                                                                                                                                                           | Rebuild                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Game engine · RPC · controller contracts · hooks (engine/state wiring) · settlement · provably fair · websocket/state channels · money calculation · API contracts | JSX · CSS · layout · HUD · betting flow · auto bet UI · history/statistics · motion · onboarding/loading/empty/error states |

**Safe legacy component rule:** wiring-bearing legacy → preserve wiring, rebuild presentation only. Reuse requires [`DECISION_LOG.md`](DECISION_LOG.md) with exact wiring reason.

**World-class UX goal:** premium international crypto casino usability — reference **information architecture, interaction flow, density, motion language, auto bet, accessibility, mobile optimization** only. No proprietary branding, graphics, artwork, wording, or visual identity copy.

### Desktop layout

- Top: game categories, balance/status, fairness cue
- Main: featured games, recently played, category rails
- Game surface: stage, controls, bet amount, result, history
- Side or lower panel: provably fair info, rules, recent outcomes

### Mobile layout

- Top: balance and game selector
- Main: game stage (dominates viewport)
- Sticky controls: bet amount, action, repeat
- Secondary tabs: fairness, history, rules

### Required modules

- Game Category Navigation
- Game Card/Grid
- Balance Display
- Bet Controls
- **Dedicated Auto Bet Controls** (first-class — not modal-only)
- Result State
- Recent Outcomes
- Provably Fair Cue
- Rules/How-to-play
- Risk/Limit State (RG · session limits)
- Live Statistics
- Session Summary

### Priority order

1. Selected game and playable state
2. Bet controls and balance
3. Result and recent outcomes
4. Fairness and rules
5. Discovery of other games

### Forbidden patterns

- Hiding fairness info
- Overstated win language
- Settlement/RPC changes from UI work
- Decorative game UI that obscures state
- Generic one-layout-fits-all game presentation
- Auto bet hidden in optional popup only
- Reusing old HUD/navigation/betting flow as final presentation

### Auto Bet Canon (cross-game)

- Auto Bet is a **first-class** feature — not an optional popup
- Always accessible · one-click enable · clear running state
- Live statistics · stop conditions · profit target · loss limit
- Session summary · mobile thumb-friendly · desktop operator-grade controls
- Detail: [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md) §Auto Bet

### Game-specific rebuild list

Each game must have: dedicated desktop layout · dedicated mobile layout · dedicated HUD · dedicated betting flow · dedicated animation language · dedicated auto bet workflow · dedicated history/statistics · dedicated onboarding · dedicated loading · dedicated empty · dedicated error state.

| Game       | UX focus (summary)                              |
| ---------- | ----------------------------------------------- |
| Crash      | Live multiplier · graph-first · lightning rebet |
| Limbo      | Target multiplier-centric · instant iteration   |
| Dice       | Probability and payout visualization            |
| Mines      | Large interactive grid · risk progression       |
| Hi-Lo      | Card visibility · decision confidence           |
| Plinko     | Physics stage dominates · intuitive controls    |
| Mint Reels | Modern slot cabinet · spin flow                 |
| Gold Rush  | Reward anticipation · bonus progression         |
| Roulette   | Table clarity · chip management · rapid repeat  |
| Blackjack  | Clean card table · decisive actions             |
| Deepshaft  | Progressive descent · depth visualization       |
| Momentum   | High-tempo slot · combo/multiplier emphasis     |

Per-game forbidden/completion detail: [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md)

### Completion signals

- Fast play loop — rebet/auto bet without friction
- Fairness and balance status always visible
- Engine/game settlement untouched
- Dedicated desktop and mobile layout **per game**
- Pixi/canvas engine wiring preserved — [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)

---

## Admin

**Routes:** `/admin/*` — user↔admin: [`PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md`](../PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX.md)  
**Domain canon:** [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)

**Primary reference:** Grafana  
**Secondary reference:** Stripe Dashboard · Supabase Studio

### Desktop layout

- Left: durable admin navigation
- Top: global status, environment, operator identity
- Main: exception queue or selected desk
- Right/side detail: audit, reason, action confirmation where needed

### Mobile/tablet layout

- Admin mobile is secondary but must remain usable
- Navigation collapses
- Tables become searchable lists
- High-risk actions keep confirmation and reason

### Required modules

- Exception Queue ("오늘 해야 할 일" first)
- Status Overview
- Audit Trail
- User/Wallet/Sports/Casino/Earn desk entries
- Filters/Search
- Action Reason Input
- Confirmation for High-risk Actions
- Permission/Role Feedback (server-trusted)

### Priority order

1. What needs operator attention?
2. What is the risk?
3. What evidence/audit exists?
4. What action is allowed?
5. What happened after action?

### Forbidden patterns

- Hiding audit trail
- Action without reason
- UI-only permission assumptions (hide button ≠ secure)
- Dense table with no filtering
- Jargon-only screens without operator plain language

### Completion signals

- One operator can triage exceptions quickly
- Every high-risk action explainable and auditable
- Admin hooks/RPC permissions unchanged
- See [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md)

---

## Cross-surface completion signals (U-phase)

모든 surface U-phase closeout 시 아래를 **추가**로 만족 (Phase R surface completion — [`REBUILD_PLAN_v1.md`](../PRODUCT/REBUILD_PLAN_v1.md)).

| Signal           | 기준                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Responsive       | mobile 390 · tablet 768 · desktop 1024 — layout 붕괴 0                                            |
| Token-only       | hardcoded hex/spacing/radius/shadow 0 — [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)            |
| Engine           | controller/hook/RPC signature unchanged — [`ENGINE_BOUNDARY.md`](ENGINE_BOUNDARY.md)              |
| Display          | [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md) required fields exposed or decision logged |
| Lightweight gate | `gate:ai-impl -- --test <owner-vitest-path>` green                                                |
| i18n             | user copy i18n key only · `check:i18n` green                                                      |
| Release          | `check:release` green — no test/debug UI in prod paths                                            |

---

## Blueprint ↔ route audit

모든 blueprint는 [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md) canonical route · tab · redirect · admin route 중 하나에 매핑.

| Blueprint     | Canonical routes / notes                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| Auth          | `/login` · `/signup` · `/reset-password` · `/auth/callback`                            |
| Home          | `/home` — `/earn` **redirect-only**                                                    |
| Earn missions | `/home/missions` — `/earn/missions` redirect                                           |
| Trade         | `/trade` · `/trade/futures` · `/trade/positions` · `/trade/orders` — Trade-only subnav |
| Sports        | `/sports` · `/sports/fixture/$fixtureId` · sports subnav (§12.19)                      |
| Casino        | `/casino` · `/games/*` · 12 `/casino/*` game routes                                    |
| Wallet        | `/wallet` · `/ledger` · `/rewards`                                                     |
| Earn staking  | `/staking` · `/staking/positions` — Earn subnav (`r0-staking-domain-sot-sync`)         |
| Admin         | `/admin/*` per registry                                                                |

**Mismatch** (blueprint module without route owner · orphan route without blueprint) → [`DECISION_LOG.md`](DECISION_LOG.md) before U-phase.

---

## Verification (D2 done)

- [x] 본 문서 — 8 surface blueprint (Auth · Home · Trade · Sports · Wallet · Earn · Casino · Admin)
- [x] 각 surface — Primary/Secondary reference · Desktop/Mobile layout · Required modules · Priority order · Forbidden patterns · Completion signals
- [x] Casino — Full Presentation Reset · Engine Freeze · Auto Bet Canon · 12-game list cross-link [`CASINO_UX_CANON.md`](CASINO_UX_CANON.md)
- [x] Cross-surface U-phase completion signals · route audit table
- [x] [`DECISION_LOG.md`](DECISION_LOG.md) Decision 012
- [x] D2 narrative complete · Phase R queue — [`ACTIVE_WORK_SSOT.md`](ACTIVE_WORK_SSOT.md) (구 rebuild/NEXT_STEP.md는 2026-07-04 삭제)

## Verification (D3 done)

- [x] [`PAYMENT_ARCHITECTURE_CANON.md`](PAYMENT_ARCHITECTURE_CANON.md) — provider card · status grammar · wallet structure
- [x] [`ADMIN_UX_CANON.md`](ADMIN_UX_CANON.md) — exception queue · operator language · audit
- [x] [`I18N_FIRST.md`](I18N_FIRST.md) · [`GLOBAL_EXPANSION.md`](GLOBAL_EXPANSION.md) · [`UNIFIED_UX_CANON.md`](UNIFIED_UX_CANON.md)
- [x] [`DECISION_LOG.md`](DECISION_LOG.md) Decision 013

**Next phase:** D4 Product Principles + UX Writing — D3 완료 전 D4 착수 **금지**.
