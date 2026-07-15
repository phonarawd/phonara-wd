/**
 * DA W8 Sound design DOC (§34.27 · YAML #227).
 * Authority: `da-w8-sound-design-spec-defer` · docs/SSOT/SOUND_DESIGN_CANON.md
 * Spec only — Web Audio wire = E-Wave. Casino §23.8 is out of scope.
 */

import { DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO } from './da-w8-signature-surfaces-display-contract';

export { DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO };

export const DA_W8_SOUND_DESIGN_SPEC_TODO = 'da-w8-sound-design-spec-defer' as const;

export const DA_W8_SOUND_DESIGN_PREREQUISITE_TODOS = [
  DA_W8_SIGNATURE_SURFACES_BUNDLE_TODO,
] as const;

/**
 * §34.27 four signature tones — mission · wallet · trade · vip.
 * Casino win cue stays on §23.8 (`casino-sound.ts`) — not in this set.
 */
export const DA_W8_SOUND_TONES = ['mission', 'wallet', 'trade', 'vip'] as const;

export type DaW8SoundTone = (typeof DA_W8_SOUND_TONES)[number];

/** Implementation owner wave — Track A ships DOC only. */
export const DA_W8_SOUND_IMPLEMENTATION_WAVE = 'E-Wave' as const;

/** Max cue duration (ms) — whisper, no loop. */
export const DA_W8_SOUND_CUE_MAX_MS = 220 as const;

/** Max oscillator gain — must stay whisper-level. */
export const DA_W8_SOUND_GAIN_MAX = 0.05 as const;

/** Default master + per-tone prefs — always off until user opt-in (E-Wave). */
export const DA_W8_SOUND_DEFAULT_ENABLED = false as const;

/** Reserved settings keys — E-Wave wire only (Track A must not read/write). */
export const DA_W8_SOUND_PREF_KEYS = {
  master: 'phonara.settings.sound.enabled',
  mission: 'phonara.settings.sound.mission',
  wallet: 'phonara.settings.sound.wallet',
  trade: 'phonara.settings.sound.trade',
  vip: 'phonara.settings.sound.vip',
} as const satisfies Record<'master' | DaW8SoundTone, string>;

export type DaW8SoundToneSpec = {
  readonly id: DaW8SoundTone;
  /** Primary route group for the tone. */
  readonly surface: string;
  /** Emotion Map target (PRODUCT_EXPERIENCE_CANON §2). */
  readonly emotion: string;
  /** Toast zone alignment (Plan §3.2). */
  readonly toastZone: 'A' | 'B';
  /** Allowed post-result triggers (display/RPC success only). */
  readonly allowedTriggers: readonly string[];
  /** Hard bans for this tone. */
  readonly forbidden: readonly string[];
};

export const DA_W8_SOUND_TONE_SPECS = [
  {
    id: 'mission',
    surface: '/home/missions',
    emotion: 'achievement-restrained',
    toastZone: 'A',
    allowedTriggers: ['mission_claim_success', 'attendance_check_in'],
    forbidden: ['scroll_chime', 'false_urgency_loop'],
  },
  {
    id: 'wallet',
    surface: '/wallet',
    emotion: 'stability-control',
    toastZone: 'B',
    allowedTriggers: ['deposit_confirmed', 'withdraw_submitted'],
    forbidden: ['withdraw_submit_press', 'fake_urgency_pulse'],
  },
  {
    id: 'trade',
    surface: '/trade',
    emotion: 'focus-professional',
    toastZone: 'B',
    allowedTriggers: ['order_accepted', 'fill_toast'],
    forbidden: ['every_book_tick', 'casino_flash'],
  },
  {
    id: 'vip',
    surface: '/tier/me',
    emotion: 'upgrade-celebration-restrained',
    toastZone: 'A',
    allowedTriggers: ['tier_upgrade_celebration'],
    forbidden: ['xp_tick_every_point', 'decay_false_complete'],
  },
] as const satisfies readonly DaW8SoundToneSpec[];

/** Explicit out-of-scope owners — do not absorb into this DOC. */
export const DA_W8_SOUND_OUT_OF_SCOPE = [
  'casino-win-cue-§23.8',
  'sports-kickoff-sfx',
  'lobby-bgm',
  'haptic',
] as const;

/** SSOT + contract artifacts required on disk. */
export const DA_W8_SOUND_DESIGN_ARTIFACT_PATHS = [
  'docs/SSOT/SOUND_DESIGN_CANON.md',
  'apps/web/src/domain/da-w8-sound-design-display-contract.ts',
  'apps/web/src/domain/__tests__/da-w8-sound-design-display-contract.test.ts',
] as const;

/** gate:ai-impl owner path. */
export const DA_W8_SOUND_DESIGN_TEST_PATHS = [
  'apps/web/src/domain/__tests__/da-w8-sound-design-display-contract.test.ts',
] as const;

export function assertDaW8SoundDesignSync(): void {
  const ids = DA_W8_SOUND_TONE_SPECS.map((s) => s.id);
  if (ids.length !== DA_W8_SOUND_TONES.length) {
    throw new Error('DA_W8_SOUND_TONE_SPECS length drift vs DA_W8_SOUND_TONES');
  }
  for (const tone of DA_W8_SOUND_TONES) {
    if (!ids.includes(tone)) {
      throw new Error(`Missing tone spec: ${tone}`);
    }
  }
  if (DA_W8_SOUND_IMPLEMENTATION_WAVE !== 'E-Wave') {
    throw new Error('Sound implementation wave must remain E-Wave defer');
  }
  if (DA_W8_SOUND_DEFAULT_ENABLED !== false) {
    throw new Error('Sound default must stay opt-in off');
  }
  if (DA_W8_SOUND_CUE_MAX_MS > 220) {
    throw new Error('Cue max ms exceeds whisper budget');
  }
  if (DA_W8_SOUND_GAIN_MAX > 0.05) {
    throw new Error('Gain max exceeds whisper budget');
  }
}
