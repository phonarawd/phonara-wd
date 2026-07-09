# apps/web — Phase R scope

> **Phase R:** Presentation rebuild in progress — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `da-w5-gate-domain-cards` (#195) · DA W5 `[x]` · DA W4 GATE `[x]` · DA W4 `[x]` · DA W3 GATE `[x]` · preflight: ACTIVE_WORK_SSOT.
> **SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../../docs/SSOT/ACTIVE_WORK_SSOT.md) · Plan **278 ids** · completed **194** · pending **77** (52차)

## KEEP (engine glue)

`contracts/` · `domain/*.ts` · hooks/lib **whitelist** · `stores/` · `workers/` · `data/` · `contexts/auth-context.tsx`

## Gates (Phase R)

```bash
bun run check:phase-r-guards -- --strict   # duplicate work + domain isolation
bun run gate:ai-impl -- --test <path> --closeout <todo-id> --evidence "gate:ai-impl ... green · N/N"
bun run typecheck
```

**Guard SOT:** `product/shell/surface-domain-boundary.ts` · rule `97-phase-r-surface-domain-guard.mdc`  
**STOP:** completed Plan todo 재착수 · cross-domain surface import · parallel `-page.tsx` — operator 보고 후만 진행.

Do not recreate pre-demolition paths (`components/ui`, `presentation-import`, `@phonara/ui`) — define new structure in `REBUILD_PLAN_v1`.
