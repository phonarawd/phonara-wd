# ADR 0005: No-V2 Policy (In-Place Canonical Modification)

## Status

Accepted (2026-06-29)

## Context

Parallel implementations (`LoginPageV2`, `WalletSurfaceNew`, `trade-desk-v2.tsx`) were a common failure mode during paste absorption and recovery tracks: engineers fixed the wrong file, left dead imports, and increased `check:ui-architecture` debt. The zero-defect launch requires one verifiable canonical per route and grep-bounded owner maps—not forked filenames.

## Decision

**Forbidden:**

- Creating new files whose names imply a parallel product surface: `*V2`, `*New`, `*Legacy`, `*Old`, `*Temp`, or duplicate `*-desk-surface` for the same route intent
- “Copy, fix, switch route later” workflows
- Leaving the old canonical in place after introducing a parallel file

**Required:**

- Modify the **locked canonical** component in place (ADR-0003)
- Preserve stable integration contracts when replacing visuals: `data-testid`, controller handlers, RPC call sites, i18n keys (add-only per `60-i18n-ux`)
- Update **desktop and mobile pair** in the same change when the surface has a desk + mobile owner
- Block-by-block replacement: mockup/legacy JSX → `@/ui/design` + `--ds-*`, without deleting engine wiring

**Deletion** of superseded files happens only after:

1. Import count 0 (grep verification)
2. Route lock matrix updated
3. Consolidation / operator agreement when the file is shell or IA debt

## Consequences

- Refactors are visibly scoped to known paths; code review and owner grep stay mechanical.
- Large visual rewrites happen incrementally inside one file, reducing route registration churn.
- Violations trigger RED STOP in release governance; new parallel hubs also violate Consolidation Wave C1–C4.

## References

- ADR-0003 Route Lock
- Master plan — “교체 방식” · naming rules · World-Class Surface DoD
- `.cursor/rules/70-autonomy-and-delivery.mdc` §7 naming
