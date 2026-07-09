# ADR 0003: Route Lock (Canonical Surface per URL)

## Status

Accepted (2026-06-29)

## Context

PHONARA accumulated multiple presentation layers (Lovable paste, NOVA desk surfaces, legacy hub pages) that can render similar product intent on different URLs or through duplicate component chains. Modifying the wrong file causes “old UI overwrite” regressions and breaks shared imports (e.g. `ImportedSportsPage` used from both `/sports` and `/trade` BetHubShell).

## Decision

**One canonical render chain per route.** Each product URL maps to exactly one desk-surface entry and one visual page owner. Phase 0.5 lock artifacts (2026-06-29):

- [`docs/rebuild/P05-route-canonical-lock.md`](../rebuild/P05-route-canonical-lock.md) — web 53 + admin 19 chains · dead duplicate audit · shared imports
- [`docs/rebuild/P05-r-design-coverage-matrix.md`](../rebuild/P05-r-design-coverage-matrix.md) — R1~R41 ↔ route bidirectional orphan
- [`docs/rebuild/P05-feature-dependency-screen-matrix.md`](../rebuild/P05-feature-dependency-screen-matrix.md) — screen-side dependency pairs

Phase A edits require these artifacts green + `check:ui-architecture` allowlist 증가 0.

**Rules:**

1. Before touching a surface, read `routes/<surface>.tsx` (or admin route) and confirm the component actually rendered.
2. Grep all importers of the visual page; if shared, validate **all** dependent routes in the same change batch.
3. `bun run check:ui-architecture` must not gain new allowlist violations (dual earn hub, stacked mobile chrome, semantic duplicate exports, etc.).
4. **Dead duplicate candidates** (e.g. `ui/trading/trade-desk-surface.tsx`, `SportsHubPage.tsx`) are not edited or deleted until import count is 0 **and** operator agrees per Consolidation Wave (`88-ui-consolidation-wave`).
5. Earn hub canonical URL is **`/home`**; `/earn` index redirects to `/home` (Consolidation C1).

**Canonical examples (web):**

| Route                                | Canonical chain                                    |
| ------------------------------------ | -------------------------------------------------- |
| `/sports`                            | `SportsDeskSurface` → `ImportedSportsPage`         |
| `/trade`                             | `BetDeskSurface` → `BetHubShell` + trade terminal  |
| `/staking`                           | `StakingDeskSurface` → `ImportedStakingPage`       |
| `/home`, `/home/missions`, `/events` | Earn/missions/events desk surfaces (P1-1 complete) |

Admin: 19 routes in `apps/admin` each map to one `Admin*Page` / desk surface—no parallel hub routes.

**Phase A guard (non-waivable):** no surface work until `phase05-canonical` completes the full web 41 + admin 19 roster lock.

## Consequences

- New parallel hub routes or `*-desk-surface` duplicates are rejected during Consolidation C0–C5.
- Route lock reduces duplicate page creation; combined with ADR-0005, fixes happen in the locked canonical file only.
- Shared components require broader test scope (trade + sports when editing sports-page visuals).

## References

- ADR-0005 No-V2 Policy
- `.cursor/rules/88-ui-consolidation-wave.mdc` — C1 Earn URL, C4 route adapters
- Master plan Phase 0.5 — surface roster · dead duplicate list · design coverage matrix
