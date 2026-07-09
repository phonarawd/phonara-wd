#!/usr/bin/env tsx
/**
 * Copy JetBrains Mono variable woff2 into apps/web/public/fonts for offline PWA + trade mono.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const webFonts = join(root, 'apps', 'web', 'public', 'fonts');
const target = join(webFonts, 'JetBrainsMono[wght].woff2');

function resolveSource(): string | null {
  const bases = [join(root, 'package.json'), join(root, 'apps', 'web', 'package.json')];
  const specs = [
    '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
    '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2',
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

export function syncJetBrainsMonoFont(options: { quiet?: boolean } = {}): boolean {
  if (existsSync(target)) {
    if (!options.quiet) {
      process.stdout.write('[fonts] JetBrains Mono already present\n');
    }
    return true;
  }

  const source = resolveSource();
  if (!source) {
    process.stderr.write(
      '[fonts] JetBrains Mono package missing — run: bun add -D @fontsource-variable/jetbrains-mono\n',
    );
    return false;
  }

  mkdirSync(webFonts, { recursive: true });
  copyFileSync(source, target);
  if (!options.quiet) {
    process.stdout.write(`[fonts] synced JetBrains Mono → ${target}\n`);
  }
  return true;
}

const ok = syncJetBrainsMonoFont({ quiet: false });
if (!ok) process.exit(1);
