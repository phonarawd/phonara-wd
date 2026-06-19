/**
 * Wave-1 · ADD-only merge of Lovable canvas i18n into @phonara/i18n.
 * Never delete/rename existing package keys.
 */
import { writeFileSync } from 'node:fs';
import { ko as lovableKo } from '../apps/web/src/i18n/ko';
import { en as lovableEn } from '../apps/web/src/i18n/en';
import { koMessages, enMessages } from '../packages/i18n/src/index';

function delta(
  lovable: Record<string, string>,
  base: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(lovable)) {
    if (!(key in base)) out[key] = value;
  }
  return out;
}

function serializeRecord(name: string, record: Record<string, string>): string {
  const lines = Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`);
  return `/** Wave-1 Lovable paste — ADD-only keys (${lines.length}). */\nexport const ${name} = {\n${lines.join('\n')}\n} as const;\n`;
}

const deltaKo = delta(lovableKo, koMessages);
const deltaEn = delta(lovableEn, enMessages);

const koOnly = Object.keys(deltaKo).filter((k) => !(k in deltaEn));
const enOnly = Object.keys(deltaEn).filter((k) => !(k in deltaKo));
if (koOnly.length || enOnly.length) {
  console.warn(`Parity gap: ko-only=${koOnly.length} en-only=${enOnly.length}`);
  for (const k of enOnly) deltaKo[k] = deltaEn[k] ?? k;
  for (const k of koOnly) deltaEn[k] = deltaKo[k] ?? k;
}

writeFileSync('packages/i18n/src/locales/lovable-ko.ts', serializeRecord('lovableKoMessages', deltaKo));
writeFileSync('packages/i18n/src/locales/lovable-en.ts', serializeRecord('lovableEnMessages', deltaEn));

console.log(`Wrote ADD-only delta: ko=${Object.keys(deltaKo).length} en=${Object.keys(deltaEn).length}`);
