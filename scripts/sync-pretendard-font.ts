#!/usr/bin/env tsx
/**
 * Copy Pretendard variable woff2 into apps/web/public/fonts (OFL · self-host).
 * Runtime uses Variable only — static weight files are not shipped.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webFonts = join(root, 'apps', 'web', 'public', 'fonts');

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

  const source = join(pretendardRoot, 'variable', 'woff2', VARIABLE);
  const target = join(webFonts, VARIABLE);

  if (!options.force && existsSync(target)) {
    if (!options.quiet) {
      process.stdout.write(`[fonts] ${VARIABLE} already present\n`);
    }
    return true;
  }
  if (!existsSync(source)) {
    process.stderr.write(`[fonts] missing source: ${source}\n`);
    return false;
  }
  copyFileSync(source, target);
  if (!options.quiet) {
    process.stdout.write(`[fonts] synced ${VARIABLE} → public/fonts\n`);
  }

  return true;
}

const ok = syncPretendardFont({ quiet: false });
if (!ok) process.exit(1);
