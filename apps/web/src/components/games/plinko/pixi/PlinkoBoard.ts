/**
 * Plinko · PlinkoBoard — Pixi v8 Application wrapper.
 *
 * L1-06 v0.1 — owns the WebGL canvas, peg grid, ball pool, slot pulses.
 * Mounts onto an existing <canvas> ref; jsdom/WebGL absence is tolerated
 * by callers via try/catch around {@link PlinkoBoard.init} (F12).
 *
 * Server `bucket` is the source of truth — {@link drop} biases the
 * integrator toward the target X so the cosmetic landing always matches
 * the payout (client never recomputes — F3).
 */
import { Application, Container, Graphics } from "pixi.js";
import { computeLayout, readTokens, biasedStartX, type Risk, type PixiTokens } from "./board";
import { createBall, step, RISK_PHYSICS, type Ball } from "./physics";

export interface BoardOpts {
  rows: 8 | 12 | 16;
  risk: Risk;
  reduced: boolean;
}

export interface DropArgs {
  targetBucket: number;
  onLand: (bin: number) => void;
}

export class PlinkoBoard {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private opts: BoardOpts;
  private tokens: PixiTokens = readTokens();
  private pegLayer = new Container();
  private ballLayer = new Container();
  private fxLayer = new Container();
  private pegGfx: Graphics | null = null;
  private slotsGfx: Graphics | null = null;
  private balls: Array<{ gfx: Graphics; trail: Graphics; ball: Ball; targetX: number; onLand: (b: number) => void }> = [];
  private pegFlashes: Map<number, number> = new Map(); // pegIndex → frames remaining
  private slotPulses: Map<number, { frames: number; tone: "up" | "down" }> = new Map();
  private W = 0;
  private H = 0;
  private tickerCb: ((ticker: { deltaMS: number }) => void) | null = null;
  private visibilityCb: (() => void) | null = null;
  private dropCounter = 0;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement, opts: BoardOpts) {
    this.canvas = canvas;
    this.container = container;
    this.opts = opts;
  }

  async init(): Promise<void> {
    const app = new Application();
    await app.init({
      canvas: this.canvas,
      antialias: true,
      backgroundAlpha: 0,
      hello: false,
      resolution: Math.min(globalThis.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: this.container,
    });
    this.app = app;
    app.stage.addChild(this.pegLayer);
    app.stage.addChild(this.fxLayer);
    app.stage.addChild(this.ballLayer);
    this.measure();
    this.drawBoard();
    if (!this.opts.reduced) {
      this.tickerCb = (ticker) => this.tick(ticker.deltaMS);
      app.ticker.add(this.tickerCb);
    }
    if (typeof document !== "undefined") {
      this.visibilityCb = () => {
        if (!this.app) return;
        if (document.hidden) this.app.ticker.stop();
        else this.app.ticker.start();
      };
      document.addEventListener("visibilitychange", this.visibilityCb);
    }
  }

  rebuild(opts: BoardOpts): void {
    this.opts = opts;
    this.balls = [];
    this.ballLayer.removeChildren();
    this.fxLayer.removeChildren();
    this.pegFlashes.clear();
    this.slotPulses.clear();
    this.measure();
    this.drawBoard();
  }

  resize(): void {
    if (!this.app) return;
    this.measure();
    this.drawBoard();
  }

  drop({ targetBucket, onLand }: DropArgs): void {
    if (!this.app) {
      // jsdom/WebGL-less fallback: deliver landing immediately (F12).
      onLand(targetBucket);
      return;
    }
    const layout = computeLayout(this.W, this.H, this.opts.rows);
    const dropIndex = this.dropCounter++;
    const startX = biasedStartX(this.W, layout.bins, targetBucket, dropIndex);
    const ball = createBall(startX, layout.ballRadius, dropIndex);
    const gfx = new Graphics().circle(0, 0, layout.ballRadius).fill({ color: this.tokens.up });
    gfx.x = ball.x;
    gfx.y = ball.y;
    const trail = new Graphics();
    this.ballLayer.addChild(trail);
    this.ballLayer.addChild(gfx);
    this.balls.push({
      gfx,
      trail,
      ball,
      targetX: layout.binWidth * (targetBucket + 0.5),
      onLand,
    });
    if (this.opts.reduced) {
      // Reduced motion: snap landing.
      this.landBall(this.balls.length - 1, targetBucket);
    }
  }

  destroy(): void {
    if (this.visibilityCb && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityCb);
    }
    this.visibilityCb = null;
    if (this.tickerCb && this.app) this.app.ticker.remove(this.tickerCb);
    this.tickerCb = null;
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.balls = [];
    this.pegFlashes.clear();
    this.slotPulses.clear();
  }

  // --- private --------------------------------------------------------------

  private measure(): void {
    const rect = this.container.getBoundingClientRect();
    this.W = Math.max(1, rect.width);
    this.H = Math.max(1, rect.height);
  }

  private drawBoard(): void {
    if (!this.app) return;
    const layout = computeLayout(this.W, this.H, this.opts.rows);
    if (!this.pegGfx) {
      this.pegGfx = new Graphics();
      this.pegLayer.addChild(this.pegGfx);
    }
    if (!this.slotsGfx) {
      this.slotsGfx = new Graphics();
      this.pegLayer.addChild(this.slotsGfx);
    }
    this.pegGfx.clear();
    layout.pegs.forEach((p) => {
      this.pegGfx!.circle(p.x, p.y, layout.pegRadius).fill({
        color: this.tokens.pegBase,
        alpha: 0.18,
      });
    });
    // Slot rim — show bin boundaries near floor.
    this.slotsGfx.clear();
    const slotY = this.H - 24;
    for (let i = 0; i < layout.bins; i++) {
      const x = layout.binWidth * i;
      this.slotsGfx.rect(x + 1, slotY, layout.binWidth - 2, 18).fill({
        color: this.tokens.primary,
        alpha: 0.06,
      });
    }
  }

  private tick(deltaMS: number): void {
    if (!this.app) return;
    const layout = computeLayout(this.W, this.H, this.opts.rows);
    const cfg = RISK_PHYSICS[this.opts.risk];

    // Step balls.
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const entry = this.balls[i];
      if (!entry) continue;
      const alive = step({
        ball: entry.ball,
        pegs: layout.pegs,
        pegRadius: layout.pegRadius,
        W: this.W,
        H: this.H,
        targetX: entry.targetX,
        cfg,
        onPegHit: (idx) => {
          // Brief peg flash (~12 frames).
          this.pegFlashes.set(idx, 12);
        },
      });
      entry.gfx.x = entry.ball.x;
      entry.gfx.y = entry.ball.y;
      // Draw trail.
      entry.trail.clear();
      const trailLen = this.opts.risk === "high" ? 1.5 : 1;
      entry.ball.trail.forEach((pt, ti) => {
        const a = ((ti + 1) / entry.ball.trail.length) * 0.35 * trailLen;
        entry.trail.circle(pt.x, pt.y, entry.ball.radius * 0.7).fill({
          color: this.tokens.up,
          alpha: a,
        });
      });
      if (!alive) {
        const bin = Math.max(
          0,
          Math.min(layout.bins - 1, Math.floor(entry.ball.x / layout.binWidth)),
        );
        this.landBall(i, bin);
      }
    }

    // Peg flashes decay.
    if (this.pegFlashes.size > 0) {
      this.fxLayer.removeChildren();
      const flashGfx = new Graphics();
      this.fxLayer.addChild(flashGfx);
      for (const [idx, frames] of this.pegFlashes) {
        const p = layout.pegs[idx];
        if (!p) continue;
        const t = frames / 12;
        flashGfx
          .circle(p.x, p.y, layout.pegRadius * (1 + (1 - t) * 1.4))
          .stroke({ color: this.tokens.primary, width: 1.2, alpha: t * 0.8 });
        const next = frames - Math.max(1, Math.round(deltaMS / 16));
        if (next <= 0) this.pegFlashes.delete(idx);
        else this.pegFlashes.set(idx, next);
      }
    } else if (this.fxLayer.children.length > 0) {
      this.fxLayer.removeChildren();
    }

    // Slot pulses.
    if (this.slotPulses.size > 0 && this.slotsGfx) {
      this.slotsGfx.clear();
      const slotY = this.H - 24;
      for (let i = 0; i < layout.bins; i++) {
        const x = layout.binWidth * i;
        const pulse = this.slotPulses.get(i);
        if (pulse) {
          const t = pulse.frames / 36;
          const color = pulse.tone === "up" ? this.tokens.up : this.tokens.down;
          this.slotsGfx.rect(x + 1, slotY, layout.binWidth - 2, 18).fill({
            color,
            alpha: 0.2 + t * 0.5,
          });
          const next = pulse.frames - Math.max(1, Math.round(deltaMS / 16));
          if (next <= 0) this.slotPulses.delete(i);
          else this.slotPulses.set(i, { frames: next, tone: pulse.tone });
        } else {
          this.slotsGfx.rect(x + 1, slotY, layout.binWidth - 2, 18).fill({
            color: this.tokens.primary,
            alpha: 0.06,
          });
        }
      }
    }
  }

  private landBall(index: number, bin: number): void {
    const entry = this.balls[index];
    if (!entry) return;
    this.ballLayer.removeChild(entry.gfx);
    this.ballLayer.removeChild(entry.trail);
    this.balls.splice(index, 1);
    // We don't know win/loss here; tone is set by caller via slot color in
    // drawBoard. Default 'up' — Stage will distinguish via the existing
    // multiplier strip DOM (which already tints win/loss).
    this.slotPulses.set(bin, { frames: 36, tone: "up" });
    entry.onLand(bin);
  }
}
