import { readFileSync, writeFileSync } from 'node:fs';

function parseCatalog(path: string): Record<string, string> {
  const src = readFileSync(path, 'utf8');
  const out: Record<string, string> = {};
  for (const line of src.split('\n')) {
    const mm = line.match(/^\s+"([^"]+)":\s*"(.*)",?\s*$/);
    if (mm) out[mm[1]!] = mm[2]!.replace(/\\"/g, '"');
    const mm2 = line.match(/^\s+'([^']+)':\s*'/);
    if (mm2) {
      // multiline values skipped — sports keys are single-line in external catalog
    }
  }
  return out;
}

function pickSports(o: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(o).filter(([k]) => k.startsWith('sports.') || k === 'nav.sports'),
  );
}

const lko = pickSports(parseCatalog('.tmp-sports-wave-1/src/i18n/ko.ts'));
const len = pickSports(parseCatalog('.tmp-sports-wave-1/src/i18n/en.ts'));
console.log('keys', Object.keys(lko).length, Object.keys(len).length);
writeFileSync('scripts/.sports-i18n-merge.json', JSON.stringify({ ko: lko, en: len }, null, 2));
