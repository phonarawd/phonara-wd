import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Perf contract gate — demolition-aware.
 *
 * Pre-demolition checked `manualChunks` + deleted hooks (`useLiveCount`,
 * `useLiveTickerFeed`, `surfaces.css`). Phase R uses TanStack Router
 * `autoCodeSplitting` and live visibility/reduced-motion owners under
 * `apps/web/src/{hooks,product,features}`.
 */

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/** True when source pauses work for tab hide and/or reduced motion. */
function hasVisibilityOrReducedMotion(src: string): boolean {
  return (
    src.includes('visibilitychange') ||
    src.includes('document.hidden') ||
    src.includes('visibilityState') ||
    src.includes('prefers-reduced-motion') ||
    src.includes('DA_W4_REDUCED_MOTION_MEDIA_QUERY')
  );
}

function assertExistsWithPause(rel: string): void {
  const abs = join(root, rel);
  assert(existsSync(abs), `check:perf-contract missing required file: ${rel}`);
  const src = read(rel);
  assert(
    hasVisibilityOrReducedMotion(src),
    `${rel} must honor visibilitychange / document.hidden / prefers-reduced-motion`,
  );
}

const vite = read('apps/web/vite.config.ts');
assert(
  vite.includes('autoCodeSplitting: true'),
  'vite.config.ts must enable TanStackRouterVite autoCodeSplitting for route splits',
);

// Reduced-motion owner (canonical) + deprecated re-export path from plan inventory.
assertExistsWithPause('apps/web/src/product/primitives/lib/use-prefers-reduced-motion.ts');
assert(
  existsSync(join(root, 'apps/web/src/hooks/use-prefers-reduced-motion.ts')),
  'hooks/use-prefers-reduced-motion.ts re-export must remain for admin-safe import path',
);

// Live/ticker/chart/game owners that must pause when tab hidden or motion reduced.
const PAUSE_OWNERS = [
  'apps/web/src/product/surfaces/games/use-pixi-stage.ts',
  'apps/web/src/product/surfaces/trade/chart/use-chart-series.ts',
  'apps/web/src/features/trading/display-chart/use-display-kline.ts',
  'apps/web/src/hooks/useOddsTick.ts',
] as const;

for (const rel of PAUSE_OWNERS) {
  assertExistsWithPause(rel);
}

process.stdout.write(
  'check:perf-contract OK — autoCodeSplitting, reduced-motion, and visibility pauses verified\n',
);
