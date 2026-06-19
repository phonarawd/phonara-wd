# LOVABLE Admin Users Desk LOCK — L1-15-C v0.2

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-C PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-D §GREEN DRAFT carry  
> **큐 ID:** **L1-15-C** (Admin Users Desk · `/admin/users` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D §GREEN · **queues page 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · [`LOVABLE_ADMIN_D_COMPLIANCE_DESK_LOCK.md`](LOVABLE_ADMIN_D_COMPLIANCE_DESK_LOCK.md)

---

## Scope (1줄)

`/admin/users` empty card → **P0 6요소** RBAC ops desk — search/filter · ban/suspend · MFA reset · session kill · balance inspect drawer (strings) · **`useAdminUsersDeskMock`** · mock-only · rpc/supabase 0.

---

## §Visual References (pattern only)

- cokepoppy/my-binance · jose-donato/crypto-orderbook — dense user/search tables
- rtavytran/rt-commission-dashboard — account list · status badges
- LucasReisVillasBoas/openbet-core · openbet-core-shell.vercel.app — admin user lookup IA
- Internal carry: `WalletDeskWithdrawQueue` (B) + `ComplianceKycQueue` (D)

---

## UX 5 · 6요소

| # | 구현 |
|---|------|
| 1 filter | search email/userId/displayName · status · kyc tier chips |
| 2 table | masked email · tier · status · MFA · session · balanceSummary (i18n interpolate 3 strings) |
| 3 row | active Suspend/Ban · suspended Unsuspend/Ban · banned detail only · drawer MFA reset / Kill session |
| 4 reason | ≥4 all mutating |
| 5 audit | `admin.users.audit.*` |
| 6 bulk | active multi-select Suspend / Ban |

MOCK chip · `AdminDetailDrawer` balance/sessions/MFA mock · **no parseFloat**

---

## Row contract

```ts
type AdminUserRow = {
  id: string;
  emailMasked: string;
  displayName: string;
  kycTier: string;
  status: 'active' | 'suspended' | 'banned';
  mfaEnabled: boolean;
  lastSessionAt: string;
  balanceCash: string;
  balanceBonus: string;
  balanceLocked: string;
  activeSessions: number;
  riskFlagCount: number;
};
```

---

## Baseline (D §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 447/451 | **457/461** · gold-rush/mint-reels 4 fail = NO-TOUCH |
| admin scope | 46/46 | **56/56** (+10) |
| `admin.*` ko=en | 288/288 | **328/328** |
| `admin.users.*` | (partial reuse) | **45/45** |
| `admin.compliance.*` | 87/87 | **87/87** |
| `admin.wallet.*` | 49/49 | **49/49** |
| `admin.primitive.*` | 17/17 | **17/17** |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` + nav | 65/65 | **66/66** |
| `/admin/users` 6요소 | stub | **✅** |

---

## 파일표

### NEW

| ID | path |
|----|------|
| C1 | `src/hooks/admin/useAdminUsersDeskMock.ts` |
| C2 | `src/components/admin/users/UsersDeskHub.tsx` |
| C3 | `src/components/admin/users/__tests__/UsersDesk.test.tsx` |

### EDIT

| ID | path |
|----|------|
| C4 | `src/components/pages/ImportedAdminUsersPage.tsx` — `<UsersDeskHub />` · **single search SOT in FilterBar** (remove duplicate page Input) |
| C5 | `src/i18n/ko.ts` · `en.ts` |

**DELETE 0**

---

## C1 — `useAdminUsersDeskMock`

Single `createAdminMockHook<AdminUserRow, UsersFilters>` + facade:

- `suspendUser` · `banUser` · `unsuspendUser` · `resetMfa` · `killSession` — reason ≥4 + audit
- Audit keys: `admin.users.audit.suspend|ban|unsuspend|mfaReset|sessionKill`
- SEED ≥10: ≥6 active · ≥2 suspended · ≥1 banned · tier mix · ≥3 mfaEnabled · varied balance strings · ≥2 riskFlagCount>0
- F5 hydration carry

---

## C2 — `UsersDeskHub`

6요소 + drawer per EXECUTE spec. Row actions gated by status. balanceSummary via i18n interpolation — **no client sum**.

---

## C3 — Tests (≥10)

SEED mix · transitions · reason gate · MFA/session audit · bulk loop · 6요소 smoke · MOCK chip · drawer balance verbatim

---

## NO-TOUCH

`/admin/queues` · wallet/compliance hooks · `/admin/sports` · P0 impl · `/admin/mfa` route · user wallet/sports · BetSlip · BottomNav · FROZEN games · rpc/mocks/ZIP

---

## i18n

**Reuse (do not duplicate):** `admin.users.title` · `subtitle` · `search.placeholder` · `empty.*` if present

**Append:** `admin.users.description` · `filter.*` · `col.*` · `action.*` · `bulk.*` · `audit.*` · `detail.*` · `mfa.enabled|disabled`

pre-grep · ko=en DIFF=0

---

## LOCK Footer C1–C7

| # | 고정 |
|---|------|
| C1 | reason ≥4 |
| C2 | balance strings only |
| C3 | MOCK chip |
| C4 | bulk UI loop |
| C5 | admin scope +10 (46→≥56) |
| C6 | compliance 87 · wallet 49 rename 0 |
| C7 | wallet 94 · sports parity carry |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 C1 · 2 C2 · 3 C4 · 4 C3 · 5 C5 · 6 vitest · 7 §GREEN · 8 9b-C

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/users/__tests__/
bunx vitest run src/components/admin/compliance/__tests__/
bunx vitest run src/components/admin/wallet/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.users\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.compliance\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/users/ src/hooks/admin/useAdminUsersDeskMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/users/ src/hooks/admin/useAdminUsersDeskMock.ts
rg -n '<table' src/components/admin/users/
rg -n '[가-힣]' src/components/admin/users/
```

**§GREEN gates:**

- admin scope ≥56 · full ≥457/461 (4 NO-TOUCH)
- compliance 87 · wallet 49 · primitive 17 · wallet 94 · sports 65 unchanged
- 9b-C: /admin/users 6요소 + MOCK + drawer · queues/sports/wallet 회귀 0

**§GREEN template:**

```text
L1-15-C §GREEN — Users Desk 6요소 · useAdminUsersDeskMock · vitest N/N (admin scope +10) · admin.* M/M (+admin.users.*) · compliance 87 · wallet 94 · sports parity · float/rpc 0 · 9b-C PASS · queues/sports/wallet 회귀 0.
```

**Next LOCK DRAFT:** L1-15-I Admin Audit + Alerts wired

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 dispatch LOCK |
| 2026-06-17 | v0.2 EXECUTE — operator spec 1:1 · reuse existing admin.users.title keys |
| 2026-06-17 | **§GREEN** — vitest 457/461 · admin scope 56 · admin.users.* 45 · 9b-C PASS |

---

*Lovable canvas only · ZIP = operator explicit GO*
