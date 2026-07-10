# P1 — `pir-p1-admin-rbac`

> **Todo:** `pir-p1-admin-rbac`  
> **완료일:** 2026-07-11  
> **상태:** **`[x]` DONE** (Implemented · `gate:ai-impl` L0~L4)

## 목표 (H-3)

Admin UI 역할 게이트를 `rpc_admin_list_role_grants` 정본으로 전환 · localStorage owner 승격을 **DEV preview만** 허용 · 로딩/오류 시 **fail-closed (viewer)**.

## 구현

| 파일 | 변경 |
|------|------|
| `apps/admin/src/domain/admin-rbac.ts` | `parseAdminRoleGrants` · `resolveOperatorRoleFromGrants` · empty→viewer · DEV-only storage R/W |
| `apps/admin/src/hooks/admin/useAdminOperatorRbac.ts` | grants query 정본 · `serverRole` · `setPreviewRole` prod no-op |
| `apps/admin/src/domain/__tests__/admin-rbac.test.ts` | matrix · grants · DEV/prod storage **17/17** |
| `apps/admin/AGENTS.md` | fail-closed · DEV-only preview 계약 |

## 증거

```text
Implemented: bun run gate:ai-impl -- --test apps/admin/src/domain/__tests__/admin-rbac.test.ts

L0 cursor:status · check:hygiene · check:ui-architecture · check:phase-r-guards --strict
L1 typecheck · check:i18n · check:release
L2 lint
L3 vitest 17/17 (admin-rbac)

gate:ai-impl ✓ Implemented (L0~L4) green
```

## DoD 체크

- [x] non-DEV에서 localStorage `owner` 읽기/쓰기 불가 (`readStoredOperatorRole` / `writeStoredOperatorRole` env.DEV=false)
- [x] grants 미로드·오류 → viewer (fail-closed)
- [x] 서버 grants 정본 (`rpc_admin_list_role_grants`) · bootstrap(무 grant 행)=owner (`_admin_has_role` 미러)

## 다음

`pir-e1-system-lock-order` — `_lock_system_accounts` · spot buy/sell 동시성 SQL
