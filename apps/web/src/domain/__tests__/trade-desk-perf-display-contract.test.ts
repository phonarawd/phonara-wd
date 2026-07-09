import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  findTradeDeskPerfMetric,
  percentile,
  TRADE_CHART_FPS_MIN,
  TRADE_CHART_FPS_SAMPLE_MS,
  TRADE_COLD_LCP_MAX_MS,
  TRADE_DESK_PERF_E2E_SPEC,
  TRADE_DESK_PERF_MATRIX,
  TRADE_DESK_PERF_TODO,
  TRADE_FILL_PANEL_MAX_MS,
  TRADE_FILLS_FETCH_LIMIT,
  TRADE_FILLS_PAGE_SIZE,
  TRADE_LATENCY_CHAIN_SAMPLES,
  TRADE_SUBMIT_ACK_MAX_MS,
  TRADE_SUBMIT_INP_MAX_MS,
  TRADE_WALLET_REFRESH_MAX_MS,
  paginateTradeFillsRows,
  passesMaxThreshold,
  passesMinThreshold,
  tradeFillsPageCount,
} from '../trade-desk-perf-display-contract';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');

function readRepo(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8');
}

describe('trade-desk-perf-display-contract · P3-A', () => {
  it('registers P3-A todo and Plan thresholds', () => {
    expect(TRADE_DESK_PERF_TODO).toBe('p3-perf-benchmark');
    expect(TRADE_CHART_FPS_MIN).toBe(30);
    expect(TRADE_CHART_FPS_SAMPLE_MS).toBe(5_000);
    expect(TRADE_SUBMIT_INP_MAX_MS).toBe(200);
    expect(TRADE_SUBMIT_ACK_MAX_MS).toBe(800);
    expect(TRADE_FILL_PANEL_MAX_MS).toBe(2_000);
    expect(TRADE_WALLET_REFRESH_MAX_MS).toBe(3_000);
    expect(TRADE_COLD_LCP_MAX_MS).toBe(2_500);
    expect(TRADE_LATENCY_CHAIN_SAMPLES).toBe(5);
    expect(TRADE_DESK_PERF_MATRIX).toHaveLength(6);
    expect(findTradeDeskPerfMetric('latency-t1-ack')?.gate).toBe('hard');
    expect(findTradeDeskPerfMetric('latency-t3-wallet')?.gate).toBe('advisory');
  });

  it('percentile helper matches p50/p95 expectations', () => {
    const samples = [100, 200, 300, 400, 500];
    expect(percentile(samples, 50)).toBe(300);
    expect(percentile(samples, 95)).toBeCloseTo(480, 0);
    expect(passesMinThreshold(30, TRADE_CHART_FPS_MIN)).toBe(true);
    expect(passesMaxThreshold(199, TRADE_SUBMIT_INP_MAX_MS)).toBe(true);
    expect(passesMaxThreshold(801, TRADE_SUBMIT_ACK_MAX_MS)).toBe(false);
  });

  it('wires E2E perf spec and baseline doc to contract constants', () => {
    const e2e = readRepo(TRADE_DESK_PERF_E2E_SPEC);
    const fixture = readRepo('tests/e2e/fixtures/trade-desk-perf.ts');
    const baseline = readRepo('docs/OPERATIONS/TRADE_DESK_PERF_BASELINE.md');

    for (const constant of [
      'TRADE_CHART_FPS_MIN',
      'TRADE_CHART_FPS_SAMPLE_MS',
      'TRADE_SUBMIT_INP_MAX_MS',
      'TRADE_SUBMIT_ACK_MAX_MS',
      'TRADE_FILL_PANEL_MAX_MS',
      'TRADE_WALLET_REFRESH_MAX_MS',
      'TRADE_COLD_LCP_MAX_MS',
      'TRADE_LATENCY_CHAIN_SAMPLES',
    ]) {
      expect(e2e).toContain(constant);
      expect(fixture).toContain(constant);
    }

    expect(baseline).toContain('P3-A');
    expect(baseline).toContain(String(TRADE_CHART_FPS_MIN));
    expect(baseline).toContain(String(TRADE_SUBMIT_INP_MAX_MS));
    expect(baseline).toContain(String(TRADE_SUBMIT_ACK_MAX_MS));
  });

  it('defines fills fetch cap and client pagination helpers (Phase D1)', () => {
    expect(TRADE_FILLS_FETCH_LIMIT).toBe(100);
    expect(TRADE_FILLS_PAGE_SIZE).toBe(20);
    expect(tradeFillsPageCount(41)).toBe(3);
    expect(paginateTradeFillsRows(['a', 'b', 'c', 'd'], 2, 2)).toEqual(['c', 'd']);

    const trading = readRepo('apps/web/src/hooks/use-trading.ts');
    expect(trading).toContain('TRADE_FILLS_FETCH_LIMIT');
  });
});
