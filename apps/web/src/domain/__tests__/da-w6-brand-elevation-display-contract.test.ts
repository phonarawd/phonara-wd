import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW6BrandElevationSync,
  DA_W6_BRAND_ELEVATION_ARTIFACT_PATHS,
  DA_W6_BRAND_ELEVATION_BUNDLE_TODO,
  DA_W6_BRAND_ELEVATION_PREREQUISITE_TODOS,
  DA_W6_BRAND_ELEVATION_TEST_PATHS,
  DA_W6_BRAND_ELEVATION_WIRE_TARGETS,
  DA_W6_BRAND_MARK_AURORA_VARIANT,
  DA_W6_DOMAIN_EMPTY_DOMAINS,
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
  DA_W6_QUAD_STREAM_LOADING_AXES,
  P10_OPERATOR_VISUAL_SIGNOFF_TODO,
} from '../da-w6-brand-elevation-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w6-brand-elevation-display-contract §34.18–34.20 · YAML #216', () => {
  it('registers BUNDLE todo · prerequisite VISUAL · aurora · 4 domains · Quad Stream', () => {
    expect(DA_W6_BRAND_ELEVATION_BUNDLE_TODO).toBe('da-w6-brand-elevation-bundle');
    expect(P10_OPERATOR_VISUAL_SIGNOFF_TODO).toBe('p10-operator-visual-signoff');
    expect(DA_W6_BRAND_ELEVATION_PREREQUISITE_TODOS).toEqual([P10_OPERATOR_VISUAL_SIGNOFF_TODO]);
    expect(DA_W6_BRAND_MARK_AURORA_VARIANT).toBe('aurora');
    expect(DA_W6_DOMAIN_EMPTY_DOMAINS).toEqual(['casino', 'trade', 'wallet', 'sports']);
    expect(DA_W6_DOMAIN_EMPTY_SIGNATURES).toEqual({
      casino: 'chips',
      trade: 'pulse',
      wallet: 'vault',
      sports: 'stadium',
    });
    expect(DA_W6_QUAD_STREAM_LOADING_AXES).toEqual(['earn', 'trading', 'sports', 'casino']);
    expect(() => assertDaW6BrandElevationSync()).not.toThrow();
  });

  it('requires artifacts and owner test paths on disk', () => {
    for (const rel of DA_W6_BRAND_ELEVATION_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W6_BRAND_ELEVATION_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('wires BrandMark aurora · domain empties · Quad Stream loading · router pending', () => {
    const brandMark = readFileSync(resolve(WEB_SRC, 'product/primitives/brand-mark.tsx'), 'utf8');
    expect(brandMark).toContain("'aurora'");
    expect(brandMark).toContain('ds-brand-mark-aurora');

    const emptyState = readFileSync(resolve(WEB_SRC, 'product/primitives/empty-state.tsx'), 'utf8');
    expect(emptyState).toContain('DomainEmptyMark');
    expect(emptyState).toContain('domain?:');

    const domainMark = readFileSync(
      resolve(WEB_SRC, 'product/primitives/domain-empty-mark.tsx'),
      'utf8',
    );
    for (const domain of DA_W6_DOMAIN_EMPTY_DOMAINS) {
      expect(domainMark).toContain(`'${domain}'`);
    }
    expect(domainMark).toContain('chips');
    expect(domainMark).toContain('pulse');
    expect(domainMark).toContain('vault');
    expect(domainMark).toContain('stadium');

    const loading = readFileSync(
      resolve(WEB_SRC, 'product/primitives/quad-stream-loading.tsx'),
      'utf8',
    );
    expect(loading).toContain('DA_W6_QUAD_STREAM_LOADING_AXES');
    expect(loading).toContain('ds-quad-stream-loading');

    const css = readFileSync(resolve(WEB_SRC, 'product/tokens/brand-elevation.css'), 'utf8');
    expect(css).toContain('--ds-brand-axis-earn');
    expect(css).toContain('.ds-brand-mark-aurora');
    expect(css).toContain('.ds-quad-stream-loading');

    const landing = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/landing/landing-page.tsx'),
      'utf8',
    );
    expect(landing).toContain("variant={abVariant === 'b' ? 'aurora' : 'hero-3d'}");

    const casino = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/casino/casino-lobby-page.tsx'),
      'utf8',
    );
    expect(casino).toContain('domain="casino"');
    expect(casino).toContain('casino-lobby-empty');

    const trade = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/futures-positions-panel.tsx'),
      'utf8',
    );
    expect(trade).toContain('domain="trade"');
    expect(trade).toContain('DomainEmptyMark');

    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/ledger-page.tsx'),
      'utf8',
    );
    expect(wallet).toContain('domain="wallet"');
    expect(wallet).toContain('QuadStreamLoading');

    const sportsBoard = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-fixture-board.tsx'),
      'utf8',
    );
    expect(sportsBoard).toContain('domain="sports"');
    expect(sportsBoard).toContain('QuadStreamLoading');

    const sportsVip = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-vip-stub-panel.tsx'),
      'utf8',
    );
    expect(sportsVip).toContain('domain="sports"');

    const router = readFileSync(resolve(WEB_SRC, 'router.ts'), 'utf8');
    expect(router).toContain('defaultPendingComponent: QuadStreamLoading');

    expect(DA_W6_BRAND_ELEVATION_WIRE_TARGETS).toContain('brand_mark_aurora');
    expect(DA_W6_BRAND_ELEVATION_WIRE_TARGETS).toContain('router_pending');
  });
});
