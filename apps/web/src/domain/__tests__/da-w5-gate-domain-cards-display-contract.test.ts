import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  DA_W5_CARDS_DOMAIN_VARIANTS_TODO,
  DA_W5_DOMAIN_CARD_SIGNATURES,
  DA_W5_DOMAIN_CARD_VARIANTS,
} from '../da-w5-cards-domain-variants-display-contract';
import {
  assertDaW5GateDomainCardsSync,
  DA_W5_GATE_DOMAIN_CARDS_ARTIFACT_PATHS,
  DA_W5_GATE_DOMAIN_CARDS_PREREQUISITE_TODOS,
  DA_W5_GATE_DOMAIN_CARDS_TEST_PATHS,
  DA_W5_GATE_DOMAIN_CARDS_TODO,
  DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST,
  DA_W5_GATE_PRIMARY_OWNER_PATHS,
  DA_W5_GATE_SCAN_CUES,
  DA_W5_GATE_SCAN_DISTINGUISH_MARKERS,
} from '../da-w5-gate-domain-cards-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w5-gate-domain-cards-display-contract §34.17 · YAML #195', () => {
  it('registers GATE todo · prerequisite BUNDLE · 6 unique scan cues', () => {
    expect(DA_W5_GATE_DOMAIN_CARDS_TODO).toBe('da-w5-gate-domain-cards');
    expect(DA_W5_CARDS_DOMAIN_VARIANTS_TODO).toBe('da-w5-cards-domain-variants');
    expect(DA_W5_GATE_DOMAIN_CARDS_PREREQUISITE_TODOS).toEqual([DA_W5_CARDS_DOMAIN_VARIANTS_TODO]);
    expect(Object.keys(DA_W5_GATE_SCAN_CUES)).toEqual([...DA_W5_DOMAIN_CARD_VARIANTS]);
    expect(new Set(Object.values(DA_W5_GATE_SCAN_CUES)).size).toBe(6);
    expect(DA_W5_GATE_SCAN_CUES.mission).toBe('in-progress-mission');
    expect(DA_W5_GATE_SCAN_CUES['wallet-hero']).toBe('balance');
    expect(DA_W5_GATE_SCAN_CUES['casino-play']).toBe('game-tile');
    expect(() => assertDaW5GateDomainCardsSync()).not.toThrow();
  });

  it('lists VISUAL advisory checklist for 0.2s scan distinguish', () => {
    expect(DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST).toContain(
      'scan-0.2s-six-personalities-distinct',
    );
    expect(DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST).toContain(
      'mission-accent-ring-progress-glow',
    );
    expect(DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST).toContain(
      'wallet-hero-mono-aurora-edge',
    );
    expect(DA_W5_GATE_DOMAIN_CARDS_VISUAL_ADVISORY_CHECKLIST).toContain(
      'casino-play-hover-glow-float',
    );
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W5_GATE_DOMAIN_CARDS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W5_GATE_DOMAIN_CARDS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('proves 0.2s scan distinguish markers in CVA + signature CSS', () => {
    const cardSrc = readFileSync(resolve(WEB_SRC, 'product/primitives/card.tsx'), 'utf8');
    const css = readFileSync(
      resolve(WEB_SRC, 'product/tokens/domain-card-personalities.css'),
      'utf8',
    );
    const combined = `${cardSrc}\n${css}`;

    for (const variant of DA_W5_DOMAIN_CARD_VARIANTS) {
      expect(combined).toContain(`data-card-variant`);
      expect(css).toContain(`[data-card-variant='${variant}']`);
      expect(DA_W5_DOMAIN_CARD_SIGNATURES[variant].length).toBeGreaterThan(0);
      for (const marker of DA_W5_GATE_SCAN_DISTINGUISH_MARKERS[variant]) {
        if (marker.startsWith('data-card-variant=')) {
          expect(css).toContain(`[${marker}]`);
          continue;
        }
        if (marker === 'progress glow') {
          expect(css.toLowerCase()).toMatch(/progress|glow|accent/);
          continue;
        }
        if (marker === 'heatmap') {
          expect(css).toContain('heatmap');
          continue;
        }
        if (marker === 'aurora') {
          expect(css).toContain('aurora');
          continue;
        }
        expect(combined).toContain(marker);
      }
    }
  });

  it('wires primary owners mission-card · wallet-hero · casino-play tile', () => {
    expect(DA_W5_GATE_PRIMARY_OWNER_PATHS).toEqual([
      'product/primitives/mission-card.tsx',
      'product/surfaces/wallet/wallet-balance-hero.tsx',
      'product/surfaces/casino/casino-lobby-page.tsx',
    ]);

    const mission = readFileSync(resolve(WEB_SRC, 'product/primitives/mission-card.tsx'), 'utf8');
    expect(mission).toContain('variant="mission"');
    expect(mission).toContain('data-mission-state');

    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    expect(wallet).toContain('variant="wallet-hero"');
    expect(wallet).toContain('data-testid="wallet-balance-hero"');

    const casino = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/casino/casino-lobby-page.tsx'),
      'utf8',
    );
    expect(casino).toContain('variant="casino-play"');
    expect(casino).toContain('casino-hub-play-tile');
  });
});
