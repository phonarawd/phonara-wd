import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal WebAudio synth — no Howler, no asset preload. Generates short
 * UI blips procedurally so the bundle stays tiny. A single AudioContext
 * is shared per page.
 */

type SoundName = "click" | "win" | "lose" | "tick" | "bigwin" | "reveal";

interface ToneSpec {
  freq: number;
  type: OscillatorType;
  duration: number;
  gain?: number;
  glide?: number; // target freq
}

const PRESETS: Record<SoundName, ToneSpec[]> = {
  click: [{ freq: 720, type: "square", duration: 0.04, gain: 0.06 }],
  tick: [{ freq: 1200, type: "triangle", duration: 0.03, gain: 0.04 }],
  reveal: [{ freq: 540, type: "sine", duration: 0.12, gain: 0.08, glide: 880 }],
  win: [
    { freq: 660, type: "triangle", duration: 0.09, gain: 0.09 },
    { freq: 880, type: "triangle", duration: 0.12, gain: 0.09 },
  ],
  bigwin: [
    { freq: 523, type: "triangle", duration: 0.1, gain: 0.1 },
    { freq: 659, type: "triangle", duration: 0.1, gain: 0.1 },
    { freq: 784, type: "triangle", duration: 0.18, gain: 0.1, glide: 988 },
  ],
  lose: [{ freq: 220, type: "sawtooth", duration: 0.18, gain: 0.06, glide: 110 }],
};

const STORAGE_KEY = "phonara.sound.muted";

let ctxSingleton: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctxSingleton) return ctxSingleton;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctxSingleton = new Ctor();
  } catch {
    return null;
  }
  return ctxSingleton;
}

export function useSound() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const setMuted = useCallback((v: boolean) => {
    setMutedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const play = useCallback((name: SoundName) => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    let offset = 0;
    for (const spec of PRESETS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec.type;
      osc.frequency.setValueAtTime(spec.freq, now + offset);
      if (spec.glide) {
        osc.frequency.exponentialRampToValueAtTime(
          spec.glide,
          now + offset + spec.duration,
        );
      }
      const peak = spec.gain ?? 0.08;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(peak, now + offset + 0.005);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + offset + spec.duration,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + spec.duration + 0.02);
      offset += spec.duration * 0.7;
    }
  }, []);

  // Resume on first user gesture (autoplay policy).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onGesture = () => {
      const ctx = getCtx();
      if (ctx?.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  return { play, muted, setMuted };
}
