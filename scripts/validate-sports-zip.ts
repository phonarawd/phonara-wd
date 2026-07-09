import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), '.tmp-sports-wave-1', 'src');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const ko = readFileSync(join(root, 'i18n/ko.ts'), 'utf8');
const en = readFileSync(join(root, 'i18n/en.ts'), 'utf8');
const keyCount = (s: string) => (s.match(/^ {2}"/gm) ?? []).length;
const sportsCount = (s: string) => (s.match(/"sports\.|"nav\.sports"/g) ?? []).length;

const files = walk(root).filter((f) => !f.includes(`${join('i18n', '')}`));
let floatHits = 0;
let slipHits = 0;
for (const f of files) {
  const t = readFileSync(f, 'utf8');
  if (/parseFloat|Number\(/.test(t) && !/\/\//.test(t.split('\n')[0])) {
    /* allow comments only - rough */
  }
  if (/\bparseFloat\b|\bNumber\(/.test(t.replace(/\/\/.*$/gm, ''))) floatHits++;
  if (t.includes('slipMarketId')) slipHits++;
}

console.log(
  JSON.stringify(
    {
      keysKo: keyCount(ko),
      keysEn: keyCount(en),
      sportsKo: sportsCount(ko),
      sportsEn: sportsCount(en),
      files: walk(root).length,
      slipMarketIdFiles: slipHits,
      floatFileHits: floatHits,
      walletHits: walk(root).filter((f) => /wallet|deposit|withdraw/i.test(f)).length,
    },
    null,
    2,
  ),
);
