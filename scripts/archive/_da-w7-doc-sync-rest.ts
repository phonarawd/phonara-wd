import { readFileSync, writeFileSync } from 'node:fs';

function patch(path: string, replacers: Array<[string, string]>): void {
  let t = readFileSync(path, 'utf8');
  for (const [from, to] of replacers) {
    if (!t.includes(from)) {
      console.warn(`MISS in ${path}: ${from.slice(0, 80)}`);
      continue;
    }
    t = t.replace(from, to);
  }
  writeFileSync(path, t);
  console.log('patched', path);
}

patch('docs/CURRENT_STATUS.md', [
  [
    '| `da-w7-operator-visual-dae-signoff`     | `[ ]` NEXT      | —          | YAML #235 pending                                                                                                               |',
    '| `da-w7-operator-visual-dae-signoff`     | `[x]` agent impl | 2026-07-11 | Home+Shell+Trade · 390/768/1024/2560 · preview · axe 0 · `gate:ai-impl` **22/22** · operator `VISUAL APPROVED: da-w7` 대기 |',
  ],
  [
    '**전역 NEXT** `da-w7-operator-visual-dae-signoff` (#235) · W7 strict `#234` `[x]` · Soft Launch `#233` `[x]`',
    '**전역 NEXT** `p13-closeout-bundle` (#236) · DA W7 VISUAL `#235` agent impl `[x]` · W7 strict `#234` `[x]` · Soft Launch `#233` `[x]`',
  ],
  [
    '| `gate:ai-impl` DA W7 GATE (`da-w7-enforcement-strict-tokens`)            | vitest **19/19** · `check:design-tokens --strict` green · text-tiny · P3 legacy purge · §34.28 · engine **0** |',
    '| `gate:ai-impl` DA W7 GATE (`da-w7-enforcement-strict-tokens`)            | vitest **19/19** · `check:design-tokens --strict` green · text-tiny · P3 legacy purge · §34.28 · engine **0** |\n| `gate:ai-impl` DA W7 VISUAL (`da-w7-operator-visual-dae-signoff`)         | vitest **22/22** · Home+Shell+Trade · 4-tier · preview · axe 0 · dead control 0 · §20.12 · engine **0** |',
  ],
]);

patch('docs/PRODUCT/REBUILD_PLAN_v1.md', [
  [
    'DA W7 strict tokens **`[x]`** (2026-07-11) · **NEXT** `da-w7-operator-visual-dae-signoff` (YAML #235)',
    'DA W7 VISUAL agent impl **`[x]`** (2026-07-11) · **NEXT** `p13-closeout-bundle` (YAML #236) · Plan #235 operator `VISUAL APPROVED: da-w7` 대기',
  ],
  [
    '**현재 NEXT:** **`da-w7-operator-visual-dae-signoff`** (#235) · W7 strict `#234` **`[x]`**',
    '**현재 NEXT:** **`p13-closeout-bundle`** (#236) · DA W7 VISUAL `#235` agent impl **`[x]`** · W7 strict `#234` **`[x]`**',
  ],
]);

patch('AGENTS.md', [
  [
    '**NEXT `da-w7-operator-visual-dae-signoff` (#235)** · W7 strict tokens `#234` **`[x]` DONE**',
    '**NEXT `p13-closeout-bundle` (#236)** · DA W7 VISUAL `#235` agent impl **`[x]`** · W7 strict `#234` **`[x]` DONE**',
  ],
]);

patch('docs/SSOT/PRODUCT_EXPERIENCE_CANON.md', [
  [
    '| **W7** | `da-w7-enforcement-strict-tokens` **`[x]`**                                   | `check:design-tokens --strict` · text-tiny · legacy purge **`[x]`**         |',
    '| **W7** | `da-w7-enforcement-strict-tokens` **`[x]`**                                   | `check:design-tokens --strict` · text-tiny · legacy purge **`[x]`**         |\n| **W7** | `da-w7-operator-visual-dae-signoff` agent impl **`[x]`**                        | Home+Shell+Trade · 390/768/1024/2560 · preview · axe 0 · operator `VISUAL APPROVED: da-w7` 대기 |',
  ],
]);

patch('docs/SSOT/DESIGN_PRINCIPLES.md', [
  [
    '- [x] da-w7: `check:design-tokens --strict` · text-tiny · legacy purge (`da-w7-enforcement-strict-tokens`)',
    '- [x] da-w7: `check:design-tokens --strict` · text-tiny · legacy purge (`da-w7-enforcement-strict-tokens`)\n- [x] da-w7 VISUAL agent impl: Home+Shell+Trade · 4-tier · preview (`da-w7-operator-visual-dae-signoff`) · operator `VISUAL APPROVED: da-w7` 대기',
  ],
]);

patch('docs/SSOT/UNIFIED_UX_CANON.md', [
  [
    '- [x] da-w7: Strict tokens GATE (`da-w7-enforcement-strict-tokens`) — `check:design-tokens --strict` · text-tiny · legacy purge · `gate:ai-impl` **19/19**',
    '- [x] da-w7: Strict tokens GATE (`da-w7-enforcement-strict-tokens`) — `check:design-tokens --strict` · text-tiny · legacy purge · `gate:ai-impl` **19/19**\n- [x] da-w7 VISUAL agent impl (`da-w7-operator-visual-dae-signoff`) — Home+Shell+Trade · 390/768/1024/2560 · preview · axe 0 · `gate:ai-impl` **22/22** · operator `VISUAL APPROVED: da-w7` 대기',
  ],
]);

patch('docs/OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md', [
  [
    '**다음:** `da-w7-operator-visual-dae-signoff` — Soft Launch · W7 strict **`[x]`**',
    '**다음:** `p13-closeout-bundle` — DA W7 VISUAL `#235` agent impl **`[x]`** · Soft Launch · W7 strict **`[x]`**',
  ],
]);

patch('docs/OPERATIONS/P13_T0A_PROD_PREFLIGHT.md', [
  [
    '**다음:** `da-w7-operator-visual-dae-signoff` — Soft Launch `#233` · W7 `#234` **`[x]`**',
    '**다음:** `p13-closeout-bundle` — DA W7 VISUAL `#235` agent impl **`[x]`** · Soft Launch `#233` · W7 `#234` **`[x]`**',
  ],
]);

patch('docs/SSOT/ADMIN_BEGINNER_LANGUAGE_CANON.md', [
  [
    '- Soft Launch: [`P13_SOFT_LAUNCH_BUNDLE.md`](../OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md) · W7 strict `#234` **`[x]`** · **다음** `da-w7-operator-visual-dae-signoff` (#235)',
    '- Soft Launch: [`P13_SOFT_LAUNCH_BUNDLE.md`](../OPERATIONS/P13_SOFT_LAUNCH_BUNDLE.md) · W7 strict `#234` **`[x]`** · DA W7 VISUAL `#235` agent impl **`[x]`** · **다음** `p13-closeout-bundle` (#236)',
  ],
]);
