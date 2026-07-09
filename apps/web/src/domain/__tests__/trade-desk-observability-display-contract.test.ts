import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assertTradeDeskObservabilitySync,
  TRADE_DESK_KPI_MATRIX,
  TRADE_DESK_KPI_METRIC_IDS,
  TRADE_DESK_KPI_WALLET_REFRESH_SLA_MS,
  TRADE_DESK_MANUAL_INCIDENT_CHECKLIST,
  TRADE_DESK_OBSERVABILITY_BACKLOG_TODO,
  TRADE_DESK_OBSERVABILITY_DETECTION_LAYERS,
  TRADE_DESK_OBSERVABILITY_TODO,
} from '../trade-desk-observability-display-contract';
import { TRADE_WALLET_REFRESH_MAX_MS } from '../trade-desk-perf-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

/** Prettier markdown may escape `*` / `_` — compare against operator-facing literals. */
function normalizeMarkdownEscapes(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+.!-])/g, '$1');
}

describe('trade-desk-observability-display-contract · P4-B', () => {
  it('registers P4-B todo · exactly 5 KPIs · detection layers', () => {
    expect(TRADE_DESK_OBSERVABILITY_TODO).toBe('p4-observability');
    expect(TRADE_DESK_OBSERVABILITY_BACKLOG_TODO).toBe('backlog-kpi-dashboard');
    expect(TRADE_DESK_KPI_METRIC_IDS).toHaveLength(5);
    expect(TRADE_DESK_KPI_MATRIX).toHaveLength(5);
    expect(TRADE_DESK_OBSERVABILITY_DETECTION_LAYERS).toHaveLength(4);
    expect(TRADE_DESK_MANUAL_INCIDENT_CHECKLIST.length).toBeGreaterThanOrEqual(5);
    expect(TRADE_DESK_KPI_WALLET_REFRESH_SLA_MS).toBe(TRADE_WALLET_REFRESH_MAX_MS);
    assertTradeDeskObservabilitySync();
  });

  it('wires operator observability doc · E0 slot · Sentry defer ADR', () => {
    const doc = readRepo('docs/OPERATIONS/TRADE_DESK_OBSERVABILITY.md');
    const e0 = readRepo(
      'docs/OPERATIONS/TRADE_DESK_ZERO_DEFECT_EVIDENCE/P4/observability-kpi-baseline.md',
    );
    const adr = readRepo('docs/PRODUCT/ADR/004-trade-desk-sentry-defer.md');
    const privacy = readRepo('docs/OBSERVABILITY_PRIVACY.md');

    expect(doc).toContain('P4-B');
    expect(doc).toContain('backlog-kpi-dashboard');
    expect(doc).toContain('p4-observability');
    expect(doc).toContain('Submit Success %');
    expect(doc).toContain('Wallet Refresh %');
    expect(doc).toContain('Realtime Disconnect %');
    expect(doc).toContain('Fetch Retry %');
    expect(doc).toContain('RPC Failure %');
    expect(doc).toContain('edge-observability.ts');
    expect(doc).toContain('004-trade-desk-sentry-defer.md');

    expect(e0).toContain('p4-observability');
    expect(e0).toContain('TRADE_DESK_OBSERVABILITY.md');

    expect(adr).toContain('Defer');
    expect(adr).toContain('Sentry');
    expect(adr).toContain('OBSERVABILITY_PRIVACY.md');
    expect(privacy).toContain('Sentry');

    for (const row of TRADE_DESK_KPI_MATRIX) {
      expect(doc).toContain(row.label);
    }
    for (const item of TRADE_DESK_MANUAL_INCIDENT_CHECKLIST) {
      expect(normalizeMarkdownEscapes(doc)).toContain(item);
    }
  });
});
