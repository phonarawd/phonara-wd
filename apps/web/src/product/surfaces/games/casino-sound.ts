/**
 * Casino win cue — §23.8 optional sound (default off · reduced-motion off).
 * Single lazy AudioContext · short oscillator beep · no loop music.
 */

import {
  readCasinoSoundEffectsPref,
  SETTINGS_CASINO_SOUND_PREF_KEY,
} from '@/domain/settings-hub-display-contract';

export { SETTINGS_CASINO_SOUND_PREF_KEY };

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new Ctor();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Big/Mega short cue only — no-op when opt-in off or reduced-motion. */
export function playCasinoWinCue(tier: 'big' | 'mega' | 'medium' | 'small' | 'none'): void {
  if (tier !== 'big' && tier !== 'mega') return;
  if (!readCasinoSoundEffectsPref()) return;
  if (prefersReducedMotion()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().then(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = tier === 'mega' ? 880 : 660;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  });
}
