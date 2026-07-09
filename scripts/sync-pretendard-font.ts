#!/usr/bin/env tsx
/**
 * Copy Pretendard variable + static woff2 into apps/web/public/fonts (OFL · self-host).
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webFonts = join(root, 'apps', 'web', 'public', 'fonts');

const STATIC_WEIGHTS = [
  'Pretendard-Regular.woff2',
  'Pretendard-Medium.woff2',
  'Pretendard-SemiBold.woff2',
  'Pretendard-Bold.woff2',
] as const;

const VARIABLE = 'PretendardVariable.woff2';

function resolvePretendardRoot(): string | null {
  const bases = [join(root, 'package.json'), join(root, 'apps', 'web', 'package.json')];
  for (const base of bases) {
    if (!existsSync(base)) continue;
    const req = createRequire(base);
    try {
      const pkg = req.resolve('pretendard/package.json');
      return join(pkg, '..', 'dist', 'web');
    } catch {
      // try next
    }
  }
  return null;
}

export function syncPretendardFont(options: { quiet?: boolean; force?: boolean } = {}): boolean {
  const pretendardRoot = resolvePretendardRoot();
  if (!pretendardRoot) {
    process.stderr.write('[fonts] pretendard package missing — run: bun add -D pretendard\n');
    return false;
  }

  mkdirSync(webFonts, { recursive: true });

  const copies: Array<{ source: string; target: string }> = [
    {
      source: join(pretendardRoot, 'variable', 'woff2', VARIABLE),
      target: join(webFonts, VARIABLE),
    },
    ...STATIC_WEIGHTS.map((name) => ({
      source: join(pretendardRoot, 'static', 'woff2', name),
      target: join(webFonts, name),
    })),
  ];

  for (const { source, target } of copies) {
    if (!options.force && existsSync(target)) {
      if (!options.quiet) {
        process.stdout.write(`[fonts] ${target.split(/[/\\]/).pop()} already present\n`);
      }
      continue;
    }
    if (!existsSync(source)) {
      process.stderr.write(`[fonts] missing source: ${source}\n`);
      return false;
    }
    copyFileSync(source, target);
    if (!options.quiet) {
      process.stdout.write(`[fonts] synced ${target.split(/[/\\]/).pop()} → public/fonts\n`);
    }
  }

  return true;
}

const ok = syncPretendardFont({ quiet: false });
if (!ok) process.exit(1);
