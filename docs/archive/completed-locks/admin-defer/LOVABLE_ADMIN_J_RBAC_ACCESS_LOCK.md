# LOVABLE Admin RBAC · Hotkeys · Cmd+K LOCK — L1-15-J v0.1 EXECUTE

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-J PASS · **admin wave FINALE** · ZIP defer  
> **작성:** 2026-06-17 · L1-15-G §GREEN carry  
> **큐 ID:** **L1-15-J** (RBAC · saved filters · Cmd+K · `/admin/settings` · `/admin/mfa` · Lovable 전용)  
> **의존:** L1-15-P0 §GREEN · **P0-3 `enableHotkeys` defer 해제** · B~G §GREEN · wired desks **impl 0-touch**  
> **상위:** [`LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md`](LOVABLE_ADMIN_P0_PRIMITIVES_LOCK.md)

---

## Operator carry (Plan ACK · impl 고정)

| # | 고정 |
|---|------|
| C1 | Settings hub file = **`AccessSettingsHub.tsx`** (not SettingsDeskHub) |
| C2 | Persist keys = **`phonara-admin-rbac-v1`** · **`phonara-admin-filters-v1`** · **`phonara-admin-mfa-policy-v1`** |
| C3 | T10 byte-equal **9 sibling stores** (operations · casino · earn · cms · +5 desk stores) |
| C4 | i18n append **`seo.adminSettings.*`** · **`seo.adminMfa.*`** + nav reuse |
| C5 | Cmd+K = Raycast-grade density · **NOT** generic shadcn clone smell |
| C6 | J10 shell-only mount palette+hotkey · BottomNav Settings+MFA icons append |

**FAIL =** persist key rename drift · hotkey on user routes · B~G impl touch · ZIP before operator GO.

---

## Scope (1줄)

Admin wave **finale:** shell **Cmd+K** + **hotkey layer** · `/admin/settings` (**RBAC roles** + **saved filter presets** · 탭당 6요소) · `/admin/mfa` (**MFA policy** 6요소) · **`useAdminAccessDeskMock`** · rpc/supabase 0 · **user app routes hotkey 0**.

---

## §Visual References (pattern only)

- openbet-core-shell — admin settings IA
- rt-commission-dashboard — role/tier table density
- shadcn Command palette pattern (visual only · **cmdk import OK if already in canvas** · no new heavy deps)
- Internal carry: P0 primitives · `CmsDeskHub` tab pattern · `UsersDeskHub` RBAC tone

---

## Platform boundary

| Layer | 역할 | FAIL |
|-------|------|------|
| **Cmd+K / hotkeys** | `/admin/*` shell only | `/wallet` `/casino` `/sports` `/earn` listener leak |
| **RBAC desk** | mock role matrix · route allow display | real auth/RPC invent |
| **Saved filters** | persist preset blobs per deskKey | mutate other desk hook impl |
| **MFA desk** | policy toggle mock | Supabase MFA wire |

**FAIL =** B~G hook impl edit · desk storage write from access mock · `enableHotkeys` forced true on user routes

---

## Three surfaces (1 slice)

### J-A Shell — Cmd+K + hotkeys

| # | 구현 |
|---|------|
| palette | `AdminCommandPalette` — `Meta+K` / `Ctrl+K` · fuzzy search admin nav routes + quick actions (mock toast) |
| provider | `AdminHotkeyProvider` wraps `ImportedAdminShell` children · sets `enableHotkeys={true}` context for admin desks |
| scope | listeners register only when pathname starts with `/admin` |
| MOCK | palette footer chip optional · **admin shell only** |

**Cmd+K route list (min):** overview · queues · users · sports · audit · alerts · operations · casino · earn · cms · settings · mfa

### J-B `/admin/settings` — 2 tabs · each 6요소

#### Tab RBAC Roles

| # | 구현 |
|---|------|
| metrics | 4× — total roles · active members (string) · restricted routes count · last change |
| filter | roleKey chip · search label |
| table | `AdminDataTable<AdminRbacRoleRow>` sortable `memberCount` |
| row | Toggle route bundle (drawer) · Disable role (reason ≥4) |
| audit | `admin.access.rbac.audit.*` |
| bulk | bulk Disable roles (reason ≥4) |

#### Tab Saved Filters

| # | implement |
|---|------|
| metrics | 4× — preset count · desks covered · default preset · stale count |
| filter | deskKey chip · search name |
| table | `AdminSavedFilterRow` sortable `updatedAt` |
| row | Apply (preview toast) · Delete (reason ≥4) |
| audit | `admin.access.filters.audit.*` |
| bulk | bulk Delete (reason ≥4) |

MOCK chip — settings hub header (shared)

### J-C `/admin/mfa` — 6요소

| # | 구현 |
|---|------|
| metrics | 4× — tiers required · optional · grace active · pending enroll |
| filter | tier · required chip |
| table | `AdminMfaPolicyRow` sortable `tierKey` |
| row | Require MFA · Relax (reason ≥4) |
| audit | `admin.mfa.audit.*` |
| bulk | bulk Require · bulk Relax (reason ≥4) |
| MOCK chip | ✅ |

---

## Types

```ts
type AdminRbacRoleRow = {
  id: string;
  roleKey: 'owner' | 'finance' | 'risk' | 'support' | 'operator' | 'viewer';
  labelKey: string;
  memberCount: string;
  routesSummary: string;
  enabled: boolean;
  updatedAt: string;
};

type AdminSavedFilterRow = {
  id: string;
  deskKey: string;
  presetName: string;
  filterBlob: string;
  isDefault: boolean;
  updatedAt: string;
};

type AdminMfaPolicyRow = {
  id: string;
  tierKey: string;
  mfaRequired: boolean;
  graceDays: string;
  enrollRate: string;
  updatedAt: string;
};
```

---

## SEED (J1 hook)

### RBAC roles SEED = **6** (all roleKeys)

`memberCount` strings · ≥2 `enabled: false` · routesSummary display only

### Saved filters SEED ≥ **8**

deskKeys sample: `wallet-withdraw` · `compliance-kyc` · `users-desk` · `sports-unsettled` · `casino-catalog` · `earn-agents` · `cms-pages` · `operations-kill`

### MFA policies SEED ≥ **6**

tier keys align user tier ladder mock · ≥3 required · ≥2 optional · ≥1 graceDays `"0"`

- Persist: **`phonara-admin-rbac-v1`** · **`phonara-admin-filters-v1`** · **`phonara-admin-mfa-policy-v1`**
- **Never write** B~G desk keys
- Audit `subject = roleKey | presetName | tierKey`
- reason `<4` → **throw**

---

## Baseline (G §GREEN 후 · EXECUTE 전 → §GREEN)

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest full | 513/517 | **525/529** · 4 fail NO-TOUCH |
| access tests | — | **12/12** |
| admin scope | ≥111 | **≥123** (J5 ✓) |
| i18n append | — | **123 keys** ko=en · DIFF **0** |
| `admin.cms.*` | 91/91 | **91/91** (frozen) |
| frozen desk prefixes | — | earn 76 · casino 81 · operations 84 · audit 27 · alerts 33 · users 45 · compliance 88 · wallet 51 · sports 66 |
| Cmd+K / hotkeys | P0-3 defer | **admin `/admin*` only** · 12 routes |
| `/admin/settings` · `/admin/mfa` | stub | **✅ wired** |
| Persist | — | 3 keys only · **9 sibling stores** T10 ✅ |
| Engine boundary | — | float/rpc/table/JSX ko **0** |
| ZIP | defer | **awaiting operator GO** |

---

## 파일표

| ID | path |
|----|------|
| J1 | `src/hooks/admin/useAdminAccessDeskMock.ts` |
| J2 | `src/components/admin/access/AdminCommandPalette.tsx` |
| J3 | `src/components/admin/access/AdminHotkeyProvider.tsx` |
| J4 | `AccessSettingsHub.tsx` — tabs RBAC \| Saved Filters · MOCK · shared audit |
| J5 | `src/components/admin/access/RbacRolesQueue.tsx` |
| J6 | `src/components/admin/access/SavedFiltersQueue.tsx` |
| J7 | `src/components/admin/access/MfaPolicyHub.tsx` |
| J8 | `src/components/admin/access/__tests__/AdminAccess.test.tsx` |
| J9 | `ImportedAdminSettingsPage.tsx` · `ImportedAdminMfaPage.tsx` · routes |
| J10 | `ImportedAdminShell.tsx` — wrap HotkeyProvider + palette |
| J11 | `src/i18n/ko.ts` · `en.ts` — `admin.access.*` · `admin.mfa.*` · `admin.command.*` · nav keys reuse |

**DELETE 0** · **B~G desk file impl 0-touch**

---

## Tests (≥12 · J8)

| # | assert |
|---|--------|
| T1 | RBAC SEED 6 roleKeys |
| T2 | saved filters SEED ≥8 |
| T3 | MFA SEED ≥6 |
| T4 | Cmd+K opens · route item count ≥10 |
| T5 | hotkey provider **inactive** outside `/admin` pathname mock |
| T6 | disable role reason `<4` throws |
| T7 | delete filter reason `<4` throws |
| T8 | relax MFA reason `<4` throws |
| T9 | audit subject stable string |
| T10 | **9 sibling stores** byte-equal after access mutations |
| T11 | MOCK chips settings + mfa |
| T12 | 0 parseFloat/Number in access scope |

---

## NO-TOUCH

B~G hook **impl** · all wired desk pages · user routes · FROZN games · rpc/supabase · ZIP (operator explicit GO only)

---

## i18n

Append `admin.access.*` · `admin.mfa.*` · `admin.command.*` · **`seo.adminSettings.*`** · **`seo.adminMfa.*`** · reuse `admin.nav.settings` · `admin.nav.mfa`

ko=en DIFF=0 · **cms 91 · earn 76 · casino 81 · operations 84 · frozen desk prefixes unchanged**

---

## LOCK Footer J1–J7

| # | 고정 |
|---|------|
| J1 | access persist keys only · cross-desk write 0 · user hotkey leak 0 |
| J2 | settings 2 tabs + mfa each 6요소 · Cmd+K wired |
| J3 | MOCK chips settings + mfa |
| J4 | RBAC 6 roles · filters ≥8 · MFA ≥6 SEED |
| J5 | admin scope **+12** (≥111→≥123) |
| J6 | G-prefix frozen |
| J7 | full vitest **≥524/528** · **admin wave complete** |

---

## EXECUTE Steps 0→8

0 LOCK ACK · 1 J1 · 2 J2–J3 shell · 3 J5–J6 · 4 J7 · 5 J4+J9 · 6 J10+J11 i18n · 7 J8 tests · 8 §GREEN + 9b-J

---

## §GREEN full block

```bash
bunx vitest run src/components/admin/access/__tests__/
bunx vitest run src/components/admin/cms/__tests__/
bunx vitest run src/components/admin/earn/__tests__/
bunx vitest run src/components/admin/casino/__tests__/
bunx vitest run src/components/admin/operations/__tests__/
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run wallet
bunx vitest run sports

rg -c '"admin\.access\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.mfa\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.command\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.cms\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.earn\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.casino\.' src/i18n/ko.ts src/i18n/en.ts
rg -c '"admin\.operations\.' src/i18n/ko.ts src/i18n/en.ts
diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)

rg -nE 'parseFloat|Number\(' src/components/admin/access/ src/hooks/admin/useAdminAccessDeskMock.ts
rg -nE 'supabase|rpc_|service_role' src/components/admin/access/
rg -n '<table' src/components/admin/access/
rg -n '[가-힣]' src/components/admin/access/
```

**§GREEN template:**

```text
L1-15-J §GREEN — RBAC+filters+Cmd+K+MFA · admin wave FINALE · vitest N/N (admin scope +12) · admin.access.* + admin.mfa.* + admin.command.* · desk i18n frozen · user hotkey 0 · 9b-J PASS · B~G 회귀 0 · operator ZIP GO defer.
```

**Post-J:** L1-15-UX-Plain ✅ §GREEN → **L1-16~18** (World Crush) → operator 「ZIP 발행 GO」→ L2 paste

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 EXECUTE — G §GREEN carry · admin wave finale |
| 2026-06-17 | Plan APPROVE — AccessSettingsHub · persist key names · T10 4-store · seo · EXECUTE Step 1→ |
| 2026-06-17 | **§GREEN** — vitest 525/529 · access 12/12 · admin wave FINALE · 9b-J PASS · ZIP defer |

---

*Lovable canvas only · PHONARA repo EXECUTE 0 · ZIP = operator explicit GO*
