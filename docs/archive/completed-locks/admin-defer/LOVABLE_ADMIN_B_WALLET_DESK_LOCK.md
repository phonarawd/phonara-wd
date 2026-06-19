# LOVABLE Admin Wallet Desk LOCK — L1-15-B v0.2

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-B PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · P0 §GREEN DRAFT carry  
> **큐 ID:** **L1-15-B** (Admin Wallet Desk · withdraw + deposit recon · Lovable 전용 · Cursor UI 0)  
> **의존:** **L1-15-P0 §GREEN** · user L1-10-W **F9** tx contract (display align only)  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · [`LOVABLE_WALLET_UI_LOCK.md`](LOVABLE_WALLET_UI_LOCK.md) F9

---

## Scope (1줄)

`/admin/queues` **Withdraw 탭** 빈 stub → **P0 primitive 6요소** mock desk + **Deposit recon** below-fold — **`useAdminWalletDeskMock`** = `createAdminMockHook` **첫 실사용** · Sports `UnsettledFixturesTable` 패턴 mirror · rpc/supabase 0.

---

## UX 5원칙 (P0 carry)

| # | B 적용 | FAIL |
|---|--------|------|
| U1 | above-fold = pending withdraw queue · deposit recon below-fold | 2 above-fold primary |
| U2 | approve/reject ≤2 · reason fields ≤5 | raw hex · full chart lib |
| U3 | withdraw **6요소 전부** | any missing |
| U4 | P0 primitives only | inline table 600L |
| U5 | MOCK chip on withdraw `AdminQueueSection` | MOCK 누락 |

---

## Withdraw 6요소 checklist (§GREEN gate)

| # | 요소 | 구현 |
|---|------|------|
| 1 | filter | `AdminFilterBar` — search userId/destination · status · method chips |
| 2 | queue table | `AdminDataTable<AdminWithdrawRow>` — SLA overdue · sortable |
| 3 | row action | pending Approve/Reject · approved Mark sent |
| 4 | reason | `AdminReasonDialog` ≥4 · mode approve/reject/sent |
| 5 | audit trail | `AdminAuditTrail` withdraw audit keys |
| 6 | bulk | pending selection · bulk approve + bulk reject |

보조: row click → `AdminDetailDrawer`

---

## F9 display contract

```ts
type AdminWithdrawRow = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  method: 'crypto' | 'krw';
  status: 'pending' | 'approved' | 'sent' | 'rejected';
  createdAt: string;
  slaDueAt: string;
  destinationSummary: string;
  fee?: string;
  net?: string;
};
type AdminDepositReconRow = {
  id: string;
  userId: string;
  amount: string;
  method: 'crypto' | 'krw' | 'giftcard';
  status: 'pending' | 'confirming' | 'pending_review' | 'complete' | 'failed';
  createdAt: string;
  reference?: string;
};
```

**FAIL =** `deposit_crypto|deposit_krw|deposit_giftcard` top-level · parseFloat/Number() on amounts · giftcard on withdraw rows.

---

## Baseline (P0 §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 428/428 | **435/439** · gold-rush/mint-reels 4 fail = NO-TOUCH |
| admin scope | 23/23 | **34/34** (+11 · P0 17 + Sports 11 + Wallet 11) |
| `admin.*` ko=en | 152/152 | **201/201** |
| `admin.wallet.*` | — | **49/49** |
| `admin.primitive.*` | 17/17 | **17/17** |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` / nav | 66/66 | **66/66** |
| Withdraw 6요소 | stub 0% | **✅** |
| Deposit recon | — | **✅** match/flag pending_review |

---

## EXECUTE (single shot · v0.2 정본)

### Step 0 — LOCK ACK

- G1 P0 §GREEN ✅ · G2 EXECUTE GO ✅ · G3 wallet 94 / sports 66 rename 0
- UX U1–U5 · F9 contract
- NO-TOUCH: user `/wallet/*` `/sports/*` · `useWalletMock`/`useAdminSportsMock` · BetSlip/BottomNav · P0 primitives impl · kyc/str/risk tabs empty stub · mocks/supabase/rpc/ZIP

### Step 1 — NEW B1 `src/hooks/admin/useAdminWalletDeskMock.ts`

`createAdminMockHook` 첫 실사용. 합성 row:

```ts
type WalletDeskSeed = {
  withdrawals: AdminWithdrawRow[];
  deposits: AdminDepositReconRow[];
};
```

Thin facade:

```ts
useAdminWalletDeskMock(): {
  withdrawals; deposits; audit;
  withdrawFilters; setWithdrawFilters;
  depositFilters; setDepositFilters;
  approveWithdraw(id, reason); rejectWithdraw(id, reason); markSent(id, reason);
  matchDeposit(id, reason); flagDeposit(id, reason);
  resetForTest();
}
```

- SEED: 8 withdraw (≥3 pending · ≥1 SLA overdue · crypto+krw) · 6 deposit (≥2 giftcard pending_review)
- Mutating: reason ≥4 + appendAudit (`admin.wallet.withdraw.audit.*` / deposit audit keys)
- F5: getServerSnapshot=SEED · filter derived in components (filterFn unused)

### Step 2 — NEW B2 `WalletDeskWithdrawQueue.tsx`

Sports 6요소 mirror — filter · table · row action · reason dialog (mode) · audit · bulk (approve + reject) · detail drawer · MOCK chip

### Step 3 — NEW B3 `WalletDeskDepositRecon.tsx`

Below-fold: filter · table · Match/Flag on pending_review · reason ≥4

### Step 4 — EDIT B5 `ImportedAdminQueuesPage.tsx`

- Withdraw tab → `WalletDeskWithdrawQueue` + `WalletDeskDepositRecon`
- `TabsTrigger` pending count Badge from mock
- kyc/str/risk empty Card carry

### Step 5 — NEW B4 `wallet/__tests__/WalletDesk.test.tsx` (≥8)

1. SEED counts · 2. hydration SEED · 3–7. action reason gates · 8–10. 6요소 smoke · MOCK chip

### Step 6 — i18n `admin.wallet.*` append ko=en

### Step 7 — vitest admin scope **38+** (23→31+ LOCK) · full 428 carry

### Step 8 — §GREEN + 9b-B · Next DRAFT: **L1-15-D Compliance Desk**

---

## 파일표

| # | path |
|---|------|
| B1 | `src/hooks/admin/useAdminWalletDeskMock.ts` |
| B2 | `src/components/admin/wallet/WalletDeskWithdrawQueue.tsx` |
| B3 | `src/components/admin/wallet/WalletDeskDepositRecon.tsx` |
| B4 | `src/components/admin/wallet/__tests__/WalletDesk.test.tsx` |
| B5 | `src/components/pages/ImportedAdminQueuesPage.tsx` |

**DELETE 0** · P0 API breaking 0 · Sports 0-touch

---

## NO-TOUCH

- user wallet/sports · `useWalletMock` · `useAdminSportsMock` · P0 primitive impl
- kyc/str/risk tabs until L1-15-D
- AdminBottomNav · ImportedAdminShell · mocks · rpc · ZIP

---

## LOCK Footer B1–B6

| # | 고정 |
|---|------|
| B1 | reason ≥4 all mutating actions |
| B2 | bulk = UI loop · mock actions only |
| B3 | MOCK chip withdraw section |
| B4 | SEED ≥3 pending · ≥1 overdue SLA |
| B5 | createAdminMockHook hydration F5 |
| B6 | admin scope vitest +8 minimum |

---

## i18n (append · `admin.wallet.*`)

```text
admin.wallet.withdraw.title / .description
admin.wallet.withdraw.col.* · .action.approve / .reject / .markSent
admin.wallet.withdraw.filter.* · .bulk.* · .audit.*
admin.wallet.withdraw.detail.title
admin.wallet.depositRecon.* · admin.wallet.sla.overdue
```

pre-grep · wallet.*/sports.*/admin.primitive.* rename 0

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/wallet/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.primitive\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/wallet/ src/hooks/admin/useAdminWalletDeskMock.ts
rg -nE 'deposit_crypto|deposit_krw|deposit_giftcard' src/components/admin/wallet/ src/hooks/admin/
rg -nE 'supabase|rpc_|service_role' src/components/admin/ src/hooks/admin/
rg -n '<table' src/components/admin/wallet/
rg -n '[가-힣]' src/components/admin/wallet/
```

**9b-B (60s):** `/admin/queues` Withdraw 6요소 · deposit recon · MOCK chip · `/wallet` `/admin/sports` 회귀 0

**§GREEN template:**

```text
L1-15-B §GREEN — WalletDesk withdraw 6요소 + deposit recon · useAdminWalletDeskMock · vitest N/N (admin scope +8) · admin.* M/M (+admin.wallet.* W/W) · primitive 17 · wallet 94 · sports 66 · F9/float/rpc 0 · 9b-B PASS · P0/sports 회귀 0.
```

**Next LOCK DRAFT:** L1-15-D Compliance Desk (KYC · STR · RG queues tabs)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 dispatch LOCK (P0 §GREEN DRAFT) |
| 2026-06-17 | v0.2 EXECUTE — operator Step 0→8 API 정본 · composite seed hook |
| 2026-06-17 | **§GREEN** — vitest 435/439 · admin scope 34 · admin.wallet.* 49 · 9b-B PASS |

---

*Lovable canvas only · ZIP = operator explicit GO*
