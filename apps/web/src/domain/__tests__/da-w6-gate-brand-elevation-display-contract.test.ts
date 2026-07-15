import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  DA_W6_BRAND_ELEVATION_BUNDLE_TODO,
  DA_W6_BRAND_MARK_AURORA_VARIANT,
  DA_W6_DOMAIN_EMPTY_DOMAINS,
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
  DA_W6_QUAD_STREAM_LOADING_AXES,
} from '../da-w6-brand-elevation-display-contract';
import {
  assertDaW6GateBrandElevationSync,
  DA_W6_GATE_BRAND_DISTINGUISH_MARKERS,
  DA_W6_GATE_BRAND_ELEVATION_ARTIFACT_PATHS,
  DA_W6_GATE_BRAND_ELEVATION_PREREQUISITE_TODOS,
  DA_W6_GATE_BRAND_ELEVATION_TEST_PATHS,
  DA_W6_GATE_BRAND_ELEVATION_TODO,
  DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST,
  DA_W6_GATE_BRAND_PRIMARY_OWNER_PATHS,
  DA_W6_GATE_BRAND_SCAN_CUES,
  daW6GateDomainEmptySignature,
} from '../da-w6-gate-brand-elevation-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w6-gate-brand-elevation-display-contract §34.18–34.20 · YAML #217', () => {
  it('registers GATE todo · prerequisite BUNDLE · unique brand scan cues', () => {
    expect(DA_W6_GATE_BRAND_ELEVATION_TODO).toBe('da-w6-gate-brand-elevation');
    expect(DA_W6_BRAND_ELEVATION_BUNDLE_TODO).toBe('da-w6-brand-elevation-bundle');
    expect(DA_W6_GATE_BRAND_ELEVATION_PREREQUISITE_TODOS).toEqual([
      DA_W6_BRAND_ELEVATION_BUNDLE_TODO,
    ]);
    expect(DA_W6_BRAND_MARK_AURORA_VARIANT).toBe('aurora');
    expect(DA_W6_GATE_BRAND_SCAN_CUES.brand_mark_aurora).toBe('quad-stream-glow-mark');
    expect(DA_W6_GATE_BRAND_SCAN_CUES.quad_stream_loading).toBe('four-axis-pulse');
    expect(new Set(Object.values(DA_W6_GATE_BRAND_SCAN_CUES)).size).toBe(6);
    expect(() => assertDaW6GateBrandElevationSync()).not.toThrow();
  });

  it('lists VISUAL advisory checklist for brand elevation', () => {
    expect(DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'brand-mark-aurora-quad-stream-glow',
    );
    expect(DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'domain-empty-casino-chips',
    );
    expect(DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'quad-stream-loading-four-axes',
    );
    expect(DA_W6_GATE_BRAND_ELEVATION_VISUAL_ADVISORY_CHECKLIST).toContain(
      'check-design-tokens-advisory',
    );
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W6_GATE_BRAND_ELEVATION_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W6_GATE_BRAND_ELEVATION_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('proves brand elevation distinguish markers in primitives + CSS', () => {
    const brandMark = readFileSync(resolve(WEB_SRC, 'product/primitives/brand-mark.tsx'), 'utf8');
    const domainMark = readFileSync(
      resolve(WEB_SRC, 'product/primitives/domain-empty-mark.tsx'),
      'utf8',
    );
    const loading = readFileSync(
      resolve(WEB_SRC, 'product/primitives/quad-stream-loading.tsx'),
      'utf8',
    );
    const css = readFileSync(resolve(WEB_SRC, 'product/tokens/brand-elevation.css'), 'utf8');
    const combined = `${brandMark}\n${domainMark}\n${loading}\n${css}`;

    expect(brandMark).toContain('ds-brand-mark-aurora');
    expect(brandMark).toContain('data-brand-variant');
    expect(brandMark).toContain('ds-brand-mark-aurora__glow');
    expect(css).toContain('.ds-brand-mark-aurora');
    expect(css).toContain('.ds-brand-mark-aurora__glow');
    for (const marker of DA_W6_GATE_BRAND_DISTINGUISH_MARKERS.brand_mark_aurora) {
      if (marker.startsWith('data-brand-variant=')) {
        expect(brandMark).toContain('data-brand-variant');
        continue;
      }
      expect(combined).toContain(marker);
    }

    for (const domain of DA_W6_DOMAIN_EMPTY_DOMAINS) {
      expect(domainMark).toContain(`'${domain}'`);
      expect(daW6GateDomainEmptySignature(domain)).toBe(DA_W6_DOMAIN_EMPTY_SIGNATURES[domain]);
      expect(DA_W6_GATE_BRAND_SCAN_CUES[`domain_empty_${domain}` as const]).toBe(
        DA_W6_DOMAIN_EMPTY_SIGNATURES[domain],
      );
    }

    for (const axis of DA_W6_QUAD_STREAM_LOADING_AXES) {
      expect(loading).toContain('DA_W6_QUAD_STREAM_LOADING_AXES');
      expect(css).toContain(`data-axis='${axis}'`);
    }
    expect(css).toContain('.ds-quad-stream-loading');
  });

  it('wires primary owners brand-mark · domain-empty · quad-stream', () => {
    expect(DA_W6_GATE_BRAND_PRIMARY_OWNER_PATHS).toEqual([
      'product/primitives/brand-mark.tsx',
      'product/primitives/domain-empty-mark.tsx',
      'product/primitives/quad-stream-loading.tsx',
    ]);

    const brandMark = readFileSync(resolve(WEB_SRC, 'product/primitives/brand-mark.tsx'), 'utf8');
    expect(brandMark).toContain('DA_W6_BRAND_MARK_AURORA_VARIANT');
    expect(brandMark).toContain('ds-brand-mark-aurora');

    const domainMark = readFileSync(
      resolve(WEB_SRC, 'product/primitives/domain-empty-mark.tsx'),
      'utf8',
    );
    expect(domainMark).toContain('DA_W6_DOMAIN_EMPTY_SIGNATURES');
    expect(domainMark).toContain('data-signature');

    const loading = readFileSync(
      resolve(WEB_SRC, 'product/primitives/quad-stream-loading.tsx'),
      'utf8',
    );
    expect(loading).toContain('ds-quad-stream-loading');
    expect(loading).toContain('data-axis');
  });
});
