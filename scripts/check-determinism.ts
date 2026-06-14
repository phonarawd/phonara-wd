import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Ensures game-engine result functions stay PF-deterministic (no Math.random / Date.now).
 */

const GAMES_DIR = join(process.cwd(), 'packages/game-engine/src/games');
const SKIP = /\.(test|spec)\.ts$/;
const BANNED = [/\bMath\.random\s*\(/, /\bDate\.now\s*\(/, /\bnew Date\s*\(\s*\)/];

function collect(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out = out.concat(collect(path));
    } else if (entry.endsWith('.ts') && !SKIP.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

const violations: string[] = [];
for (const file of collect(GAMES_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('release-allow')) return;
    for (const re of BANNED) {
      if (re.test(line)) {
        violations.push(`${file.replaceAll('\\', '/')}:${i + 1}: ${line.trim()}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error('check:determinism failed — games must use floatStream only:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('check:determinism OK');
