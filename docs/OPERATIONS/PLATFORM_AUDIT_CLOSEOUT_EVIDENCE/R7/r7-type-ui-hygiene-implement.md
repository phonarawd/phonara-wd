# R7 — Type / UI Hygiene (`audit-r7-type-ui-hygiene`)

> **Stage:** R7 · **Plan todo:** `audit-r7-type-ui-hygiene`  
> **Findings:** M-14 · M-15 · M-16  
> **Date:** 2026-07-13  
> **Command:** Implement per PLATFORM_AUDIT_TODO_HANDOFF.md

## Finding touched

| Finding  | Fix summary                                                                                                                                                                               | Gate                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **M-14** | orphan delete: `domain-hub-page` · status/support stubs · `useAdminAccessDesk(+Mock)` · `useAdminGiftcardFeeMarket` · Access types from `admin-desk-views`                                | import 0 · vitest orphan assert     |
| **M-16** | typed `callRpc` sweep · delete `sportsRpc` / `casinoLiveRpc` · Admin Team/MFA/Support/Missions/ops/staking/sports · wallet whitelist · account delete · CMS/landing · repeatable missions | `check:rpc-type-hygiene` findings=0 |
| **M-15** | `check:primitive-ratchet --strict` baseline · `text-[11px]`→`text-xs` · chart RGB `primitive-allow` signed exception · file input allow                                                   | ratchet within baseline             |

## Root cause / fix

| 필드                  | 값                                                                   |
| --------------------- | -------------------------------------------------------------------- |
| **Root cause (M-14)** | live owner 대체 후 stub/orphan hook 잔존                             |
| **Fix (M-14)**        | import 0 확인 후 삭제                                                |
| **Root cause (M-16)** | generated types 전에 심은 wrong-name / `as never` cast               |
| **Fix (M-16)**        | `callRpc` + Strict Type Rule · wrapper 내부 `as never`만 허용        |
| **Root cause (M-15)** | Casino/Trade/Auth page-local raw controls · arbitrary px · chart rgb |
| **Fix (M-15)**        | 증가 금지 ratchet + typography token + chart signed allowlist        |

## Code owners

| Path                                                                  | Role                           |
| --------------------------------------------------------------------- | ------------------------------ |
| deleted orphan surfaces/hooks                                         | M-14                           |
| `apps/*/src/lib/rpc.ts`                                               | typed bridge (only `as never`) |
| sports/casino/wallet/admin desks                                      | M-16 callRpc                   |
| `scripts/check-rpc-type-hygiene.ts`                                   | M-16 gate                      |
| `scripts/check-primitive-ratchet.ts`                                  | M-15 gate                      |
| `spot-order-book-panel` · `order-book-depth-chart` · `chart-theme.ts` | M-15 typography/chart          |
| `apps/web/src/domain/__tests__/r7-type-ui-hygiene.test.ts`            | owner vitest                   |

## Gates

```text
gate:ai-impl L0~L4 green · vitest 5/5
check:rpc-type-hygiene findings=0
check:primitive-ratchet --strict green (rawButton 43/23 · rawInput 15/8 · text11px 0)
typecheck · lint · check:i18n · check:release green
```

## No Shortcut checklist

- [x] orphan production import **0** · stubs/hooks deleted
- [x] type-lie / dynamic RPC helper **0** (`as any`로 typecheck 통과 금지)
- [x] `lib/rpc.ts` 내부 shim만 `as never`
- [x] arbitrary `text-[11px]` **0**
- [x] chart RGB signed (`primitive-allow` + FILE_ALLOWLIST)
- [x] raw-control residual = **서명된 baseline** (증가 시 ratchet FAIL)

Finding status: **M-14 / M-15 / M-16 → VERIFIED_FIXED**

NEXT Implement: **`audit-r8-deploy-parity`**.
