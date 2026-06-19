# LOVABLE Admin Earn/Referral Desk LOCK — L1-15-F v0.1 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-F PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-E §GREEN carry  
> **큐 ID:** **L1-15-F** (Admin Earn/Referral Desk · `/admin/earn` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D/C/H/I/E §GREEN · **wired admin routes 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · Phase 12-E paste memo (`affiliate_settlements.state`)

---

## Operator carry (Plan ACK · impl 고정)

| # | 고정 |
|---|------|
| C1 | Agents metrics **4×** — active · pending · suspended · **depth-2 count** |
| C2 | Settlements metrics **4×** — pending · approved · paid · **total amount (string sum/display · no float math in hook)** |
| C3 | Amount table sort = **padded numeric string compare** in UI layer · hook/store amounts stay string |
| C4 | reason `<4` → **`throws`** (tests T5–T7) · bulk gates same |
| C5 | Nav F8: `ImportedAdminShell` + `AdminBottomNav` · **Coins** icon · `/admin/earn` |
| C6 | SEED settlements: **USDT/BTC** mix · period keys `2026-04` / `2026-05` / `2026-06` |

**FAIL =** parseFloat/Number in hook for sum/sort · reason `<4` silent pass · T9 operations+casino storage write.

---

## Scope (1줄)

NEW `/admin/earn` → **Agents** (onboard/tier/suspend) + **Settlements** (commission 3-state queue) · **탭당 P0 6요소** · **`useAdminEarnDeskMock`** · localStorage mock · rpc/supabase 0 · **Operations `feature_referral` global kill과 canonical 분리**.

## §Visual References (pattern only)

- rt-commission-dashboard — commission · tier · agent list density
- live stake.com/affiliate — agent portal tier · payout rhythm (pattern only)
- openbet-core-shell — admin multi-tab queue IA
- Toss gamification case — mission/reward clarity (Earn admin tone only)
- Internal carry: `ComplianceKycQueue` (D) · `CasinoCatalogQueue` (E) · P0 6요소

---

## Platform boundary (non-negotiable)

| Layer | Route / hook | 역할 |
|-------|--------------|------|
| **Global kill** | `/admin/operations` · `feature_referral` | platform-wide referral feature flag |
| **Earn desk** | `/admin/earn` · `useAdminEarnDeskMock` | per-agent ops · settlement approval queue |
| **User funnel** | `/partner` · `/earn` · user referral UI | **0-touch** — admin desk does not branch user surfaces |

**FAIL =** earn desk writes `phonara-admin-operations-v1` / casino keys · user `/partner` `/earn` behaviour branch · paste memo column `settlements.status` (use **`affiliate_settlements.state`**)

---

## Two tabs (1 slice · single route)

### F-A Agents — full 6요소

| # | 구현 |
|---|------|
| metrics | 4× `AdminMetricCard` — active · pending · suspended · **depth-2 count** |
| 1 filter | tier chip · status chip · search agentCode/displayName |
| 2 table | `AdminDataTable<AdminEarnAgentRow>` sortable `joinedAt` · treeDepth badge · pendingPayout tabular-nums |
| 3 row | Approve (pending→active) · Suspend · Tier override → reason ≥4 on suspend/tier |
| 4 reason | ≥4 suspend · tier override · reject onboard |
| 5 audit | `AdminAuditTrail` `admin.earn.agents.audit.*` |
| 6 bulk | bulk Approve pending · bulk Suspend (reason ≥4) |
| MOCK chip | ✅ hub header (shared) |

### F-B Settlements — full 6요소

| # | 구현 |
|---|------|
| metrics | 4× `AdminMetricCard` — pending · approved · paid · **total amount (string display sum)** |
| 1 filter | state chip `pending \| approved \| paid` · search agentCode · period preset |
| 2 table | `AdminDataTable<AdminEarnSettlementRow>` sortable `amount` (**padded string compare**) · state badge |
| 3 row | Approve (pending→approved) · Mark paid (approved→paid) · Reject (reason ≥4) |
| 4 reason | ≥4 reject · mark paid · bulk paid |
| 5 audit | `admin.earn.settlements.audit.*` |
| 6 bulk | bulk Approve pending · bulk Mark paid (reason ≥4) |
| MOCK chip | (page-level single chip OK) |

보조: row → `AdminDetailDrawer` — agent tree depth-2 summary (display strings) · downline count · period metadata

---

## Types

```ts
type AdminEarnAgentRow = {
  id: string;
  agentCode: string;
  displayName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  treeDepth: '1' | '2';
  status: 'pending' | 'active' | 'suspended';
  referralCount: string;
  pendingPayout: string;
  joinedAt: string;
};

type AdminEarnSettlementRow = {
  id: string;
  agentCode: string;
  agentDisplayName: string;
  periodKey: string;
  amount: string;
  currency: string;
  state: 'pending' | 'approved' | 'paid';
  downlineCount?: string;
  createdAt: string;
};
```

---

## SEED contract (F1 hook)

### Agents SEED ≥10

| mix | min |
|-----|-----|
| pending | ≥3 |
| active | ≥5 |
| suspended | ≥2 |
| treeDepth 2 | ≥4 |
| tier gold/platinum | ≥2 |

Stable `agentCode` samples for tests: `AGT-001` … `AGT-010` pattern OK

### Settlements SEED ≥8

| state | min |
|-------|-----|
| pending | ≥3 |
| approved | ≥2 |
| paid | ≥2 |

Settlements currency mix **USDT/BTC** · period keys **`2026-04` · `2026-05` · `2026-06`**

- Persist: **`phonara-admin-earn-agents-v1`** + **`phonara-admin-earn-settlements-v1`**
- **Never write** operations · casino · B/D/C/I desk keys
- **Public API:**

```ts
approveAgent(id); // pending→active · no reason
suspendAgent(id, reason); // throws if reason.trim().length < 4
setAgentTier(id, tier, reason); // throws if < 4
bulkApproveAgents(ids);
bulkSuspendAgents(ids, reason); // ≥4
approveSettlement(id); // pending→approved
markSettlementPaid(id, reason); // throws if < 4
rejectSettlement(id, reason); // throws if < 4
bulkApproveSettlements(ids);
bulkMarkSettlementsPaid(ids, reason); // ≥4
// audit append: subject = agentCode (stable string)
resetForTest();
```

All money/count fields = **strings** · no parseFloat/Number.

---

## Baseline (E §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 490/494 | **502/506** · 4 fail NO-TOUCH |
| admin scope | 89/89 | **101/101** (+12) |
| earn tests | — | **11/11** (T1–T11) |
| catalog i18n | 2241/2241 | ko=en parity ✅ |
| `admin.earn.*` | — | **76/76** |
| nav + seo earn | — | **`admin.nav.earn` + `seo.adminEarn.*`** (+2 · append) |
| `admin.casino.*` | 81/81 | **81/81** |
| `admin.operations.*` | 84/84 | **84/84** |
| `admin.audit.*` | 27/27 | **27/27** |
| `admin.alerts.*` | 33/33 | **33/33** |
| `admin.users.*` | 45/45 | **45/45** |
| `admin.compliance.*` | 88/88 | **88/88** |
| `admin.wallet.*` | 51/51 | **51/51** |
| `sports.*` + nav | 66 | **66** |
| `/admin/earn` | missing | **✅ wired** · MOCK · mobile tabs |
| Persist | — | agents-v1 + settlements-v1 only |
| T10 isolation | — | ops+casino+wallet+compliance+users+alerts byte-equal ✅ |
| Engine boundary | — | float/rpc/table/JSX ko **0** |

---

## 파일표

| ID | path |
|----|------|
| F1 | `src/hooks/admin/useAdminEarnDeskMock.ts` |
| F2 | `src/components/admin/earn/EarnDeskHub.tsx` — tabs Agents \| Settlements |
| F3 | `src/components/admin/earn/EarnAgentsQueue.tsx` |
| F4 | `src/components/admin/earn/EarnSettlementsQueue.tsx` |
| F5 | `src/components/admin/earn/__tests__/EarnDesk.test.tsx` |
| F6 | `src/components/pages/ImportedAdminEarnPage.tsx` + route `admin.earn.tsx` |
| F7 | `src/i18n/ko.ts` · `en.ts` — `admin.nav.earn` · `admin.earn.*` |
| F8 | `ImportedAdminShell.tsx` · `AdminBottomNav.tsx` — nav `/admin/earn` · **Coins** icon |

**DELETE 0**

---

## Tests (≥10 · F5)

| # | assert |
|---|--------|
| T1 | agents SEED ≥10 · status/tier/depth mix |
| T2 | settlements SEED ≥8 · 3-state · USDT/BTC |
| T3 | agents filter tier/status/search |
| T4 | settlements filter state/search |
| T5 | `suspendAgent` reason `<4` **throws** |
| T6 | `setAgentTier` reason `<4` **throws** |
| T7 | `markSettlementPaid` / `rejectSettlement` reason `<4` **throws** |
| T8 | audit **`subject === agentCode`** |
| T9 | operations + casino storage byte-equal after earn mutations |
| T10 | MOCK chip · nav `/admin/earn` mounts |
| T11 | hook · no parseFloat/Number |

---

## NO-TOUCH

B/D/C/H/I/E hook impl · wired `/admin/*` · P0 · user `/earn` `/partner` `/wallet` `/casino` `/sports` · FROZEN games · rpc/supabase · ZIP

---

## i18n

**Reuse if hit:** `referral.pending|approved|paid` tone alignment OK but **admin keys separate** — append `admin.earn.*` only

**Append:** `admin.nav.earn` · `admin.earn.title` · `admin.earn.tab.*` · `admin.earn.agents.*` · `admin.earn.settlements.*` · `admin.earn.tier.*` · `admin.earn.audit.*` (agents + settlements)

ko=en DIFF=0 · **casino 81 · operations 84 · audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 66 unchanged**

---

## LOCK Footer F1–F7

| # | 고정 |
|---|------|
| F1 | earn persist keys only · cross-desk write 0 |
| F2 | both tabs 6요소 · reason ≥4 on suspend/tier/reject/paid |
| F3 | MOCK chip + nav `/admin/earn` |
| F4 | agents SEED ≥10 · settlements SEED ≥8 |
| F5 | admin scope **+10** (89→≥99) |
| F6 | E-prefix i18n counts frozen |
| F7 | full vitest **≥500/504** (4 NO-TOUCH) |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 F1 · 2 F3 · 3 F4 · 4 F2+F6 · 5 F8 nav · 6 F7 i18n · 7 F5 tests · 8 §GREEN + 9b-F

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/earn/__tests__/
bunx vitest run src/components/admin/casino/__tests__/
bunx vitest run src/components/admin/operations/__tests__/
bunx vitest run src/components/admin/audit/__tests__/
bunx vitest run src/components/admin/alerts/__tests__/
bunx vitest run src/components/admin/users/__tests__/
bunx vitest run src/components/admin/compliance/__tests__/
bunx vitest run src/components/admin/wallet/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.earn\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.casino\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.operations\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.audit\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.alerts\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.users\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.compliance\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/earn/ src/hooks/admin/useAdminEarnDeskMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/earn/ src/hooks/admin/useAdminEarnDeskMock.ts
rg -n '<table' src/components/admin/earn/
rg -n '[가-힣]' src/components/admin/earn/ src/hooks/admin/useAdminEarnDeskMock.ts
```

**§GREEN template:**

```text
L1-15-F §GREEN — Earn/Referral desk Agents+Settlements 6요소 · useAdminEarnDeskMock · vitest N/N (admin scope +10) · admin.earn.* P/P · desk i18n frozen · cross-store 0 · float/rpc 0 · 9b-F PASS · E/H/I/B/D/C/sports/wallet/casino 회귀 0.
```

**Next LOCK DRAFT:** [`LOVABLE_ADMIN_G_CMS_DESK_LOCK.md`](LOVABLE_ADMIN_G_CMS_DESK_LOCK.md) §GREEN · **L1-15-J** Admin RBAC · hotkeys · Cmd+K

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 EXECUTE — E §GREEN carry · L1-15-F EXECUTE GO dispatch |
| 2026-06-17 | Plan APPROVE — 4× metrics · throws gate · Coins nav · EXECUTE Step 1→ |
| 2026-06-17 | **§GREEN** — vitest 502/506 · admin scope 101 · earn 76 · 9b-F PASS · cycle-tier carry |

---

*Lovable canvas only · PHONARA repo EXECUTE 0 · ZIP = operator explicit GO*
