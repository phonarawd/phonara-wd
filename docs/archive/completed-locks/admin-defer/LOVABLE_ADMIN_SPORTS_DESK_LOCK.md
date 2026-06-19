# LOVABLE Admin Sports Desk LOCK — L1-15-A `apps/admin` presentation mock v0.2

> **상태:** L1-15-A §GREEN ✅ · **L1-15-A-M** mobile AMEND EXECUTE 0  
> **갱신:** 2026-06-16 · operator 모바일·메뉴탭 피드백  
> **큐 ID:** **L1-15-A** (Admin Sports Desk · Lovable 전용 · Cursor UI 0)  
> **정본:** [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.3 · [`PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md`](PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md)

---

## Scope (1줄)

Admin **Sports Desk** UI (nav · unsettled queue · exposure · risk · kill-switch surface) — **mock/display-only** on Lovable admin canvas → ZIP → PHONARA `apps/admin` paste 1:1. **rpc/supabase invent 0** · 기존 `rpc_admin_*` wire는 paste 후 Cursor L2-A-W only.

---

## 역할 분리 (non-negotiable)

| 구역 | 소유 | 금지 |
|------|------|------|
| Admin UI/UX | **Lovable canvas** | Cursor `apps/admin`에서 화면 신규 작성 |
| Paste | **Cursor** | presentation 1:1 · route/shim only |
| Engine RPC | **PHONARA** (S13–S22 GREEN) | Lovable에서 migration/RPC invent |

**FAIL =** Cursor에서 admin sports 화면을 직접 구현하거나 Lovable ZIP 없이 `apps/admin` UI 추가.

---

## 게이트 (EXECUTE GO 전)

| # | 게이트 | FAIL |
|---|--------|------|
| G1 | L1-10-W Wallet **§GREEN** (Wave-2 ZIP + paste) | wallet 미완 시 admin EXECUTE |
| G2 | operator 「**L1-15-A EXECUTE GO**」 | Plan만으로 GO 금지 |
| G3 | L2-S `/sports` hook wire §GREEN (user sports mock 제거) | user/admin 데이터 계약 불일치 |

**3개 중 하나라도 미충족 → EXECUTE 0.**

---

## Slice bar (A0–A6)

| ID | surface | Lovable 산출 | paste 후 wire (Cursor만) |
|----|---------|--------------|-------------------------|
| A-0 | `admin.nav.sports` + `/sports` hub stub | layout + nav item | route register |
| A-1 | Operations · `feature_sports_enabled` toggle UI | display/toast mock | `rpc_admin_*` ops read |
| A-2 | Unsettled fixtures queue (read-only table) | mock rows | `rpc_admin_list_unsettled_sports_fixtures` |
| A-2b | Manual score override | **defer** | settle = service_role only |
| A-3 | Market suspend + audit reason form | mock confirm | existing suspend RPC |
| A-4 | Exposure dashboard | mock aggregates | read-only RPC |
| A-5 | Risk events + tier banner | mock list | read-only RPC |
| A-6 | §GREEN self-check | vitest + i18n `admin.sports.*` | admin E2E paste 후 |

---

## i18n

- prefix: `admin.sports.*` · `admin.nav.sports` · `admin.operations.feature.sports`
- append only · `check:i18n` green on Lovable canvas before ZIP

---

## ZIP · paste

- artifact: `lovable-admin-sports-wave-1.zip` (operator 「ZIP 발행 GO」 후만)
- paste target: `apps/admin/src/**` presentation zone + `packages/i18n` merge
- **PHONARA repo UI 작업 = paste adapter만** (shell, routes, shims)

---

## L1-15-A-M · Admin mobile + menu tabs (AMEND)

> **상위:** L1-15-A §GREEN 유지 · **UI-only** · rpc/i18n rename 0 (append-only OK)

### 문제 (operator)

- `/admin/sports` **360px** 가로 overflow · sidebar-only IA · 세로 과밀
- admin **모바일 메뉴 탭** 없음 — 1인 운영도 모바일 예외 처리 필요

### Scope (1줄)

`ImportedAdminShell` **responsive** + **AdminBottomNav** (mobile) + `SportsDeskHub` **segment tabs** (mobile). desktop sidebar **1280+ 유지**.

### Breakpoints

| viewport | shell | sports desk |
|----------|-------|-------------|
| **≥1024** | sidebar 9 nav (현행) | single column stack (현행) |
| **768–1023** | sidebar **collapsible drawer** (hamburger) | segment tabs optional |
| **<768** | sidebar **hidden** · **AdminBottomNav** 5 tabs | **segment tabs 필수** |

### AdminBottomNav (NEW · mobile only · `md:hidden`)

| tab | route | icon |
|-----|-------|------|
| Overview | `/admin` | LayoutDashboard |
| Queue | `/admin/queue` | ListOrdered |
| **Sports** | `/admin/sports` | Activity |
| Users | `/admin/users` | Users |
| More | sheet → Settings · Audit · MFA · Operations | Menu |

- safe-area-inset-bottom · min-h-14 · active = violet accent (wallet `--wallet-cta` 계열 또는 admin token)
- **FAIL =** user `BottomNav` 컴포넌트 diff · `/wallet` `/sports` touch 0

### SportsDeskHub segment tabs (mobile · `<md` 필수)

| tab | content |
|-----|---------|
| **Queue** | UnsettledFixturesTable (default) |
| **Exposure** | ExposureDashboard 3-card |
| **Risk** | RiskEventsPanel + tier banner |
| **Ops** | FeatureSportsToggle + kill/suspend hint |

- desktop `md+`: tabs hidden · **현행 single-page stack** 유지
- table mobile: **card rows** (`<md`) OR horizontal scroll **`overflow-x-auto` + `min-w-0`** — overflow-x on **body 0**

### Files (AMEND)

| # | path | 작업 |
|---|------|------|
| M1 | `src/components/admin/AdminBottomNav.tsx` | NEW · 5 tabs |
| M2 | `src/components/admin/ImportedAdminShell.tsx` | drawer `<lg` · bottom nav `<md` · main `pb-[calc(3.5rem+env(safe-area-inset-bottom))]` |
| M3 | `src/components/admin/sports/SportsDeskHub.tsx` | `SportsDeskTabs` segment · responsive split |
| M4 | `src/components/admin/sports/UnsettledFixturesTable.tsx` | `<md` card row variant |
| M5 | `src/components/admin/sports/__tests__/SportsDesk.test.tsx` | mobile tab switch · bottom nav render · overflow class |

### i18n (append only)

```text
admin.nav.mobile.overview / .queue / .sports / .users / .more
admin.sports.tab.queue / .exposure / .risk / .ops
```

기존 `admin.*` 115 · wallet 94 · sports 66 **rename/delete 0**

### §GREEN (M)

```bash
rg -c '"admin\.' src/i18n/ko.ts src/i18n/en.ts          # 115 + Δ 동일
rg -c '"wallet\.' src/i18n/ko.ts src/i18n/en.ts          # 94/94
rg -c '"sports\.|"nav\.sports"' src/i18n/ko.ts src/i18n/en.ts  # 66/66
bunx vitest run src/components/admin/sports/__tests__/
bunx vitest run wallet && bunx vitest run sports
```

수동 9b-M: 360px overflow 0 · bottom nav 5탭 · sports segment 4탭 · 1280 sidebar 유지

### LOCK Footer M1–M4

| # | 고정 |
|---|------|
| M1 | AdminBottomNav **`md:hidden` only** |
| M2 | Sports segment **`md:hidden` only** · desktop layout diff 0 |
| M3 | body horizontal scroll **0** at 360px |
| M4 | suspend reason ≥4 · mock chip · rpc 0 유지 |

---

## Defer

- Admin deposit approval queues → 별도 Lovable admin slice
- Browser `service_role` · score settle UI → Engine operator GO

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-16 | v0.1 초판 |
| 2026-06-16 | v0.2 L1-15-A-M mobile + AdminBottomNav + SportsDesk tabs |

---

*L1-15-A §GREEN 후 AMEND · ZIP defer until Lovable 100%*