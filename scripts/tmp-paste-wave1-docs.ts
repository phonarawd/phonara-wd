import { readFileSync, writeFileSync } from 'node:fs';

const contract = 'docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md';
let t = readFileSync(contract, 'utf8');
if (!t.includes('paste Wave-1 ✅')) {
  t = t.replace(
    /\| \*\*GATE\*\* \| sports ZIP Wave-1 \*\*✅ §GREEN\*\* \| \*\*paste Wave-1 대기\*\* \|/,
    '| **GATE** | sports ZIP Wave-1 ✅ · **paste Wave-1 ✅** | **L1-10-W G4 대기** |',
  );
  t = t.replace(
    /ZIP Wave-1 ✅ \(92\.4 KB · 32 files\) → \*\*「PHONARA paste GO Wave-1」\*\./,
    'ZIP Wave-1 ✅ → paste Wave-1 ✅ (2026-06-16) → **L1-10-W EXECUTE GO** 대기.',
  );
  writeFileSync(contract, t);
  console.log('updated');
}
