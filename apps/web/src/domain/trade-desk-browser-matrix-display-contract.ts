/**
 * P3-D — Trade desk browser compatibility matrix (Plan trade_desk_qa_audit).
 * Playwright firefox + webkit smoke subset; chromium remains CI authoritative e2e job.
 */

export const TRADE_DESK_BROWSER_MATRIX_TODO = 'p3-browser-matrix' as const;

/** Source spec — subset only (no full money paths on non-chromium engines). */
export const TRADE_DESK_BROWSER_MATRIX_SPEC = 'tests/e2e/trade-desk-smoke.spec.ts' as const;

export const TRADE_DESK_BROWSER_MATRIX_CONFIG = 'playwright.browser-matrix.config.ts' as const;

export const TRADE_DESK_BROWSER_MATRIX_CI_JOB = 'e2e-browser-matrix' as const;

/** Playwright grep targets — must stay in sync with trade-desk-smoke test titles. */
export const TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS = ['E1', 'E8', 'E9'] as const;

export type TradeDeskBrowserMatrixSmokeId = (typeof TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS)[number];

/** Human-readable smoke titles (grep fragments) wired in trade-desk-smoke.spec.ts. */
export const TRADE_DESK_BROWSER_MATRIX_SMOKE_TITLES: Readonly<
  Record<TradeDeskBrowserMatrixSmokeId, string>
> = {
  E1: 'E1 login → spot chart visible on PHON desk',
  E8: 'E8 stale oracle blocks submit while chart panel stays visible',
  E9: 'E9 futures kill-switch OFF leaves spot submit enabled',
};

/** Non-chromium engines exercised in the optional CI matrix. */
export const TRADE_DESK_BROWSER_MATRIX_PROJECTS = ['firefox', 'webkit'] as const;

export type TradeDeskBrowserMatrixProject = (typeof TRADE_DESK_BROWSER_MATRIX_PROJECTS)[number];

/** Package script — wraps run-e2e.ts with browser-matrix config. */
export const TRADE_DESK_BROWSER_MATRIX_E2E_SCRIPT = 'test:e2e:browser-matrix' as const;

/** Playwright config grep — subset of trade-desk-smoke (rendering + gate UI only). */
export const TRADE_DESK_BROWSER_MATRIX_GREP = new RegExp(
  TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS.map((id) => `${id}\\b`).join('|'),
);

export function listTradeDeskBrowserMatrixSmokeTitles(): string[] {
  return TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS.map(
    (id) => TRADE_DESK_BROWSER_MATRIX_SMOKE_TITLES[id],
  );
}

/** Non-waivable sync for P3-D Implemented closeout. */
export function assertTradeDeskBrowserMatrixSync(): void {
  if (TRADE_DESK_BROWSER_MATRIX_PROJECTS.length !== 2) {
    throw new Error('trade-desk-browser-matrix: firefox + webkit required');
  }
  if (TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS.length < 3) {
    throw new Error('trade-desk-browser-matrix: smoke subset must cover E1/E8/E9');
  }
  for (const id of TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS) {
    const title = TRADE_DESK_BROWSER_MATRIX_SMOKE_TITLES[id];
    if (!TRADE_DESK_BROWSER_MATRIX_GREP.test(title)) {
      throw new Error(`trade-desk-browser-matrix: grep must match smoke title ${id}`);
    }
  }
}
