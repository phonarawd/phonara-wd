import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertDaW8SoundDesignSync,
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
  DA_W8_SOUND_CUE_MAX_MS,
  DA_W8_SOUND_DEFAULT_ENABLED,
  DA_W8_SOUND_DESIGN_ARTIFACT_PATHS,
  DA_W8_SOUND_DESIGN_PREREQUISITE_TODOS,
  DA_W8_SOUND_DESIGN_SPEC_TODO,
  DA_W8_SOUND_DESIGN_TEST_PATHS,
  DA_W8_SOUND_GAIN_MAX,
  DA_W8_SOUND_IMPLEMENTATION_WAVE,
  DA_W8_SOUND_OUT_OF_SCOPE,
  DA_W8_SOUND_PREF_KEYS,
  DA_W8_SOUND_TONE_SPECS,
  DA_W8_SOUND_TONES,
} from '../da-w8-sound-design-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('da-w8-sound-design-display-contract §34.27 · YAML #227', () => {
  it('registers DOC todo · prerequisite BUNDLE · 4 tones · E-Wave defer', () => {
    expect(DA_W8_SOUND_DESIGN_SPEC_TODO).toBe('da-w8-sound-design-spec-defer');
    expect(DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO).toBe('da-w8-signature-surfaces-bundle');
    expect(DA_W8_SOUND_DESIGN_PREREQUISITE_TODOS).toEqual([DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO]);
    expect(DA_W8_SOUND_TONES).toEqual(['mission', 'wallet', 'trade', 'vip']);
    expect(DA_W8_SOUND_TONE_SPECS.map((s) => s.id)).toEqual([...DA_W8_SOUND_TONES]);
    expect(DA_W8_SOUND_IMPLEMENTATION_WAVE).toBe('E-Wave');
    expect(DA_W8_SOUND_DEFAULT_ENABLED).toBe(false);
    expect(DA_W8_SOUND_CUE_MAX_MS).toBe(220);
    expect(DA_W8_SOUND_GAIN_MAX).toBe(0.05);
    expect(() => assertDaW8SoundDesignSync()).not.toThrow();
  });

  it('keeps casino/sports/bgm/haptic out of the four-tone set', () => {
    expect(DA_W8_SOUND_OUT_OF_SCOPE).toEqual([
      'casino-win-cue-§23.8',
      'sports-kickoff-sfx',
      'lobby-bgm',
      'haptic',
    ]);
    expect(DA_W8_SOUND_TONES).not.toContain('casino');
    expect(DA_W8_SOUND_TONES).not.toContain('sports');
  });

  it('pins reserved pref keys and zone alignment', () => {
    expect(DA_W8_SOUND_PREF_KEYS.master).toBe('phonara.settings.sound.enabled');
    expect(DA_W8_SOUND_PREF_KEYS.mission).toBe('phonara.settings.sound.mission');
    expect(DA_W8_SOUND_PREF_KEYS.wallet).toBe('phonara.settings.sound.wallet');
    expect(DA_W8_SOUND_PREF_KEYS.trade).toBe('phonara.settings.sound.trade');
    expect(DA_W8_SOUND_PREF_KEYS.vip).toBe('phonara.settings.sound.vip');
    expect(DA_W8_SOUND_TONE_SPECS.find((s) => s.id === 'mission')?.toastZone).toBe('A');
    expect(DA_W8_SOUND_TONE_SPECS.find((s) => s.id === 'wallet')?.toastZone).toBe('B');
    expect(DA_W8_SOUND_TONE_SPECS.find((s) => s.id === 'trade')?.toastZone).toBe('B');
    expect(DA_W8_SOUND_TONE_SPECS.find((s) => s.id === 'vip')?.toastZone).toBe('A');
  });

  it('requires SSOT + contract artifacts on disk', () => {
    for (const rel of DA_W8_SOUND_DESIGN_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
    for (const rel of DA_W8_SOUND_DESIGN_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });

  it('SOUND_DESIGN_CANON pins four tones and E-Wave defer', () => {
    const canon = readFileSync(resolve(REPO_ROOT, 'docs/SSOT/SOUND_DESIGN_CANON.md'), 'utf8');
    expect(canon).toContain('da-w8-sound-design-spec-defer');
    expect(canon).toContain('E-Wave');
    expect(canon).toContain('mission');
    expect(canon).toContain('wallet');
    expect(canon).toContain('trade');
    expect(canon).toContain('vip');
    expect(canon).toContain('§23.8');
    expect(canon).toMatch(/기본값[\s\S]*off|opt-in/i);
  });
});
