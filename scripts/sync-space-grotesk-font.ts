#!/usr/bin/env tsx
/**
 * Copy Space Grotesk variable woff2 into apps/web/public/fonts for offline numeric UI.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webFonts = join(root, 'apps', 'web', 'public', 'fonts');
const target = join(webFonts, 'SpaceGrotesk[wght].woff2');

function resolveSource(): string | null {
  const bases = [join(root, 'package.json'), join(root, 'apps', 'web', 'package.json')];
  const specs = [
    '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
    '@fontsource-variable/space-grotesk/files/space-grotesk-latin-ext-wght-normal.woff2',
  ];
  for (const base of bases) {
    if (!existsSync(base)) continue;
    const req = createRequire(base);
    for (const spec of specs) {
      try {
        return req.resolve(spec);
      } catch {
        // try next
      }
    }
  }
  return null;
}

export function syncSpaceGroteskFont(options: { quiet?: boolean } = {}): boolean {
  if (existsSync(target)) {
    if (!options.quiet) {
      process.stdout.write('[fonts] Space Grotesk already present\n');
    }
    return true;
  }

  const source = resolveSource();
  if (!source) {
    process.stderr.write(
      '[fonts] Space Grotesk package missing — run: bun add -D @fontsource-variable/space-grotesk\n',
    );
    return false;
  }

  mkdirSync(webFonts, { recursive: true });
  copyFileSync(source, target);
  if (!options.quiet) {
    process.stdout.write(`[fonts] synced Space Grotesk → ${target}\n`);
  }
  return true;
}

const ok = syncSpaceGroteskFont({ quiet: false });
if (!ok) process.exit(1);
