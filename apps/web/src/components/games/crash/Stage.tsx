/**
 * Crash · Stage — unified mobile + desktop (P2.0 LOCK v1.1 + Polish G#1).
 *
 * REPLAY MODEL (not live round):
 *  - Display multiplier comes from `CrashRoundContext` (ref-based).
 *  - Per-frame `setState` for the multiplier is FORBIDDEN; the value
 *    is written to the DOM via a subscriber.
 *  - `m(t)` here is replay only — payout is server-authoritative.
 *
 * FAIL gates (#P2.0 invariants):
 *  - No client-known `crashAt` cashout evaluation.
 *  - No invented round clock for "live" rounds. We render only after
 *    a bet result reveals a real `crashMultiplier`.
 *
 * Polish G#1 (presentation only · engine 0-touch):
 *  - Skin tokens cached in a ref (mount + ResizeObserver +
 *    prefers-color-scheme matchMedia). NO `getComputedStyle` inside
 *    the per-frame render loop (Stage.renderPath.test enforces this).
 *  - `LinearGradient` cached per (color, H) key — rebuilt only when
 *    H or color changes.
 *  - Decile tick → multiplier text gets a transform-only scale pulse
 *    (no layout, no width/height).
 *  - Curve tip glow: extra radial halo around the leading point while
 *    live; brighter at crash.
 *  - Bust flash: one ≤200ms CSS-opacity overlay layered on the canvas
 *    (suppressed under reduced-motion). `screenShake` is verify-only —
 *    NO duplicate implementation.
 */
import { useEffect, useRef, useState } from "react";
import { FairnessSheet } from "../shared/FairnessSheet";
import { useGameLoop } from "../shared/hooks/useGameLoop";
import { useSound } from "../shared/hooks/useSound";
import { useReducedMotionGuard } from "../shared/hooks/useReducedMotionGuard";
import { celebrationTier, CelebrateOverlay } from "../shared/celebrate";
import { screenShake } from "../shared/feel/screenShake";
import { juice } from "../shared/feel/juice";
import { crashHistoryMultiplier, normalizeRecentBets } from "../shared/adapt-recent-bet";
import { t } from "@/i18n";
import type { ImportedGameSurfaceProps } from "../shared/types";
import { useCrashRoundOptional } from "./CrashRoundContext";
import { CrashHistoryStrip } from "./CrashHistoryStrip";

type Props = Pick<
  ImportedGameSurfaceProps<"crash">,
  | "gameCode"
  | "selection"
  | "bet"
  | "clientSeed"
  | "commitment"
  | "verification"
  | "onClientSeedChange"
> & {
  recentBets?: ImportedGameSurfaceProps<"crash">["recentBets"];
};

const K = 0.85;

// Canvas-safe alpha mixer. Skin tokens may resolve to `lab(...)` /
// `oklch(...)` in modern browsers, so hex-alpha suffixes like `${c}33`
// fail to parse in CanvasGradient.addColorStop. `color-mix` is widely
// supported (Chrome 111+, Safari 16.4+, FF 113+) and accepts any color
// notation as input.
const withAlpha = (color: string, pct: number) =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

type SkinPalette = {
  success: string;
  danger: string;
  live: string;
};

function readSkinPalette(): SkinPalette {
  if (typeof window === "undefined") {
    return { success: "#00E701", danger: "#ED4163", live: "#B1BAD3" };
  }
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fb: string) =>
    cs.getPropertyValue(name).trim() || fb;
  return {
    success: get("--skin-success", "#00E701"),
    danger: get("--skin-danger", "#ED4163"),
    live: get("--skin-fg-dim", "#B1BAD3"),
  };
}

export function Stage(p: Props) {
  const reduced = useReducedMotionGuard();
  const { play } = useSound();
  const round = useCrashRoundOptional();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const multTextRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  // Skin palette cache — refreshed on mount + ResizeObserver +
  // prefers-color-scheme matchMedia. NEVER read inside `render()`.
  const skinRef = useRef<SkinPalette>(readSkinPalette());
  // Gradient cache keyed by (colorHex, H px). Rebuilt only on change.
  const gradientRef = useRef<{
    key: string;
    grad: CanvasGradient;
  } | null>(null);
  // Local replay state (used when no provider is mounted — preserves
  // the previous component-owned behavior for test smoke renders).
  const localState = useRef({
    phase: "idle" as "idle" | "running" | "crashed",
    revealedCrashMult: 1,
    auto: 2,
    startedAt: 0,
  });
  const [phaseLabel, setPhaseLabel] = useState<"idle" | "crashed">("idle");
  const tickedDecileRef = useRef(0);

  const r = (p.bet?.result ?? {}) as {
    crashMultiplier?: number | string;
    cashedOut?: boolean;
    cashoutMultiplier?: number | string;
  };
  const cashedOut = r.cashedOut === true;
  const cashoutMultiplier = Number(r.cashoutMultiplier ?? 0);
  const isWin = cashedOut && cashoutMultiplier >= 1.01;
  const tier = isWin ? celebrationTier(cashoutMultiplier) : "none";

  // #P2.0c-T4 — history strip uses crashHistoryMultiplier(row) only.
  // Source rows may already be normalized (crash/index.tsx) but we
  // re-normalize defensively for direct test renders.
  const history = normalizeRecentBets(p.recentBets)
    .map(crashHistoryMultiplier)
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 10);

  // Subscribe DOM mutator for the multiplier readout (ref-based, no setState).
  useEffect(() => {
    if (!round) return;
    return round.subscribe((v) => {
      const node = multTextRef.current;
      if (node) node.textContent = `${v}×`;
    });
  }, [round]);

  // Canvas DPR sizing + skin cache refresh on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      canvas.dataset['w'] = String(rect.width);
      canvas.dataset['h'] = String(rect.height);
      canvas.dataset['dpr'] = String(dpr);
      // Resize invalidates gradient + may follow a theme change.
      skinRef.current = readSkinPalette();
      gradientRef.current = null;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Theme change → refresh cached skin palette + invalidate gradient.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const refresh = () => {
      skinRef.current = readSkinPalette();
      gradientRef.current = null;
    };
    if (mq.addEventListener) mq.addEventListener("change", refresh);
    else mq.addListener(refresh);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", refresh);
      else mq.removeListener(refresh);
    };
  }, []);

  // Replay: when a bet result lands, start the replay clock.
  useEffect(() => {
    const revealedMult = Number(r.crashMultiplier ?? "");
    if (!Number.isFinite(revealedMult) || revealedMult <= 0) return;
    const auto = Math.max(1.01, Number(p.selection.autoCashout) || 0);
    setPhaseLabel("idle");
    tickedDecileRef.current = 0;
    if (round) {
      round.resetRound({ revealedCrashMult: revealedMult, auto });
    } else {
      localState.current.phase = "running";
      localState.current.revealedCrashMult = revealedMult;
      localState.current.auto = auto;
      localState.current.startedAt = performance.now();
    }
    if (reduced) {
      setPhaseLabel("crashed");
      const node = multTextRef.current;
      if (node) node.textContent = `${revealedMult.toFixed(2)}×`;
      if (round) round.state.current.phase = "crashed";
      else localState.current.phase = "crashed";
    }
    if (isWin) {
      juice(badgeRef.current, { reduced });
    } else if (!cashedOut) {
      screenShake(stageRef.current, { reduced });
      // Polish G#1: brief bust flash overlay (CSS opacity, ≤200ms,
      // reduced-motion suppressed). NOT a duplicate of screenShake —
      // shake is transform on stage, flash is opacity on overlay div.
      const flash = flashRef.current;
      if (flash && !reduced) {
        flash.style.opacity = "0";
        // force reflow → restart transition
        void flash.offsetWidth;
        flash.style.transition = "opacity 200ms ease-out";
        flash.style.opacity = "0.55";
        window.setTimeout(() => {
          if (flash) flash.style.opacity = "0";
        }, 60);
      }
    }
     
  }, [p.bet, p.selection.autoCashout, reduced]);

  // Decile tick → transform-only scale pulse on the multiplier text.
  // Pure DOM mutation; no setState, no layout.
  function pulseMultiplier() {
    const node = badgeRef.current;
    if (!node || reduced) return;
    node.style.transition = "transform 220ms cubic-bezier(.22,1,.36,1)";
    node.style.transform = "scale(1.045)";
    window.setTimeout(() => {
      if (badgeRef.current) badgeRef.current.style.transform = "scale(1)";
    }, 90);
  }

  useGameLoop({
    active: !reduced,
    update: () => {
      const s = round ? round.state.current : localState.current;
      if (s.phase !== "running") return;
      const tSec = (performance.now() - s.startedAt) / 1000;
      const m = Math.exp(K * tSec);
      if (m >= s.revealedCrashMult) {
        s.phase = "crashed";
        if (round) round.writeDisplayM(s.revealedCrashMult);
        else {
          const node = multTextRef.current;
          if (node) node.textContent = `${s.revealedCrashMult.toFixed(2)}×`;
        }
        setPhaseLabel("crashed");
        const win = s.revealedCrashMult >= s.auto;
        play(win ? "win" : "lose");
      } else {
        if (round) round.writeDisplayM(m);
        else {
          const node = multTextRef.current;
          if (node) node.textContent = `${m.toFixed(2)}×`;
        }
        const decile = Math.floor(m * 10);
        if (decile !== tickedDecileRef.current) {
          tickedDecileRef.current = decile;
          play("tick");
          pulseMultiplier();
        }
      }
    },
    render: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const s = round ? round.state.current : localState.current;
      const W = Number(canvas.dataset['w'] ?? "0") || canvas.width;
      const H = Number(canvas.dataset['h'] ?? "0") || canvas.height;
      const dpr = Number(canvas.dataset['dpr'] ?? "1") || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Cached skin tokens — NEVER call getComputedStyle here.
      const skin = skinRef.current;
      const successColor = skin.success;
      const dangerColor = skin.danger;
      const liveColor = skin.live;

      const live = s.phase === "running";
      const crashed = s.phase === "crashed";
      const tNow = live
        ? (performance.now() - s.startedAt) / 1000
        : Math.log(Math.max(1, s.revealedCrashMult)) / K;
      const tEnd = Math.max(0.001, tNow);
      const steps = 64;
      const points: [number, number][] = [];
      for (let i = 0; i <= steps; i++) {
        const tt = (i / steps) * tEnd;
        const mm = Math.exp(K * tt);
        const x = (i / steps) * (W - 32) + 16;
        const y = H - 24 - Math.min(H - 48, (mm - 1) * 30);
        points.push([x, y]);
      }
      const win = crashed && s.revealedCrashMult >= s.auto;
      const color = crashed ? (win ? successColor : dangerColor) : liveColor;

      // Gradient cache keyed by (color, H). Rebuild only on change.
      const key = `${color}|${H.toFixed(0)}`;
      let grad: CanvasGradient;
      if (gradientRef.current && gradientRef.current.key === key) {
        grad = gradientRef.current.grad;
      } else {
        grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, withAlpha(color, 20));
        grad.addColorStop(1, withAlpha(color, 0));
        gradientRef.current = { key, grad };
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      if (!firstPoint || !lastPoint) return;
      ctx.moveTo(firstPoint[0], H);
      points.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(lastPoint[0], H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();

      // Polish G#1: curve tip glow (radial halo). Live = soft pulse via
      // time-modulated radius; crashed = static brighter halo.
      const [hx, hy] = lastPoint;
      const baseR = live ? 5 : 7;
      const haloR = live ? baseR + 8 + Math.sin(performance.now() / 140) * 2 : 14;
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, haloR);
      halo.addColorStop(0, withAlpha(color, 67));
      halo.addColorStop(0.55, withAlpha(color, 20));
      halo.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(hx, hy, haloR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(hx, hy, baseR, 0, Math.PI * 2);
      ctx.fill();

      if (s.auto > 1) {
        const autoT = Math.log(s.auto) / K;
        const ax = Math.min(W - 16, (autoT / tEnd) * (W - 32) + 16);
        ctx.strokeStyle = "rgba(245,200,76,0.45)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, 0);
        ctx.lineTo(ax, H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
  });

  const idleLabel = t("games.crash.idle");
  const crashedLabel = t("games.crash.ended");
  const phase = phaseLabel;
  const multTone =
    phase === "crashed" &&
    Number(r.cashoutMultiplier ?? r.crashMultiplier ?? 0) <
      Number(p.selection.autoCashout)
      ? "text-skin-danger"
      : phase === "crashed"
        ? "text-skin-success"
        : "text-foreground";

  return (
    <div
      ref={stageRef}
      data-game-id="crash-stage"
      className="relative grid gap-2 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-(--color-surface-elev) to-(--color-surface) p-2"
    >
      <CrashHistoryStrip history={history} />

      <div className="relative" data-game-id="crash-curve">
        <canvas
          ref={canvasRef}
          className="block aspect-[4/3] w-full md:aspect-[16/9] lg:min-h-[520px]"
        />

        {/* Bust flash overlay — opacity transition only. */}
        <div
          ref={flashRef}
          aria-hidden
          data-game-id="crash-bust-flash"
          className="pointer-events-none absolute inset-0 bg-skin-danger/40 opacity-0"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 grid justify-items-center pt-[14%] md:pt-[10%]">
          <div className="text-center">
            <div
              ref={badgeRef}
              data-game-id="crash-multiplier"
              className={`font-mono font-bold tabular-nums tracking-tight ${multTone}`}
              style={{
                fontSize: "clamp(56px, 11vw, 160px)",
                lineHeight: 1,
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              <span ref={multTextRef} data-testid="casino-crash-multiplier">
                1.00×
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {phase === "crashed" ? crashedLabel : idleLabel}
            </div>
          </div>
        </div>

        {phase === "crashed" && !isWin && !reduced && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
            data-game-id="crash-burst"
          >
            <style>{"@keyframes crash-burst-fade{from{opacity:.9;transform:translate(0,0) scale(.6)}to{opacity:0;transform:var(--burst-end) scale(1.2)}}"}</style>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const dx = Math.cos(angle) * 60;
              const dy = Math.sin(angle) * 60;
              return (
                <circle
                  key={i}
                  cx="50%"
                  cy="50%"
                  r="3"
                  className="fill-skin-danger"
                  style={{
                    transformOrigin: "center",
                    ["--burst-end" as string]: `translate(${dx}px, ${dy}px)`,
                    animation: `crash-burst-fade 600ms ${i * 25}ms ease-out forwards`,
                  }}
                />
              );
            })}
          </svg>
        )}

        {tier !== "none" && (
          <CelebrateOverlay
            tier={tier}
            multiplier={cashoutMultiplier.toFixed(2)}
            reduced={reduced}
          />
        )}

        <div className="absolute right-3 top-3">
          <FairnessSheet
            gameCode={p.gameCode}
            clientSeed={p.clientSeed}
            commitment={p.commitment}
            verification={p.verification}
            onClientSeedChange={p.onClientSeedChange}
          />
        </div>
      </div>
    </div>
  );
}
