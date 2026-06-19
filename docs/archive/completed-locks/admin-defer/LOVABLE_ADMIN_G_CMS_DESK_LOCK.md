# LOVABLE Admin CMS Desk LOCK — L1-15-G v0.1 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-G PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · L1-15-F §GREEN carry  
> **큐 ID:** **L1-15-G** (Admin CMS Desk · `/admin/cms` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · B/D/C/H/I/E/F §GREEN · **wired admin routes 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md)

---

## Operator carry (Plan ACK · impl 고정)

| # | 고정 |
|---|------|
| C1 | G1 = **2× `createAdminMockHook`** compose (pages · promos domains) |
| C2 | G2 hub = title · MOCK chip · mobile tabs · **shared `AdminAuditTrail`** (pages+promos merge display) |
| C3 | G6 route = **Outlet pattern** · **noindex** head · append **`seo.adminCms.*`** |
| C4 | T9 snapshot **7 storages:** operations · casino · earn · users · wallet · audit · alerts — byte-equal after CMS mutations |
| C5 | reason `<4` → **throw** on archive · restore · endPromoEarly · bulk archive/end |

**FAIL =** per-tab duplicate audit only without hub trail · runtime i18n file write · T9 any sibling storage drift.

---

## Scope (1줄)

NEW `/admin/cms` → **Pages** (draft/publish/archive) + **Promos** (banner schedule queue) · **탭당 P0 6요소** · **`useAdminCmsDeskMock`** · localStorage mock overrides only · rpc/supabase 0 · **user i18n catalog 파일 런타임 mutate 0**.

---

## §Visual References (pattern only)

- openbet-core-shell — admin content queue IA
- shadcn/ui — form/table density (default clone 금지)
- live stake.com — promo strip · announcement rhythm (pattern only)
- Internal carry: `EarnAgentsQueue` (F) · `CasinoCatalogQueue` (E) · P0 6요소

---

## Platform boundary (non-negotiable)

| Layer | 역할 | 금지 |
|-------|------|------|
| **CMS desk** | mock content override preview · publish state machine | `ko.ts`/`en.ts` 런타임 write |
| **User surfaces** | Home/Casino/Earn/Trade presentation | CMS mock가 user route behaviour branch 금지 |
| **`/admin/settings`** | operator prefs stub (defer) | CMS와 route merge 금지 |

**FAIL =** CMS hook writes earn/casino/operations storage · mutates user-facing i18n files · `/admin/settings` redirect merge

---

## Two tabs (1 slice · single route)

### G-A Pages — full 6요소

| # | 구현 |
|---|------|
| metrics | 4× `AdminMetricCard` — published · draft · archived · **locales live (ko+en pairs count as string)** |
| 1 filter | locale chip `all \| ko \| en` · status chip · search pageKey/title |
| 2 table | `AdminDataTable<AdminCmsPageRow>` sortable `updatedAt` · status badge |
| 3 row | Publish (draft→published) · Archive (reason ≥4) · Restore draft (reason ≥4 from archived) |
| 4 reason | ≥4 archive · restore · bulk archive |
| 5 audit | `AdminAuditTrail` `admin.cms.pages.audit.*` |
| 6 bulk | bulk Publish draft · bulk Archive (reason ≥4) |
| MOCK chip | ✅ hub header (shared) |

### G-B Promos — full 6요소

| # | 구현 |
|---|------|
| metrics | 4× `AdminMetricCard` — live · scheduled · draft · ended |
| 1 filter | surface chip `all \| home \| casino \| earn \| trade` · status · search promoKey |
| 2 table | `AdminDataTable<AdminCmsPromoRow>` sortable `startsAt` · surface badge |
| 3 row | Activate (draft/scheduled→live) · End early (reason ≥4) · Schedule edit drawer (display strings) |
| 4 reason | ≥4 end early · reject schedule conflict |
| 5 audit | `admin.cms.promos.audit.*` |
| 6 bulk | bulk End (reason ≥4) · bulk Activate scheduled |
| MOCK chip | (page-level single chip OK) |

보조: row → `AdminDetailDrawer` — pageKey/promoKey metadata · last editor · schedule window strings

---

## Types

```ts
type AdminCmsPageRow = {
  id: string;
  pageKey: string;
  locale: 'ko' | 'en';
  status: 'draft' | 'published' | 'archived';
  titleKey: string;
  updatedAt: string;
  updatedByKey: string;
};

type AdminCmsPromoRow = {
  id: string;
  promoKey: string;
  surface: 'home' | 'casino' | 'earn' | 'trade';
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  startsAt: string;
  endsAt: string;
  headlineKey: string;
  priority: string; // tabular display · "1".."99"
};
```

---

## SEED contract (G1 hook)

### Pages SEED ≥10

| mix | min |
|-----|-----|
| published | ≥4 |
| draft | ≥3 |
| archived | ≥2 |
| locale ko | ≥5 |
| locale en | ≥5 |

Stable `pageKey` samples: `legal.terms` · `legal.privacy` · `info.fees` · `info.rg` · `faq.deposit` · `faq.withdraw` · `promo.welcome` · `seo.home` · `notice.maintenance` · `partner.rules`

### Promos SEED ≥8

| status | min |
|--------|-----|
| live | ≥2 |
| scheduled | ≥2 |
| draft | ≥2 |
| ended | ≥2 |

Surfaces spread: home · casino · earn · trade each ≥1

- Persist: **`phonara-admin-cms-pages-v1`** + **`phonara-admin-cms-promos-v1`**
- **Never write** earn/casino/operations/B/D/C/I desk keys
- **Public API:**

```ts
publishPage(id); // draft→published · no reason
archivePage(id, reason); // throws if reason.trim().length < 4
restorePageDraft(id, reason); // archived→draft · throws if < 4
bulkPublishPages(ids);
bulkArchivePages(ids, reason); // throws if < 4
activatePromo(id); // draft|scheduled→live
endPromoEarly(id, reason); // throws if < 4
bulkActivatePromos(ids);
bulkEndPromos(ids, reason); // throws if < 4
// audit append: subject = pageKey | promoKey (stable string)
resetForTest();
```

Schedule/date fields = **ISO strings** · no Date math in hook for money — display sort via string compare OK.

---

## Baseline (F §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 502/506 | **513/517** · 4 fail NO-TOUCH |
| cms scope tests | — | **11/11** |
| admin scope | 101/101 | **≥111** (G5 ✓ · operator full vitest PASS) |
| `admin.cms.*` ko=en | — | **91/91** |
| catalog i18n diff | — | **0** |
| `admin.earn.*` | 76/76 | **76/76** (frozen) |
| `admin.casino.*` | 81/81 | **81/81** |
| `admin.operations.*` | 84/84 | **84/84** |
| frozen desk prefixes | — | audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 66 |
| `/admin/cms` | missing | **✅ wired** · FileText · MOCK · shared audit |
| Persist | — | pages-v1 + promos-v1 isolated |
| T9 | — | 7 stores byte-equal ✅ |
| Engine boundary | — | float/rpc/table/JSX ko **0** |

---

## 파일표

| ID | path |
|----|------|
| G1 | `useAdminCmsDeskMock.ts` — **2× `createAdminMockHook`** |
| G2 | `CmsDeskHub.tsx` — tabs · **shared audit trail** |
| G3 | `src/components/admin/cms/CmsPagesQueue.tsx` |
| G4 | `src/components/admin/cms/CmsPromosQueue.tsx` |
| G5 | `src/components/admin/cms/__tests__/CmsDesk.test.tsx` |
| G6 | `ImportedAdminCmsPage.tsx` + `admin.cms.tsx` — Outlet · noindex |
| G7 | i18n append · `admin.nav.cms` · `admin.cms.*` · **`seo.adminCms.*`** |
| G8 | `ImportedAdminShell.tsx` · `AdminBottomNav.tsx` — nav `/admin/cms` (FileText icon) |

**DELETE 0**

---

## Tests (≥10 · G5)

| # | assert |
|---|--------|
| T1 | SEED bucket mins — pages ≥10 · promos ≥8 |
| T2 | pages filter locale/status/search |
| T3 | promos filter surface/status |
| T4 | `publishPage` draft→published · audit logged · **subject=pageKey** |
| T5 | `archivePage` reason `<4` throws |
| T6 | `endPromoEarly` reason `<4` throws · ≥4 succeeds |
| T7 | bulk publish/archive gates |
| T8 | audit **subject = pageKey \| promoKey** (not row id) |
| T9 | **7 stores** byte-equal: operations · casino · earn · users · wallet · audit · alerts |
| T10 | MOCK chip · nav entry render |
| T11 | CMS scope · 0 parseFloat/Number |

---

## NO-TOUCH

All wired admin hooks · `/admin/settings` stub (separate slice) · P0 · user Home/Casino/Earn/Trade routes · FROZEN games · rpc/supabase · ZIP

---

## i18n

**Append:** `admin.nav.cms` · `admin.cms.*` · **`seo.adminCms.*`** · audit keys

ko=en DIFF=0 · **earn 76 · casino 81 · operations 84 · audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 66 unchanged**

---

## LOCK Footer G1–G7

| # | 고정 |
|---|------|
| G1 | cms persist keys only · cross-desk write 0 · i18n file runtime write 0 |
| G2 | both tabs 6요소 · reason ≥4 archive/end/restore |
| G3 | MOCK chip + nav `/admin/cms` |
| G4 | pages SEED ≥10 · promos SEED ≥8 |
| G5 | admin scope **+10** (101→≥111) |
| G6 | F-prefix i18n counts frozen |
| G7 | full vitest **≥512/516** (4 NO-TOUCH) |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 G1 · 2 G3 · 3 G4 · 4 G2+G6 · 5 G8 nav · 6 G7 i18n · 7 G5 tests · 8 §GREEN + 9b-G

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/cms/__tests__/
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
rg -c '"admin\.cms\.' src/i18n/ko.ts src/i18n/en.ts
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

rg -nE 'parseFloat|Number\(' src/components/admin/cms/ src/hooks/admin/useAdminCmsDeskMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/cms/ src/hooks/admin/useAdminCmsDeskMock.ts
rg -n '<table' src/components/admin/cms/
rg -n '[가-힣]' src/components/admin/cms/ src/hooks/admin/useAdminCmsDeskMock.ts
```

**§GREEN template:**

```text
L1-15-G §GREEN — CMS desk Pages+Promos 6요소 · useAdminCmsDeskMock · vitest N/N (admin scope +10) · admin.cms.* P/P · desk i18n frozen · cross-store 0 · float/rpc 0 · 9b-G PASS · F/E/H/I/B/D/C/sports/wallet/casino/earn 회귀 0.
```

**Next LOCK DRAFT:** [`LOVABLE_ADMIN_J_RBAC_ACCESS_LOCK.md`](LOVABLE_ADMIN_J_RBAC_ACCESS_LOCK.md) · operator ZIP GO (post-J §GREEN)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 EXECUTE — F §GREEN carry · L1-15-G EXECUTE GO dispatch |
| 2026-06-17 | Plan APPROVE — shared audit · seo.adminCms · T9 7-store · EXECUTE Step 1→ |
| 2026-06-17 | **§GREEN** — vitest 513/517 · cms 11/11 · admin.cms 91 · 9b-G PASS |

---

*Lovable canvas only · PHONARA repo EXECUTE 0 · ZIP = operator explicit GO*
