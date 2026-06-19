# PHONARA — Sportsbook Admin Desk Plan (Lovable → paste `apps/admin`)

> **상태:** PLAN LOCK DRAFT — **EXECUTE 0**  
> **갱신:** 2026-06-16 (operator 정정: **어드민 UI = Lovable 플랫폼**)  
> **분리:** **유저 `/sports` UI = Lovable → paste** · **어드민 UI = Lovable → paste `apps/admin`** · **Cursor = paste adapter + RPC wire만**  
> **정본:** [`PHONARA_SPORTSBOOK_MASTER_PLAN.md`](PHONARA_SPORTSBOOK_MASTER_PLAN.md) · [`LOVABLE_ADMIN_SPORTS_DESK_LOCK.md`](LOVABLE_ADMIN_SPORTS_DESK_LOCK.md) · [`PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md`](PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md) §3.1.3

---

## 0. 한 줄

엔진 RPC(S13–S22)는 PHONARA **GREEN** — **어드민 화면은 Lovable에서 제작** → ZIP → `apps/admin` 1:1 paste. Cursor는 **예외 큐 중심 Trading Desk wire**만 담당. 1인 운영 · audit 필수 · 자동화 기본.

---

## 1. 큐 위치 (수정 정본)

```text
[L1] Lovable user sports UI — GATE close ✅ · paste Wave-1 ✅
[L1-10-W] Lovable Wallet — G4 EXECUTE GO 대기
[L1-15-A] Lovable Admin Sports Desk — EXECUTE 0 (본 문서)
[L2] PHONARA full Crush transplant paste waves
[L2-S] /sports hook wire — mock place 제거 · sports E2E
[L2-A-W] Admin RPC wire only (paste 후 · Cursor · UI 0)
[L3] Engine waves — L2 전체 GREEN 후
```

| 항목 | 정본 |
|------|------|
| **UI 제작** | **Lovable canvas** (user·admin 동일 플랫폼) |
| **PHONARA UI** | **paste만** — `apps/admin` 신규 화면 직접 작성 **금지** |
| **착수 GO** | G1 wallet §GREEN + operator 「**L1-15-A EXECUTE GO**」 |
| **Cursor L2-A-W** | paste 후 `rpc_admin_*` hook wire · migration invent 0 |

**FAIL =** Cursor에서 admin sports UI를 먼저 만들거나 · Lovable admin ZIP 없이 `apps/admin` presentation 추가 · browser service_role

---

## 2. Lovable 슬라이스 (L1-15-A)

상세 LOCK: [`LOVABLE_ADMIN_SPORTS_DESK_LOCK.md`](LOVABLE_ADMIN_SPORTS_DESK_LOCK.md)

| # | surface | Lovable | paste 후 (Cursor) |
|---|---------|---------|-------------------|
| A-0 | nav + `/sports` hub | mock hub | route + layout shim |
| A-1 | sports feature kill switch UI | toast mock | ops RPC read |
| A-2 | unsettled fixtures queue | mock table | `rpc_admin_list_unsettled_sports_fixtures` |
| A-2b | manual score | defer | service_role only |
| A-3 | market suspend + audit | mock form | existing RPC |
| A-4 | exposure dashboard | mock charts | read-only |
| A-5 | risk events | mock list | read-only |
| A-6 | §GREEN | vitest · i18n | admin E2E post-paste |

---

## 3. PHONARA paste (Wave-Admin-1)

- source: `lovable-admin-sports-wave-1.zip` (operator ZIP GO 후)
- target: `apps/admin/src/routes/**` · `apps/admin/src/components/**` · i18n merge
- forbidden: paste 중 엔진/RLS/migration 변경

---

## 4. 이전 오해 (폐기)

~~「L2-A = Cursor `apps/admin` only · Lovable 0」~~ — **operator 2026-06-16 정정으로 폐기.**  
Cursor에 임시로 넣었던 admin sports 라우트/도메인은 **전량 revert** 완료.

---

## 5. operator 신호

| 신호 | 의미 |
|------|------|
| 「L1-15-A EXECUTE GO」 | Lovable admin Sports Desk EXECUTE 시작 |
| 「Admin paste GO Wave-1」 | PHONARA `apps/admin` paste 착수 |
| 「Admin Sports Desk GO」 | L2-A-W RPC wire 착수 (UI 0) |