# Knip Dead Code Report

> Generated: 2026-07-13T00:45:11Z (baseline) · Updated: 2026-07-13 (SA-03 cleanup) · Errata: 2026-07-24 (`doc-hygiene-batch`)
> Command: `bunx knip --no-progress`
> Config: `knip.json`
> Exit code: 1 (findings present — expected for inventory; remaining categories are documented false-positive/config-gap noise, not delete candidates)

## SA-03 cleanup (2026-07-13 — Wave 3)

The three high-signal categories from the baseline scan are now resolved:

| Category                  |         Baseline | After cleanup | Action                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ---------------: | ------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unused files              |                3 |         **0** | Deleted `apps/admin/src/contracts/admin-desk-views.ts`, `apps/admin/src/lib/i18n.tsx` (deprecated shim, superseded by `@/product/i18n`). **`apps/admin/src/contracts/controller-view-freeze.ts`는 삭제되지 않음** — 파일 실존(참조 0 · dead 유지 · cross-app 테스트/`knip.json` entry로 unused-files 0 유지; web 쪽 copy만 `phase-c-dead-contract`에서 제거됨). |
| Unused dependency         | 1 (`decimal.js`) |         **0** | Removed root `package.json` `dependencies.decimal.js` — `packages/money` and `packages/trading-engine` already declare it as their own workspace dependency; root entry was redundant                                                                                                                                          |
| Unresolved script imports |                3 |         **0** | Deleted `scripts/generate-web-sitemap.ts` (imported deleted `apps/web/src/lib/seo-config`, never existed post-Demolition) and `scripts/merge-presentation-i18n-wave1.ts` (imported deleted pre-demolition `apps/web/src/i18n/ko`/`en` catalogs) — removed the matching `generate:web-sitemap` script entry from `package.json` |

## Summary (current — post SA-03 cleanup)

| Category               | Count |
| ---------------------- | ----: |
| Unused files           |     0 |
| Unused dependencies    |     0 |
| Unused devDependencies |    12 |
| Unlisted binaries      |    19 |
| Unresolved imports     |     0 |
| Unused exports         |    17 |
| Unused exported types  |    10 |
| Duplicate exports      |     7 |
| Configuration hints    |     7 |

## Interpretation (inventory)

- **Pre-demolition UI:** still **0** files under deleted paths (unchanged).
- **Unused routes:** Knip did **not** flag route files as unused (entry via TanStack file routes).
- **Unused RPCs:** Knip does not analyze SQL/RPC — see [`RPC_USAGE_MATRIX.md`](RPC_USAGE_MATRIX.md) (Edge/SQL cross-use scan added under SA-04, see §Cross-use).
- **devDependencies flagged unused:** many are used via Vite/CI tooling outside Knip workspace entry graphs (`wrangler`, `tailwindcss`, Playwright axe) — treat as **knip false-positive / config gap**, not delete candidates without operator review.
- **Unlisted binaries:** OS tools (`powershell`, `gh`, `psql`) — expected on Windows ops scripts.
- **Unused exports / types / duplicate exports:** engine · sports-ingest · i18n helper symbols kept for API surface/parity reasons — LOW severity, not part of SA-03 scope.

## Artifacts

- Raw: [`knip-raw-output.txt`](./knip-raw-output.txt)
- Master inventory §20 updated from this report
