import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const vite = read('apps/web/vite.config.ts');
assert(
  vite.includes('manualChunks'),
  'vite.config.ts must declare manualChunks for route/game splits',
);

const surfaces = read('apps/web/src/styles/surfaces.css');
assert(
  surfaces.includes('prefers-reduced-motion'),
  'surfaces.css must honor prefers-reduced-motion',
);

const liveCount = read('apps/web/src/hooks/useLiveCount.ts');
assert(liveCount.includes('usePageVisible'), 'useLiveCount must pause when tab hidden');

const liveTicker = read('apps/web/src/hooks/useLiveTickerFeed.ts');
assert(liveTicker.includes('usePageVisible'), 'useLiveTickerFeed must pause when tab hidden');

process.stdout.write(
  'check:perf-contract OK — code-split, reduced-motion, and visibility pauses verified\n',
);
