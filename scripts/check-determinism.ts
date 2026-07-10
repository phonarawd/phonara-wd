import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Ensures game-engine result functions stay PF-deterministic (no Math.random / Date.now)
 * and that PIR P2 PF golden vectors cover all 12 casino games (SQL authority).
 */

const ROOT = process.cwd();
const GAMES_DIR = join(ROOT, 'packages/game-engine/src/games');
const GOLDEN_VECTORS = join(ROOT, 'packages/game-engine/src/fairness/pf-golden-vectors.ts');
const SKIP = /\.(test|spec)\.ts$/;
const BANNED = [/\bMath\.random\s*\(/, /\bDate\.now\s*\(/, /\bnew Date\s*\(\s*\)/];

const GAME_CODES = [
  'crash',
  'limbo',
  'dice',
  'mines',
  'hilo',
  'plinko',
  'mint_reels',
  'gold_rush',
  'roulette',
  'blackjack',
  'deepshaft',
  'momentum',
] as const;

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

if (!existsSync(GOLDEN_VECTORS)) {
  violations.push(`missing PF golden vectors fixture: ${GOLDEN_VECTORS.replaceAll('\\', '/')}`);
} else {
  const golden = readFileSync(GOLDEN_VECTORS, 'utf8');
  for (const code of GAME_CODES) {
    // Seed vectors use `game: 'code'` — boundary vectors list codes in games: [...]
    const inSeed = golden.includes(`game: '${code}'`);
    const inBoundary = golden.includes(`'${code}'`);
    if (!inSeed) {
      violations.push(`pf-golden-vectors.ts missing seed vector for game: ${code}`);
    }
    if (!inBoundary) {
      violations.push(`pf-golden-vectors.ts missing boundary coverage for game: ${code}`);
    }
  }
  for (const token of [
    'PF_FLOAT_MAX',
    'PF_FLOAT_MIN',
    'PF_GOLDEN_SEED',
    'PF_BOUNDARY_FORMULA_VECTORS',
    'PF_SEED_RESULT_VECTORS',
    'assertPfGoldenCoverageComplete',
  ]) {
    if (!golden.includes(token)) {
      violations.push(`pf-golden-vectors.ts missing export/symbol: ${token}`);
    }
  }
}

if (violations.length > 0) {
  console.error('check:determinism failed — PF determinism / golden vectors:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('check:determinism OK — no banned RNG · 12-game PF golden vectors pinned');
