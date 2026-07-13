# R9-PERF-JS — Phase 4 i18n lazy-load measure (2026-07-14)

## Goal

Stage1 initial JS **≤450 kB gzip** (web modulepreload + entry scripts).

## Before / After

| 시점 | initial JS gzip | SLO 450 | Evidence |
| --- | ---: | --- | --- |
| Baseline (Wave 1 · framer-motion 제거 후) | **519.31 kB** | FAIL | [`r9-perf-js-measure-baseline.json`](r9-perf-js-measure-baseline.json) · `06_PERFORMANCE.md` §6 |
| After i18n ko-eager / en-lazy | **394.00 kB** | **PASS** | [`r9-perf-js-measure-after-i18n-lazy.json`](r9-perf-js-measure-after-i18n-lazy.json) |

**Delta:** −125.31 kB (−24.1%).

## What changed

| File / area | Why |
| --- | --- |
| `packages/i18n/src/catalog-ko.ts` | ko (+ presentation-ko) eager catalog |
| `packages/i18n/src/catalog-en.ts` | en (+ presentation-en) **dynamic import only** |
| `packages/i18n/src/index.ts` | `ensureLocaleCatalog` / `preloadAllLocalesForTests` · `translate` uses registry |
| `packages/i18n/src/react.tsx` | I18nProvider gates until active locale catalog ready; `setLocale` preloads |
| `vitest.web.setup.ts` · `vitest.admin.setup.ts` | `beforeAll(preloadAllLocalesForTests)` — **134 test files not rewritten** |
| `scripts/check-i18n-coverage.ts` | allowlist `catalog-ko.ts` / `catalog-en.ts` |
| `scripts/measure-web-initial-js.mjs` | reproducible Stage1 gzip measure |

`catalog-en-*.js` exists in `dist/assets` but is **not** in `index.html` modulepreload — loaded only on English locale switch.

## Tests (local L0–L4 samples)

- Batch 1: i18n + landing + fiat-hint + appshell — **29/29**
- Batch 2: p13-soft-launch + trust-hub + system-status + wallet fiat + ux-grammar + education — **27/27**
- `bun run typecheck` green · `bun run check:i18n` green

## Money / SQL / auth

**0 touch.**
