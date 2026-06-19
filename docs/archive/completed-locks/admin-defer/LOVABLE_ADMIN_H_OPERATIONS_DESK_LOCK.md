# LOVABLE Admin Operations 2.0 LOCK — L1-15-H v0.2 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-H PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-I §GREEN carry  
> **큐 ID:** **L1-15-H** (Admin Operations 2.0 · `/admin/operations` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D/C/I §GREEN · **wired admin routes 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md) · [`LOVABLE_ADMIN_I_AUDIT_ALERTS_LOCK.md`](LOVABLE_ADMIN_I_AUDIT_ALERTS_LOCK.md)  
> **PHONARA paste wire 참고 (read-only):** `apps/admin/src/routes/operations.tsx` · `overview.tsx` ops-health cards

---

## Operator carry (v0.2 · impl 고정)

| # | 고정 |
|---|------|
| C1 | **Hook mutate API = row `id`:** `setKillSwitch(id, enabled, reason)` · `bulkSetKillSwitch(ids, enabled, reason)` · `reason.trim().length >= 4` |
| C2 | **`switchKey` = audit/test SOT:** `opsAudit` row `{ subject: switchKey, actionKey: 'admin.operations.audit.{enable\|disable}' }` — re-seed 후에도 switchKey 문자열 stable assert |
| C3 | **i18n 「0 diff」= ko=en catalog DIFF=0** — `admin.operations.*` append 양쪽 동시 · audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 65+nav 1 **rename/delete 0** |
| C4 | **T9 byte-equal keys:** `admin:wallet:*` · `admin:compliance:*` · `admin:users:v1` · `phonara-admin-audit-alerts-v1` (+ I merge desk keys if present in fixture) |
| C5 | `/admin/sports` Ops tab = **hint-only** · canonical toggle = operations desk · behaviour branch **0** |

**FAIL =** mutate API가 `switchKey`를 public param으로 노출하고 audit `subject`가 id-only · T9 key write · sports Ops tab toggle drift.

---

## §Visual References (pattern only)

my-binance · coinicx · openbet-core-shell · crypto-orderbook · shadcn binance · live Binance Spot — density · status chips · tabular ops grammar only · code import 0.

---

## Scope (1줄)

`/admin/operations` empty/stub cards → **Operations 2.0 desk** — display-only **cron · queue lag · error budget** metrics + sortable health table + **kill switch / feature flag** rows with **P0 6요소** mutate block · **`useAdminOperationsMock`** · localStorage mock · rpc/supabase 0.

---

## Two blocks (1 slice · single route)

### H-A Health & metrics — read-mostly (display-only)

| # | 구현 |
|---|------|
| metrics | 4× `AdminMetricCard` — cron healthy % · max queue lag (sec string) · error budget remaining % · active kill switches count |
| filter | status chip `all \| ok \| warning \| critical` · category chip `all \| cron \| queue \| budget` |
| table | `AdminDataTable<AdminOpsHealthRow>` sortable `lastRunAt` · status badge · lag/budget tabular-nums |
| row | detail drawer — checkKey · observedAt · lastRunAt · lastSuccessfulAt · lastErrorAt · metadata strings |
| refresh | header refresh → `refreshHealth()` tick only · **desk cross-storage write 0** |
| MOCK chip | ✅ page header |

**No** reason dialog · **no** bulk mutate on health table.

### H-B Kill switches — full 6요소

| # | 구현 |
|---|------|
| 1 filter | category chip `all \| system \| wallet \| trading \| sports \| earn` · search switchKey/label |
| 2 table | `AdminDataTable<AdminKillSwitchRow>` — label · category · ON/OFF badge · lastChangedAt |
| 3 row | Enable / Disable → `AdminReasonDialog` (≥4) |
| 4 reason | ≥4 all toggles · system halt = danger tone |
| 5 audit | `AdminAuditTrail` `admin.operations.audit.*` |
| 6 bulk | multi-select → bulk Disable (reason ≥4) · bulk Enable (reason ≥4) |
| MOCK chip | ✅ kill section header (or page-level single chip — **both sections share 1 page chip OK**) |

---

## Types

```ts
type AdminOpsHealthRow = {
  id: string;
  checkKey: string;
  category: 'cron' | 'queue' | 'budget' | 'infra';
  status: 'ok' | 'warning' | 'critical';
  summary: string; // i18n-interpolated display string from hook, not JSX literal
  lastRunAt: string;
  lastSuccessfulAt?: string;
  lastErrorAt?: string;
  observedAt: string;
  lagSeconds?: string; // tabular display · no Number() math
  budgetRemainingPct?: string;
};

type AdminKillSwitchRow = {
  id: string;
  switchKey: string;
  category: 'system' | 'wallet' | 'trading' | 'sports' | 'earn';
  labelKey: string; // resolves via t()
  enabled: boolean;
  tone: 'danger' | 'warning' | 'primary';
  lastChangedAt?: string;
  lastChangedByKey?: string;
};
```

---

## SEED contract (H1 hook)

### Health SEED ≥10 rows

| category | min | status mix |
|----------|-----|------------|
| cron | ≥3 | ≥1 warning or critical |
| queue | ≥3 | ≥1 with `lagSeconds` > `"120"` (string compare OK for display) |
| budget | ≥2 | ≥1 warning (`budgetRemainingPct` ≤ `"15"`) |
| infra | ≥2 | ok + warning |

Required checkKey samples (stable ids for tests):

- `cron_liquidation_liveness` · `cron_settlement_liveness` · `cron_reconciliation`
- `queue_withdraw_lag` · `queue_kyc_lag` · `queue_str_lag`
- `error_budget_24h` · `error_budget_7d`
- `reconciliation_latest` · `hash_chain_integrity`

### Kill switch SEED ≥11 rows

| switchKey | category | default | tone |
|-----------|----------|---------|------|
| `system_halt` | system | off | danger |
| `system_readonly` | system | off | warning |
| `feature_deposit` | wallet | on | primary |
| `feature_withdrawal` | wallet | on | primary |
| `feature_spot` | trading | on | primary |
| `feature_futures` | trading | on | primary |
| `feature_staking` | trading | on | primary |
| `feature_game` | earn | on | primary |
| `feature_referral` | earn | on | primary |
| `feature_sports` | sports | on | primary |
| `feature_casino` | earn | on | primary |

- Persist: `phonara-admin-operations-v1` only
- **Never write** B/D/C/I desk keys · `phonara-admin-audit-alerts-v1` · audit merge keys
- **Public API (final):**

```ts
refreshHealth(); // display tick only · cross-desk write 0
setKillSwitch(id: string, enabled: boolean, reason: string): boolean; // false if reason.trim().length < 4
bulkSetKillSwitch(ids: string[], enabled: boolean, reason: string): boolean;
// opsAudit append: { subject: switchKey, actionKey: 'admin.operations.audit.enable' | 'admin.operations.audit.disable' }
resetForTest();
```

- `refreshHealth()` — re-roll display tick from SEED + persisted switch state · health row count stable

---

## Baseline (I §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 468/472 | **479/483** · 4 fail NO-TOUCH |
| admin scope | 67/67 | **78/78** (+11) |
| `admin.*` ko=en | 387/387 | **456/456** |
| `admin.operations.*` | (partial reuse) | **84/84** |
| `admin.audit.*` | 27/27 | **27/27** |
| `admin.alerts.*` | 33/33 | **33/33** |
| `admin.users.*` | 45/45 | **45/45** |
| `admin.compliance.*` | 88/88 | **88/88** |
| `admin.wallet.*` | 51/51 | **51/51** |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` + nav | 65 + nav 1 | **65 + nav 1** |
| `/admin/operations` | stub | **✅ wired** |
| Engine boundary | — | float/rpc/table/JSX ko **0** |

---

## 파일표

| ID | path |
|----|------|
| H1 | `src/hooks/admin/useAdminOperationsMock.ts` |
| H2 | `src/components/admin/operations/OperationsDeskHub.tsx` |
| H3 | `src/components/admin/operations/__tests__/OperationsDesk.test.tsx` |
| H4 | `src/components/pages/ImportedAdminOperationsPage.tsx` — `<OperationsDeskHub />` |
| H5 | `src/i18n/ko.ts` · `en.ts` |

**DELETE 0**

---

## Tests (≥10 · H3)

| # | assert |
|---|--------|
| T1 | health SEED ≥10 · 4 categories (cron/queue/budget/infra) |
| T2 | metrics derive from health + kill (string counts · no float math) |
| T3 | health filter status narrows rows |
| T4 | health filter category narrows rows |
| T5 | toggle → audit append · **`opsAudit[0].subject === switchKey`** (not row id) |
| T6 | reason `<4` blocked · `setKillSwitch` returns false |
| T7 | bulk Enable reason ≥4 gate |
| T8 | bulk Disable reason ≥4 gate + audit |
| T9 | `refreshHealth` byte-equal: `admin:wallet:*` · `admin:compliance:*` · `admin:users:v1` · `phonara-admin-audit-alerts-v1` |
| T10 | MOCK chip · health row → detail drawer |
| T11 | `system_halt` danger dialog tone + audit row |

---

## NO-TOUCH

B/D/C/I hook **impl** · `/admin/audit` · `/admin/alerts` · `/admin/queues` · `/admin/users` · `/admin/sports` · P0 impl · user `/wallet` · `/sports` · Overview KPI cards (MOCK chip 유지) · rpc/supabase/service_role · PHONARA `apps/admin` · FROZEN games · ZIP

**FAIL =** audit feed merge keys write · alerts hook mutate from ops · Sports `feature_sports` row duplicate on `/admin/sports` Ops tab diff (sports tab = hint only · **canonical toggle = operations desk**)

---

## i18n

**Reuse if hit (append 0):**

- `admin.operations.title` · `admin.operations.description`
- `admin.operations.section.systemMode` · `admin.operations.section.featureFlags`
- `admin.operations.systemHalt.*` · `admin.operations.systemReadonly.*`
- `admin.operations.feature.*` (spot · futures · staking · game · referral · deposit · withdrawal · sports)
- `admin.operations.toggle.*` · `admin.operations.dialog.*` · `admin.operations.action.*`
- `admin.nav.operations`

**Append only:**

- `admin.operations.section.health` · `admin.operations.section.killSwitches`
- `admin.operations.metric.*` (4 cards)
- `admin.operations.health.*` (col · status · category · drawer)
- `admin.operations.kill.*` (col · filter · bulk)
- `admin.operations.audit.*`

ko=en DIFF=0 · **audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 65 + nav 1 unchanged** (rename/delete 0 on prior prefixes)

---

## UX carry (P0)

- above-fold = 4 metrics + health table · kill switches below-fold (or segment tabs mobile: **Health | Switches** — desktop single scroll stack OK)
- tabular-nums on lag · budget · counts
- `AdminReasonDialog` minLength **4**
- inline `<table>` **0** — `AdminDataTable` only
- enableHotkeys **false**

---

## LOCK Footer H1–H7

| # | 고정 |
|---|------|
| H1 | health block read-only mutate 0 · cross-desk storage write 0 |
| H2 | kill reason ≥4 · audit **`subject=switchKey`** on every toggle/bulk |
| H3 | MOCK chip on `/admin/operations` |
| H4 | health SEED ≥10 · kill SEED ≥11 |
| H5 | admin scope **+10** (67→≥77) |
| H6 | I-prefix i18n counts frozen (audit/alerts/users/compliance/wallet/sports) |
| H7 | full vitest **≥478/482** carry (4 NO-TOUCH) |

---

## EXECUTE Steps 0→8

| Step | 작업 |
|------|------|
| 0 | LOCK ACK · baseline snapshot |
| 1 | H1 `useAdminOperationsMock` + SEED + persist |
| 2 | H2 `OperationsDeskHub` health block + metrics |
| 3 | H2 kill block 6요소 |
| 4 | H4 page wire · remove stub empty state |
| 5 | H5 i18n append · reuse scan |
| 6 | H3 tests ≥10 |
| 7 | vitest admin scope + full · §GREEN self-check block |
| 8 | operator 9b-H manual (desktop 1280 + mobile 360 · toggle + refresh · B/D/C/I/sports 회귀 0) |

---

## §GREEN full block

```bash
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
rg -c '"admin\.operations\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.audit\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.alerts\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.users\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.compliance\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/operations/ src/hooks/admin/useAdminOperationsMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/operations/ src/hooks/admin/useAdminOperationsMock.ts
rg -n '<table' src/components/admin/operations/
rg -n '[가-힣]' src/components/admin/operations/ src/hooks/admin/useAdminOperationsMock.ts
```

**9b-H:** 4 metrics visible · health table filter+drawer · kill 6요소 · refresh · MOCK · audit/alerts/users/queues/sports 회귀 0

**FAIL =** health row mutate · desk key write · reason `<4` pass · admin scope `<+10` · prior prefix i18n rename/delete · float/rpc/table/JSX Korean hit · vitest full `<478/482`

**§GREEN template:**

```text
L1-15-H §GREEN — Operations 2.0 · cron/queue/budget metrics + kill 6요소 · useAdminOperationsMock · vitest N/N (admin scope +10) · admin.* M/M · admin.operations.* P/P · desk i18n unchanged · float/rpc 0 · 9b-H PASS · I/B/D/C/sports/wallet 회귀 0.
```

**Next LOCK DRAFT:** [`LOVABLE_ADMIN_E_CASINO_DESK_LOCK.md`](LOVABLE_ADMIN_E_CASINO_DESK_LOCK.md) §GREEN · **L1-15-F** Admin Earn/Referral Desk

---

## paste adapter memo (L2 · post-ZIP)

- `useAdminOperationsMock` → `useAppConfig` + `getOpsHealthRaw` + `setSystemMode` / `setFeatureEnabled` adapters
- Health rows map to `apps/admin` overview check ids
- Kill rows map 1:1 `operations.tsx` FEATURES + `system_halt` / `system_readonly`
- `AdminReasonDialog` → merge `AdminActionDialog` reason path

---

## Defer

- Live RPC health poll · real cron lag — L2-A-W only
- Market limits / exposure caps UI — sports desk carry
- `/admin/mfa` · `/admin/settings` — post E/F/G
- ZIP — operator explicit GO

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 DRAFT — I §GREEN carry |
| 2026-06-17 | Plan APPROVE · EXECUTE Step 1→ |
| 2026-06-17 | **v0.2 EXECUTE** — operator carry C1–C5 · hook id/switchKey · T9 keys · audit subject |
| 2026-06-17 | **§GREEN** — vitest 479/483 · admin scope 78 · operations 84 · 9b-H PASS |

---

*Lovable canvas only · PHONARA repo EXECUTE 0 · ZIP = operator explicit GO*
