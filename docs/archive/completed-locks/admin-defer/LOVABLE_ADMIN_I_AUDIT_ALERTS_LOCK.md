# LOVABLE Admin Audit + Alerts LOCK — L1-15-I v0.2

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-I PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-C §GREEN DRAFT carry  
> **큐 ID:** **L1-15-I** (Audit merged feed + Alerts stream · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D/C §GREEN (desk hooks **read-only parse** · **write 0**)  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md)

---

## Scope (1줄)

`/admin/audit` + `/admin/alerts` empty cards → **merged audit tail** (read-mostly) + **alerts 6요소 desk** · **`useAdminAuditAlertsMock`** · cross-desk localStorage merge read-only · rpc/supabase 0.

---

## Two surfaces (1 slice)

### I-A `/admin/audit` — read-mostly

| # | 구현 |
|---|------|
| filter | domain chip · actionKey search · date preset |
| table | `AdminDataTable<AdminAuditFeedRow>` sortable `at` |
| row | detail drawer full reason/metadata |
| refresh | live count + `refreshAuditFeed` (read-only merge) |
| optional | Copy ref toast per row |
| MOCK chip | ✅ |

**No** reason dialog · **no** bulk mutate on audit page.

### I-B `/admin/alerts` — full 6요소

| # | 구현 |
|---|------|
| metrics | 3× `AdminMetricCard` open critical / warning / ack |
| filter | severity · status · summary search |
| table | severity · status · summary · source · lastSeen · occurrenceCount |
| row | Ack · Resolve (reason ≥4) |
| audit | `AdminAuditTrail` alertAudit |
| bulk | bulk Ack (no reason) · bulk Resolve (reason ≥4) |
| MOCK chip | ✅ |

---

## Types

```ts
type AdminAuditFeedRow = {
  id: string; at: string; actorKey: string;
  domain: 'wallet' | 'compliance' | 'users' | 'sports' | 'system';
  actionKey: string; subject?: string; reason?: string;
};
type AdminAlertRow = {
  id: string; dedupeKey: string; sourceCheckId: string;
  severity: 'critical' | 'warning';
  status: 'open' | 'acknowledged' | 'resolved';
  summary: string; runbookKey: string;
  firstSeenAt: string; lastSeenAt: string; occurrenceCount: number;
};
```

---

## Baseline (C §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 457/461 | **468/472** · 4 fail NO-TOUCH |
| admin scope | 56/56 | **67/67** (+11) |
| audit/alerts tests | — | **11/11** |
| `admin.*` ko=en | 328/328 | **387/387** |
| `admin.audit.*` | — | **27/27** |
| `admin.alerts.*` | — | **33/33** |
| `admin.users.*` | 45/45 | **45/45** |
| `admin.compliance.*` | 87/87 | **88/88** (+1 feed label · append) |
| `admin.wallet.*` | 49/49 | **51/51** (+2 feed labels · append) |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` + nav | 66/66 | **65 + nav 1** (unchanged) |
| Audit merge | — | read-only 6 keys · storage byte-equal test ✅ |

---

## I1 — `useAdminAuditAlertsMock.ts`

- Single `createAdminMockHook` for **alerts**
- Audit feed: SEED ≥20 (≥4 domains) + **read-only merge** from:
  - `phonara-admin-wallet-desk-v1`
  - `phonara-admin-compliance-v1`
  - `phonara-admin-users-desk-v1`
  - (optional) sports desk key if present
- Alerts SEED ≥8: ≥2 crit open · ≥2 warn open · ≥2 ack · ≥1 resolved
- Cap feed **200** · **never write** desk keys
- `ackAlert` · `resolveAlert(reason≥4)` · `bulkAckAlert` · `bulkResolveAlert(reason≥4)`
- `alertAudit` append · `refreshAuditFeed()` · `resetForTest()`

---

## 파일표

| ID | path |
|----|------|
| I1 | `src/hooks/admin/useAdminAuditAlertsMock.ts` |
| I2 | `src/components/admin/audit/AdminAuditHub.tsx` |
| I3 | `src/components/admin/alerts/AdminAlertsHub.tsx` |
| I4 | `src/components/admin/audit/__tests__/AuditAlerts.test.tsx` |
| I5 | `src/components/pages/ImportedAdminAuditPage.tsx` |
| I6 | `src/components/pages/ImportedAdminAlertsPage.tsx` |
| I7 | `src/i18n/ko.ts` · `en.ts` |

**DELETE 0**

---

## Tests (≥10)

SEED cardinality · ≥4 domains · merge read-only stability · ack + audit · resolve reason gate · bulk ack · bulk resolve gate · filter narrow · MOCK chips · drawer full reason

---

## NO-TOUCH

B/D/C hook **impl** (parse only) · `/admin/queues` · `/admin/users` · `/admin/sports` · P0 impl · user wallet/sports · `/admin/operations` stub · rpc/mocks/ZIP · FROZEN games

---

## i18n

Reuse if hit: `admin.audit.title` · `admin.alerts.title`

Append: `admin.audit.feed.*` · `admin.audit.domain.*` · `admin.alerts.metric.*` · `admin.alerts.filter.*` · `admin.alerts.col.*` · `admin.alerts.action.*` · `admin.alerts.bulk.*` · `admin.alerts.audit.*`

ko=en DIFF=0 · desk prefix counts unchanged

---

## LOCK Footer I1–I7

| # | 고정 |
|---|------|
| I1 | audit read-only · desk storage write 0 |
| I2 | resolve reason ≥4 |
| I3 | MOCK chip both routes |
| I4 | SEED ≥4 audit domains |
| I5 | admin scope +10 (56→≥66) |
| I6 | users 45 · compliance 87 · wallet 49 · sports 66 unchanged |
| I7 | full ≥467/471 carry (4 NO-TOUCH) |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 I1 · 2 I2 · 3 I3 · 4 I5–I6 · 5 I4 · 6 I7 · 7 vitest+§GREEN · 8 9b-I

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/audit/__tests__/
bunx vitest run src/components/admin/users/__tests__/
bunx vitest run src/components/admin/compliance/__tests__/
bunx vitest run src/components/admin/wallet/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.audit\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.alerts\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.users\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.compliance\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/audit/ src/components/admin/alerts/ src/hooks/admin/useAdminAuditAlertsMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/audit/ src/components/admin/alerts/ src/hooks/admin/useAdminAuditAlertsMock.ts
rg -n '<table' src/components/admin/audit/ src/components/admin/alerts/
rg -n '[가-힣]' src/components/admin/audit/ src/components/admin/alerts/
```

**9b-I:** audit merged feed + filter + drawer · alerts 6요소 + 3 metrics · MOCK both · B/D/C/sports/wallet 회귀 0

**§GREEN template:**

```text
L1-15-I §GREEN — Audit merged feed + Alerts 6요소 · useAdminAuditAlertsMock · vitest N/N (admin scope +10) · admin.* M/M · desk i18n unchanged · float/rpc 0 · 9b-I PASS · B/D/C/sports/wallet 회귀 0.
```

**Next LOCK DRAFT:** [`LOVABLE_ADMIN_H_OPERATIONS_DESK_LOCK.md`](LOVABLE_ADMIN_H_OPERATIONS_DESK_LOCK.md) · v0.1 DRAFT

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 dispatch LOCK |
| 2026-06-17 | v0.2 EXECUTE — operator single-shot spec 1:1 |
| 2026-06-17 | **§GREEN** — vitest 468/472 · admin scope 67 · audit 27 · alerts 33 · 9b-I PASS |

---

*Lovable canvas only · ZIP = operator explicit GO*
