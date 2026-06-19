# LOVABLE Admin Compliance Desk LOCK — L1-15-D v0.2

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-D PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-B §GREEN DRAFT carry  
> **큐 ID:** **L1-15-D** (KYC · STR · Risk/RG · 3 tabs × 6요소 · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · L1-15-B §GREEN (Withdraw tab **0-touch**)  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · [`LOVABLE_ADMIN_B_WALLET_DESK_LOCK.md`](LOVABLE_ADMIN_B_WALLET_DESK_LOCK.md)

---

## Scope (1줄)

`/admin/queues` **KYC · STR · Risk(RG)** 3탭 empty stub → **탭당 P0 6요소** — **`useAdminComplianceMock`** = `createAdminMockHook` **×3 compose** · Wallet/Sports 패턴 mirror · rpc/supabase 0.

---

## §Visual References (pattern only)

- openbet-core / openbet-core-shell — multi-queue exception tabs IA
- cokepoppy/my-binance + jose-donato/crypto-orderbook — SLA/overdue tabular density
- rtavytran/rt-commission-dashboard — pending review status badges
- Internal carry: `WalletDeskWithdrawQueue` (B) + Sports `UnsettledFixturesTable` (P0) 6요소

---

## UX 5원칙 (carry)

| Tab | U1 above-fold | U3 6요소 | U5 MOCK chip |
|-----|---------------|----------|--------------|
| KYC | pending review queue | 필수 | ✅ |
| STR | open cases queue | 필수 | ✅ |
| Risk/RG | active flags + RG rows | 필수 | ✅ |

---

## 6요소 checklist (각 탭)

| # | KYC | STR | Risk/RG |
|---|-----|-----|---------|
| 1 filter | tier/status · search userId | caseType/status · search trigger | flagType/status · search userId |
| 2 table | sortable submitted/SLA | sortable created | sortable created |
| 3 row | Approve · Reject | Flag · Escalate · File · Dismiss | Clear · RG cooldown · Limit override |
| 4 reason | ≥4 | ≥4 | ≥4 |
| 5 audit | kyc audit keys | str audit keys | rg audit keys |
| 6 bulk | bulk approve/reject | bulk escalate open | bulk clear active |

보조: `AdminDetailDrawer` — masked user · summary · audit timeline subset

---

## Row types

```ts
type AdminKycRow = {
  id: string; userId: string; tier: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  submittedAt: string; slaDueAt: string;
  documentSummary: string; riskScore?: string;
};
type AdminStrRow = {
  id: string; userId: string; caseType: string;
  status: 'open' | 'reviewing' | 'filed' | 'dismissed';
  triggerRef: string; createdAt: string; slaDueAt: string;
  detailsSummary: string;
};
type AdminRiskRgRow = {
  id: string; userId: string; flagType: string;
  status: 'active' | 'cleared';
  rgLimit?: string; selfExclusionUntil?: string;
  createdAt: string; detailsSummary: string;
};
```

---

## Baseline (B §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 435/439 | **447/451** · gold-rush/mint-reels 4 fail = NO-TOUCH |
| admin scope | 34/34 | **46/46** (+12) |
| `admin.*` ko=en | 201/201 | **288/288** |
| `admin.compliance.*` | — | **87/87** |
| `admin.wallet.*` | 49/49 | **49/49** |
| `admin.primitive.*` | 17/17 | **17/17** |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` / nav.sports | 66/66 | **65/65 + nav.sports** (회귀 0 per 9b-D) |
| 3 tabs × 6요소 | stub | **✅ KYC/STR/Risk** |

---

## 파일표

### NEW

| ID | path |
|----|------|
| D1 | `src/hooks/admin/useAdminComplianceMock.ts` |
| D2 | `src/components/admin/compliance/ComplianceKycQueue.tsx` |
| D3 | `src/components/admin/compliance/ComplianceStrQueue.tsx` |
| D4 | `src/components/admin/compliance/ComplianceRiskRgQueue.tsx` |
| D5 | `src/components/admin/compliance/__tests__/ComplianceDesk.test.tsx` |

### EDIT

| ID | path |
|----|------|
| D6 | `src/components/pages/ImportedAdminQueuesPage.tsx` |
| D7 | `src/i18n/ko.ts` · `src/i18n/en.ts` — append `admin.compliance.*` |

**DELETE 0**

---

## D1 — `useAdminComplianceMock`

Compose 3 `createAdminMockHook` instances (kyc / str / risk).

```ts
useAdminComplianceMock(): {
  kyc; str; risk;
  kycFilters; setKycFilters; strFilters; setStrFilters; riskFilters; setRiskFilters;
  audit; // merged prepend cap 150
  approveKyc(id, reason); rejectKyc(id, reason);
  flagStr(id, reason); escalateStr(id, reason); fileStr(id, reason); dismissStr(id, reason);
  clearRiskFlag(id, reason); applyRgCooldown(id, reason); limitOverride(id, reason);
  resetForTest();
}
```

Audit keys:

- `admin.compliance.kyc.audit.approve|reject`
- `admin.compliance.str.audit.flag|escalate|file|dismiss`
- `admin.compliance.rg.audit.clear|cooldown|limitOverride`

SEED: KYC ≥6 (≥3 pending · ≥1 SLA overdue) · STR ≥5 (≥2 open · ≥1 reviewing) · Risk ≥6 (≥3 active · ≥2 rg_self_exclusion · ≥1 rgLimit). F5 carry · factory API unchanged.

---

## D2/D3/D4 — Queue components

Mirror `WalletDeskWithdrawQueue`:

1. `AdminFilterBar`
2. `AdminDataTable<Row>`
3. Row actions (status-gated)
4. `AdminReasonDialog` mode · min 4
5. `AdminAuditTrail` domain-filtered
6. `AdminBulkActionBar`

MOCK chip in section header · detail drawer on row click.

---

## D6 — Page wire

Replace KYC/STR/Risk empty Cards with D2/D3/D4.

Tab badges:

```tsx
kyc.filter(r => r.status === 'pending' || r.status === 'in_review').length
str.filter(r => r.status === 'open').length
risk.filter(r => r.status === 'active').length
```

**Withdraw tab unchanged.**

---

## D5 — Tests (≥12)

SEED/overdue · action transitions + reason gate · bulk UI loop per tab · 6요소 smoke per tab · MOCK chip · badge counts from hook.

---

## NO-TOUCH

Withdraw tab (B) · `useAdminWalletDeskMock` · Sports · `/wallet` · `/sports` · `/admin/sports` · P0 primitives impl · `useAdminSportsMock` · mocks · rpc · ZIP

---

## LOCK Footer D1–D7

| # | 고정 |
|---|------|
| D1 | 3 tabs × 6요소 visible |
| D2 | reason ≥4 all mutating |
| D3 | MOCK chip per tab |
| D4 | bulk = UI loop |
| D5 | KYC SLA overdue ≥1 in SEED |
| D6 | admin scope **+12** (34→≥46) |
| D7 | wallet 94 · sports 66 · admin.wallet 49 rename 0 |

---

## i18n (append · `admin.compliance.*`)

```text
admin.compliance.kyc.* / .str.* / .rg.*
admin.compliance.risk.flagType.*
admin.compliance.sla.overdue
admin.compliance.detail.title
```

pre-grep · ko=en DIFF=0 · admin.* rename 0

---

## EXECUTE Steps 0→8

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · NO-TOUCH |
| 1 | D1 hook |
| 2 | D2 KYC |
| 3 | D3 STR |
| 4 | D4 Risk/RG |
| 5 | D6 wire + badges |
| 6 | D5 tests ≥12 |
| 7 | i18n append |
| 8 | vitest + §GREEN + 9b-D |

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/compliance/__tests__/
bunx vitest run src/components/admin/wallet/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.compliance\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.primitive\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/compliance/ src/hooks/admin/useAdminComplianceMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/compliance/ src/hooks/admin/useAdminComplianceMock.ts
rg -n '<table' src/components/admin/compliance/
rg -n '[가-힣]' src/components/admin/compliance/
```

**9b-D:** KYC/STR/Risk 6요소 + badges + MOCK · Withdraw/sports/wallet 회귀 0

**§GREEN template:**

```text
L1-15-D §GREEN — Compliance KYC/STR/Risk 3 tabs × 6요소 · useAdminComplianceMock ×3 compose · vitest N/N (admin scope +12) · admin.* M/M (+admin.compliance.* C/C) · wallet 94 · sports 66 · float/rpc 0 · 9b-D PASS · B/P0/sports/wallet 회귀 0.
```

**Next LOCK DRAFT:** L1-15-C Admin Users Desk

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 dispatch LOCK (B §GREEN DRAFT) |
| 2026-06-17 | v0.2 EXECUTE — operator spec 1:1 |
| 2026-06-17 | **§GREEN** — vitest 447/451 · admin scope 46 · admin.compliance.* 87 · 9b-D PASS |

---

*Lovable canvas only · ZIP = operator explicit GO*
