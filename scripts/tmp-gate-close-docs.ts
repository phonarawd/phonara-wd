import { readFileSync, writeFileSync } from 'node:fs';

const contract = 'docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md';
let t = readFileSync(contract, 'utf8');

if (!t.includes('GATE close ✅')) {
  t = t.replace(
    /\| \*\*GATE\*\* \| operator.*?Step 9b manual.*?L1-14 E defer \|/,
    '| **GATE** | sports L1-09-S **GATE close ✅** | **ZIP Wave-1 대기** | Step 9b PASS · S8 §GREEN · operator 「ZIP 발행 GO」 · L1-14 E defer |',
  );
  t = t.replace(
    /Sports \*\*GATE close 대기\*\*.*?Step 9b 중 Lovable NO-TOUCH[^\n]*/,
    'Sports **GATE close ✅** (2026-06-16) → operator **「Lovable 100%」+「ZIP 발행 GO」** → Wave-1 ZIP → **「PHONARA paste GO Wave-1」**. ZIP 전 Lovable NO-TOUCH (sports · mocks · i18n 1701/66 · wallet 0).',
  );
  writeFileSync(contract, t);
  console.log('contract: GATE close updated');
} else {
  console.log('contract: already updated');
}

const sportsLock = 'docs/LOVABLE_SPORTSBOOK_UI_LOCK.md';
let s = readFileSync(sportsLock, 'utf8');
if (!s.includes('GATE close ✅')) {
  s = s.replace(
    /> \*\*Queue:\*\* Sports \*\*GATE close 대기\*\*[^\n]*/,
    '> **Queue:** Sports **GATE close ✅** (2026-06-16) → ZIP Wave-1 대기 → paste Wave-1 → L1-10-W defer',
  );
  writeFileSync(sportsLock, s);
  console.log('sports lock: GATE close updated');
}
