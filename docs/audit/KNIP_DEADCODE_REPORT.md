# Knip Dead Code Report

> Generated: 2026-07-13T00:45:11Z  
> Command: `bunx knip --no-progress`  
> Config: `knip.json`  
> Exit code: 1 (findings present — expected for inventory)

## Summary

| Category               | Count |
| ---------------------- | ----: |
| Unused files           |     3 |
| Unused dependencies    |     1 |
| Unused devDependencies |    12 |
| Unlisted binaries      |    19 |
| Unresolved imports     |     3 |
| Unused exports         |    17 |
| Unused exported types  |    10 |
| Duplicate exports      |     7 |
| Configuration hints    |     7 |

## Unused files (high signal)

| File                                                 | Notes                                  |
| ---------------------------------------------------- | -------------------------------------- |
| `apps/admin/src/contracts/admin-desk-views.ts`       | No import graph hit                    |
| `apps/admin/src/contracts/controller-view-freeze.ts` | No import graph hit                    |
| `apps/admin/src/lib/i18n.tsx`                        | Likely superseded by product i18n path |

## Unused dependencies

| Package      | Location            | Notes                                                       |
| ------------ | ------------------- | ----------------------------------------------------------- |
| `decimal.js` | root `package.json` | Money path uses `@phonara/money` — root dep may be residual |

## Unused exports (sample — full list in raw)

See raw log for complete unused exports (game-engine slot helpers, sports-ingest vendor symbols, web `lib/i18n` re-exports, admin ops push SW helper).

## Unresolved imports (stale script paths)

| Import                           | Script                                     |
| -------------------------------- | ------------------------------------------ |
| `../apps/web/src/lib/seo-config` | `scripts/generate-web-sitemap.ts`          |
| `../apps/web/src/i18n/ko`        | `scripts/merge-presentation-i18n-wave1.ts` |
| `../apps/web/src/i18n/en`        | `scripts/merge-presentation-i18n-wave1.ts` |

## Interpretation (inventory)

- **Pre-demolition UI:** still **0** files under deleted paths (unchanged).
- **Unused routes:** Knip did **not** flag route files as unused (entry via TanStack file routes).
- **Unused RPCs:** Knip does not analyze SQL/RPC — see `RPC_USAGE_MATRIX.md` (112 types RPCs with no app call site).
- **devDependencies flagged unused:** many are used via Vite/CI tooling outside Knip workspace entry graphs (`wrangler`, `tailwindcss`, Playwright axe) — treat as **knip false-positive / config gap**, not delete candidates without operator review.
- **Unlisted binaries:** OS tools (`powershell`, `gh`, `psql`) — expected on Windows ops scripts.

## Artifacts

- Raw: [`knip-raw-output.txt`](./knip-raw-output.txt)
- Master inventory §20 updated from this report
