# Presentation Import Guide

**Policy:** Everything the user **sees** comes from Lovable, pasted **as-is**. Everything that **moves money, settles bets, trades, or talks to Supabase** stays in the existing PHONARA engine.

```text
┌─────────────────────────────────────────────────────────┐
│  Lovable (visual only)                                  │
│  pages + components + CSS + motion                      │
│  presentation-import/pages/*  components/{ui,shell,...} │
└───────────────────────────┬─────────────────────────────┘
                            │ props / callbacks only
┌───────────────────────────▼─────────────────────────────┐
│  Thin route adapters (routes/*.tsx)                     │
│  auth guard, navigate, map hook data → display props    │
└───────────────────────────┬─────────────────────────────┘
                            │ calls only
┌───────────────────────────▼─────────────────────────────┐
│  Engine (READ-ONLY during UI import)                    │
│  hooks/, contexts/, features/*/use-*.ts, lib/{auth,rpc}, │
│  packages/*, supabase/*                                 │
└─────────────────────────────────────────────────────────┘
```

## What stays (engine — do not replace with Lovable)

| Area | Paths |
|---|---|
| Money / ledger / wallet logic | `packages/money`, `packages/wallet-ledger` |
| Trading engine | `packages/trading-engine`, `hooks/use-trading.ts` |
| Casino engine / provably fair | `packages/game-engine`, `features/casino/use-casino-round.ts`, `game-config.ts`, helpers |
| Database / RPC / RLS | `supabase/*` |
| Auth session / RPC clients | `contexts/auth-context.tsx`, `lib/auth.ts`, `lib/supabase.ts`, `lib/rpc.ts` |
| Data hooks | `hooks/use-wallet.ts`, `hooks/use-profile.ts`, `hooks/use-ledger.ts`, `features/wallet/use-wallet-data.ts`, etc. |
| Realtime / stores | `stores/realtime.ts`, `components/global-notification-subscriptions.tsx` |
| PWA / a11y infra (non-visual) | `components/pwa-shell.tsx`, `components/skip-link.tsx` |
| Root safety banners | `routes/__root.tsx` restriction/realtime banners (engine state; restyle later if Lovable provides) |

**Rule:** Lovable never imports Supabase or calls RPC directly. Adapters call hooks and pass **already-formatted display strings** (or `Money` props) down.

## What gets replaced (100% Lovable visual)

All of the following PHONARA UI is **throwaway** once Lovable is pasted:

| Current PHONARA visual | Replace with |
|---|---|
| `components/app-shell.tsx`, `components/auth-shell.tsx` | Lovable `components/shell/*` |
| `components/landing-page.tsx`, `presentation/pages/*` | `presentation-import/pages/landing-page.tsx` |
| `components/daily-claim-card.tsx`, `roulette-card.tsx`, `missions-card.tsx`, … | Lovable `components/earn/*` |
| `features/earn/earn-surface.tsx` | Lovable earn page + components |
| `features/trading/*-panel.tsx`, old `routes/trade.tsx` body | Lovable `components/trade/*` + `trade-page.tsx` |
| `routes/dashboard.tsx` body | Lovable home/dashboard visual |
| `routes/login.tsx` / `signup.tsx` / `reset-password.tsx` bodies | Lovable auth pages |
| `routes/wallet.tsx` / `ledger.tsx` / `staking.tsx` bodies | Lovable wallet/ledger/staking pages |
| `routes/casino.tsx` JSX layout | Lovable casino shell (keep `useCasinoRoundPipeline` in adapter) |
| `routes/more.tsx`, `responsible-gaming.tsx` bodies | Lovable more / risk pages |
| `components/legal-page.tsx` | Lovable terms/privacy/about |
| `presentation/` folder (old duplicate) | Delete after import complete |
| `@phonara/ui` on user-facing marketing/earn surfaces | Lovable `components/ui/*` inside paste zones |

Casino game widgets in `@phonara/ui` (`RocketCrashCanvas`, `MinesGrid`, …) stay until Lovable ships equivalent game surfaces; then swap visual only, pipeline hook unchanged.

## Lovable → PHONARA paste map

| Lovable path | Paste into |
|---|---|
| `src/components/ui/*` | `apps/web/src/components/ui/` |
| `src/components/shell/*` | `apps/web/src/components/shell/` |
| `src/components/earn/*` | `apps/web/src/components/earn/` |
| `src/components/trade/*` | `apps/web/src/components/trade/` |
| `src/components/fomo/*` | `apps/web/src/components/fomo/` |
| `src/components/welcome/*` | `apps/web/src/components/welcome/` |
| `src/routes/index.tsx` (page UI) | `presentation-import/pages/landing-page.tsx` → `ImportedLandingPage` |
| `src/routes/home.tsx` | `presentation-import/pages/home-page.tsx` |
| `src/routes/earn.tsx` | `presentation-import/pages/earn-page.tsx` |
| `src/routes/trade.tsx` | `presentation-import/pages/trade-page.tsx` |
| `src/routes/account.tsx` | `presentation-import/pages/account-page.tsx` |
| `src/routes/settings.tsx` | `presentation-import/pages/settings-page.tsx` |
| `src/routes/referral.tsx` | `presentation-import/pages/referral-page.tsx` |
| `src/routes/about.tsx` | `presentation-import/pages/about-page.tsx` |
| `src/routes/terms.tsx` | `presentation-import/pages/terms-page.tsx` |
| `src/routes/privacy.tsx` | `presentation-import/pages/privacy-page.tsx` |
| `src/routes/login.tsx` | `presentation-import/pages/login-page.tsx` (add when pasting) |
| `src/routes/signup.tsx` | `presentation-import/pages/signup-page.tsx` |
| `src/routes/dashboard.tsx` | `presentation-import/pages/dashboard-page.tsx` |
| `src/routes/wallet.tsx` | `presentation-import/pages/wallet-page.tsx` |
| `src/routes/ledger.tsx` | `presentation-import/pages/ledger-page.tsx` |
| `src/routes/staking.tsx` | `presentation-import/pages/staking-page.tsx` |
| `src/routes/more.tsx` | `presentation-import/pages/more-page.tsx` |
| `src/routes/casino*.tsx` | `presentation-import/pages/casino-page.tsx` (+ game subcomponents) |
| `src/routes/risk.tsx` (if present) | `presentation-import/pages/responsible-gaming-page.tsx` → URL `/responsible-gaming` |
| Global CSS / tokens | `apps/web/src/styles/presentation-import-tokens.css` |

**Do not paste into:** `hooks/` (except `use-toast.ts` shim), `contexts/`, `features/*/use-*.ts`, `lib/supabase.ts`, `lib/rpc.ts`, `packages/*`, `supabase/*`.

## Route adapter status

### Already thin adapters (paste Lovable into `pages/*`)

| URL | Adapter | Paste target |
|---|---|---|
| `/` | `routes/index.tsx` | `landing-page.tsx` (+ auth redirect in adapter) |
| `/home` | `routes/home.tsx` | `home-page.tsx` |
| `/earn` | `routes/earn.tsx` | `earn-page.tsx` |
| `/trade` | `routes/trade.tsx` | `trade-page.tsx` |
| `/account` | `routes/account.tsx` | `account-page.tsx` |
| `/settings` | `routes/settings.tsx` | `settings-page.tsx` |
| `/referral` | `routes/referral.tsx` | `referral-page.tsx` |
| `/about` | `routes/about.tsx` | `about-page.tsx` |
| `/terms` | `routes/terms.tsx` | `terms-page.tsx` |
| `/privacy` | `routes/privacy.tsx` | `privacy-page.tsx` |

### Still old PHONARA UI — convert on paste (engine stays in adapter)

| URL | Current file | After paste |
|---|---|---|
| `/login`, `/signup`, `/reset-password` | inline `@phonara/ui` forms | Lovable page + `signInWithPassword` etc. in adapter |
| `/dashboard` | `AppShell` + reward cards | Lovable dashboard; `useWallet` in adapter |
| `/wallet`, `/ledger`, `/staking` | engine hooks + `@phonara/ui` | Lovable pages; hooks in adapter |
| `/casino/*` | `useCasinoRoundPipeline` + `@phonara/ui` games | Lovable casino shell; pipeline in adapter |
| `/more`, `/responsible-gaming` | `AppShell` + cards | Lovable pages |

**Adapter pattern (engine routes):**

```tsx
function WalletRoute() {
  const wallet = useWallet(); // engine — unchanged
  // auth guard, error mapping...
  return (
    <PresentationRoot>
      <ImportedWalletPage
        balanceLabel={formatMoney(wallet.available)}
        onDeposit={wallet.requestDeposit} // later: real handler
      />
    </PresentationRoot>
  );
}
```

## Imports that work unchanged (Vite aliases)

| Lovable import | Resolves to |
|---|---|
| `@/components/...` | `apps/web/src/components/...` |
| `@/lib/utils` | `apps/web/src/lib/utils.ts` |
| `@/lib/motion` | `apps/web/src/lib/motion.ts` |
| `@/hooks/use-toast` | `apps/web/src/hooks/use-toast.ts` |
| `react-router-dom` | `apps/web/src/shims/react-router-dom.tsx` (TanStack Router) |

Lovable/shadcn deps are **pre-installed** in `apps/web/package.json`. On a new machine run `bun run setup` once.

## Tech stack (pre-installed)

| Layer | Technology |
|---|---|
| Runtime / package manager | Bun 1.3+ |
| UI framework | React 19 + **React Compiler** |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 + `tw-animate-css` |
| Routing / data | TanStack Router + TanStack Query v5 |
| Motion / icons | framer-motion 12, lucide-react |
| Primitives | Radix UI (full shadcn set), vaul, cmdk, sonner |
| Forms | react-hook-form + zod 4 |
| Rewards FX | canvas-confetti |
| Engine money | `@phonara/money` (Decimal — never JS float) |
| Backend | Supabase JS v2 |
| PWA / E2E / tests | vite-plugin-pwa, Playwright, Vitest 4 |
| Types | TypeScript 6 strict |

## Paste workflow

1. Export Lovable zip (demo labels removed in Lovable first if possible).
2. Paste components into `components/*` zones — **no restyle**.
3. Paste page bodies into `presentation-import/pages/*` — keep `Imported*Page` export names.
4. If a route still has PHONARA JSX, shrink it to adapter-only (hooks + `<Imported*Page />`).
5. Run gates (below).
6. Delete dead files: `presentation/`, old `components/landing-page.tsx`, unused `@phonara/ui` marketing usage.

## i18n

Lovable `src/i18n/ko.ts` → move strings to `packages/i18n` keys for `check:i18n`. Until wired, hardcoded copy may live in presentation-import only during import.

## Validation after each paste

```bash
bun run typecheck
bun --filter @phonara/web build
bun run check:i18n
bun run check:release
```

## Game UI integration

Casino game surfaces: see **`docs/GAMES-INTEGRATION.md`** and **`docs/LOVABLE_ABSORPTION_PLAN_FINAL.md`** (Lovable handoff contract).

Paste zones for games:

| Lovable | PHONARA |
|---|---|
| `src/games/shared/*` | `apps/web/src/components/games/shared/` |
| `src/games/crash/*` etc. | `apps/web/src/components/games/crash/` etc. |
| `src/routes/games.tsx` | `presentation-import/pages/games-catalog-page.tsx` |

**Do not** implement client RNG or `src/engine/ports`. Connect via `useCasinoRoundPipeline` props only.

## Lovable Cloud

Do not enable Lovable Cloud. No OAuth/payment/backend in Lovable — presentation only.
