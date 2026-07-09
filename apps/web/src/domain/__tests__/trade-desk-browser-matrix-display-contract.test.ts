import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskBrowserMatrixSync,
  listTradeDeskBrowserMatrixSmokeTitles,
  TRADE_DESK_BROWSER_MATRIX_CI_JOB,
  TRADE_DESK_BROWSER_MATRIX_CONFIG,
  TRADE_DESK_BROWSER_MATRIX_E2E_SCRIPT,
  TRADE_DESK_BROWSER_MATRIX_GREP,
  TRADE_DESK_BROWSER_MATRIX_PROJECTS,
  TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS,
  TRADE_DESK_BROWSER_MATRIX_SPEC,
  TRADE_DESK_BROWSER_MATRIX_TODO,
} from '../trade-desk-browser-matrix-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('trade-desk-browser-matrix-display-contract · P3-D', () => {
  it('registers todo id, spec, config, and optional CI job', () => {
    expect(TRADE_DESK_BROWSER_MATRIX_TODO).toBe('p3-browser-matrix');
    expect(TRADE_DESK_BROWSER_MATRIX_SPEC).toBe('tests/e2e/trade-desk-smoke.spec.ts');
    expect(TRADE_DESK_BROWSER_MATRIX_CONFIG).toBe('playwright.browser-matrix.config.ts');
    expect(TRADE_DESK_BROWSER_MATRIX_CI_JOB).toBe('e2e-browser-matrix');
    expect(TRADE_DESK_BROWSER_MATRIX_E2E_SCRIPT).toBe('test:e2e:browser-matrix');
  });

  it('targets firefox + webkit with E1/E8/E9 smoke subset grep', () => {
    expect(TRADE_DESK_BROWSER_MATRIX_PROJECTS).toEqual(['firefox', 'webkit']);
    expect(TRADE_DESK_BROWSER_MATRIX_SMOKE_IDS).toEqual(['E1', 'E8', 'E9']);
    for (const title of listTradeDeskBrowserMatrixSmokeTitles()) {
      expect(TRADE_DESK_BROWSER_MATRIX_GREP.test(title)).toBe(true);
    }
    assertTradeDeskBrowserMatrixSync();
  });

  it('keeps grep aligned with trade-desk-smoke.spec.ts test titles', () => {
    const specPath = resolve(REPO_ROOT, TRADE_DESK_BROWSER_MATRIX_SPEC);
    const source = readFileSync(specPath, 'utf8');
    for (const title of listTradeDeskBrowserMatrixSmokeTitles()) {
      expect(source, `missing smoke test title: ${title}`).toContain(title);
    }
  });
});
