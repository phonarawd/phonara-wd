# ADR 0004: Single Design System (Presentation Token Source)

## Status

역사 기록 / v5 Demolition 이후 구현 기준에서 대체됨 (2026-07-03).

이 ADR의 경로는 pre-demolition 기록이며 active Phase R 구현 대상이 아니다.
Phase R은 UI 작업 전에 새 컴포넌트·토큰 아키텍처를 먼저 정의해야 한다.

## Context

Pre-demolition 기록: 과거에는 engine-grade shared UI (`@phonara/ui`), 외부 presentation paste (`apps/web/src/components/ui`), `apps/web/src/ui/design`, `design-system.css`를 분리해 운영했다. 해당 경로는 v5 Demolition 이후 active target이 아니며 Phase R에서 새 구조를 정의한다.

## Decision

**Primary presentation SOT for pivot / Phase A surfaces:**

| Concern                          | Source                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Reusable presentation primitives | `apps/web/src/ui/design/*` (GlowCard, MoneyFigure, MintButton, FormPanel, FieldGroup, …)                |
| Design tokens                    | `apps/web/src/ui/design/design-system.css` (`--ds-*`) + `apps/web/src/theme.css` `@theme` for app shell |
| Responsive breakpoints           | `--ds-bp-*`, `.shell-content-column`, `viewport-contract.ts` (see `M0-responsive-shell-contract.md`)    |
| Page assembly                    | Desk surfaces under `ui/pages/*`, `ui/wallet/*`, `ui/trading/*`, `ui/sports/*`, `ui/casino/*`           |

**Component ownership (no new overlap):**

| Zone                                                 | Owner                                       | Use for                                           |
| ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `@phonara/ui` + `theme.css`                          | Engine / trade terminal / shared games UI   | Exchange-grade density, `@phonara/ui` barrel only |
| `apps/web/src/ui/design`                             | Auth, Earn, wallet, landing, pivot surfaces | M0 token→component pipeline                       |
| `apps/web/src/components/ui` + `presentation-import` | pre-demolition paste zone 기록              | v5 Demolition 이후 active target 아님             |

**Forbidden in production presentation paths:**

- Arbitrary pixel typography as the only responsive strategy (`text-[Npx]` without `--ds-text-*`)
- Inline hex colors without theme/`--ds-*` tokens
- Mockup PNG full-page backgrounds to game visual gates
- New semantic duplicate exports (same component name, different behavior)

Pre-demolition Surface DoD는 Phase A 대상에 `@/ui/design` primitives + `--ds-*`를 요구했다.
해당 DoD는 v5 Demolition 이후 active가 아니다.

## Consequences

- `components/ui` ↔ `@phonara/ui` dual DS remains isolated until a future explicit merge (out of Consolidation Wave scope).
- Token changes in `design-system.css` ripple across all pivot surfaces—owners must coordinate via route lock (ADR-0003).
- `check:ui-architecture` enforces shell/IA convergence (Consolidation C0–C5).

## References

- `.cursor/rules/91-uiux-worldclass-methodology.mdc`, `95-presentation-import-absorption.mdc`, `85-architecture-and-components.mdc`
- `docs/rebuild/M0-worldclass-uiux-methodology.md`, `PHONARA_DESIGN_CANON_40.md`
- ADR-0003 Route Lock
