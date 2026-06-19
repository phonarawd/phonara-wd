# LOVABLE Admin Casino Desk LOCK — L1-15-E v0.1 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-E PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-H §GREEN carry  
> **큐 ID:** **L1-15-E** (Admin Casino Desk · `/admin/casino` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D/C/H/I §GREEN · **wired admin routes 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · [`LOVABLE_ADMIN_H_OPERATIONS_DESK_LOCK.md`](LOVABLE_ADMIN_H_OPERATIONS_DESK_LOCK.md)

---

## Scope (1줄)

NEW `/admin/casino` stub → **Casino ops desk** — **Catalog** (per-game enable/maintenance) + **RTP Review** queue · **탭당 P0 6요소** · **`useAdminCasinoDeskMock`** · localStorage mock · rpc/supabase 0 · **Operations global kill (`feature_game`/`feature_casino`)과 canonical 분리**.

---

## §Visual References (pattern only)

- stake-originals-clone · Stake-frontend-clone · gamba-labs/platform — originals catalog grid/table density
- live stake.com/casino — game status · maintenance badge rhythm
- openbet-core-shell — admin multi-tab queue IA
- Internal carry: `ComplianceKycQueue` (D) · `OperationsDeskHub` (H) · P0 6요소

---

## Platform boundary (non-negotiable)

| Layer | Route / hook | 역할 |
|-------|--------------|------|
| **Global kill** | `/admin/operations` · `feature_game` · `feature_casino` | platform-wide feature flags |
| **Casino desk** | `/admin/casino` · `useAdminCasinoDeskMock` | per-game catalog · RTP review ops |

**FAIL =** casino desk toggle writes `phonara-admin-operations-v1` · operations hook impl touch · `/admin/sports` or user `/casino` behaviour branch from catalog mock.

---

## Two tabs (1 slice · single route)

### E-A Catalog — full 6요소

| # | 구현 |
|---|------|
| metrics | 3× `AdminMetricCard` — games live · maintenance · disabled |
| 1 filter | category chip `all \| originals \| table \| instant` · status · search gameKey |
| 2 table | `AdminDataTable<AdminCasinoGameRow>` sortable `bets24h` · RTP columns tabular-nums |
| 3 row | Set live · Maintenance · Disable → `AdminReasonDialog` (≥4 on maintenance/disable) |
| 4 reason | ≥4 maintenance/disable · enable = confirm only (no reason) OK |
| 5 audit | `AdminAuditTrail` `admin.casino.catalog.audit.*` |
| 6 bulk | bulk Maintenance · bulk Disable (reason ≥4) |
| MOCK chip | ✅ hub header (shared both tabs) |

### E-B RTP Review — full 6요소

| # | 구현 |
|---|------|
| metrics | 3× `AdminMetricCard` — open reviews · critical drift · resolved (tab-local OK) |
| 1 filter | severity · status · search gameKey |
| 2 table | `AdminDataTable<AdminRtpReviewRow>` sortable `driftPct` · sampleSize string |
| 3 row | Ack · Resolve (reason ≥4) |
| 4 reason | resolve ≥4 |
| 5 audit | `admin.casino.rtp.audit.*` |
| 6 bulk | bulk Ack · bulk Resolve (reason ≥4) |

보조: row → `AdminDetailDrawer` (theoretical vs observed RTP strings · window · sample)

---

## Types

```ts
type AdminCasinoGameRow = {
  id: string;
  gameKey: string;
  labelKey: string;
  category: 'originals' | 'table' | 'instant';
  status: 'live' | 'maintenance' | 'disabled';
  enabled: boolean;
  rtpConfigured: string;
  rtpObserved24h?: string;
  rtpDriftPct?: string;
  bets24h: string;
};

type AdminRtpReviewRow = {
  id: string;
  gameKey: string;
  labelKey: string;
  status: 'open' | 'acknowledged' | 'resolved';
  severity: 'warning' | 'critical';
  theoreticalRtp: string;
  observedRtp: string;
  driftPct: string;
  sampleSize: string;
  windowStart: string;
  windowEnd: string;
};
```

---

## SEED contract (E1 hook)

### Catalog SEED ≥10 games

Stable `gameKey` samples (tests assert these strings):

`crash` · `dice` · `limbo` · `mines` · `plinko` · `hilo` · `blackjack` · `roulette` · `gold_rush` · `mint_reels`

| mix | min |
|-----|-----|
| status live | ≥7 |
| maintenance | ≥2 |
| disabled | ≥1 |
| rtpDriftPct warning | ≥2 |

### RTP review SEED ≥8

| status | min |
|--------|-----|
| open | ≥3 (≥1 critical) |
| acknowledged | ≥2 |
| resolved | ≥2 |

- Persist: **`phonara-admin-casino-catalog-v1`** + **`phonara-admin-casino-rtp-v1`** (§GREEN split · operations write **0**)
- **Never write** operations · B/D/C/I · audit-alerts keys
- **Public API:**

```ts
setGameStatus(id, status: 'live'|'maintenance'|'disabled', reason?: string); // reason required unless status→live
bulkSetGameStatus(ids, status, reason?);
ackRtpReview(id); // no reason
resolveRtpReview(id, reason); // reason.trim().length >= 4
bulkAckRtpReview(ids);
bulkResolveRtpReview(ids, reason);
catalogAudit · rtpAudit append — subject: gameKey (stable string)
resetForTest();
```

All RTP/bet counts = **strings** · no parseFloat/Number.

---

## Baseline (H §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 479/483 | **490/494** · 4 fail NO-TOUCH |
| admin scope | 78/78 | **89/89** (+11) |
| casino tests | — | **11/11** |
| catalog i18n | — | **2241/2241** ko=en · diff ∅ |
| `admin.casino.*` | — | **81/81** |
| `admin.operations.*` | 84/84 | **84/84** |
| `admin.audit.*` | 27/27 | **27/27** |
| `admin.alerts.*` | 33/33 | **33/33** |
| `admin.users.*` | 45/45 | **45/45** |
| `admin.compliance.*` | 88/88 | **88/88** |
| `admin.wallet.*` | 51/51 | **51/51** |
| `sports.*` + nav | 65 + nav 1 | **66** (unchanged) |
| `/admin/casino` | stub/missing | **✅ wired** + nav |
| Persist | — | catalog-v1 + rtp-v1 · T9 byte-equal 6 stores |
| Engine boundary | — | float/rpc/table/JSX ko **0** |

---

## 파일표

| ID | path |
|----|------|
| E1 | `src/hooks/admin/useAdminCasinoDeskMock.ts` |
| E2 | `src/components/admin/casino/CasinoDeskHub.tsx` — segment tabs Catalog \| RTP |
| E3 | `src/components/admin/casino/CasinoCatalogQueue.tsx` |
| E4 | `src/components/admin/casino/CasinoRtpReviewQueue.tsx` |
| E5 | `src/components/admin/casino/__tests__/CasinoDesk.test.tsx` |
| E6 | `src/components/pages/ImportedAdminCasinoPage.tsx` — stub → `<CasinoDeskHub />` |
| E7 | `src/i18n/ko.ts` · `en.ts` — append `admin.casino.*` · `admin.nav.casino` |
| E8 | Admin shell nav register — `/admin/casino` + `admin.nav.casino` (sidebar + More sheet if applicable) |

**DELETE 0**

---

## Tests (≥10 · E5)

| # | assert |
|---|--------|
| T1 | catalog SEED ≥10 · status mix · gameKey stable |
| T2 | RTP SEED ≥8 · severity/status mix |
| T3 | catalog filter category/status/search |
| T4 | RTP filter severity/status |
| T5 | `setGameStatus` reason `<4` blocked for maintenance/disabled |
| T6 | `resolveRtpReview` reason `<4` blocked |
| T7 | audit **`subject === gameKey`** (catalog or rtp) |
| T8 | bulk gates — reason required maintenance/disable/resolve |
| T9 | `phonara-admin-operations-v1` byte-equal after mutations |
| T10 | MOCK chip · nav `/admin/casino` |
| T11 | tabular string metrics · no parseFloat/Number |

---

## NO-TOUCH

B/D/C/H/I hook impl · `/admin/{operations,audit,alerts,queues,users,sports}` · P0 impl · user `/casino` · `/wallet` · FROZEN games core · gold-rush/mint-reels vitest baseline · rpc/supabase · ZIP

---

## i18n

**Append:** `admin.nav.casino` · `admin.casino.title` · `admin.casino.tab.*` · `admin.casino.metric.*` · `admin.casino.catalog.*` · `admin.casino.rtp.*` · `admin.casino.game.{crash,dice,...}.*` (label keys)

ko=en DIFF=0 · **operations 84 · audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 65+nav 1 unchanged** (rename/delete 0)

---

## LOCK Footer E1–E7

| # | 고정 |
|---|------|
| E1 | persist casino catalog+rtp keys only · **operations storage write 0** |
| E2 | both tabs 6요소 · reason ≥4 on disable/maintenance/resolve |
| E3 | MOCK chip + nav `/admin/casino` |
| E4 | catalog SEED ≥10 · RTP SEED ≥8 |
| E5 | admin scope **+10** (78→≥88) |
| E6 | H-prefix i18n counts frozen |
| E7 | full vitest **≥489/493** (4 NO-TOUCH) |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 E1 · 2 E3 catalog · 3 E4 RTP · 4 E2 hub + E6 page · 5 E8 nav · 6 E7 i18n · 7 E5 tests · 8 §GREEN + 9b-E

---

## §GREEN full block

```bash
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

rg -nE 'parseFloat|Number\(' src/components/admin/casino/ src/hooks/admin/useAdminCasinoDeskMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/casino/ src/hooks/admin/useAdminCasinoDeskMock.ts
rg -n '<table' src/components/admin/casino/
rg -n '[가-힣]' src/components/admin/casino/ src/hooks/admin/useAdminCasinoDeskMock.ts
```

**§GREEN template:**

```text
L1-15-E §GREEN — Casino desk Catalog+RTP 6요소 · useAdminCasinoDeskMock · vitest N/N (admin scope +10) · admin.* M/M · admin.casino.* P/P · desk i18n unchanged · operations storage 0 · float/rpc 0 · 9b-E PASS · H/I/B/D/C/sports/wallet 회귀 0.
```

**Next LOCK DRAFT:** [`LOVABLE_ADMIN_F_EARN_REFERRAL_DESK_LOCK.md`](LOVABLE_ADMIN_F_EARN_REFERRAL_DESK_LOCK.md) §GREEN · **L1-15-G** Admin CMS Desk

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 EXECUTE — H §GREEN carry · dispatch with L1-15-E EXECUTE GO |
| 2026-06-17 | Plan APPROVE — Lovable Plan 1:1 LOCK · RTP tab 3 metrics · EXECUTE Step 1→ |
| 2026-06-17 | **§GREEN** — vitest 490/494 · admin scope 89 · casino 81 · 11/11 tests · 9b-E PASS · persist split catalog+rtp |

---

*Lovable canvas only · PHONARA repo EXECUTE 0 · ZIP = operator explicit GO*
