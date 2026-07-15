import { readFileSync, writeFileSync } from 'node:fs';

const p = 'docs/SSOT/ACTIVE_WORK_SSOT.md';
let t = readFileSync(p, 'utf8');

t = t.replace(
  'Track A **`da-w7-enforcement-strict-tokens` (#234) `[x]`** · **다음 `da-w7-operator-visual-dae-signoff` (#235)**',
  'Track A **`da-w7-operator-visual-dae-signoff` (#235) agent impl `[x]`** · **다음 `p13-closeout-bundle` (#236)** · W7 strict `#234` `[x]`',
);

const insert = `## DA W7 Operator Visual DAE Sign-off (\`da-w7-operator-visual-dae-signoff\` · §20.12 · §34.28 · YAML #235) — agent impl \`[x]\` 2026-07-11

> **§20.12:** agent gate green ≠ Plan YAML \`completed\` — operator preview 육안 **\`VISUAL APPROVED: da-w7\`** 채팅 기록 후 Plan #235 \`completed\` 가능.

**Implemented (green):**

| 항목 | 증거 |
| ---- | ---- |
| Display contract | \`da-w7-operator-visual-dae-signoff-display-contract.ts\` · Home+Shell+Trade · 4-tier 390/768/1024/2560 · DAE checklist |
| Automated companions | surface **16/16** · contract **6/6** · axe critical 0 · dead control 0 |
| Preview | \`deploy:pages:web:preview\` → https://preview.phonara-web.pages.dev |
| Bundle gate | \`gate:ai-impl\` **22/22** · \`typecheck\` · \`check:i18n\` · \`check:release\` · engine **0** |

**operator 육안 체크리스트 (§20.12 · Plan YAML #235 completed 조건):**

1. Preview **390 / 768 / 1024 / 2560** — \`/home\` · AppShell (BottomNav·TopBar·aurora) · \`/trade\` · \`/trade/futures\`
2. Home signature day-flow · next-action accent · Shell aurora backdrop · Trade spot desk
3. dead control 0 · axe critical 0 (브라우저 DevTools)
4. 채팅 **\`VISUAL APPROVED: da-w7\`** → Plan YAML \`completed\` + §82 doc sync

**다음 todo:** \`p13-closeout-bundle\` (#236) — Plan #235 operator APPROVED 후

`;

t = t.replace(
  '**다음 todo:** `da-w7-operator-visual-dae-signoff` (#235)\n\n## P13 Soft Launch Bundle',
  '**다음 todo:** `p13-closeout-bundle` (#236) — DA W7 VISUAL #235 agent impl `[x]`\n\n' +
    insert +
    '## P13 Soft Launch Bundle',
);

t = t.replaceAll(
  '**다음 todo:** `da-w7-operator-visual-dae-signoff` (#235) — Soft Launch `#233` **`[x]`** · W7 `#234` **`[x]`**',
  '**다음 todo:** `p13-closeout-bundle` (#236) — DA W7 VISUAL #235 agent impl `[x]`',
);

t = t.replaceAll(
  '**다음 todo:** `da-w7-operator-visual-dae-signoff` (#235) — W7 strict `#234` **`[x]`**',
  '**다음 todo:** `p13-closeout-bundle` (#236) — DA W7 VISUAL #235 agent impl `[x]`',
);

t = t.replace(
  '**현재 NEXT:** **`da-w7-operator-visual-dae-signoff` (#235)**',
  '**현재 NEXT:** **`p13-closeout-bundle` (#236)**',
);

writeFileSync(p, t);
console.log('ACTIVE_WORK_SSOT updated');
