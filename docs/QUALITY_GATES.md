# PHONARA Quality Gates

Every implementation task must pass the relevant quality gates before completion.

## Required Gates

- TypeScript strict mode.
- ESLint.
- Prettier format check.
- Unit tests for domain logic.
- Playwright smoke/E2E for critical user flows. E2E is mandatory for auth,
  wallet, rewards, spot/futures, staking, casino, deposits, withdrawals, admin,
  permissions, PWA, i18n mode switching, and mobile-shell flows.
- Env validation.
- i18n hardcoded Korean detection.
- Test artifact cleanup.

## Domain Gates

- Money code: Decimal-based tests.
- Ledger code: idempotency, available/locked balance, reversal tests.
- Supabase code: RLS positive and negative tests.
- Supabase advisor: local/remote security advisor must report **0 ERROR** before
  any DB-facing task is considered complete. `authenticated_security_definer_function_executable`
  WARNs are acceptable only when the function is an intentional client-facing
  `rpc_*` wrapper with an internal `auth.uid()` or `_is_admin()` guard; document
  the WARN count and rationale in the Build Log instead of treating WARNs as
  green by assumption.
- Admin code: permission and audit log tests.
- PWA code: manifest/service worker smoke tests.
- Money E2E: run real browser flows against the local Supabase stack and assert
  database invariants, including per-currency conservation across user wallets
  and system accounts, idempotency, hash-chain integrity when relevant, and no
  durable test residue.
- Security/Admin E2E: prove both positive and negative authorization through the
  server-trusted RPC/RLS path, not only hidden UI controls.
- Casino E2E: prove bet placement, settlement, provably-fair seed reveal/hash
  verification, client-side outcome recomputation, tamper/duplicate rejection,
  and ledger conservation.

## E2E Levels

- Smoke E2E: app boots, auth screen/routes/navigation render.
- Feature E2E: the changed feature's happy path plus one realistic failure path.
- Money E2E: success + failure + database conservation/idempotency assertions.
- Security E2E: allowed role succeeds, unauthorized role fails, audit exists when
  the action is manual or high-risk.
- Full Phase E2E: all critical journeys for the phase. Required before a phase is
  called complete or launch-ready.

## Current E2E Matrix

This matrix is the current local browser coverage map. Extend the listed spec
when a behavior belongs to an existing domain; create a new spec only when the
domain or invariant is not already represented.

- Auth/session/mobile shell: `global-setup.ts` provisions real local Supabase
  users and sessions; `visual.spec.ts` covers login plus authenticated route
  rendering; `admin.spec.ts` covers admin login, allowed admin access, and
  regular-user denial. Success: real session injection and route render.
  Failure: non-admin blocked from admin app.
- Wallet, deposits, withdrawals, and KYC: `phase5-wave9.spec.ts` covers KYC
  lock, withdrawal pause, withdrawal confirmation/cancel/double-submit, frozen
  account browse-only UX, KYC submission to admin approval, and KRW deposit
  request plus bank auto-match. Invariants: deposit PHON conservation,
  withdrawal request no-RPC-before-confirm, and single RPC on double confirm.
- Trading and staking money flows: `core-flow.spec.ts` covers spot buy, futures
  open/close, staking, reward claim, confirm cancel, OI cap rejection, leverage
  rejection, and conservation. `funnel.spec.ts` covers signup, welcome bonus,
  futures open, and liquidation. `group-d-hardening.spec.ts` adds candle volume,
  price alert, stale oracle UI, and parallel OI-cap race coverage. Invariants:
  PHON/USDT conservation, no side effect on cancel/reject, race boundary.
- Casino/provably fair: `casino.spec.ts` covers all six games for commit,
  settle, reveal, verification, idempotency, and auth. `casino-wave7-closeout.spec.ts`
  covers cap rejection with translated error, confirmation cancel, double
  confirm dedupe, RG block, self-exclusion block, and mismatch auto-kill.
  Invariants: ledger conservation, seed hash/result verification, no raw SQL
  code leakage, no bet on cancel/reject.
- Admin, security, and audit: `admin.spec.ts` covers RBAC positive/negative,
  feature toggle confirmation plus audit, withdrawal reject/refund plus audit,
  ops alert sync/ack audit, and non-admin RPC denial. Invariants: server-side
  authz, audit row for manual actions, PHON conservation on withdrawal refund.
- Responsible gambling and risk gates: `casino-wave7-closeout.spec.ts` covers
  self-exclusion/RG blocks in the browser; `phase5-wave9.spec.ts` covers frozen
  account browse-only UX; SQL suites remain the deeper policy/invariant gate.
- Affiliate approvals: browser E2E is not a separate spec yet; coverage is SQL
  integration focused (`affiliate_*` suites) plus admin queue patterns in
  `admin.spec.ts`. Add browser coverage when an affiliate user/admin route is
  shipped.
- PWA/offline/i18n UI: `visual.spec.ts` covers login and authenticated route
  rendering; `quality.spec.ts` and `bun run check:pwa` cover production quality
  and PWA checks. `check:i18n` detects hardcoded Korean outside the catalog and
  server-tested error codes without mappings. Add explicit locale-toggle E2E
  before launch once the language switch UX is exposed.

## Completion Definition

A task is complete only when code, tests, relevant E2E, security notes, cleanup,
and a concise report are done. Passing unit/SQL/build without the required E2E
is not enough for user-facing, money, security, admin, casino, PWA, or launch
readiness work.
