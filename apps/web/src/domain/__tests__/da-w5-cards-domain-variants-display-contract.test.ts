import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW5CardsDomainVariantsSync,
  DA_W4_GATE_MOTION_TODO,
  DA_W5_CARDS_DOMAIN_VARIANTS_ARTIFACT_PATHS,
  DA_W5_CARDS_DOMAIN_VARIANTS_PREREQUISITE_TODOS,
  DA_W5_CARDS_DOMAIN_VARIANTS_TEST_PATHS,
  DA_W5_CARDS_DOMAIN_VARIANTS_TODO,
  DA_W5_DOMAIN_CARD_SIGNATURES,
  DA_W5_DOMAIN_CARD_VARIANTS,
  DA_W5_DOMAIN_CARD_WIRE_TARGETS,
} from '../da-w5-cards-domain-variants-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w5-cards-domain-variants-display-contract §34.17 · YAML #194', () => {
  it('registers BUNDLE todo · prerequisite GATE · 6 personalities', () => {
    expect(DA_W5_CARDS_DOMAIN_VARIANTS_TODO).toBe('da-w5-cards-domain-variants');
    expect(DA_W4_GATE_MOTION_TODO).toBe('da-w4-gate-motion');
    expect(DA_W5_CARDS_DOMAIN_VARIANTS_PREREQUISITE_TODOS).toEqual([DA_W4_GATE_MOTION_TODO]);
    expect(DA_W5_DOMAIN_CARD_VARIANTS).toEqual([
      'mission',
      'wallet-hero',
      'vip',
      'trade-dense',
      'sports-odds',
      'casino-play',
    ]);
    expect(DA_W5_DOMAIN_CARD_SIGNATURES.mission).toBe('accent-ring-progress-glow');
    expect(DA_W5_DOMAIN_CARD_SIGNATURES['sports-odds']).toBe('heatmap-movement-bg');
    expect(() => assertDaW5CardsDomainVariantsSync()).not.toThrow();
  });

  it('requires artifacts and owner test paths on disk', () => {
    for (const rel of DA_W5_CARDS_DOMAIN_VARIANTS_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W5_CARDS_DOMAIN_VARIANTS_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('wires CVA domain variants + signature CSS + surface owners', () => {
    const cardSrc = readFileSync(resolve(WEB_SRC, 'product/primitives/card.tsx'), 'utf8');
    for (const variant of DA_W5_DOMAIN_CARD_VARIANTS) {
      // CVA keys may be bare (`mission:`) or quoted (`'wallet-hero':`).
      expect(cardSrc).toMatch(new RegExp(`['"]?${variant}['"]?:`));
    }

    const css = readFileSync(
      resolve(WEB_SRC, 'product/tokens/domain-card-personalities.css'),
      'utf8',
    );
    expect(css).toContain("[data-card-variant='mission']");
    expect(css).toContain("[data-card-variant='wallet-hero']");
    expect(css).toContain("[data-card-variant='vip']");
    expect(css).toContain("[data-card-variant='trade-dense']");
    expect(css).toContain("[data-card-variant='sports-odds']");
    expect(css).toContain("[data-card-variant='casino-play']");

    const mission = readFileSync(resolve(WEB_SRC, 'product/primitives/mission-card.tsx'), 'utf8');
    expect(mission).toContain('variant="mission"');
    expect(mission).toContain('data-mission-state');

    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    expect(wallet).toContain('variant="wallet-hero"');

    const tier = readFileSync(resolve(WEB_SRC, 'product/surfaces/tier/tier-me-page.tsx'), 'utf8');
    expect(tier).toContain('variant="vip"');
    expect(tier).toContain('--ds-card-tier');

    const spotTicket = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/spot-order-ticket.tsx'),
      'utf8',
    );
    expect(spotTicket).toContain('variant="trade-dense"');

    const futuresTicket = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/futures-order-ticket.tsx'),
      'utf8',
    );
    expect(futuresTicket).toContain('variant="trade-dense"');

    const orderBook = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/spot-order-book-panel.tsx'),
      'utf8',
    );
    expect(orderBook).toContain('variant="trade-dense"');

    const sports = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-fixture-board.tsx'),
      'utf8',
    );
    expect(sports).toContain('variant="sports-odds"');

    const casino = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/casino/casino-lobby-page.tsx'),
      'utf8',
    );
    expect(casino).toContain('variant="casino-play"');

    expect(DA_W5_DOMAIN_CARD_WIRE_TARGETS).toContain('mission_card');
    expect(DA_W5_DOMAIN_CARD_WIRE_TARGETS).toContain('casino_hub_tile');
  });
});
