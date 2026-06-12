import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * tsx runs under Node and does not inherit Bun's automatic `.env` injection when
 * invoked via `bun run`. Load repo-root env files so documented setup works.
 */
export function loadRepoEnvFiles(cwd = process.cwd()): void {
  for (const filename of ['.env', '.env.local']) {
    const path = join(cwd, filename);
    if (!existsSync(path)) continue;
    for (const rawLine of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
