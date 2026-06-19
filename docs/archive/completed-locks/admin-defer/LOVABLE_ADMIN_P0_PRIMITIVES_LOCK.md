# LOVABLE Admin Primitives LOCK — L1-15-P0 v0.2

> **상태:** **§GREEN ✅** · 2026-06-17 · operator 9b-P0 PASS · ZIP/paste defer  
> **작성:** 2026-06-17 · **L1-15-AUDIT v0.2** (operator session) carry  
> **큐 ID:** **L1-15-P0** (Admin Primitives Library + Sports Desk refactor · Lovable 전용 · Cursor UI 0)  
> **의존:** **L1-15-A-M-fix** §GREEN (9b-Mh PASS) · canvas 정본 carry · **L1-P2-M** §GREEN (operator 선택 defer 시 생략)  
> **상위:** [`LOVABLE_ADMIN_SPORTS_DESK_LOCK.md`](LOVABLE_ADMIN_SPORTS_DESK_LOCK.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md)

---

## Scope (1줄)

Lovable admin canvas에 **공용 primitive 8 + mock hook factory 1** 신규 · **Sports Desk를 reference impl로 refactor** · Overview MOCK chip 추가 — **mock/display-only** · **rpc/supabase invent 0** · paste 후 Cursor adapter merge.

---

## §1 Header · 역할 분리

| 구역 | 소유 | 금지 |
|------|------|------|
| Admin primitives + Sports refactor | **Lovable canvas** | Cursor `apps/admin` 화면 신규 작성 |
| Paste / adapter | **Cursor** | presentation 1:1 · shim · `@phonara/ui` merge |
| Engine RPC | **PHONARA** (S1–S22 GREEN) | Lovable migration/RPC invent |

**FAIL =** Cursor에서 primitive 또는 admin desk를 직접 구현 · Lovable ZIP 없이 `apps/admin` UI 추가.

**Baseline (M-fix §GREEN 후 · EXECUTE 전 실측 기록):**

| 항목 | EXECUTE 전 | **§GREEN (2026-06-17)** |
|------|------------|-------------------------|
| vitest (full suite) | 22/22 admin scope | **428/428** · gold-rush/mint-reels 4 fail = pre-P0 baseline NO-TOUCH |
| vitest admin scope | — | **23/23** (12 primitive + 5 Sports hook + 6 UnsettledFixturesTable) |
| `admin.*` ko=en | **126/126** | **152/152** |
| `admin.primitive.*` | — | **17/17** |
| `wallet.*` | **94/94** | **94/94** |
| `sports.*` / nav.sports | **66/66** | **66/66** |
| Sports Desk 6요소 | ~70% | **reference impl ✅** |

---

## §2 UX 5원칙 LOCK (모든 후속 head 공통 게이트)

audit v0.2 operator UX 원칙 — **L1-15-B ~ J 전부 동일 적용**.

| # | 원칙 | 적용 규칙 | FAIL |
|---|------|-----------|------|
| U1 | **단순 우선** | 1 surface = 1 above-fold 핵심 작업 (Sports = unsettled queue) · 부가 정보 = detail drawer/expand · md+ sidebar **9 nav** · mobile **AdminBottomNav 5** 유지 | above-fold 2+ primary 작업 |
| U2 | **비복잡** | primary action ≤ 2 · 폼 필드 ≤ 5 (초과 = step) · **토큰 색상만** (raw hex 0) · 차트 = sparkline/tabular-nums (full chart lib defer) | raw hex · Recharts 등 full lib |
| U3 | **기능 100%** | 각 desk = **6요소 전부** (아래 §3) — 빈 stub 금지 | 6요소 중 1개라도 missing |
| U4 | **일관성** | 모든 desk = `AdminQueueSection` + `AdminDataTable` + `AdminReasonDialog` + `AdminAuditTrail` 소비 | surface별 인라인 table 600L |
| U5 | **MOCK 표시** | mock desk 헤더 **MOCK chip 필수** (operator/투자자 혼동 방지) | MOCK chip 없는 mock surface |

**긴장 완화 (U1 × U3):** above-fold = **1 핵심 작업** · 나머지 5요소는 **drawer/expand/section below-fold**에 배치 — “단순 화면 + 필요 기능 100%” 동시 달성.

**hotkey/Cmd+K:** **L1-15-J defer** — primitive에 `enableHotkeys?: boolean` optional prop만 예약 · **FAIL = J 전 전 desk full hotkey 강제**.

---

## §3 Sports Desk 6요소 reference checklist (P0 §GREEN gate)

P0 완료 시 `/admin/sports` unsettled queue surface가 **6요소 mock 작동 visible** — B~J desk reference impl.

| # | 요소 | P0 구현 | primitive |
|---|------|---------|-----------|
| 1 | **filter** | league/status search **1 field** | `AdminFilterBar` |
| 2 | **queue table** | unsettled fixtures rows · sortable · tabular-nums | `AdminDataTable` |
| 3 | **row action** | single-row suspend CTA | row action slot |
| 4 | **reason** | suspend confirm · **≥ 4자** gate | `AdminReasonDialog` |
| 5 | **audit trail** | suspend/toggle inline tail (mock append-only) | `AdminAuditTrail` |
| 6 | **bulk** | multi-select → bulk suspend + reason | `AdminBulkActionBar` |

**보조 (6요소 외 · P0 scope):**

- `AdminDetailDrawer` — row click → fixture detail side panel
- `AdminQueueSection` — sticky header + count badge + 예외 우선 ordering hint + MOCK chip slot
- `AdminMetricCard` — Exposure 3-card refactor

**수동 9b-P0 — 6요소 visible 확인 (operator 60초):**

1. filter 입력 → table rows 필터됨 (mock)
2. row suspend → reason dialog ≥4자 → toast/mock state
3. 2+ row select → bulk bar sticky → bulk suspend + reason
4. audit trail에 suspend 이벤트 1행+ append
5. row → detail drawer open/close

**FAIL =** 6요소 중 1개 mock 동작 불가 · Sports 시각/행동 회귀 (refactor 외 diff).

---

## §4 파일표 (NEW 9 · EDIT 4)

### NEW — `src/components/admin/primitives/`

| # | path | 책임 |
|---|------|------|
| N1 | `AdminQueueSection.tsx` | sticky header · count badge · 예외 우선 hint · MOCK chip slot · children slot |
| N2 | `AdminDataTable.tsx` | generic column def · sortable · tabular-nums · `overflow-x-auto` + `min-w-0` · empty slot · `<md` card row variant hook |
| N3 | `AdminFilterBar.tsx` | search · date (optional defer prop) · multi-select chip |
| N4 | `AdminDetailDrawer.tsx` | row → side panel · Sheet 기반 · primary action ≤ 2 |
| N5 | `AdminBulkActionBar.tsx` | selection ≥ 1 · sticky bottom-of-section · reason gate 연동 |
| N6 | `AdminReasonDialog.tsx` | reason **≥ 4자** · confirm/cancel · danger/primary tone |
| N7 | `AdminAuditTrail.tsx` | inline append-only list · actor/time/reason mock rows |
| N8 | `AdminMetricCard.tsx` | label/value/delta/tone · tabular-nums |

### NEW — hook factory

| # | path | 책임 |
|---|------|------|
| N9 | `src/hooks/admin/createAdminMockHook.ts` | `{ seed, storageKey, hydrate }` 계약 · hydration-safe SOT · B~J mock hook 표준 |

**`createAdminMockHook` 계약 (고정):**

```ts
type AdminMockHookConfig<TRow, TFilters> = {
  storageKey: string;
  seedRows: TRow[];
  getServerSnapshot: () => TRow[]; // always SEED
  filterFn?: (rows: TRow[], filters: TFilters) => TRow[];
};
// Returns: { rows, filters, setFilters, patchRow, appendAudit, hydrated }
```

### EDIT — Sports Desk + Overview

| # | path | 작업 |
|---|------|------|
| E1 | `src/components/admin/sports/MarketSuspendDialog.tsx` | `AdminReasonDialog` 래핑 · **외부 props API 호환** (breaking 0) |
| E2 | `src/components/admin/sports/UnsettledFixturesTable.tsx` | `AdminQueueSection` + `AdminDataTable` + filter + bulk + drawer |
| E3 | `src/components/admin/sports/ExposureDashboard.tsx` | `AdminMetricCard` × 3 |
| E4 | `src/components/pages/ImportedAdminOverviewPage.tsx` | `AdminMetricCard` + **MOCK chip** on KPI header |

### NEW — tests

| # | path | 작업 |
|---|------|------|
| T1 | `src/components/admin/primitives/__tests__/AdminPrimitives.test.tsx` | **≥ 8** unit cases (ReasonDialog ≥4 · BulkBar visibility · Filter · Table empty · Audit append · MetricCard · QueueSection MOCK slot · createAdminMockHook hydration) |
| T2 | `src/components/admin/sports/__tests__/SportsDesk.test.tsx` | 6요소 integration smoke · **기존 22 PASS 유지** |

**DELETE 0** · 라우트 파일명 0 · `useAdminSportsMock` SOT 행동 변경 0 (refactor wiring only).

---

## §5 PHONARA paste memo (adapter merge 전제)

Lovable canvas = mock SOT · paste = presentation 1:1 + **기존 PHONARA 엔진 admin과 merge** (read-only audit v0.1/v0.2 carry).

| Lovable primitive | paste 시 수렴 | FAIL |
|-------------------|---------------|------|
| `AdminDataTable` | presentation wrapper · data layer = `@phonara/ui` `DataTable` **shim/재export** | duplicate table engine in apps/admin |
| `AdminMetricCard` | PHONARA 동명 존재: `apps/admin/src/components/admin-metric-card.tsx` — **visual 1:1 paste · impl merge** | 두 개 AdminMetricCard 영구 공존 |
| `AdminReasonDialog` | minLength **4** · paste 후 `AdminActionDialog`(non-empty only)와 **단일 primitive** | reason gate 불일치 |
| `createAdminMockHook` | paste 후 RPC adapter: hook 계약만 교체 · **surface 재작성 0** | desk마다 fetch 재작성 |
| `AdminQueueSection` etc. | `apps/admin/src/components/admin/` presentation zone | `@phonara/ui`에 business logic 유입 |

**PHONARA 엔진 admin (paste 전 · no-touch):** `apps/admin` queues/alerts/audit/operations는 **RPC wired** — Lovable mock desk paste 시 **adapter wire(L2-A-W)** 로 연결 · Lovable EXECUTE 중 PHONARA repo **0-touch**.

---

## §6 Gates (G1 · G2 · G3 · UX 5 · F1–F5)

### EXECUTE GO 전

| # | 게이트 | 상태 | FAIL |
|---|--------|------|------|
| G1 | **L1-15-A-M-fix** §GREEN · 9b-Mh PASS | ⏳ operator manual | M-fix 미PASS 시 P0 EXECUTE |
| G2 | operator 「**L1-15-P0 EXECUTE GO**」 | ⏳ | Plan/LOCK만으로 GO |
| G2b | **L1-P2-M** §GREEN (게임 bet dock) | operator **defer 허용** | defer 시 G1만 충족하면 GO |
| G3 | L1-15-A Sports Desk §GREEN 유지 | ✅ carry | Sports desk 삭제/축소 |

**G2b operator 정책 (2026-06-17):** admin gap fill 우선 시 **P2-M defer** · standing queue = `M-fix → P0 → B → …`

### §GREEN carry (G1 numeric)

| 항목 | EXECUTE 전 | P0 §GREEN 목표 |
|------|------------|----------------|
| vitest | 22/22 | **30+/30+** |
| `admin.*` | 126/126 | **~141/141** (+ `admin.primitive.*` ~15) |
| `wallet.*` | 94/94 | **94/94** |
| `sports.*` | 66/66 | **66/66** |

### LOCK Footer F1–F5 (carry · L1-15-A)

| # | 고정 | FAIL |
|---|------|------|
| F1 | mock SOT = `useAdminSportsMock` + `createAdminMockHook` · localStorage only | supabase/rpc invent |
| F2 | suspend reason **≥ 4자** · bulk 동일 | reason 3자 이하 confirm |
| F3 | MOCK chip 모든 mock desk header | Overview MOCK 누락 |
| F4 | money/odds = **string display props** · `parseFloat`/`Number()` 산술 0 | float odds/money |
| F5 | hydration: `getServerSnapshot` = SEED always | console hydration mismatch |

### UX 5 self-check (P0 §GREEN)

| # | 검증 |
|---|------|
| U1 | Sports above-fold = unsettled queue only · exposure/risk = below-fold or mobile tab |
| U2 | Overview primary action ≤ 2 · primitive 내 raw hex 0 |
| U3 | §3 6요소 checklist 전부 mock visible |
| U4 | Sports가 primitives 소비 (인라인 `<table>` 잔존 0) |
| U5 | `/admin` Overview + Sports queue header MOCK chip |

---

## i18n (append only)

prefix: `admin.primitive.*` · **~15 keys** · ko=en 동시 append · rename/delete 0.

후보 (Step 6 pre-grep · hit 시 skip):

```text
admin.primitive.mockChip
admin.primitive.filter.searchPlaceholder
admin.primitive.filter.clear
admin.primitive.table.empty
admin.primitive.table.sortAsc / .sortDesc
admin.primitive.reason.title / .label / .placeholder / .minLength
admin.primitive.bulk.selected / .suspend / .clearSelection
admin.primitive.audit.title / .empty / .col.actor / .col.time / .col.action
admin.primitive.drawer.close
admin.primitive.queue.count / .priorityHint
```

기존 `admin.sports.*` · `admin.nav.*` · M-fix 11키 **touch 0**.

---

## NO-TOUCH

- user `/wallet` · `/sports` · user `BottomNav` · `BetSlip*` · wallet vitest/sports vitest behavior
- `useAdminSportsMock` mock row semantics · `mocks/*.json` seed counts
- `rpc_*` / `supabase` / `service_role` / migration
- L1-15-A-M shell: `AdminBottomNav` · `ImportedAdminShell` layout diff 0 (Sports child refactor only)
- JSX 한글 literal 0
- ZIP / paste (operator 최종 1회 GO)

---

## EXECUTE 순서 (single shot · v0.2 정본)

### Step 0 — LOCK ACK

- G1: M-fix 9b-Mh PASS carry ✅ · G2b: P2-M defer ✅ · F1–F5 carry · UX 5 (U1–U5)
- NO-TOUCH: `useAdminSportsMock` SOT semantics 0 (bulk = UI 루프) · `useWalletMock` 0 · `mocks/*.json` 0 · BottomNav/Shell layout 0 · 라우트 0 · supabase/rpc 0
- Sports 6요소 = §3 reference + 보조 (detail drawer · metric card)

### Step 1 — NEW N1–N8 + barrel (`src/components/admin/primitives/`)

| # | 파일 | API 요약 |
|---|------|----------|
| N1 | `AdminQueueSection.tsx` | `{ title · count · severity?: 'warn'\|'crit' · subtitle? · mockChip?: boolean · actions? · children }` — sticky header · Badge count · MOCK chip · `overflow-hidden rounded-xl border bg-card` |
| N2 | `AdminDataTable.tsx` | 제네릭 `<T>{ columns: AdminColumn<T>[] · rows · rowKey · onRowClick? · selection?: { selected: Set<string> · onToggle · onToggleAll } · empty? · enableHotkeys?: boolean }` · `tabular-nums` · `overflow-x-auto` · `min-w-[640px] md:min-w-0` · sortable columns · selection checkbox prepend |
| N3 | `AdminFilterBar.tsx` | `{ search · onSearchChange · placeholder · chips?: {label,value,active,onToggle}[] · onReset? }` — Input + chip + reset · mobile stack · md+ row |
| N4 | `AdminDetailDrawer.tsx` | `{ open · onOpenChange · title · description? · children }` — Sheet `side="right"` md+ / `bottom` <md · max-h + overflow-y-auto |
| N5 | `AdminBulkActionBar.tsx` | `{ count · actionLabel · onConfirm: (reason)=>void · disabled? · variant? · reasonMinLength?=4 }` — count≥1 sticky · → `AdminReasonDialog` |
| N6 | `AdminReasonDialog.tsx` | `{ open · onOpenChange · title · description? · subjectLabel? · confirmLabel? · minLength?=4 · variant? · onConfirm }` — Textarea · trim≥minLength · `data-testid="reason-confirm"`/`reason-input` · open 시 reset · F2 |
| N7 | `AdminAuditTrail.tsx` | `{ events: AdminAuditEvent[] · emptyLabel? }` · `{ id · at · actorKey · actionKey · subject? · reason? }` — divide-y · relativeTime |
| N8 | `AdminMetricCard.tsx` | `{ label · value: string · delta? · tone?: 'primary'\|'warn'\|'crit' · srLabel? }` — tabular-nums · semantic 토큰만 |
| — | `primitives/index.ts` | barrel 8 + `AdminColumn<T>` · `AdminAuditEvent` |

규칙: raw hex 0 · JSX 한글 0 · parseFloat/Number() 0 · chart lib 0

### Step 2 — NEW N9 `src/hooks/admin/createAdminMockHook.ts`

```ts
export type AdminMockHookConfig<TRow, TFilters> = {
  storageKey: string;
  seedRows: TRow[];
  seedFilters: TFilters;
  filterFn?: (rows: TRow[], filters: TFilters) => TRow[];
};
export type AdminMockHookResult<TRow, TFilters> = {
  rows: TRow[]; allRows: TRow[]; filters: TFilters;
  setFilters: (f: TFilters | ((p: TFilters) => TFilters)) => void;
  patchRow: (key: string, mut: (r: TRow) => TRow, keyOf: (r: TRow) => string) => void;
  appendAudit: (e: AdminAuditEvent) => void; audit: AdminAuditEvent[];
  hydrated: boolean; resetForTest: () => void;
};
export function createAdminMockHook<TRow, TFilters>(
  cfg: AdminMockHookConfig<TRow, TFilters>,
): () => AdminMockHookResult<TRow, TFilters>;
```

- `useSyncExternalStore` + module store (mirrors `useAdminSportsMock`)
- `getServerSnapshot` always SEED · localStorage hydrate in `useEffect` only (F5)
- `appendAudit` prepend · cap 50
- P0: factory **export only** · Sports hook migrate optional (P0-5)

### Step 3 — EDIT E1–E4

**E1 `MarketSuspendDialog.tsx`** — thin wrapper → `AdminReasonDialog` · 외부 props/testid 호환 (`suspend-reason`/`suspend-confirm` alias) · `suspendMarket` + toast 동일

**E2 `UnsettledFixturesTable.tsx`** — 6요소:

1. `AdminFilterBar` — search home/away/league · chips status live/ft/scheduled
2. `AdminQueueSection` + `AdminDataTable<SportsFixtureRow>` — 7 cols carry · selection · sortable unsettledMarkets/exposure/kickoff
3. row suspend (carry)
4. reason via E1 wrapper ≥4자
5. `AdminAuditTrail` — `suspended[]` → audit events (`admin.sports.audit.suspend` · subject=fixtureId)
6. `AdminBulkActionBar` — selected ids → `suspendMarket(id, reason)` loop (SOT 0)

보조: row click → `AdminDetailDrawer` · MOCK chip = `SportsDeskHub` header only (중복 0)

**E3 `ExposureDashboard.tsx`** — `AdminMetricCard` ×3 · `formatKrwGrouped` carry

**E4 `ImportedAdminOverviewPage.tsx`** — KPI → `AdminMetricCard` ×3 · MOCK chip `data-testid="mock-chip"`

### Step 4 — TESTS

**T1 `AdminPrimitives.test.tsx`** — ≥8 (목표 11):

1. ReasonDialog <4 disabled · 2. ≥4 confirm+trim · 3. open reset · 4. DataTable rows+rowKey · 5. selection toggle/all · 6. empty slot · 7. BulkBar count=0 hidden · 8. BulkBar confirm+reason · 9. MetricCard tone tokens · 10. AuditTrail empty/events · 11. createAdminMockHook SEED/filters/patch/audit

**T2 `SportsDesk.test.tsx`** — 22 carry + 6요소 smoke (filter · chip · bulk suspend · audit row · drawer · reason 4자) → **30+ PASS**

### Step 5 — i18n append

`admin.primitive.*` + sports filter/bulk/detail keys · ko=en 동시 · pre-grep · `admin.nav.*` / 기존 `admin.sports.*` / M-fix 11키 touch 0

후보:

```text
admin.primitive.search.placeholder · .reset · .bulk.confirm · .bulk.cancel
admin.primitive.reason.label · .placeholder · .hint
admin.primitive.audit.empty · .audit.actor.system
admin.primitive.table.selectAll · .selectRow · .empty
admin.primitive.detail.close · .mock
admin.sports.audit.suspend · .filter.status.live · .ft · .scheduled
admin.sports.bulk.suspend.label · .detail.title
```

### Step 6 — vitest 30+/30+

### Step 7 — §7 §GREEN full block (아래)

### Step 8 — operator 9b-P0 manual PASS 1줄

### NO-TOUCH (EXECUTE 전체)

- user `/wallet/*` `/sports/*` BottomNav BetSlip* · mocks · supabase/rpc
- `useAdminSportsMock.ts` actions 추가 0 · `useWalletMock.ts` 0
- `AdminBottomNav` · `ImportedAdminShell` · `SportsDeskHub` · `SportsDeskTabs` · `FeatureSportsToggle` · `RiskEventsPanel` 0
- 라우트 · ZIP/paste · P2-Games/Crash FROZEN 0

### Slice bar carry

Exchange ops density · above-fold queue only · 6요소 visible · Overview MOCK chip · reason≥4 row+bulk · primitive folder only · user 0-touch

### 보고 (Step 8 후)

§GREEN template 1줄 + 다음 LOCK DRAFT 1줄: **L1-15-B Wallet Desk**

---

## §7 §GREEN full block

```bash
# vitest
bunx vitest run src/components/admin/primitives/__tests__/
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet
bunx vitest run sports
# expect: 30+/30+ cumulative admin+sports+wallet PASS

# i18n parity
rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts
# expect: ko == en (baseline 126 + Δ ~15 = record actual N in §GREEN report)

rg -c '"admin\.primitive\.' src/i18n/ko.ts src/i18n/en.ts
# expect: ko == en (~15)

rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts
# expect: 94/94

rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts
# expect: 66/66

diff <(rg -o '^\s+"[^"]+":' src/i18n/ko.ts|sort) <(rg -o '^\s+"[^"]+":' src/i18n/en.ts|sort)
# expect: empty

# money / engine boundary
rg -nE 'parseFloat|Number\(' src/components/admin/ src/hooks/admin/
# expect: 0

rg -nE 'supabase|rpc_|service_role' src/components/admin/ src/hooks/admin/
# expect: 0

rg -nE '@phonara/money|decimal\.js' src/components/admin/ src/hooks/admin/
# expect: 0

# UX U2 — raw hex
rg -nE '#[0-9a-fA-F]{3,6}' src/components/admin/primitives/
# expect: 0 (theme tokens only elsewhere)

# consistency U4 — Sports inline table removed
rg -n '<table' src/components/admin/sports/UnsettledFixturesTable.tsx
# expect: 0 (AdminDataTable only)

# JSX Korean
rg -n '[가-힣]' src/components/admin/primitives/ src/components/admin/sports/
# expect: 0
```

**수동 9b-P0 (operator 60초):**

- `/admin/sports` desktop 1280 + mobile 360 · **시각/행동 refactor-only** (회귀 0)
- §3 **6요소** mock 동작 visible
- `/admin` Overview KPI **MOCK chip** visible
- `/wallet` · `/sports` user surface 회귀 0

---

## §GREEN template

```text
L1-15-P0 §GREEN — primitives 8 + createAdminMockHook · Sports 6요소 reference · vitest N/N (baseline 22→N) · admin.* ko=en M/M (+admin.primitive.* P/P) · wallet 94 · sports 66 · float/rpc/hex 0 · Overview MOCK chip · 9b-P0 PASS · user wallet/sports 회귀 0.
```

**FAIL =** vitest < 30 · admin/wallet/sports i18n parity 깨짐 · 6요소 미완 · Sports visual regression · float/rpc/hex hit · 9b-P0 미PASS.

---

## §8 Footer · standing queue · defer

### Canvas canonical routes (1줄 고정)

```text
/admin · /admin/queues (plural) · /admin/sports · /admin/users · /admin/alerts · /admin/audit · /admin/operations · /admin/mfa · /admin/settings
```

**FAIL =** `/admin/queue` (singular) 신규 도입 · M-fix BottomNav Queue tab route drift.

### Standing queue (인계 §2 · operator 2026-06-17)

```text
L1-15-A-M-fix §GREEN (9b-Mh)
  → L1-P2-M (optional defer — admin wave 우선)
  → L1-15-P0 (본 LOCK)
  → L1-15-B Wallet Desk
  → L1-15-D Compliance
  → L1-15-C Users
  → L1-15-I Audit + Alerts
  → L1-15-H Operations 2.0 ✅
  → L1-15-E Casino Desk ✅
  → L1-15-F Earn/Referral ✅
  → L1-15-G CMS Desk ✅
  → L1-15-J RBAC · hotkeys · Cmd+K ✅
  → L1-15-UX-Plain ✅ §GREEN (2026-06-17 · 2535/2535 · nav plain)
  → **HEAD: L1-17** Trade split → L1-18 FOMO
  → operator 「ZIP 발행 GO」→ L2 paste (**G-WC1~3 §GREEN 필수**)
```

### LOCK Footer P0-1 ~ P0-6

| # | 고정 |
|---|------|
| P0-1 | Primitives live under `src/components/admin/primitives/` only |
| P0-2 | `AdminReasonDialog` minLength = **4** (F2) |
| P0-3 | `enableHotkeys?: boolean` — **L1-15-J §GREEN** admin shell gate active · user routes **0** |
| P0-4 | Sports refactor **visual/behavior parity** — layout/nav diff 0 |
| P0-5 | `createAdminMockHook` exported for B~J · Sports mock hook migrate **optional** in P0 (defer OK if 6요소 green) |
| P0-6 | Chart library **0** — sparkline = inline SVG only |

### Defer

- ZIP / paste — operator 「ZIP 발행 GO」· Lovable 100% 후 1회
- L1-15-B ~ J — P0 §GREEN 후 1 head씩 EXECUTE GO
- Full chart library — sparkline SVG only
- L1-15-J — hotkey/Cmd+K/saved filters/RBAC tiers
- Sports `useAdminSportsMock` → `createAdminMockHook` full migration — P0 optional · **B head에서 강제 가능**

---

## paste adapter memo (L2 · post-ZIP)

- Cursor: admin primitives ZIP → `apps/admin/src/components/admin/primitives/` · i18n `admin.primitive.*` merge
- `AdminDataTable` → `@phonara/ui` DataTable shim
- `AdminReasonDialog` → merge with `AdminActionDialog`
- Mock hooks → L2-A-W RPC adapters per desk plan

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-17 | v0.1 DRAFT — audit v0.2 UX 5 · 6요소 checklist · paste memo · §GREEN full block |
| 2026-06-17 | v0.2 EXECUTE — Step 0→8 API 정본 · operator EXECUTE GO single shot |
| 2026-06-17 | **§GREEN** — vitest 428/428 · admin scope 23/23 · admin.* 152 · primitive.* 17 · 9b-P0 PASS |

---

*Lovable canvas only · 본 LOCK = doc only until operator `L1-15-P0 EXECUTE GO` · ZIP = operator explicit GO*
