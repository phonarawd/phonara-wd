/**
 * Plinko · Pixi physics — tiny deterministic euler integrator with peg
 * collisions and lateral bias toward a target bucket.
 *
 * L1-06 v0.1 — server `bucket` is the source of truth; this integrator
 * only produces a cosmetic path. The ball is gently steered toward the
 * target X each peg pass so the visible landing matches the payout.
 */

export interface PhysicsConfig {
  gravity: number;
  restitution: number;
  damping: number;
  biasStrength: number; // 0..1 — per-collision lateral nudge toward targetX
}

export const RISK_PHYSICS: Record<"low" | "medium" | "high", PhysicsConfig> = {
  low: { gravity: 0.22, restitution: 0.55, damping: 0.992, biasStrength: 0.18 },
  medium: { gravity: 0.26, restitution: 0.62, damping: 0.99, biasStrength: 0.22 },
  high: { gravity: 0.3, restitution: 0.7, damping: 0.988, biasStrength: 0.28 },
};

/** Cosmetic-only unit in [0,1) from spawn/frame index — no game seeds. */
export function cosmeticUnit(seed: number): number {
  return ((seed * 1103515245 + 12345) >>> 0) % 1000 / 1000;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: { x: number; y: number }[];
  collidedIds: Set<number>;
}

export function createBall(x: number, radius: number, spawnIndex = 0): Ball {
  const u = cosmeticUnit(spawnIndex + 1);
  return {
    x,
    y: 8,
    vx: (u - 0.5) * 0.4,
    vy: 0,
    radius,
    trail: [],
    collidedIds: new Set(),
  };
}

export interface StepArgs {
  ball: Ball;
  pegs: { x: number; y: number }[];
  pegRadius: number;
  W: number;
  H: number;
  targetX: number;
  cfg: PhysicsConfig;
  onPegHit?: (pegIndex: number) => void;
}

/**
 * Advance the ball one frame. Returns true while still in play, false once
 * the ball has crossed the slot threshold (y > H - 30).
 */
export function step(args: StepArgs): boolean {
  const { ball, pegs, pegRadius, W, H, targetX, cfg, onPegHit } = args;
  ball.vy += cfg.gravity;
  ball.vx *= cfg.damping;
  ball.vy *= cfg.damping;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Walls
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx) * cfg.restitution;
  } else if (ball.x > W - ball.radius) {
    ball.x = W - ball.radius;
    ball.vx = -Math.abs(ball.vx) * cfg.restitution;
  }

  // Peg collisions
  const minDist = pegRadius + ball.radius;
  for (let i = 0; i < pegs.length; i++) {
    const p = pegs[i];
    if (!p) continue;
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;
      // Resolve overlap
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;
      // Reflect velocity along normal
      const vDotN = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * vDotN * nx) * cfg.restitution;
      ball.vy = (ball.vy - 2 * vDotN * ny) * cfg.restitution;
      // Lateral bias toward targetX (cosmetic agreement with server bucket)
      const lateral = Math.sign(targetX - ball.x);
      ball.vx += lateral * cfg.biasStrength;
      if (!ball.collidedIds.has(i)) {
        ball.collidedIds.add(i);
        onPegHit?.(i);
      }
    }
  }

  // Trail
  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > 8) ball.trail.shift();

  return ball.y < H - 30;
}
