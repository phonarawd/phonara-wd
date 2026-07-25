<!-- GENERATED — do not edit by hand. Run: bun run generate:ssot-freeze-manifest -->

# Engine Integration Playbook

> **Generated:** 2026-07-24 · **Source:** page controllers · desk surfaces · `page-controller-view-shapes.ts`
> **Rule:** UI rebuild replaces presentation only. Consume controller/hook output — never recompute money/odds/settlement.

## How to use (U-phase surface implementation)

1. Confirm route/tab in [`ROUTE_CANONICAL_REGISTRY.md`](ROUTE_CANONICAL_REGISTRY.md).
2. Confirm wiring in [`FREEZE_MANIFEST.md`](FREEZE_MANIFEST.md).
3. Confirm display fields in [`DISPLAY_DATA_CONTRACT.md`](DISPLAY_DATA_CONTRACT.md).
4. Read the surface section below — wire **Display values** and **Action handlers** only.
5. If a blueprint field is **missing-from-contract** → remove UI, show unavailable state, or separate engine work ([`DECISION_LOG.md`](DECISION_LOG.md)).
6. Verify with lightweight mount/action vitest listed under **Mount smoke test**.

## Global principles

- UI displays engine output; never recomputes balance, odds, payout, fee, margin, or PnL.
- UI calls existing controller/hook action handlers — no new `use*-page-controller` and no signature changes.
- UI does not add direct `rpc_*` / `supabase.from` calls in desk surfaces or presentation pages.
- Route → `*DeskSurface` → controller hook → existing hooks/RPC boundary chain stays intact.
- Auto Bet session UI: `useAutoBetQueue` is **ui-only-local** — display OK, ledger drive **forbidden**.

## Missing contract summary (blockers)

- **Wallet · heroBalanceDisplay** — 
- **Wallet · phonAvailableDisplay** — 
- **Wallet · usdtAvailableDisplay** — 
- **Wallet · withdrawAvailableDisplay** — 
- **Wallet · giftcardPreviewFeeDisplay** — 
- **Trade · futuresPositions (incl. realized_pnl, margin_amount, liquidation_price, open_fee)** — Position rows from DB via useFuturesPositions
- **Trade · margin input / margin mode** — useFuturesActions local state — not on TradePageControllerView; UI must not invent margin

## Controllers without freeze view type

- `useAccountPageController` — wire `AccountPageViewProps` only until freeze shape added
- `useOnboardingPageController` — step navigation handlers only until freeze shape added

## LoginDeskSurface

```text
Surface: LoginDeskSurface
Route: /login
Controller: useLoginPageController
Hooks: contexts/auth-context · lib/auth (signInWithPassword · sendMagicLink · signInWithPasskey)
RPC/lib boundary: Supabase Auth client — no wallet RPC
Engine package: Supabase Auth
DB boundary: auth.users · profiles trigger

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: useAuth().loading → controller.loading
Error state source: controller.errorKey (authErrorMessageKey)
Empty state source: N/A — form always rendered
Success/result state source: session set via setAuthSession · redirectOnSuccess → /home
Permission/restriction state source: N/A
Money/odds/balance display source: N/A
Forbidden direct calls: supabase.auth.* from presentation JSX · new auth RPC from desk surface
Required test fixture: isVisualFixtureMode() · VISUAL_FIXTURE.authEmailPlaceholder
Mount smoke test: gate:ai-impl — auth flow vitest · E2E /login smoke
```

## SignupDeskSurface

```text
Surface: SignupDeskSurface
Route: /signup · /r/$code
Controller: useSignupPageController
Hooks: contexts/auth-context · lib/auth signup + email verification
RPC/lib boundary: Supabase Auth signUp · resend
Engine package: Supabase Auth
DB boundary: auth.users · handle_new_user profiles/wallets

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: useAuth().loading
Error state source: controller.errorKey · resendErrorKey
Empty state source: N/A
Success/result state source: verifySent · session on confirm
Permission/restriction state source: N/A
Money/odds/balance display source: N/A
Forbidden direct calls: direct profiles INSERT from UI
Required test fixture: visual-fixture auth placeholders
Mount smoke test: signup route render · auth vitest
```

## ResetPasswordDeskSurface

```text
Surface: ResetPasswordDeskSurface
Route: /reset-password
Controller: useResetPasswordPageController
Hooks: contexts/auth-context · lib/auth recovery
RPC/lib boundary: Supabase Auth resetPasswordForEmail · updateUser
Engine package: Supabase Auth
DB boundary: auth.users

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: controller.busy
Error state source: controller.errorMessage
Empty state source: N/A
Success/result state source: controller.sent · controller.completed
Permission/restriction state source: controller.recoveryMode
Money/odds/balance display source: N/A
Forbidden direct calls: password update bypassing controller.submit
Required test fixture: visual-fixture
Mount smoke test: reset-password route mount
```

## HomeDeskSurface

```text
Surface: HomeDeskSurface
Route: /home
Controller: (none — hooks/shell only)
Hooks: use-auth · use-wallet · lib/onboarding-consent
RPC/lib boundary: hooks/use-wallet.ts → wallet RPC · no page controller
Engine package: @phonara/wallet-ledger + earn presentation props
DB boundary: wallets · profiles

Display values: ImportedHomePage static FOMO props (guest), WelcomeSheet when new wallet Σ=0
Action handlers: navigation-only · see child components
Loading state source: authLoading → data-testid=home-loading
Error state source: none at shell — page handles inline
Empty state source: guest static home always renders
Success/result state source: WelcomeSheet dismiss
Permission/restriction state source: session gate for welcome only
Money/odds/balance display source: useWallet() balances for welcome heuristic only — **do not** format amounts in shell; pass to child if wired
Forbidden direct calls: useWalletPageController bypass · createEarnPageController · direct rpc_* from ImportedHomePage
Required test fixture: isVisualFixtureMode()
Mount smoke test: home route · earn/home vitest if present

Note: Earn canonical URL — /earn redirect-only
Note: Full earn engine on /home/missions via useEarnPageController
```

## HomeMissionsDeskSurface

```text
Surface: HomeMissionsDeskSurface
Route: /home/missions
Controller: useEarnPageController
Hooks: use-retention (missions · daily · roulette) · use-earn-hub-status · use-phon-balance-breakdown · use-viral-missions · use-repeatable-missions
RPC/lib boundary: hooks/use-retention.ts · earn hub RPC
Engine package: earn RPC (Supabase)
DB boundary: missions · retention · referral

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · pageLoading · layoutLoading · homeLoading · missionsLoading
Error state source: toast on action failure — no global errorKey on view
Empty state source: missionItems empty array
Success/result state source: DailyClaimResult · RouletteResult via onClaimDaily / onWheelSpin
Permission/restriction state source: dailyClaimGateReason · canClaimDaily · wheelDisabled · hubStatus limits
Money/odds/balance display source: homeProps phonBonusDisplay · phonRealDisplay · pointsDisplay · claimableHeroDisplay · hubStatus (from controller formatting via @phonara/money)
Forbidden direct calls: client reward calculation · direct mission RPC from JSX
Required test fixture: VISUAL_FIXTURE earn balances
Mount smoke test: earn page controller vitest if present
```

## WalletDeskSurface

```text
Surface: WalletDeskSurface
Route: /wallet
Controller: useWalletPageController
Hooks: use-wallet · use-profile · use-wallet-data · use-crypto-deposit · use-crypto-withdraw · use-giftcard-fee-market · use-phon-balance-breakdown · use-compliance-status
RPC/lib boundary: domain/wallet.ts · features/wallet/* → lib/rpc.ts
Engine package: @phonara/wallet-ledger + @phonara/money
DB boundary: wallets · ledger · compliance · KYC storage

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading · complianceLoading · cryptoAddressLoading · giftcardPreviewLoading · busy
Error state source: walletError · deposit/withdraw status keys · giftcardDepositStatusKey · cryptoWithdrawStatusKey · krwWithdrawStatusKey
Empty state source: N/A — tabs always show structure
Success/result state source: lastTransactionSuccess · copy toasts
Permission/restriction state source: kycVerified · showKycGate · withdrawalPaused · phonLocked · depositGateReason · withdrawGateReason · canRequestDeposit · canRequestWithdraw · whitelistEnabled
Money/odds/balance display source: *Display fields on WalletPageControllerView — heroBalanceDisplay · phon/usdt/krw available · giftcardPreviewFeeDisplay · withdrawAvailableDisplay (see DISPLAY_DATA_CONTRACT)
Forbidden direct calls: requestWithdrawal from JSX · createKrwDepositRequest direct · toLocaleString for amounts · JS number arithmetic on balances
Required test fixture: isVisualFixtureMode() · VISUAL_FIXTURE wallet
Mount smoke test: wallet domain unit tests · wallet E2E deposit/withdraw paths (operator gate)
```

## LedgerDeskSurface

```text
Surface: LedgerDeskSurface
Route: /ledger
Controller: useLedgerPageController
Hooks: use-wallet ledger query
RPC/lib boundary: use-ledger-page-controller → wallet ledger RPC
Engine package: @phonara/wallet-ledger
DB boundary: ledger entries (append-only)

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · loading
Error state source: implicit query error — empty fallback
Empty state source: controller.empty · rows.length === 0
Success/result state source: N/A
Permission/restriction state source: auth session required
Money/odds/balance display source: rows[].amountDisplay · feeDisplay from LedgerRowView (RPC-backed)
Forbidden direct calls: ledger row amount reformat with JS number
Required test fixture: visual-fixture ledger rows if defined
Mount smoke test: ledger controller mount
```

## StakingDeskSurface

```text
Surface: StakingDeskSurface
Route: /staking · /wallet?tab=staking
Controller: useStakingPageController
Hooks: use-wallet · use-trading staking hooks
RPC/lib boundary: hooks/use-trading.ts staking RPC
Engine package: @phonara/trading-engine (staking pools)
DB boundary: staking positions · pools

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading · busy
Error state source: errorKey · errorMessage
Empty state source: activePositions.length === 0
Success/result state source: confirmStakingAction success toast
Permission/restriction state source: canStake · canUnstake
Money/odds/balance display source: balanceDisplay · rewardsDisplay · aprDisplay · stakeAmountDisplay · phonAvailable
Forbidden direct calls: stake/unstake RPC from presentation · APR client calculation
Required test fixture: visual-fixture
Mount smoke test: staking panel vitest via trade terminal tests
```

## BetDeskSurface

```text
Surface: BetDeskSurface
Route: /trade
Canonical container: BetHubShell
Controller: useTradePageController
Hooks: use-wallet · use-trading (prices · markets · positions · futuresActions · spotActions) · use-trade-notifications · display-chart/use-exchange-display-price
RPC/lib boundary: hooks/use-trading.ts → lib/rpc.ts · trading RPC
Engine package: @phonara/trading-engine
DB boundary: futures/spot orders · positions · prices oracle

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading · futuresMarketsLoading · pricesFetching · positionsFetching
Error state source: pricesError · positionsError · marketsError · tradeNotifications
Empty state source: guest TradeModeShell — session null
Success/result state source: tradeNotifications toasts · order fill events
Permission/restriction state source: oracleStale · isPriceStale · realtimeDisconnected · oracleMarkUnavailable · session gate
Money/odds/balance display source: phonAvail · usdtAvail · priceDisplay · oraclePriceDisplay · futuresPositions[] (realized_pnl · margin_amount · liquidation_price · open_fee from RPC rows)
Forbidden direct calls: useFuturesActions bypass from new UI · margin mode local state in presentation (missing-from-contract) · client PnL recompute · duplicate usePrices channel
Required test fixture: shouldBlockOnAuthLoading · visual-fixture trade prices
Mount smoke test: components/trade/__tests__/TradeModeShell.test.tsx · trade-rpc-capabilities vitest

Note: BetHub passes engine={controller} when session present
Note: Trade tab: /trade?section=trade · defaultSection=trade
```

## TradeDeskSurface · TradeModeShell (embedded)

```text
Surface: TradeDeskSurface · TradeModeShell (embedded)
Route: /trade?section=trade
Canonical container: BetHubShell · TradeModeShell
Controller: useTradePageController
Hooks: same as BetDeskSurface
RPC/lib boundary: futuresActions · spotActions on controller
Engine package: @phonara/trading-engine
DB boundary: same as trade-hub

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: same as BetDeskSurface
Error state source: same as BetDeskSurface
Empty state source: guest-trade-guest when !session
Success/result state source: futuresActions/spotActions submit handlers
Permission/restriction state source: oracleStale · circuit via oracleStale flag
Money/odds/balance display source: controller.futuresActions + spotActions for tickets; display prices from controller only
Forbidden direct calls: new useTradePageController() in leaf components · terminal wire hooks duplicating controller
Required test fixture: TradeModeShell test mocks
Mount smoke test: TradeModeShell.test.tsx · useFuturesTerminalWire consumes controller props
```

## SportsDeskSurface · SportsFixtureDeskSurface

```text
Surface: SportsDeskSurface · SportsFixtureDeskSurface
Route: /sports · /sports/fixture/$fixtureId
Controller: useSportsPageController
Hooks: use-platform-gates · use-phon-balance-breakdown
RPC/lib boundary: Sports hub embedded components → sportsbook RPC via child wiring
Engine package: @phonara/sportsbook-engine
DB boundary: sports fixtures · bets

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · gatesLoading · breakdownLoading
Error state source: sportsGateReason when blocked
Empty state source: fixture list empty states in presentation
Success/result state source: bet slip submit via sports components (not controller action)
Permission/restriction state source: sportsBlocked · sportsGateReason · session required
Money/odds/balance display source: hubProps.phonBonusDisplay · phonRealDisplay · odds from hub child wiring (DISPLAY_DATA_CONTRACT exposed)
Forbidden direct calls: odds client recompute · direct sportsbook RPC from desk surface bypassing hub
Required test fixture: VISUAL_FIXTURE phon balances · sportsGateReason null in fixture mode
Mount smoke test: sports desk mount · sports E2E (operator gate)

Note: Canonical sportsbook owner: standalone /sports
Note: /trade?section=sports = embedded summary entry only
```

## ImportedSportsPage (BetHub tab)

```text
Surface: ImportedSportsPage (BetHub tab)
Route: /trade?section=sports
Canonical container: BetHubShell
Controller: useSportsPageController
Hooks: same as sports-standalone
RPC/lib boundary: same as sports-standalone
Engine package: @phonara/sportsbook-engine
DB boundary: same as sports-standalone

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: same as sports-standalone
Error state source: same as sports-standalone
Empty state source: embedded tab empty states
Success/result state source: same as sports-standalone
Permission/restriction state source: same as sports-standalone
Money/odds/balance display source: same as sports-standalone
Forbidden direct calls: parallel sports controller instance in tab vs /sports route
Required test fixture: same as sports-standalone
Mount smoke test: BetHubShell sports section render
```

## CasinoDeskSurface

```text
Surface: CasinoDeskSurface
Route: /casino/$game · /games/$game
Controller: useCasinoPageController
Hooks: use-wallet · use-casino-round-pipeline (use-casino-round.ts) · use-platform-gates · use-confirm-snapshot · useAutoBetQueue (UI-only session — components/games/shared/hooks)
RPC/lib boundary: use-casino-round.ts → game RPC · provably fair
Engine package: @phonara/game-engine + casino RPC
DB boundary: casino rounds · ledger settlement

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading · busy
Error state source: errorKey · toastKey · confirmNotice (casinoBlocked)
Empty state source: recentBets empty
Success/result state source: bet · settledResult · verificationEvidence · toastKey
Permission/restriction state source: canSubmit · canConfirm · casinoBlocked · confirmOpen drift
Money/odds/balance display source: available (wallet phon/usdt) · stake string · gameSurfaceProps (mapped — no client payout math)
Forbidden direct calls: settlement recompute in JSX · direct game RPC from GameSurfaceLoader · useAutoBetQueue driving ledger
Required test fixture: casino E2E engine env · visual-fixture
Mount smoke test: apps/web/src/ui/pages/__tests__/casino-page.test.tsx · features/casino/__tests__/autoBet.test.tsx · useAutoBetQueue.test.ts

Note: Auto Bet queue stats: ui-only-local per DISPLAY_DATA_CONTRACT
Note: Presentation consumes gameSurfaceProps bundle
```

## CasinoLobbyDeskSurface

```text
Surface: CasinoLobbyDeskSurface
Route: /casino
Controller: (none — hooks/shell only)
Hooks: 
RPC/lib boundary: static lobby · navigate to game routes
Engine package: none (navigation only)
DB boundary: none

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: none
Error state source: none
Empty state source: N/A
Success/result state source: N/A
Permission/restriction state source: N/A
Money/odds/balance display source: N/A — lobby cards use static/meta props only
Forbidden direct calls: useCasinoPageController on lobby index
Required test fixture: N/A
Mount smoke test: casino lobby route mount
```

## GamesFairnessDeskSurface

```text
Surface: GamesFairnessDeskSurface
Route: /casino/fairness
Controller: (none — hooks/shell only)
Hooks: load-fairness-history (UI data loader)
RPC/lib boundary: read-only fairness history
Engine package: @phonara/game-engine verification display
DB boundary: round history read

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: loader pending state in surface
Error state source: loader error in surface
Empty state source: no history rows
Success/result state source: N/A
Permission/restriction state source: N/A
Money/odds/balance display source: N/A
Forbidden direct calls: verify hash recompute diverging from server algorithm in UI
Required test fixture: fairness E2E anchor
Mount smoke test: casino fairness route · aurora-hero-visual E2E (operator)
```

## RgDeskSurface

```text
Surface: RgDeskSurface
Route: /responsible-gaming
Controller: useRgPageController
Hooks: RG limits RPC via viewProps
RPC/lib boundary: responsible-gaming feature hooks
Engine package: Supabase RG RPC
DB boundary: RG limits · self-exclusion

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · sessionReady
Error state source: viewProps error surfaces
Empty state source: viewProps empty limits
Success/result state source: limit update confirm
Permission/restriction state source: sessionReady gate
Money/odds/balance display source: deposit/loss limit displays via viewProps (DISPLAY_DATA_CONTRACT exposed)
Forbidden direct calls: RG RPC from presentation
Required test fixture: visual-fixture
Mount smoke test: rg desk mount
```

## SecurityDeskSurface

```text
Surface: SecurityDeskSurface
Route: /security
Controller: useSecurityPageController
Hooks: domain/user-auth-security
RPC/lib boundary: passkey · TOTP MFA Supabase + domain helpers
Engine package: Supabase Auth MFA
DB boundary: auth factors · passkeys

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · isLoading · busy
Error state source: toast on handler failure
Empty state source: no passkeys list
Success/result state source: enroll verify success
Permission/restriction state source: session required
Money/odds/balance display source: N/A
Forbidden direct calls: MFA enroll bypassing controller handlers
Required test fixture: secondary-account-surfaces test mock SecurityPageControllerView
Mount smoke test: apps/web/src/ui/pages/__tests__/secondary-account-surfaces.test.tsx
```

## AccountDeskSurface

```text
Surface: AccountDeskSurface
Route: /account
Controller: useAccountPageController
Hooks: use-auth · use-profile · use-wallet · use-retention referral
RPC/lib boundary: lib/auth signOut · supabase account delete RPC via controller
Engine package: Supabase Auth + wallet display
DB boundary: profiles · wallets · referral

Display values: AccountPageViewProps — displayName · tier · phon · krw · referralCode
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading on viewProps
Error state source: toast on delete/logout failure
Empty state source: guest redirect to login
Success/result state source: logout navigate
Permission/restriction state source: isLoggedIn
Money/odds/balance display source: wallet phon/krw formatted in controller (tierFromPhon uses @phonara/money toDecimal — display tier only)
Forbidden direct calls: supabase.auth.signOut from JSX · account delete RPC direct
Required test fixture: account-page.test.tsx mocks
Mount smoke test: apps/web/src/ui/pages/__tests__/account-page.test.tsx

Note: No FreezeControllerView yet — add shape before U-phase or static presentation only
```

## OnboardingDeskSurface

```text
Surface: OnboardingDeskSurface
Route: /onboarding
Controller: useOnboardingPageController
Hooks: contexts/auth-context · lib/onboarding-funnel
RPC/lib boundary: local onboarding-funnel storage only
Engine package: none
DB boundary: localStorage onboarding flag

Display values: step · ONBOARDING_STEP_COUNT · t
Action handlers: navigation-only · see child components
Loading state source: useAuth().loading
Error state source: N/A
Empty state source: N/A
Success/result state source: finish() → /home
Permission/restriction state source: session required · redirect if complete
Money/odds/balance display source: N/A
Forbidden direct calls: markOnboardingComplete from JSX
Required test fixture: onboarding-page.test.tsx buildEngine()
Mount smoke test: apps/web/src/ui/pages/__tests__/onboarding-page.test.tsx

Note: No FreezeControllerView yet
```

## ReferralDeskSurface

```text
Surface: ReferralDeskSurface
Route: /referral
Controller: useReferralPageController
Hooks: use-retention referral dashboard
RPC/lib boundary: referral RPC
Engine package: earn/referral RPC
DB boundary: referral stats

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · pageLoading
Error state source: implicit in viewProps
Empty state source: viewProps empty stats
Success/result state source: share/copy actions in viewProps
Permission/restriction state source: auth required
Money/odds/balance display source: commission displays in viewProps (RPC-backed strings)
Forbidden direct calls: referral RPC from JSX
Required test fixture: visual-fixture
Mount smoke test: referral desk mount
```

## PartnerDeskSurface

```text
Surface: PartnerDeskSurface
Route: /partner
Controller: usePartnerPageController
Hooks: partner commission RPC
RPC/lib boundary: partner feature RPC
Engine package: partner/affiliate RPC
DB boundary: partner commissions

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: loading
Error state source: gated surface when !partner
Empty state source: zero commission strings
Success/result state source: N/A
Permission/restriction state source: gated prop on PartnerDeskSurface
Money/odds/balance display source: commissionTotal · commissionPending · commissionPaid · commissionRate · commissionMtd (display strings from RPC)
Forbidden direct calls: commission math in JSX
Required test fixture: use-partner-page-controller.test.ts
Mount smoke test: apps/web/src/features/partner/__tests__/use-partner-page-controller.test.ts
```

## EventsDeskSurface

```text
Surface: EventsDeskSurface
Route: /events
Controller: useEventsPageController
Hooks: use-retention daily · roulette
RPC/lib boundary: retention RPC
Engine package: earn/events RPC
DB boundary: retention events

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · hubLoading
Error state source: hubErrorKey · spinErrorKey
Empty state source: days empty
Success/result state source: lastResult · onClaimDaily
Permission/restriction state source: canClaimDaily · canSpin · gateReasonKey · dailyClaimGateReason
Money/odds/balance display source: todayRewardLabel · streakLabel · attendanceRemaining · rouletteRemaining
Forbidden direct calls: roulette outcome client randomization for ledger
Required test fixture: events-page.test.tsx makeView()
Mount smoke test: apps/web/src/ui/pages/__tests__/events-page.test.tsx
```

## DashboardDeskSurface

```text
Surface: DashboardDeskSurface
Route: /dashboard
Controller: useDashboardPageController
Hooks: use-retention · use-wallet
RPC/lib boundary: retention + wallet
Engine package: earn RPC
DB boundary: retention · wallets

Display values: see viewProps
Action handlers: navigation-only · see child components
Loading state source: authLoading · walletLoading · dailyLoading · rouletteLoading
Error state source: error MessageKey
Empty state source: viewProps empty sections
Success/result state source: claimDaily · spin results
Permission/restriction state source: showWelcome
Money/odds/balance display source: viewProps wallet/earn displays
Forbidden direct calls: retention RPC direct from dashboard JSX
Required test fixture: visual-fixture
Mount smoke test: dashboard desk mount

Note: Legacy route — canonical earn hub is /home
```

## Admin app (summary)

```text
Route: /admin/*
Surface: AdminDeskSurface → Admin*Page components
Controller: none (react-query + admin auth context)
Display values: per Admin page hooks — no web FreezeControllerView
Action handlers: Admin page mutations via existing admin hooks
Forbidden direct calls: service role in browser · new admin RPC from presentation without audit
Mount smoke test: apps/admin vitest · admin E2E (operator gate)
```

## Regenerate when

- Route/surface/controller wiring change · page-controller-view-shapes.ts change · new action/display field on controller

```bash
bun run generate:ssot-freeze-manifest
```
