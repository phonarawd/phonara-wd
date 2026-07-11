# apps/web — Phase R scope

> **Phase R:** Presentation rebuild in progress — [`REBUILD_PLAN_v1.md`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** `launch-ramp-t1-feature-gates` (#237) · P13 closeout `#236` `[x]` · team desk `#230` `[x]` · Admin canonical docs `#229` `[x]` · W8 GATE `#228` `[x]` · W8 sound DOC `#227` `[x]` · W8 signature `#226` `[x]` · P12 GATE `#225` `[x]` · P12 legal pages `#224` `[x]` · P12 community hub `#223` `[x]` · P12 trust hub `#222` `[x]` · P11 GATE `#221` `[x]` · P11 wallet redeem `#220` `[x]` · P11 Earn side `#219` `[x]` · P4 VISUAL `#218` agent impl `[x]` · W6 GATE `#217` `[x]` · W6 BUNDLE `#216` `[x]` · P10 VISUAL `#215` agent impl `[x]` · P10 GATE `#214` `[x]` · first-bet education `#213` `[x]` · Fairness `#212` `[x]` · Batch D `#211` `[x]` · Batch C `#210` `[x]` · Batch B `#209` `[x]` · Batch A `#208` `[x]` · AdminTable GATE `#207` `[x]` · AdminTable `#206` `[x]` · Fiat#11 `#205` `[x]` · CasinoR#1 `#204` `[x]` · Casino lobby `#203` `[x]` · preflight: ACTIVE_WORK_SSOT.
> **SSOT:** [`docs/SSOT/ACTIVE_WORK_SSOT.md`](../../docs/SSOT/ACTIVE_WORK_SSOT.md) · Plan **280 ids** · completed **217** · pending **56** (53차)

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
