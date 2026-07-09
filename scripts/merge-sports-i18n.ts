import { readFileSync, writeFileSync } from 'node:fs';

const merge = JSON.parse(readFileSync('scripts/.sports-i18n-merge.json', 'utf8')) as {
  ko: Record<string, string>;
  en: Record<string, string>;
};

const indexPath = 'packages/i18n/src/index.ts';
let src = readFileSync(indexPath, 'utf8');

function existingKeys(block: 'koMessages' | 'enMessages'): Set<string> {
  const marker = `export const ${block}`;
  const start = src.indexOf(marker);
  const end = src.indexOf('} as const satisfies', start);
  const blockSrc = src.slice(start, end);
  const keys = new Set<string>();
  for (const m of blockSrc.matchAll(/'([^']+)':/g)) keys.add(m[1]!);
  return keys;
}

const koExisting = existingKeys('koMessages');
const enExisting = existingKeys('enMessages');

const newKo = Object.entries(merge.ko).filter(([k]) => !koExisting.has(k));
const newEn = Object.entries(merge.en).filter(([k]) => !enExisting.has(k));

console.log('new ko keys', newKo.length);
console.log('new en keys', newEn.length);

function formatEntry([k, v]: [string, string]): string {
  const escaped = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (escaped.includes('\n')) {
    return `  '${k}':\n    '${escaped}',`;
  }
  return `  '${k}': '${escaped}',`;
}

if (newKo.length > 0) {
  const insertKo =
    '\n  // ── Sportsbook (Presentation Wave-1 paste) ─────────────────────────────────────\n' +
    newKo.map(formatEntry).join('\n') +
    '\n';
  const anchor =
    "  'sports.disclaimer.quota': '월 요청 한도 내에서 ingest 주기를 유지합니다. 설정은',";
  if (src.includes(anchor)) {
    src = src.replace(anchor, anchor + insertKo);
  } else {
    throw new Error('ko anchor not found');
  }
}

if (newEn.length > 0) {
  const insertEn =
    '\n  // ── Sportsbook (Presentation Wave-1 paste) ─────────────────────────────────────\n' +
    newEn.map(formatEntry).join('\n') +
    '\n';
  const anchor =
    "  'sports.disclaimer.quota': 'Ingest interval stays within the monthly request quota. Settings in',";
  if (src.includes(anchor)) {
    src = src.replace(anchor, anchor + insertEn);
  } else {
    throw new Error('en anchor not found');
  }
}

writeFileSync(indexPath, src);
console.log('merged');
