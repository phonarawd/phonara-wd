import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  DA_W8_SIGNATURE_MOMENTS,
  DA_W8_SIGNATURE_SURFACES,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
} from '../da-w8-signature-surfaces-display-contract';
import {
  DA_W8_SOUND_DESIGN_SPEC_TODO,
  DA_W8_SOUND_IMPLEMENTATION_WAVE,
  DA_W8_SOUND_TONES,
} from '../da-w8-sound-design-display-contract';
import {
  assertDaW8GateSignatureExperienceSync,
  DA_W8_GATE_EMOTION_MAP_FORBIDDEN,
  DA_W8_GATE_EMOTION_MAP_TARGETS,
  DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS,
  DA_W8_GATE_SIGNATURE_EXPERIENCE_ARTIFACT_PATHS,
  DA_W8_GATE_SIGNATURE_EXPERIENCE_PREREQUISITE_TODOS,
  DA_W8_GATE_SIGNATURE_EXPERIENCE_TEST_PATHS,
  DA_W8_GATE_SIGNATURE_EXPERIENCE_TODO,
  DA_W8_GATE_SIGNATURE_PRIMARY_OWNER_PATHS,
  DA_W8_GATE_SIGNATURE_SCAN_CUES,
  DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST,
  daW8GateEmotionTarget,
  daW8GateSignatureMoment,
} from '../da-w8-gate-signature-experience-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w8-gate-signature-experience-display-contract §34.2·§34.21–34.27 · YAML #228', () => {
  it('registers GATE todo · prerequisites · unique signature scan cues', () => {
    expect(DA_W8_GATE_SIGNATURE_EXPERIENCE_TODO).toBe('da-w8-gate-signature-experience');
    expect(DA_W8_SOUND_DESIGN_SPEC_TODO).toBe('da-w8-sound-design-spec-defer');
    expect(DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO).toBe('da-w8-signature-surfaces-bundle');
    expect(DA_W8_GATE_SIGNATURE_EXPERIENCE_PREREQUISITE_TODOS).toEqual([
      DA_W8_SOUND_DESIGN_SPEC_TODO,
      DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
    ]);
    expect(Object.keys(DA_W8_GATE_SIGNATURE_SCAN_CUES)).toHaveLength(7);
    expect(new Set(Object.values(DA_W8_GATE_SIGNATURE_SCAN_CUES)).size).toBe(7);
    expect(DA_W8_GATE_SIGNATURE_SCAN_CUES.sound_doc_defer).toBe('four-tone-spec-e-wave');
    expect(DA_W8_SOUND_TONES).toHaveLength(4);
    expect(DA_W8_SOUND_IMPLEMENTATION_WAVE).toBe('E-Wave');
    expect(() => assertDaW8GateSignatureExperienceSync()).not.toThrow();
  });

  it('spot-checks §34.2 Emotion Map targets and forbidden emotions per surface', () => {
    expect(DA_W8_GATE_EMOTION_MAP_TARGETS).toEqual({
      home: 'achievement-restrained',
      wallet: 'stability-control',
      trade: 'focus-professional',
      sports: 'scan-tension-restrained',
      casino: 'discovery-delight',
      vip: 'upgrade-celebration-restrained',
    });

    for (const surface of DA_W8_SIGNATURE_SURFACES) {
      expect(daW8GateEmotionTarget(surface)).toBe(DA_W8_GATE_EMOTION_MAP_TARGETS[surface]);
      expect(daW8GateSignatureMoment(surface)).toBe(DA_W8_SIGNATURE_MOMENTS[surface]);
      expect(DA_W8_GATE_SIGNATURE_SCAN_CUES[surface]).toBe(DA_W8_SIGNATURE_MOMENTS[surface]);
      expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN[surface].length).toBeGreaterThanOrEqual(2);
    }

    expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN.home).toContain('false_urgency');
    expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN.wallet).toContain('fake_urgency_on_withdraw');
    expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN.trade).toContain('casino_style_flash');
    expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN.sports).toContain('guaranteed_win');
    expect(DA_W8_GATE_EMOTION_MAP_FORBIDDEN.casino).toContain(
      'infinite_decorative_on_bet_submit',
    );
  });

  it('lists VISUAL: da-w8-signature advisory checklist', () => {
    expect(DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST).toContain('home-greeting-day-flow');
    expect(DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST).toContain(
      'wallet-living-balance-count-up',
    );
    expect(DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST).toContain(
      'emotion-map-spot-check-six-surfaces',
    );
    expect(DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST).toContain(
      'sound-doc-four-tones-e-wave-defer',
    );
    expect(DA_W8_GATE_SIGNATURE_VISUAL_ADVISORY_CHECKLIST).toContain(
      'check-design-tokens-advisory',
    );
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of DA_W8_GATE_SIGNATURE_EXPERIENCE_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of DA_W8_GATE_SIGNATURE_EXPERIENCE_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('proves signature distinguish markers in surfaces + CSS + sound DOC', () => {
    const home = readFileSync(resolve(WEB_SRC, 'product/surfaces/home/earn-home-page.tsx'), 'utf8');
    const wallet = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/wallet/wallet-balance-hero.tsx'),
      'utf8',
    );
    const trade = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/trade/trade-market-ticker-stats.tsx'),
      'utf8',
    );
    const casino = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/casino/casino-lobby-page.tsx'),
      'utf8',
    );
    const sports = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-kickoff-countdown.tsx'),
      'utf8',
    );
    const vip = readFileSync(resolve(WEB_SRC, 'product/surfaces/tier/tier-me-page.tsx'), 'utf8');
    const css = readFileSync(resolve(WEB_SRC, 'product/tokens/signature-surfaces.css'), 'utf8');
    const sound = readFileSync(
      resolve(WEB_SRC, 'domain/da-w8-sound-design-display-contract.ts'),
      'utf8',
    );
    const soundCanon = readFileSync(resolve(REPO_ROOT, 'docs/SSOT/SOUND_DESIGN_CANON.md'), 'utf8');

    expect(home).toContain('data-signature="greeting-day-flow"');
    expect(home).toContain('earn-home-greeting');
    expect(home).toContain('earn-home-signature-flow');
    expect(wallet).toContain('data-signature="living-balance"');
    expect(wallet).toContain('wallet-balance-hero');
    expect(trade).toContain('data-signature="market-heat-volume-pulse"');
    expect(trade).toContain('data-market-heat');
    expect(trade).toContain('data-volume-pulse');
    expect(casino).toContain('data-signature="tile-float-glow"');
    expect(css).toContain('ds-casino-tile-float');
    expect(sports).toContain('data-signature="kickoff-countdown"');
    expect(sports).toContain('sports-kickoff-countdown');
    expect(vip).toContain('data-signature="xp-fill"');
    expect(vip).toContain('data-xp-fill');
    expect(vip).toContain('fillOnMount');
    expect(sound).toContain('DA_W8_SOUND_TONES');
    expect(soundCanon).toContain('da-w8-sound-design-spec-defer');
    expect(soundCanon).toContain('E-Wave');

    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.home).toContain('earn-home-signature-flow');
    expect(DA_W8_GATE_SIGNATURE_DISTINGUISH_MARKERS.sound_doc_defer).toContain('E-Wave');
  });

  it('wires primary owners across six surfaces + sound DOC', () => {
    expect(DA_W8_GATE_SIGNATURE_PRIMARY_OWNER_PATHS).toEqual([
      'product/surfaces/home/earn-home-page.tsx',
      'product/surfaces/wallet/wallet-balance-hero.tsx',
      'product/surfaces/trade/trade-market-ticker-stats.tsx',
      'product/surfaces/casino/casino-lobby-page.tsx',
      'product/surfaces/sports/sports-kickoff-countdown.tsx',
      'product/surfaces/tier/tier-me-page.tsx',
      'product/tokens/signature-surfaces.css',
      'domain/da-w8-sound-design-display-contract.ts',
    ]);
  });
});
