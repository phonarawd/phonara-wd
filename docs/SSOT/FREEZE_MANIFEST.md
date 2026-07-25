<!-- GENERATED — do not edit by hand. Run: bun run generate:ssot-freeze-manifest -->

# Freeze Manifest

> **Generated:** 2026-07-24 · **Source:** codebase via `generate-ssot-freeze-manifest.ts`
> **Rule:** Route → Surface → Controller → Hook → RPC → Engine → DB. Do not infer from deleted docs.

## Protected boundaries (never delete/modify behavior in UI-only work)

- `supabase/**`, `packages/money`, `packages/game-engine`, `packages/trading-engine`, `packages/sportsbook-engine`, `packages/wallet-ledger`
- `apps/web/src/features/**/use-*-page-controller*`
- `apps/web/src/contracts/**`, `hooks/use-trading.ts`, `hooks/use-wallet.ts`, `lib/rpc.ts`

## User app

### `/`

```text
/
→ LandingPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/account/`

```text
/account/
→ AccountHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/account/kyc`

```text
/account/kyc
→ AccountKycPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/account/profile`

```text
/account/profile
→ AccountProfilePage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/account/responsible-gaming`

```text
/account/responsible-gaming
→ AccountResponsibleGamingPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/announcements`

```text
/announcements
→ AnnouncementsPage
→ (no page controller — hooks/shell only)
→ use-cms-content
→ hooks/use-cms-content.ts → lib/rpc.ts
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/casino`

```text
/casino
→ CasinoLobbyDeskSurface
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/casino/`

```text
/casino/
→ CasinoLobbyPage
→ (no page controller — hooks/shell only)
→ use-wallet
→ hooks/use-wallet.ts → lib/rpc.ts
→ @phonara/wallet-ledger + @phonara/money
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/casino/fairness`

```text
/casino/fairness
→ GamesFairnessDeskSurface
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/earn/cashback`

```text
/earn/cashback
→ EarnCashbackPage
→ useEarnCashbackPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/earn/play`

```text
/earn/play
→ EarnPlayPage
→ useEarnPlayPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/events`

```text
/events
→ EventsHubPage
→ useEventsHubPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/features/`

```text
/features/
→ FeaturesHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/features/earn`

```text
/features/earn
→ FeaturesEarnPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/features/vip`

```text
/features/vip
→ FeaturesVipPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/feedback`

```text
/feedback
→ FeedbackPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/fees`

```text
/fees
→ FeesPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/games/$gameCode`

```text
/games/$gameCode
→ CasinoGameRoutePage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/home`

```text
/home
→ EarnHomePage
→ useEarnPageController (missions) · direct useWallet (home hub)
→ use-auth, use-wallet
→ hooks/use-auth.ts · hooks/use-wallet.ts → lib/rpc.ts
→ @phonara/wallet-ledger + @phonara/money
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/home/attendance`

```text
/home/attendance
→ HomeAttendancePage
→ useHomeAttendancePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/home/missions`

```text
/home/missions
→ HomeMissionsPage
→ useHomeMissionsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/home/missions/invite`

```text
/home/missions/invite
→ HomeMissionsInvitePage
→ useHomeMissionsInvitePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/home/missions/referral`

```text
/home/missions/referral
→ HomeMissionsReferralPage
→ useHomeMissionsReferralPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/install`

```text
/install
→ InstallPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/ledger`

```text
/ledger
→ LedgerPage
→ useLedgerPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/wallet-ledger + @phonara/money
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/login`

```text
/login
→ LoginPage
→ useLoginPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/onboarding`

```text
/onboarding
→ —
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/onboarding/`

```text
/onboarding/
→ OnboardingPage
→ useOnboardingPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/onboarding/missions`

```text
/onboarding/missions
→ OnboardingMissionsPage
→ useOnboardingMissionsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/referral`

```text
/referral
→ ReferralPage
→ useReferralPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/referral/invite`

```text
/referral/invite
→ ReferralInvitePage
→ useReferralInvitePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/referral/leaderboard`

```text
/referral/leaderboard
→ ReferralLeaderboardPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/reset-password`

```text
/reset-password
→ ResetPasswordPage
→ useResetPasswordPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/rewards/history`

```text
/rewards/history
→ RewardsHistoryPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/security`

```text
/security
→ TrustSecurityPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings`

```text
/settings
→ SettingsHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/account`

```text
/settings/account
→ AccountSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/api-keys`

```text
/settings/api-keys
→ ApiKeysSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/bank-accounts`

```text
/settings/bank-accounts
→ BankAccountsSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/notifications`

```text
/settings/notifications
→ NotificationsSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/preferences`

```text
/settings/preferences
→ PreferencesSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/referral`

```text
/settings/referral
→ ReferralSettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/settings/security`

```text
/settings/security
→ SecuritySettingsPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/share/earnings`

```text
/share/earnings
→ ShareEarningsPage
→ useShareEarningsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ earn RPC (Supabase)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/signup`

```text
/signup
→ SignupPage
→ useSignupPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports`

```text
/sports
→ —
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
flag: dual-sports-entry — canonical standalone /sports; /trade?section=sports = hub tab
```

### `/sports/`

```text
/sports/
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/fixture/$fixtureId`

```text
/sports/fixture/$fixtureId
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/live`

```text
/sports/live
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/my-bets`

```text
/sports/my-bets
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/prematch`

```text
/sports/prematch
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/rules`

```text
/sports/rules
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/sports/vip`

```text
/sports/vip
→ SportsPage
→ useSportsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/staking`

```text
/staking
→ StakingHubPage
→ useStakingPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/trading-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/staking/positions`

```text
/staking/positions
→ StakingPositionsPage
→ useStakingPositionsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/trading-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/status`

```text
/status
→ SystemStatusPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/support/`

```text
/support/
→ SupportHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/support/faq`

```text
/support/faq
→ SupportFaqPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/support/ticket`

```text
/support/ticket
→ SupportTicketPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/tier/`

```text
/tier/
→ TierGuidePage
→ useTierGuidePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase Auth + RPC
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/tier/benefits`

```text
/tier/benefits
→ TierBenefitsPage
→ useTierBenefitsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/tier/leaderboard`

```text
/tier/leaderboard
→ TierLeaderboardPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/tier/me`

```text
/tier/me
→ TierMePage
→ useTierMePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/trade`

```text
/trade
→ — (container: BetHubShell)
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/trade?section=casino`

```text
/trade?section=casino
→ CasinoSportsLiveDesk + CasinoCrashDesk (container: BetHubShell)
→ useCasinoPageController (partial)
→ use-wallet, use-casino
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/game-engine
→ Supabase
```

### `/trade?section=sports`

```text
/trade?section=sports
→ ImportedSportsPage (embedded) (container: BetHubShell)
→ useSportsPageController
→ sports-engine-glue
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/sportsbook-engine
→ Supabase
```

### `/trade?section=trade`

```text
/trade?section=trade
→ TradeModeShell (container: BetHubShell)
→ useTradePageController
→ use-wallet, use-trading, use-prices
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/trading-engine
→ Supabase
```

### `/trade/`

```text
/trade/
→ SpotDeskPage
→ useTradePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/trade/futures`

```text
/trade/futures
→ FuturesDeskPage
→ useTradePageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/trade/orders`

```text
/trade/orders
→ FuturesOrdersPage
→ useFuturesOrdersPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/trading-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/trade/positions`

```text
/trade/positions
→ FuturesPositionsPage
→ useFuturesPositionsPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/trading-engine
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/verify-email`

```text
/verify-email
→ VerifyEmailPage
→ useVerifyEmailPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet`

```text
/wallet
→ —
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/`

```text
/wallet/
→ WalletPage
→ useWalletPageController
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ @phonara/wallet-ledger + @phonara/money
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/deposit`

```text
/wallet/deposit
→ —
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/deposit/`

```text
/wallet/deposit/
→ DepositHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/deposit/crypto`

```text
/wallet/deposit/crypto
→ CryptoDepositPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/deposit/giftcard`

```text
/wallet/deposit/giftcard
→ GiftcardDepositPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/deposit/krw`

```text
/wallet/deposit/krw
→ KrwDepositPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/redeem`

```text
/wallet/redeem
→ WalletRedeemPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/redeem/giftcard`

```text
/wallet/redeem/giftcard
→ GiftcardRedeemPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/transfer`

```text
/wallet/transfer
→ WalletTransferPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/withdraw`

```text
/wallet/withdraw
→ —
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/withdraw/`

```text
/wallet/withdraw/
→ WithdrawHubPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/withdraw/crypto`

```text
/wallet/withdraw/crypto
→ CryptoWithdrawPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

### `/wallet/withdraw/krw`

```text
/wallet/withdraw/krw
→ KrwWithdrawPage
→ (no page controller — hooks/shell only)
→ (none)
→ apps/web/src/lib/rpc.ts · supabase client
→ Supabase (display-only)
→ Supabase (yocjhjsdwoijfdrehzoq)
```

## Redirect-only URLs

- `/notifications` → `/account`

## Admin app

### `/admin/audit`

```text
/admin/audit
→ AdminDeskSurface
→ AdminAuditPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/audit-logs`

```text
/admin/audit-logs
→ AdminDeskSurface
→ audit-logs
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/casino`

```text
/admin/casino
→ AdminDeskSurface
→ AdminCasinoPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/cms`

```text
/admin/cms
→ AdminDeskSurface
→ AdminCmsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/config`

```text
/admin/config
→ AdminDeskSurface
→ config
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/deposits`

```text
/admin/deposits
→ AdminDeskSurface
→ AdminDepositsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/earn`

```text
/admin/earn
→ AdminDeskSurface
→ earn
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/login`

```text
/admin/login
→ AdminDeskSurface
→ AdminLoginPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/ops`

```text
/admin/ops
→ AdminDeskSurface
→ AdminOpsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/promotions`

```text
/admin/promotions
→ AdminDeskSurface
→ AdminPromotionsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/queues`

```text
/admin/queues
→ AdminDeskSurface
→ AdminQueuesPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/rewards`

```text
/admin/rewards
→ AdminDeskSurface
→ rewards
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/risk`

```text
/admin/risk
→ AdminDeskSurface
→ AdminRiskPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/settings`

```text
/admin/settings
→ AdminDeskSurface
→ AdminSettingsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/sports`

```text
/admin/sports
→ AdminDeskSurface
→ AdminSportsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/staking`

```text
/admin/staking
→ AdminDeskSurface
→ AdminStakingPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/support`

```text
/admin/support
→ AdminDeskSurface
→ AdminSupportPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/team`

```text
/admin/team
→ AdminDeskSurface
→ AdminTeamPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/tier-benefits`

```text
/admin/tier-benefits
→ AdminDeskSurface
→ AdminTierBenefitsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/tiers`

```text
/admin/tiers
→ AdminDeskSurface
→ AdminTiersPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/users`

```text
/admin/users
→ AdminDeskSurface
→ AdminUsersPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/viral-stats`

```text
/admin/viral-stats
→ AdminDeskSurface
→ AdminViralStatsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

### `/admin/withdrawals`

```text
/admin/withdrawals
→ AdminDeskSurface
→ AdminWithdrawalsPage
→ apps/admin service role RPC
→ Supabase (admin RLS bypass via service)
→ Supabase
```

## Regenerate when

- Route add/remove · redirect change · surface/controller wiring change · hook/RPC boundary change
