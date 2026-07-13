# Per-Page UI State Matrix (Web)

> Generated: 2026-07-13T00:44:43.264Z  
> Scope: `*-page.tsx` + `casino-game-shell.tsx` + `trade-desk-page-shell.tsx` (79 surfaces; plan ~81 was approximate)  
> Method: static scan of page TSX + related `-display-contract.ts` + vitest paths  
> **NOT VERIFIED:** live browser render · axe · animation quality

## Summary

| State                         | yes | partial |  no |
| ----------------------------- | --: | ------: | --: |
| Loading                       |  56 |       1 |  22 |
| Empty                         |  31 |       7 |  41 |
| Error                         |  48 |       2 |  29 |
| Responsive (md/lg/sm in page) |  57 |      16 |   6 |

## Legend

- **yes** — dedicated primitive/testid/contract signal found
- **partial** — weak keyword-only signal
- **no** — no static evidence in page + related contracts

## Matrix

| #   | Domain         | Page                                  | Loading | Empty   | Error   | Responsive | Contracts | Tests |
| --- | -------------- | ------------------------------------- | ------- | ------- | ------- | ---------- | --------- | ----- |
| 1   | account        | `account-hub-page.tsx`                | yes     | yes     | yes     | yes        | 5         | 6     |
| 2   | account        | `account-kyc-page.tsx`                | yes     | no      | yes     | yes        | 3         | 4     |
| 3   | account        | `account-profile-page.tsx`            | yes     | no      | yes     | yes        | 3         | 4     |
| 4   | account        | `account-responsible-gaming-page.tsx` | yes     | no      | yes     | yes        | 3         | 4     |
| 5   | auth           | `auth-callback-page.tsx`              | partial | no      | yes     | partial    | 1         | 2     |
| 6   | casino         | `casino-fairness-page.tsx`            | yes     | yes     | yes     | yes        | 5         | 6     |
| 7   | casino         | `casino-lobby-page.tsx`               | yes     | yes     | no      | yes        | 5         | 6     |
| 8   | earn           | `earn-cashback-page.tsx`              | yes     | no      | yes     | yes        | 5         | 6     |
| 9   | earn           | `earn-play-page.tsx`                  | yes     | no      | yes     | yes        | 5         | 6     |
| 10  | events         | `events-hub-page.tsx`                 | yes     | partial | yes     | yes        | 5         | 6     |
| 11  | games          | `casino-game-shell.tsx`               | yes     | yes     | yes     | yes        | 5         | 6     |
| 12  | home           | `earn-home-page.tsx`                  | yes     | yes     | yes     | yes        | 5         | 6     |
| 13  | home           | `home-attendance-page.tsx`            | yes     | yes     | yes     | yes        | 5         | 6     |
| 14  | home           | `home-missions-invite-page.tsx`       | yes     | yes     | yes     | yes        | 5         | 6     |
| 15  | home           | `home-missions-page.tsx`              | yes     | yes     | yes     | yes        | 5         | 8     |
| 16  | home           | `home-missions-referral-page.tsx`     | yes     | yes     | yes     | yes        | 5         | 6     |
| 17  | install        | `install-page.tsx`                    | no      | no      | partial | yes        | 1         | 2     |
| 18  | landing        | `landing-page.tsx`                    | no      | no      | no      | yes        | 5         | 7     |
| 19  | legal          | `affiliate-page.tsx`                  | no      | no      | no      | partial    | 3         | 4     |
| 20  | legal          | `cookies-page.tsx`                    | no      | no      | no      | partial    | 2         | 3     |
| 21  | legal          | `privacy-page.tsx`                    | no      | no      | no      | partial    | 2         | 3     |
| 22  | legal          | `responsible-gaming-page.tsx`         | no      | no      | no      | partial    | 2         | 3     |
| 23  | legal          | `risk-disclosure-page.tsx`            | no      | no      | no      | partial    | 4         | 5     |
| 24  | legal          | `terms-page.tsx`                      | no      | no      | no      | partial    | 2         | 3     |
| 25  | login          | `login-page.tsx`                      | no      | no      | no      | partial    | 0         | 1     |
| 26  | marketing      | `announcements-page.tsx`              | yes     | yes     | yes     | no         | 4         | 5     |
| 27  | marketing      | `features-earn-page.tsx`              | no      | no      | no      | no         | 5         | 6     |
| 28  | marketing      | `features-hub-page.tsx`               | no      | no      | no      | partial    | 5         | 6     |
| 29  | marketing      | `features-vip-page.tsx`               | no      | no      | no      | no         | 5         | 6     |
| 30  | marketing      | `feedback-page.tsx`                   | no      | no      | no      | partial    | 4         | 5     |
| 31  | marketing      | `fees-page.tsx`                       | no      | no      | no      | partial    | 4         | 5     |
| 32  | marketing      | `support-faq-page.tsx`                | no      | partial | no      | no         | 5         | 6     |
| 33  | marketing      | `support-hub-page.tsx`                | no      | partial | no      | partial    | 5         | 6     |
| 34  | marketing      | `support-ticket-page.tsx`             | yes     | yes     | yes     | yes        | 5         | 6     |
| 35  | marketing      | `system-status-page.tsx`              | no      | yes     | no      | no         | 5         | 6     |
| 36  | marketing      | `tier-guide-page.tsx`                 | yes     | no      | yes     | partial    | 5         | 6     |
| 37  | marketing      | `trust-security-page.tsx`             | no      | no      | no      | no         | 5         | 6     |
| 38  | notifications  | `notifications-page.tsx`              | yes     | yes     | yes     | yes        | 3         | 4     |
| 39  | onboarding     | `onboarding-missions-page.tsx`        | yes     | no      | yes     | yes        | 5         | 6     |
| 40  | onboarding     | `onboarding-page.tsx`                 | yes     | no      | no      | yes        | 3         | 5     |
| 41  | referral       | `referral-invite-page.tsx`            | yes     | partial | yes     | yes        | 5         | 6     |
| 42  | referral       | `referral-leaderboard-page.tsx`       | yes     | yes     | yes     | yes        | 5         | 6     |
| 43  | referral       | `referral-page.tsx`                   | yes     | yes     | yes     | yes        | 5         | 8     |
| 44  | reset-password | `reset-password-page.tsx`             | yes     | no      | no      | yes        | 0         | 1     |
| 45  | rewards        | `rewards-history-page.tsx`            | yes     | yes     | yes     | yes        | 1         | 2     |
| 46  | settings       | `account-settings-page.tsx`           | yes     | no      | yes     | yes        | 5         | 6     |
| 47  | settings       | `api-keys-settings-page.tsx`          | yes     | yes     | yes     | yes        | 5         | 6     |
| 48  | settings       | `bank-accounts-settings-page.tsx`     | yes     | yes     | yes     | yes        | 5         | 6     |
| 49  | settings       | `notifications-settings-page.tsx`     | no      | yes     | no      | yes        | 5         | 6     |
| 50  | settings       | `preferences-settings-page.tsx`       | no      | no      | no      | yes        | 5         | 6     |
| 51  | settings       | `referral-settings-page.tsx`          | yes     | no      | yes     | yes        | 5         | 6     |
| 52  | settings       | `security-settings-page.tsx`          | yes     | yes     | yes     | yes        | 5         | 6     |
| 53  | settings       | `settings-hub-page.tsx`               | no      | yes     | no      | yes        | 5         | 6     |
| 54  | share          | `share-earnings-page.tsx`             | yes     | no      | yes     | yes        | 2         | 3     |
| 55  | signup         | `signup-page.tsx`                     | yes     | no      | no      | yes        | 0         | 1     |
| 56  | sports         | `sports-page.tsx`                     | yes     | yes     | yes     | yes        | 5         | 8     |
| 57  | staking        | `staking-hub-page.tsx`                | yes     | yes     | yes     | yes        | 5         | 6     |
| 58  | staking        | `staking-positions-page.tsx`          | yes     | no      | yes     | yes        | 1         | 2     |
| 59  | tier           | `tier-benefits-page.tsx`              | yes     | no      | yes     | yes        | 5         | 6     |
| 60  | tier           | `tier-leaderboard-page.tsx`           | yes     | yes     | yes     | yes        | 5         | 6     |
| 61  | tier           | `tier-me-page.tsx`                    | yes     | yes     | yes     | yes        | 5         | 6     |
| 62  | trade          | `futures-desk-page.tsx`               | yes     | partial | no      | partial    | 5         | 6     |
| 63  | trade          | `futures-orders-page.tsx`             | yes     | partial | yes     | yes        | 5         | 6     |
| 64  | trade          | `futures-positions-page.tsx`          | yes     | partial | yes     | yes        | 5         | 7     |
| 65  | trade          | `spot-desk-page.tsx`                  | yes     | no      | no      | partial    | 5         | 6     |
| 66  | trade          | `trade-desk-page-shell.tsx`           | no      | no      | no      | partial    | 5         | 5     |
| 67  | verify-email   | `verify-email-page.tsx`               | yes     | no      | no      | yes        | 1         | 2     |
| 68  | wallet         | `crypto-deposit-page.tsx`             | yes     | no      | yes     | yes        | 5         | 6     |
| 69  | wallet         | `crypto-withdraw-page.tsx`            | yes     | no      | yes     | yes        | 5         | 6     |
| 70  | wallet         | `deposit-hub-page.tsx`                | yes     | yes     | partial | yes        | 5         | 6     |
| 71  | wallet         | `giftcard-deposit-page.tsx`           | yes     | yes     | yes     | yes        | 5         | 6     |
| 72  | wallet         | `giftcard-redeem-page.tsx`            | yes     | no      | yes     | yes        | 5         | 6     |
| 73  | wallet         | `krw-deposit-page.tsx`                | yes     | no      | yes     | yes        | 5         | 6     |
| 74  | wallet         | `krw-withdraw-page.tsx`               | yes     | no      | yes     | yes        | 5         | 6     |
| 75  | wallet         | `ledger-page.tsx`                     | yes     | yes     | yes     | yes        | 5         | 6     |
| 76  | wallet         | `wallet-page.tsx`                     | yes     | yes     | yes     | yes        | 5         | 8     |
| 77  | wallet         | `wallet-redeem-page.tsx`              | yes     | no      | yes     | yes        | 5         | 6     |
| 78  | wallet         | `wallet-transfer-page.tsx`            | yes     | yes     | yes     | yes        | 5         | 6     |
| 79  | wallet         | `withdraw-hub-page.tsx`               | yes     | yes     | no      | yes        | 5         | 6     |

## Evidence detail (loading/empty/error hits)

### `apps/web/src/product/surfaces/account/account-hub-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/account-profile-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/p12-community-support-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/account/__tests__/account-hub-page.test.tsx`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-profile-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/p10-sports-hub-pages-gate-contract.test.ts`

### `apps/web/src/product/surfaces/account/account-kyc-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/account-profile-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`
- tests: `apps/web/src/product/surfaces/account/__tests__/account-kyc-page.test.tsx`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-profile-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`

### `apps/web/src/product/surfaces/account/account-profile-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/account-profile-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`
- tests: `apps/web/src/product/surfaces/account/__tests__/account-profile-page.test.tsx`, `apps/web/src/domain/__tests__/account-profile-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`

### `apps/web/src/product/surfaces/account/account-responsible-gaming-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/account-profile-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`
- tests: `apps/web/src/product/surfaces/account/__tests__/account-responsible-gaming-page.test.tsx`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-profile-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`

### `apps/web/src/product/surfaces/auth/auth-callback-page.tsx`

- loading: partial — loading
- empty: no — —
- error: yes — role=alert
- responsive: partial — md:
- contracts: `apps/web/src/domain/auth-landing-visual-signoff-display-contract.ts`
- tests: `apps/web/src/product/surfaces/auth/__tests__/auth-callback-page.test.tsx`, `apps/web/src/domain/__tests__/auth-landing-visual-signoff-display-contract.test.ts`

### `apps/web/src/product/surfaces/casino/casino-fairness-page.tsx`

- loading: yes — loading, query loading flag
- empty: yes — empty, empty length guard
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/casino-fairness-display-contract.ts`, `apps/web/src/domain/casino-fiat-hint-session-lock-display-contract.ts`, `apps/web/src/domain/casino-games-batch-a-display-contract.ts`, `apps/web/src/domain/casino-games-batch-b-display-contract.ts`, `apps/web/src/domain/casino-games-batch-c-display-contract.ts`
- tests: `apps/web/src/product/surfaces/casino/__tests__/casino-fairness-page.test.tsx`, `apps/web/src/domain/__tests__/casino-fairness-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-fiat-hint-session-lock-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-a-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-c-display-contract.test.ts`

### `apps/web/src/product/surfaces/casino/casino-lobby-page.tsx`

- loading: yes — loading, loading testid
- empty: yes — EmptyState, empty, empty length guard
- error: no — —
- responsive: yes — md:, lg:, sm:, width constraint
- contracts: `apps/web/src/domain/casino-lobby-display-contract.ts`, `apps/web/src/domain/casino-fairness-display-contract.ts`, `apps/web/src/domain/casino-fiat-hint-session-lock-display-contract.ts`, `apps/web/src/domain/casino-games-batch-a-display-contract.ts`, `apps/web/src/domain/casino-games-batch-b-display-contract.ts`
- tests: `apps/web/src/product/surfaces/casino/__tests__/casino-lobby-page.test.tsx`, `apps/web/src/domain/__tests__/casino-lobby-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-fairness-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-fiat-hint-session-lock-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-a-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-b-display-contract.test.ts`

### `apps/web/src/product/surfaces/earn/earn-cashback-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/earn-cashback-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/earn-play-display-contract.ts`, `apps/web/src/domain/earn-side-surfaces-display-contract.ts`, `apps/web/src/domain/share-earnings-display-contract.ts`
- tests: `apps/web/src/product/surfaces/earn/__tests__/earn-cashback-page.test.tsx`, `apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-play-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-side-surfaces-display-contract.test.ts`, `apps/web/src/domain/__tests__/share-earnings-display-contract.test.ts`

### `apps/web/src/product/surfaces/earn/earn-play-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/earn-play-display-contract.ts`, `apps/web/src/domain/earn-cashback-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/earn-side-surfaces-display-contract.ts`, `apps/web/src/domain/share-earnings-display-contract.ts`
- tests: `apps/web/src/product/surfaces/earn/__tests__/earn-play-page.test.tsx`, `apps/web/src/domain/__tests__/earn-play-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-side-surfaces-display-contract.test.ts`, `apps/web/src/domain/__tests__/share-earnings-display-contract.test.ts`

### `apps/web/src/product/surfaces/events/events-hub-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: partial — empty
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/p12-community-support-hub-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/events/__tests__/events-hub-page.test.tsx`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/p10-sports-hub-pages-gate-contract.test.ts`, `apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/games/casino-game-shell.tsx`

- loading: yes — query loading flag
- empty: yes — empty length guard
- error: yes — errorKey, role=alert, error flag
- responsive: yes — md:, lg:, width constraint
- contracts: `apps/web/src/domain/casino-games-batch-a-display-contract.ts`, `apps/web/src/domain/casino-games-batch-b-display-contract.ts`, `apps/web/src/domain/casino-games-batch-c-display-contract.ts`, `apps/web/src/domain/casino-games-batch-d-display-contract.ts`, `apps/web/src/domain/appshell-visual-signoff-display-contract.ts`
- tests: `apps/web/src/product/surfaces/games/__tests__/casino-game-shell.test.tsx`, `apps/web/src/domain/__tests__/casino-games-batch-a-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-c-display-contract.test.ts`, `apps/web/src/domain/__tests__/casino-games-batch-d-display-contract.test.ts`, `apps/web/src/domain/__tests__/appshell-visual-signoff-display-contract.test.ts`

### `apps/web/src/product/surfaces/home/earn-home-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty length guard
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/earn-cashback-display-contract.ts`, `apps/web/src/domain/earn-play-display-contract.ts`, `apps/web/src/domain/earn-side-surfaces-display-contract.ts`, `apps/web/src/domain/home-attendance-display-contract.ts`
- tests: `apps/web/src/product/surfaces/home/__tests__/earn-home-page.test.tsx`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-play-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-side-surfaces-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-attendance-display-contract.test.ts`

### `apps/web/src/product/surfaces/home/home-attendance-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty length guard
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/home-attendance-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/home-missions-display-contract.ts`, `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`
- tests: `apps/web/src/product/surfaces/home/__tests__/home-attendance-page.test.tsx`, `apps/web/src/domain/__tests__/home-attendance-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`

### `apps/web/src/product/surfaces/home/home-missions-invite-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/home-missions-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/ew-e2-gate-missions-display-contract.ts`
- tests: `apps/web/src/product/surfaces/home/__tests__/home-missions-invite-page.test.tsx`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts`

### `apps/web/src/product/surfaces/home/home-missions-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/home-missions-display-contract.ts`, `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/ew-e2-gate-missions-display-contract.ts`
- tests: `apps/web/src/product/surfaces/home/__tests__/home-missions-invite-page.test.tsx`, `apps/web/src/product/surfaces/home/__tests__/home-missions-page.test.tsx`, `apps/web/src/product/surfaces/home/__tests__/home-missions-referral-page.test.tsx`, `apps/web/src/domain/__tests__/home-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts`

### `apps/web/src/product/surfaces/home/home-missions-referral-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/home-missions-display-contract.ts`, `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/ew-e2-gate-missions-display-contract.ts`
- tests: `apps/web/src/product/surfaces/home/__tests__/home-missions-referral-page.test.tsx`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts`

### `apps/web/src/product/surfaces/install/install-page.tsx`

- loading: no — —
- empty: no — —
- error: partial — error flag
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/app-install-mission-display-contract.ts`
- tests: `apps/web/src/product/surfaces/install/__tests__/install-page.test.tsx`, `apps/web/src/domain/__tests__/app-install-mission-display-contract.test.ts`

### `apps/web/src/product/surfaces/landing/landing-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: yes — md:, lg:, width constraint
- contracts: `apps/web/src/domain/auth-landing-visual-signoff-display-contract.ts`, `apps/web/src/domain/landing-ab-display-contract.ts`, `apps/web/src/domain/landing-analytics-display-contract.ts`, `apps/web/src/domain/landing-brand-memory-display-contract.ts`, `apps/web/src/domain/landing-design-release-display-contract.ts`
- tests: `apps/web/src/product/surfaces/landing/__tests__/auth-landing-visual-signoff.test.tsx`, `apps/web/src/product/surfaces/landing/__tests__/landing-page.test.tsx`, `apps/web/src/domain/__tests__/auth-landing-visual-signoff-display-contract.test.ts`, `apps/web/src/domain/__tests__/landing-ab-display-contract.test.ts`, `apps/web/src/domain/__tests__/landing-analytics-display-contract.test.ts`, `apps/web/src/domain/__tests__/landing-brand-memory-display-contract.test.ts`, `apps/web/src/domain/__tests__/landing-design-release-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/affiliate-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/affiliate-partner-display-contract.ts`, `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/affiliate-page.test.tsx`, `apps/web/src/domain/__tests__/affiliate-partner-display-contract.test.ts`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/cookies-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/cookies-page.test.tsx`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/privacy-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/privacy-page.test.tsx`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/responsible-gaming-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/responsible-gaming-page.test.tsx`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/risk-disclosure-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/aml-risk-display-contract.ts`, `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`, `apps/web/src/domain/trade-synthetic-book-disclosure-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/risk-disclosure-page.test.tsx`, `apps/web/src/domain/__tests__/aml-risk-display-contract.test.ts`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-synthetic-book-disclosure-display-contract.test.ts`

### `apps/web/src/product/surfaces/legal/terms-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- contracts: `apps/web/src/domain/legal-display-contract.ts`, `apps/web/src/domain/p12-legal-pages-display-contract.ts`
- tests: `apps/web/src/product/surfaces/legal/__tests__/terms-page.test.tsx`, `apps/web/src/domain/__tests__/legal-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-legal-pages-display-contract.test.ts`

### `apps/web/src/product/surfaces/login/login-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — md:
- tests: `apps/web/src/product/surfaces/login/__tests__/login-page.test.tsx`

### `apps/web/src/product/surfaces/marketing/announcements-page.tsx`

- loading: yes — Skeleton, loading, query loading flag, loading testid
- empty: yes — EmptyState, empty, empty length guard
- error: yes — role=alert, error flag, error testid
- responsive: no — —
- contracts: `apps/web/src/domain/announcements-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/announcements-page.test.tsx`, `apps/web/src/domain/__tests__/announcements-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/features-earn-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: no — —
- contracts: `apps/web/src/domain/earn-cashback-display-contract.ts`, `apps/web/src/domain/earn-home-display-contract.ts`, `apps/web/src/domain/earn-play-display-contract.ts`, `apps/web/src/domain/earn-side-surfaces-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/features-earn-page.test.tsx`, `apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-home-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-play-display-contract.test.ts`, `apps/web/src/domain/__tests__/earn-side-surfaces-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/features-hub-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — width constraint
- contracts: `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/features-hub-page.test.tsx`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/features-vip-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: no — —
- contracts: `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`, `apps/web/src/domain/sports-rules-and-vip-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/features-vip-page.test.tsx`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/sports-rules-and-vip-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/feedback-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — width constraint
- contracts: `apps/web/src/domain/feedback-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/feedback-page.test.tsx`, `apps/web/src/domain/__tests__/feedback-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/fees-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — width constraint
- contracts: `apps/web/src/domain/fees-page-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/fees-page.test.tsx`, `apps/web/src/domain/__tests__/fees-page-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/support-faq-page.tsx`

- loading: no — —
- empty: partial — empty
- error: no — —
- responsive: no — —
- contracts: `apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts`, `apps/web/src/domain/ew-e9-gate-identity-support-display-contract.ts`, `apps/web/src/domain/ew-e9-identity-support-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-community-support-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/support-faq-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e9-gate-identity-support-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e9-identity-support-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/support-hub-page.tsx`

- loading: no — —
- empty: partial — empty
- error: no — —
- responsive: partial — width constraint
- contracts: `apps/web/src/domain/p12-community-support-hub-display-contract.ts`, `apps/web/src/domain/support-hub-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/support-hub-page.test.tsx`, `apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/support-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/support-ticket-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — role=alert, error flag, error testid
- responsive: yes — sm:, width constraint
- contracts: `apps/web/src/domain/support-ticket-display-contract.ts`, `apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts`, `apps/web/src/domain/ew-e9-gate-identity-support-display-contract.ts`, `apps/web/src/domain/ew-e9-identity-support-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/support-ticket-page.test.tsx`, `apps/web/src/domain/__tests__/support-ticket-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e9-gate-identity-support-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e9-identity-support-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/system-status-page.tsx`

- loading: no — —
- empty: yes — empty length guard
- error: no — —
- responsive: no — —
- contracts: `apps/web/src/domain/system-status-display-contract.ts`, `apps/web/src/domain/da-w4-motion-system-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/system-status-page.test.tsx`, `apps/web/src/domain/__tests__/system-status-display-contract.test.ts`, `apps/web/src/domain/__tests__/da-w4-motion-system-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/tier-guide-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: partial — width constraint
- contracts: `apps/web/src/domain/tier-guide-display-contract.ts`, `apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/tier-guide-page.test.tsx`, `apps/web/src/domain/__tests__/tier-guide-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/marketing/trust-security-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: no — —
- contracts: `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`, `apps/web/src/domain/ew-e10-trust-support-ui-display-contract.ts`, `apps/web/src/domain/marketing-shell-display-contract.ts`, `apps/web/src/domain/operator-trust-pages-display-contract.ts`, `apps/web/src/domain/p12-gate-marketing-display-contract.ts`
- tests: `apps/web/src/product/surfaces/marketing/__tests__/trust-security-page.test.tsx`, `apps/web/src/domain/__tests__/p12-trust-marketing-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-trust-support-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/marketing-shell-display-contract.test.ts`, `apps/web/src/domain/__tests__/operator-trust-pages-display-contract.test.ts`, `apps/web/src/domain/__tests__/p12-gate-marketing-display-contract.test.ts`

### `apps/web/src/product/surfaces/notifications/notifications-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/notifications-center-display-contract.ts`, `apps/web/src/domain/notifications-pwa-display-contract.ts`, `apps/web/src/domain/settings-notifications-display-contract.ts`
- tests: `apps/web/src/product/surfaces/notifications/__tests__/notifications-page.test.tsx`, `apps/web/src/domain/__tests__/notifications-center-display-contract.test.ts`, `apps/web/src/domain/__tests__/notifications-pwa-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts`

### `apps/web/src/product/surfaces/onboarding/onboarding-missions-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/onboarding-missions-display-contract.ts`, `apps/web/src/domain/ew-e2-gate-missions-display-contract.ts`, `apps/web/src/domain/home-missions-display-contract.ts`, `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`
- tests: `apps/web/src/product/surfaces/onboarding/__tests__/onboarding-missions-page.test.tsx`, `apps/web/src/domain/__tests__/onboarding-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e2-gate-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`

### `apps/web/src/product/surfaces/onboarding/onboarding-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: no — —
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/onboarding-handoff-display-contract.ts`, `apps/web/src/domain/onboarding-journey-display-contract.ts`, `apps/web/src/domain/onboarding-missions-display-contract.ts`
- tests: `apps/web/src/product/surfaces/onboarding/__tests__/onboarding-missions-page.test.tsx`, `apps/web/src/product/surfaces/onboarding/__tests__/onboarding-page.test.tsx`, `apps/web/src/domain/__tests__/onboarding-handoff-display-contract.test.ts`, `apps/web/src/domain/__tests__/onboarding-journey-display-contract.test.ts`, `apps/web/src/domain/__tests__/onboarding-missions-display-contract.test.ts`

### `apps/web/src/product/surfaces/referral/referral-invite-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: partial — empty
- error: yes — role=alert, error flag, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/referral-invite-display-contract.ts`, `apps/web/src/domain/home-missions-invite-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/referral-hub-display-contract.ts`, `apps/web/src/domain/referral-leaderboard-display-contract.ts`
- tests: `apps/web/src/product/surfaces/referral/__tests__/referral-invite-page.test.tsx`, `apps/web/src/domain/__tests__/referral-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts`

### `apps/web/src/product/surfaces/referral/referral-leaderboard-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — EmptyState, empty, empty length guard
- error: yes — errorKey, role=alert, error flag, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/referral-leaderboard-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/referral-hub-display-contract.ts`, `apps/web/src/domain/referral-invite-display-contract.ts`, `apps/web/src/domain/settings-referral-display-contract.ts`
- tests: `apps/web/src/product/surfaces/referral/__tests__/referral-leaderboard-page.test.tsx`, `apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-referral-display-contract.test.ts`

### `apps/web/src/product/surfaces/referral/referral-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — role=alert, error flag, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/referral-hub-display-contract.ts`, `apps/web/src/domain/referral-invite-display-contract.ts`, `apps/web/src/domain/referral-leaderboard-display-contract.ts`, `apps/web/src/domain/settings-referral-display-contract.ts`
- tests: `apps/web/src/product/surfaces/referral/__tests__/referral-invite-page.test.tsx`, `apps/web/src/product/surfaces/referral/__tests__/referral-leaderboard-page.test.tsx`, `apps/web/src/product/surfaces/referral/__tests__/referral-page.test.tsx`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-invite-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-referral-display-contract.test.ts`

### `apps/web/src/product/surfaces/reset-password/reset-password-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: no — —
- responsive: yes — md:, width constraint
- tests: `apps/web/src/product/surfaces/reset-password/__tests__/reset-password-page.test.tsx`

### `apps/web/src/product/surfaces/rewards/rewards-history-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/funding-history-display-contract.ts`
- tests: `apps/web/src/product/surfaces/rewards/__tests__/rewards-history-page.test.tsx`, `apps/web/src/domain/__tests__/funding-history-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/account-settings-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/settings-account-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/account-profile-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/settings-api-keys-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/account-settings-page.test.tsx`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-profile-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/api-keys-settings-page.tsx`

- loading: yes — Skeleton
- empty: yes — EmptyState, empty, empty length guard, empty testid
- error: yes — role=alert
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/settings-api-keys-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`, `apps/web/src/domain/settings-hub-display-contract.ts`, `apps/web/src/domain/settings-notifications-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/api-keys-settings-page.test.tsx`, `apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/bank-accounts-settings-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`, `apps/web/src/domain/settings-api-keys-display-contract.ts`, `apps/web/src/domain/settings-hub-display-contract.ts`, `apps/web/src/domain/settings-notifications-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/bank-accounts-settings-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/notifications-settings-page.tsx`

- loading: no — —
- empty: yes — empty length guard
- error: no — —
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/settings-notifications-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/notifications-center-display-contract.ts`, `apps/web/src/domain/notifications-pwa-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/notifications-settings-page.test.tsx`, `apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/notifications-center-display-contract.test.ts`, `apps/web/src/domain/__tests__/notifications-pwa-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/preferences-settings-page.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/settings-preferences-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`, `apps/web/src/domain/settings-api-keys-display-contract.ts`, `apps/web/src/domain/settings-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/preferences-settings-page.test.tsx`, `apps/web/src/domain/__tests__/settings-preferences-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/referral-settings-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/settings-referral-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/home-missions-referral-display-contract.ts`, `apps/web/src/domain/referral-hub-display-contract.ts`, `apps/web/src/domain/referral-invite-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/referral-settings-page.test.tsx`, `apps/web/src/domain/__tests__/settings-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/home-missions-referral-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-invite-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/security-settings-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/settings-account-display-contract.ts`, `apps/web/src/domain/settings-api-keys-display-contract.ts`, `apps/web/src/domain/settings-hub-display-contract.ts`, `apps/web/src/domain/settings-notifications-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/security-settings-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-account-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-api-keys-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/settings-notifications-display-contract.test.ts`

### `apps/web/src/product/surfaces/settings/settings-hub-page.tsx`

- loading: no — —
- empty: yes — empty length guard
- error: no — —
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/settings-hub-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/settings/__tests__/settings-hub-page.test.tsx`, `apps/web/src/domain/__tests__/settings-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/share/share-earnings-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/share-earnings-display-contract.ts`, `apps/web/src/domain/kakao-share-display-contract.ts`
- tests: `apps/web/src/product/surfaces/share/__tests__/share-earnings-page.test.tsx`, `apps/web/src/domain/__tests__/share-earnings-display-contract.test.ts`, `apps/web/src/domain/__tests__/kakao-share-display-contract.test.ts`

### `apps/web/src/product/surfaces/signup/signup-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: no — —
- responsive: yes — md:, width constraint
- tests: `apps/web/src/product/surfaces/signup/__tests__/signup-page.test.tsx`

### `apps/web/src/product/surfaces/sports/sports-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty length guard
- error: yes — errorKey
- responsive: yes — md:, lg:, width constraint
- contracts: `apps/web/src/domain/ew-e22-gate-sports-parity-display-contract.ts`, `apps/web/src/domain/ew-e22-sports-parity-display-contract.ts`, `apps/web/src/domain/ew-e22-ui-sports-parity-unlocks-display-contract.ts`, `apps/web/src/domain/sports-cashout-combo-display-contract.ts`, `apps/web/src/domain/sports-exchange-parity-display-contract.ts`
- tests: `apps/web/src/product/surfaces/sports/__tests__/sports-cashout-card.test.tsx`, `apps/web/src/product/surfaces/sports/__tests__/sports-money-with-fiat-hint.test.tsx`, `apps/web/src/product/surfaces/sports/__tests__/sports-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e22-gate-sports-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e22-sports-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e22-ui-sports-parity-unlocks-display-contract.test.ts`, `apps/web/src/domain/__tests__/p10-sports-hub-pages-gate-contract.test.ts`, `apps/web/src/domain/__tests__/sports-cashout-combo-display-contract.test.ts`

### `apps/web/src/product/surfaces/staking/staking-hub-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/p12-community-support-hub-display-contract.ts`, `apps/web/src/domain/p12-trust-marketing-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/staking/__tests__/staking-hub-page.test.tsx`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/p10-sports-hub-pages-gate-contract.test.ts`, `apps/web/src/domain/__tests__/p12-community-support-hub-display-contract.test.ts`

### `apps/web/src/product/surfaces/staking/staking-positions-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/staking-display-contract.ts`
- tests: `apps/web/src/product/surfaces/staking/__tests__/staking-positions-page.test.tsx`, `apps/web/src/domain/__tests__/staking-display-contract.test.ts`

### `apps/web/src/product/surfaces/tier/tier-benefits-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/tier-benefits-display-contract.ts`, `apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts`, `apps/web/src/domain/tier-decay-display-contract.ts`, `apps/web/src/domain/tier-fee-display-contract.ts`, `apps/web/src/domain/tier-guide-display-contract.ts`
- tests: `apps/web/src/product/surfaces/tier/__tests__/tier-benefits-page.test.tsx`, `apps/web/src/domain/__tests__/tier-benefits-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-fee-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-guide-display-contract.test.ts`

### `apps/web/src/product/surfaces/tier/tier-leaderboard-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — EmptyState, empty, empty length guard
- error: yes — errorKey, role=alert, error flag, error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/tier-leaderboard-display-contract.ts`, `apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts`, `apps/web/src/domain/referral-leaderboard-display-contract.ts`, `apps/web/src/domain/tier-benefits-display-contract.ts`, `apps/web/src/domain/tier-decay-display-contract.ts`
- tests: `apps/web/src/product/surfaces/tier/__tests__/tier-leaderboard-page.test.tsx`, `apps/web/src/domain/__tests__/tier-leaderboard-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-benefits-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts`

### `apps/web/src/product/surfaces/tier/tier-me-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/tier-me-display-contract.ts`, `apps/web/src/domain/ew-e4-gate-tier-option-b-display-contract.ts`, `apps/web/src/domain/tier-benefits-display-contract.ts`, `apps/web/src/domain/tier-decay-display-contract.ts`, `apps/web/src/domain/tier-fee-display-contract.ts`
- tests: `apps/web/src/product/surfaces/tier/__tests__/tier-me-page.test.tsx`, `apps/web/src/domain/__tests__/tier-me-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e4-gate-tier-option-b-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-benefits-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-decay-display-contract.test.ts`, `apps/web/src/domain/__tests__/tier-fee-display-contract.test.ts`

### `apps/web/src/product/surfaces/trade/futures-desk-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: partial — empty
- error: no — —
- responsive: partial — responsive keyword
- contracts: `apps/web/src/domain/trade-desk-a11y-display-contract.ts`, `apps/web/src/domain/trade-desk-browser-matrix-display-contract.ts`, `apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts`, `apps/web/src/domain/trade-desk-fetch-error-display-contract.ts`, `apps/web/src/domain/trade-desk-fiat-hint-wire-display-contract.ts`
- tests: `apps/web/src/product/surfaces/trade/__tests__/futures-desk-page.test.tsx`, `apps/web/src/domain/__tests__/trade-desk-a11y-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-browser-matrix-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-critical5-phase0-repro.test.ts`, `apps/web/src/domain/__tests__/trade-desk-failure-recovery-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-fetch-error-display-contract.test.ts`

### `apps/web/src/product/surfaces/trade/futures-orders-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: partial — empty
- error: yes — error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/ew-e21-gate-trade-engine-parity-display-contract.ts`, `apps/web/src/domain/ew-e21-trade-parity-display-contract.ts`, `apps/web/src/domain/ew-e21-ui-trade-engine-unlocks-display-contract.ts`, `apps/web/src/domain/p9-gate-trade-world-class-display-contract.ts`, `apps/web/src/domain/p9-trade-visual-signoff-display-contract.ts`
- tests: `apps/web/src/product/surfaces/trade/__tests__/futures-orders-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e21-gate-trade-engine-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e21-trade-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e21-ui-trade-engine-unlocks-display-contract.test.ts`, `apps/web/src/domain/__tests__/p9-gate-trade-contract.test.ts`, `apps/web/src/domain/__tests__/p9-gate-trade-world-class-display-contract.test.ts`

### `apps/web/src/product/surfaces/trade/futures-positions-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: partial — empty
- error: yes — error testid
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/ew-e21-gate-trade-engine-parity-display-contract.ts`, `apps/web/src/domain/ew-e21-trade-parity-display-contract.ts`, `apps/web/src/domain/ew-e21-ui-trade-engine-unlocks-display-contract.ts`, `apps/web/src/domain/p9-gate-trade-world-class-display-contract.ts`, `apps/web/src/domain/p9-trade-visual-signoff-display-contract.ts`
- tests: `apps/web/src/product/surfaces/trade/__tests__/futures-positions-page.test.tsx`, `apps/web/src/product/surfaces/trade/__tests__/futures-positions-panel.test.tsx`, `apps/web/src/domain/__tests__/ew-e21-gate-trade-engine-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e21-trade-parity-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e21-ui-trade-engine-unlocks-display-contract.test.ts`, `apps/web/src/domain/__tests__/p9-gate-trade-contract.test.ts`, `apps/web/src/domain/__tests__/p9-gate-trade-world-class-display-contract.test.ts`

### `apps/web/src/product/surfaces/trade/spot-desk-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: no — —
- responsive: partial — responsive keyword
- contracts: `apps/web/src/domain/trade-desk-a11y-display-contract.ts`, `apps/web/src/domain/trade-desk-browser-matrix-display-contract.ts`, `apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts`, `apps/web/src/domain/trade-desk-fetch-error-display-contract.ts`, `apps/web/src/domain/trade-desk-fiat-hint-wire-display-contract.ts`
- tests: `apps/web/src/product/surfaces/trade/__tests__/spot-desk-page.test.tsx`, `apps/web/src/domain/__tests__/trade-desk-a11y-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-browser-matrix-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-critical5-phase0-repro.test.ts`, `apps/web/src/domain/__tests__/trade-desk-failure-recovery-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-fetch-error-display-contract.test.ts`

### `apps/web/src/product/surfaces/trade/trade-desk-page-shell.tsx`

- loading: no — —
- empty: no — —
- error: no — —
- responsive: partial — lg:
- contracts: `apps/web/src/domain/trade-desk-a11y-display-contract.ts`, `apps/web/src/domain/trade-desk-browser-matrix-display-contract.ts`, `apps/web/src/domain/trade-desk-failure-recovery-display-contract.ts`, `apps/web/src/domain/trade-desk-fetch-error-display-contract.ts`, `apps/web/src/domain/trade-desk-fiat-hint-wire-display-contract.ts`
- tests: `apps/web/src/domain/__tests__/trade-desk-a11y-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-browser-matrix-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-critical5-phase0-repro.test.ts`, `apps/web/src/domain/__tests__/trade-desk-failure-recovery-display-contract.test.ts`, `apps/web/src/domain/__tests__/trade-desk-fetch-error-display-contract.test.ts`

### `apps/web/src/product/surfaces/verify-email/verify-email-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: no — —
- responsive: yes — md:, width constraint
- contracts: `apps/web/src/domain/trade-desk-migration-verify-display-contract.ts`
- tests: `apps/web/src/product/surfaces/verify-email/__tests__/verify-email-page.test.tsx`, `apps/web/src/domain/__tests__/trade-desk-migration-verify-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/crypto-deposit-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error flag
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/crypto-edge-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/krw-deposit-proof-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/crypto-deposit-page.test.tsx`, `apps/web/src/domain/__tests__/crypto-edge-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/crypto-withdraw-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts`, `apps/web/src/domain/crypto-edge-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/crypto-withdraw-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-withdrawal-off-display-contract.test.ts`, `apps/web/src/domain/__tests__/crypto-edge-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/deposit-hub-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: partial — error flag
- responsive: yes — md:, lg:, sm:, width constraint
- contracts: `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`, `apps/web/src/domain/krw-deposit-proof-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/deposit-hub-page.test.tsx`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/giftcard-deposit-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty testid
- error: yes — role=alert, error flag, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/krw-deposit-proof-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-redeem-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/giftcard-deposit-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/giftcard-redeem-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-redeem-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-transfer-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/giftcard-redeem-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-redeem-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/krw-deposit-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error flag
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/krw-deposit-proof-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-redeem-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/krw-deposit-page.test.tsx`, `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/krw-withdraw-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — role=alert, error flag
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/krw-deposit-proof-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/krw-withdraw-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-withdrawal-off-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/krw-deposit-proof-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/ledger-page.tsx`

- loading: yes — QuadStreamLoading, loading
- empty: yes — EmptyState, empty
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-redeem-display-contract.ts`, `apps/web/src/domain/wallet-transfer-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/ledger-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`, `apps/web/src/domain/__tests__/wallet-redeem-display-contract.test.ts`

### `apps/web/src/product/surfaces/wallet/wallet-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-redeem-display-contract.ts`, `apps/web/src/domain/wallet-transfer-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/wallet-money-with-fiat-hint.test.tsx`, `apps/web/src/product/surfaces/wallet/__tests__/wallet-page.test.tsx`, `apps/web/src/product/surfaces/wallet/__tests__/wallet-redeem-page.test.tsx`, `apps/web/src/product/surfaces/wallet/__tests__/wallet-transfer-page.test.tsx`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/wallet-redeem-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: no — —
- error: yes — errorKey, role=alert, error testid
- responsive: yes — md:, lg:, sm:
- contracts: `apps/web/src/domain/wallet-redeem-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-transfer-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/wallet-redeem-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-redeem-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/wallet-transfer-page.tsx`

- loading: yes — Skeleton
- empty: yes — empty, empty length guard
- error: yes — role=alert, error testid
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-transfer-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/wallet-capability-rails-display-contract.ts`, `apps/web/src/domain/wallet-ledger-realtime-display-contract.ts`, `apps/web/src/domain/wallet-redeem-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/wallet-transfer-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-transfer-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-capability-rails-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-ledger-realtime-display-contract.test.ts`, `apps/web/src/domain/__tests__/wallet-money-policy-display.test.ts`

### `apps/web/src/product/surfaces/wallet/withdraw-hub-page.tsx`

- loading: yes — Skeleton, loading, loading testid
- empty: yes — empty, empty length guard, empty testid
- error: no — —
- responsive: yes — md:, sm:, width constraint
- contracts: `apps/web/src/domain/wallet-withdrawal-off-display-contract.ts`, `apps/web/src/domain/account-hub-display-contract.ts`, `apps/web/src/domain/events-hub-display-contract.ts`, `apps/web/src/domain/ew-e10-wallet-settings-ui-display-contract.ts`, `apps/web/src/domain/features-hub-display-contract.ts`
- tests: `apps/web/src/product/surfaces/wallet/__tests__/withdraw-hub-page.test.tsx`, `apps/web/src/domain/__tests__/wallet-withdrawal-off-display-contract.test.ts`, `apps/web/src/domain/__tests__/account-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/events-hub-display-contract.test.ts`, `apps/web/src/domain/__tests__/ew-e10-wallet-settings-ui-display-contract.test.ts`, `apps/web/src/domain/__tests__/features-hub-display-contract.test.ts`
