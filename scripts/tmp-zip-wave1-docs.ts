import { readFileSync, writeFileSync } from 'node:fs';

const contract = 'docs/PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md';
let t = readFileSync(contract, 'utf8');
if (!t.includes('ZIP Wave-1 ✅')) {
  t = t.replace(
    /\| \*\*GATE\*\* \| sports L1-09-S \*\*GATE close ✅\*\* \| \*\*ZIP Wave-1 대기\*\* \|/,
    '| **GATE** | sports ZIP Wave-1 **✅ §GREEN** | **paste Wave-1 대기** |',
  );
  t = t.replace(
    /operator \*\*「Lovable 100%」\+「ZIP 발행 GO」\*\* → Wave-1 ZIP →/,
    'ZIP Wave-1 ✅ (92.4 KB · 32 files) →',
  );
  writeFileSync(contract, t);
  console.log('contract updated');
}
