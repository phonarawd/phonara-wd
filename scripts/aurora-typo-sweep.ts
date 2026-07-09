/**
 * One-shot Aurora typo sweep — text-[Npx] → .t-* role classes.
 * Skips game Stage.tsx canvas (allowlist). Run: bun scripts/aurora-typo-sweep.ts
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WEB_SRC = 'apps/web/src';
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '__tests__']);

const STAGE_ALLOWLIST = [
  '/components/games/crash/Stage.tsx',
  '/components/games/momentum/Stage.tsx',
  '/components/games/roulette/Stage.tsx',
  '/components/games/plinko/Stage.tsx',
  '/components/games/mines/Stage.tsx',
  '/components/games/deepshaft/Stage.tsx',
  '/components/games/dice/Stage.tsx',
  '/components/games/blackjack/Stage.tsx',
  '/components/games/limbo/Stage.tsx',
  '/components/fomo/WheelOfFortune.tsx',
];

function collectTsx(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) out = out.concat(collectTsx(path));
      continue;
    }
    if (entry.endsWith('.tsx')) out.push(path.replaceAll('\\', '/'));
  }
  return out;
}

function isStageAllowlisted(rel: string): boolean {
  return STAGE_ALLOWLIST.some((suffix) => rel.endsWith(suffix));
}

function pickRole(classFragment: string, px: number): string {
  const isOverline =
    /uppercase/.test(classFragment) || /tracking-(wider|widest|wide|\[)/.test(classFragment);
  if (px <= 11) return isOverline ? 't-overline' : 't-caption';
  if (px <= 13) return 't-label';
  if (px <= 15) {
    return /font-(semibold|bold|black|extrabold)/.test(classFragment) ? 't-body-strong' : 't-body';
  }
  if (px <= 17) return 't-h';
  if (px <= 20) return 't-sub';
  return 't-body';
}

function sweepLine(line: string): string {
  return line.replace(
    /text-\[(\d+)px\]/g,
    (_match, pxStr: string, offset: number, full: string) => {
      const px = Number(pxStr);
      const before = full.slice(Math.max(0, offset - 200), offset);
      const after = full.slice(offset, Math.min(full.length, offset + 200));
      const classFragment = before + after;
      const role = pickRole(classFragment, px);
      return role;
    },
  );
}

function main(): void {
  let filesChanged = 0;
  let linesChanged = 0;

  for (const file of collectTsx(WEB_SRC)) {
    const rel = file.replaceAll('\\', '/');
    if (isStageAllowlisted(rel)) continue;

    const original = readFileSync(file, 'utf8');
    if (!/text-\[\d+px\]/.test(original)) continue;

    const lines = original.split('\n');
    let changed = false;
    const next = lines.map((line) => {
      if (!/text-\[\d+px\]/.test(line)) return line;
      if (line.includes('design-token-allow:')) return line;
      const swept = sweepLine(line);
      if (swept !== line) {
        changed = true;
        linesChanged++;
      }
      return swept;
    });

    if (changed) {
      writeFileSync(file, next.join('\n'), 'utf8');
      filesChanged++;
      console.log(`  swept ${rel}`);
    }
  }

  console.log(`\naurora-typo-sweep: ${filesChanged} files, ${linesChanged} lines`);
}

main();
