import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

let text = execSync('git show :docs/SSOT/ACTIVE_WORK_SSOT.md', {
  encoding: 'utf8',
});

const lines = text.split(/\r?\n/);
const phaseIdx = lines.findIndex((l) => l.includes('**Phase R UI Rebuild**'));
if (phaseIdx < 0) throw new Error('Phase R row missing');
lines[phaseIdx] =
  '| **Phase R UI Rebuild**        | **IN PROGRESS (Track B E-Wave)** | **왕초보 큐:** To-do **위→아래** · completed **스킵** · Track B **`ew-e8-financial-wave` `[x]` DONE** · **다음 `ew-e8-gate-financial`** · E23 UI `[x]` · E23 GATE `[x]` · E23 WAVE `[x]` · E22–E0 · T2/T1 · P13 · DA · PQA **`[x]`** |';

const nextIdx = lines.findIndex((l) => l.includes('**현재 NEXT (전역):**'));
if (nextIdx < 0) throw new Error('NEXT line missing');

const e8Section = [
  '**현재 NEXT (전역):** **`ew-e8-gate-financial`** — E8 WAVE **`[x]` DONE** 2026-07-12 · E23 UI unlock **`[x]` DONE** 2026-07-12 · E23 GATE **`[x]` DONE** 2026-07-12 · E23 WAVE **`[x]` DONE** 2026-07-12 · E22–E0 · T2/T1 · P13 **`[x]`**',
  '',
  '## Track B E8 Financial WAVE (`ew-e8-financial-wave` · §21.1) — `[x]` DONE · 재착수 금지',
  '',
  '> **선행:** E23 UI `ew-e23-ui-casino-live-unlocks` **`[x]`** · **후행:** `ew-e8-gate-financial`',
  '',
  '| Todo | 상태 | 완료일 | 증거 |',
  '| ---- | ---- | ------ | ---- |',
  '| **`ew-e8-financial-wave`** | **`[x]` DONE** | **2026-07-12** | ADR-018 · P2P · API keys · giftcard redeem · [`ENGINE_GAP_E8_FINANCIAL.md`](../OPERATIONS/ENGINE_GAP_E8_FINANCIAL.md) |',
  '',
  '**Implemented:** `018-financial-connectivity.md` · `ew_e8_financial` migration · `rpc_transfer_to_user` · trading API keys · giftcard redeem reverse · `LAUNCH_GATES.financialConnectivityEngine=true` · `financialConnectivityLive=false` · EXISTS giftcard deposit remigration **0**',
  '',
  '**증거:** `gate:ai-impl` ew-e8-financial · vitest **9/9** (ew-e8 + settings-api-keys + dead-controls) · SQL test artifact (CI authoritative · G13) · GATE remote apply **pending**',
  '',
  '**다음 todo:** `ew-e8-gate-financial`',
  '',
];

lines.splice(nextIdx, 1, ...e8Section);

text = lines.join('\n');
text = text.replace(
  /p13-closeout-bundle \[x\] DONE\r?\n {2}→ phase_r Track A 다음 = launch-ramp-t1-feature-gates \(#237\)/,
  'ew-e8-financial-wave [x] DONE\n  → phase_r Track B 다음 = ew-e8-gate-financial',
);

writeFileSync('docs/SSOT/ACTIVE_WORK_SSOT.md', text, 'utf8');
console.log(
  JSON.stringify({
    hangul: text.includes('유일한'),
    e8: text.includes('ew-e8-gate-financial'),
    done: text.includes('재착수 금지'),
  }),
);
