#!/usr/bin/env node
/**
 * apply-plan-todo-merge-50.ts — 50차 Tier-1 todo 병합 (plan frontmatter + 본문 id 치환)
 * Usage: bun run scripts/apply-plan-todo-merge-50.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos, type PlanTodo } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

/** removed id → surviving id (본문 grep 치환용) */
const ID_REDIRECT: Record<string, string> = {
  'da-w0-adr-digital-aurora': 'da-w0-foundation-ssot-bundle',
  'da-w0-ssot-emotion-map': 'da-w0-foundation-ssot-bundle',
  'da-w0-ssot-interaction-grammar': 'da-w0-foundation-ssot-bundle',
  'da-w0-ssot-brand-memory': 'da-w0-foundation-ssot-bundle',
  'da-w0-ssot-accessibility-elevation': 'da-w0-foundation-ssot-bundle',
  'da-w1-ds-text-primitive': 'da-w1-ds-foundation-bundle',
  'da-w1-ds-elevation-tokens': 'da-w1-ds-foundation-bundle',
  'da-w1-ds-card-cva-variants': 'da-w1-ds-foundation-bundle',
  'da-w1-ds-spacing-8pt-ratchet': 'da-w1-ds-foundation-bundle',
  'da-w2-shell-aurora-backdrop': 'da-w2-shell-elevation-infra',
  'da-w2-shell-floating-nav-12col': 'da-w2-shell-elevation-infra',
  'p10-casino-oneshot-replay-contract': 'p10-casino-replay-and-infra',
  'p10-casino-infra': 'p10-casino-replay-and-infra',
  'p10-sports-parity-matrix-sync': 'p10-sports-parity-contract-and-board',
  'p10-sports-multi-market-board': 'p10-sports-parity-contract-and-board',
  'p10-page-sports-live': 'p10-sports-live-surface-wire',
  'p10-sports-live-inplay-wire': 'p10-sports-live-surface-wire',
  'p13-prep-admin-beginner-language': 'p13-prep-admin-canonical-docs',
  'p13-prep-admin-correspondence-matrix': 'p13-prep-admin-canonical-docs',
  'ew-e3-gate-cms': 'ew-e3-gate-cms-promotions',
  'ew-e3-gate-promotions': 'ew-e3-gate-cms-promotions',
};

const SKIP_IDS = new Set([
  'da-w0-ssot-emotion-map',
  'da-w0-ssot-interaction-grammar',
  'da-w0-ssot-brand-memory',
  'da-w0-ssot-accessibility-elevation',
  'da-w1-ds-elevation-tokens',
  'da-w1-ds-card-cva-variants',
  'da-w1-ds-spacing-8pt-ratchet',
  'da-w2-shell-floating-nav-12col',
  'p10-casino-infra',
  'p10-sports-multi-market-board',
  'p10-page-sports-live',
  'p10-sports-live-inplay-wire',
  'p13-prep-admin-correspondence-matrix',
  'ew-e3-gate-cms',
  'ew-e3-gate-promotions',
]);

const MERGED: Record<string, string> = {
  'da-w0-foundation-ssot-bundle':
    '[DA·W0·BUNDLE] §34 W0 Foundation — ADR-004 brand DNA 5문법(Aurora Mesh·Quad Stream·Orbit Grid·Signal Pulse·Neural Glow) · elevation ladder · motion tier L0/L1/L2 · PC 12-col · §34.2 Emotion Map · §34.3 Interaction Grammar · §34.4 Brand Memory · §34.5 Accessibility Elevation · docs/SSOT/PRODUCT_EXPERIENCE_CANON.md · UNIFIED_UX_CANON · DESIGN_PRINCIPLES §7 · **동일 PR 필수**(50차 merge · SSOT drift 0) · 선행:pqa-gate-platform-audit · gate:check:ai-reference',
  'da-w1-ds-foundation-bundle':
    '[DA·W1·BUNDLE] §34.6–34.9 DS Foundation — Text primitive · elevation.css · Card CVA(default|raised|glass|mission|wallet-hero|vip|trade-dense|casino-play) · 8pt spacing ratchet · product/tokens+primitives · parallel card 0 · **동일 PR 필수**(50차 merge) · 선행:da-w0-foundation-ssot-bundle',
  'da-w2-shell-elevation-infra':
    '[DA·W2·BUNDLE] §34.10–34.11 Shell elevation — aurora-background.tsx+css · floating BottomNav(blur+shadow-2) · layout.css 12-col · ds-shell-panel-grid col-span-8/4 · Earn lg+ side rails · prefers-reduced-motion static · **동일 PR 필수**(50차 merge) · 선행:da-w1-gate-ds-2',
  'p10-sports-parity-contract-and-board':
    '[P10·BUNDLE] §22.2.5 Sports parity+board — `sports-exchange-parity-display-contract.ts`+test · SPORTS_UI_ZONE_OWNERS·COMPLAINT_RISKS·ACTION_PATH_REGISTRY · fixture 멀티마켓 `rpc_get_fixture_markets` wire · totals·spread·handicap·asian_handicap·btts·props · **동일 PR 필수**(50차 merge · contract drift 0) · 선행:p10-page-sports-my-bets',
  'p10-sports-live-surface-wire':
    '[P10·UI] /sports/live surface — ENGINE:exists live markets · `useLiveFixtureState`+`sports-realtime-cache` in-play wire · goal/market suspend 배너 · live delay · score 갱신 · **기존 route 확장만·신규 route 0** · **동일 PR 필수**(50차 merge) · 선행:p10-sports-parity-contract-and-board',
  'p10-casino-replay-and-infra':
    '[P10·BUNDLE] §23.2.1 Casino replay+shell — `casino-outcome-replay-contract.ts`+test · 12종 one-shot 원자 정산 · CasinoGameShell·AutoBetPanel·BetModeTabs·useAutoBetQueue·WinTierOverlay·GameOutcomeLayer·PF strip · §34.17 casino-play card · USDT/PHON stake toggle · **동일 PR 필수**(50차 merge) · 선행:p10-page-casino',
  'p13-prep-admin-canonical-docs':
    '[P13·DOC] Admin canonical docs — §29.1·§29.5 ADMIN_BEGINNER_LANGUAGE_CANON · admin-beginner-language-display-contract.ts · PHONARA_USER_ADMIN_CORRESPONDENCE_MATRIX · ADMIN_TEAM_RBAC_CANON · §12.14↔§29.2 · **동일 PR 필수**(50차 merge) · 선행:da-w8-gate-signature-experience',
  'ew-e3-gate-cms-promotions':
    '[E·GATE] Viral+CMS engine verified — test:sql · stack:push-remote · unlock /referral/leaderboard · /admin/promotions · /admin/cms · /announcements full · 선행:ew-e3-engine-promotions-cms',
};

function redirectContent(content: string): string {
  let out = content;
  for (const [oldId, newId] of Object.entries(ID_REDIRECT)) {
    if (oldId === newId) continue;
    out = out.replaceAll(oldId, newId);
  }
  return out;
}

function applyMerges(todos: PlanTodo[]): PlanTodo[] {
  const out: PlanTodo[] = [];

  for (const todo of todos) {
    if (SKIP_IDS.has(todo.id)) continue;

    if (todo.id === 'da-w0-adr-digital-aurora') {
      out.push({
        id: 'da-w0-foundation-ssot-bundle',
        status: todo.status,
        content: MERGED['da-w0-foundation-ssot-bundle'],
      });
      continue;
    }
    if (todo.id === 'da-w1-ds-text-primitive') {
      out.push({
        id: 'da-w1-ds-foundation-bundle',
        status: todo.status,
        content: MERGED['da-w1-ds-foundation-bundle'],
      });
      continue;
    }
    if (todo.id === 'da-w1-gate-ds-2') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[DA·W1·GATE] DS 2.0 bundle — gate:ai-impl primitives+tokens · typecheck · check:i18n · check:design-tokens advisory · 82 ACTIVE_WORK_SSOT NEXT=da-w2 · 선행:da-w1-ds-foundation-bundle',
      });
      continue;
    }
    if (todo.id === 'da-w2-shell-aurora-backdrop') {
      out.push({
        id: 'da-w2-shell-elevation-infra',
        status: todo.status,
        content: MERGED['da-w2-shell-elevation-infra'],
      });
      continue;
    }
    if (todo.id === 'da-w2-gate-shell-elevation') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[DA·W2·GATE] Shell elevation — check:ui-architecture · gate:ai-impl shell · 390/768/1024 smoke · 5탭 IA unchanged · 선행:da-w2-shell-elevation-infra → da-w3',
      });
      continue;
    }
    if (todo.id === 'p10-page-sports-fixture') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[P10·UI] /sports/fixture/$fixtureId — ENGINE:exists fixture markets · 선행:p10-page-sports-prematch',
      });
      continue;
    }
    if (todo.id === 'p10-sports-parity-matrix-sync') {
      out.push({
        id: 'p10-sports-parity-contract-and-board',
        status: todo.status,
        content: MERGED['p10-sports-parity-contract-and-board'],
      });
      out.push({
        id: 'p10-sports-live-surface-wire',
        status: todo.status,
        content: MERGED['p10-sports-live-surface-wire'],
      });
      continue;
    }
    if (todo.id === 'p10-sports-cashout-wire') {
      out.push({
        id: todo.id,
        status: todo.status,
        content: redirectContent(todo.content).replace(
          '선행:p10-sports-live-inplay-wire',
          '선행:p10-sports-live-surface-wire',
        ),
      });
      continue;
    }
    if (todo.id === 'p10-casino-oneshot-replay-contract') {
      out.push({
        id: 'p10-casino-replay-and-infra',
        status: todo.status,
        content: MERGED['p10-casino-replay-and-infra'],
      });
      continue;
    }
    if (todo.id === 'p10-casino-fiat-hint-session-lock') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[P10·UI] Casino fiat hint session-lock — bet open 시 rate snapshot 고정 · spin 간 hint drift 0 · `CasinoFiatRateSession` · **Fiat#11** · 선행:p4-fiat-money-display-hint+p10-casino-replay-and-infra',
      });
      continue;
    }
    if (todo.id === 'p10-games-batch-a') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[P10·UI] /games crash·limbo·dice — instant loop · WinTier L1 · §23.2·§23.8 · 선행:p10-casino-replay-and-infra',
      });
      continue;
    }
    if (todo.id === 'p13-prep-admin-beginner-language') {
      out.push({
        id: 'p13-prep-admin-canonical-docs',
        status: todo.status,
        content: MERGED['p13-prep-admin-canonical-docs'],
      });
      continue;
    }
    if (todo.id === 'p13-prep-admin-team-desk') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[P13·UI] /admin/team — 직원 권한 주기 · §29.5 초등어 · rpc_admin_set_role_grant · owner만 메뉴 · settings에서 링크 · 선행:p13-prep-admin-canonical-docs',
      });
      continue;
    }
    if (todo.id === 'ew-e3-engine-promotions-cms') {
      out.push({ id: todo.id, status: todo.status, content: todo.content });
      out.push({
        id: 'ew-e3-gate-cms-promotions',
        status: 'pending',
        content: MERGED['ew-e3-gate-cms-promotions'],
      });
      continue;
    }
    if (todo.id === 'ew-e4-adr-tier-option-b') {
      out.push({
        id: todo.id,
        status: todo.status,
        content:
          '[E·ADR] Option B rpc_get_user_tier_summary + fee tier caps · 선행:ew-e3-gate-cms-promotions',
      });
      continue;
    }

    out.push({
      id: todo.id,
      status: todo.status,
      content: redirectContent(todo.content),
    });
  }

  return out;
}

function serializeTodos(todos: PlanTodo[]): string {
  const lines = ['todos:'];
  for (const t of todos) {
    lines.push(`  - id: ${t.id}`);
    lines.push(`    content: "${t.content.replace(/"/g, '\\"')}"`);
    lines.push(`    status: ${t.status}`);
  }
  return lines.join('\n');
}

function replaceIdsInBody(text: string): string {
  let out = text;
  const entries = Object.entries(ID_REDIRECT)
    .filter(([a, b]) => a !== b)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [oldId, newId] of entries) {
    out = out.replaceAll(`\`${oldId}\``, `\`${newId}\``);
    out = out.replaceAll(oldId, newId);
  }
  // Sports ladder §20.13.3
  out = out.replace(
    /Sports#1 \| `p10-sports-parity-contract-and-board` \| DOC \| `p10-page-sports-my-bets`[\s\S]*?Sports#2 \| `p10-sports-parity-contract-and-board`[\s\S]*?Sports#3 \| `p10-sports-live-surface-wire`/,
    `Sports#1 | \`p10-sports-parity-contract-and-board\` | BUNDLE | \`p10-page-sports-my-bets\` | parity contract + multi-market board (50차 merge) |
| Sports#2 | \`p10-sports-live-surface-wire\` | UI | Sports#1 | live page + in-play wire (50차 merge)`,
  );
  out = out.replace(
    /CasinoR#1 \| `p10-casino-replay-and-infra`[\s\S]*?— §23\.2\.1 · 이후 `p10-casino-replay-and-infra`/,
    'CasinoR#1 | `p10-casino-replay-and-infra` | BUNDLE | `p10-page-casino` | §23.2.1 replay contract + casino shell (50차 merge)',
  );
  return out;
}

function patchOverview(header: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  return header
    .replace(/\*\*359 ids\*\*/g, `**${summary.ids} ids**`)
    .replace(/W0–W8 · 36 ids\*\*/g, `W0–W8 · 28 ids**`)
    .replace(/\+36 DA W0–W8/g, `+28 DA W0–W8 (50차 merge −8)`);
}

function patchSection206(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  out = out.replace(
    /\*\*총량 \(정본\):\*\* \*\*\d+ ids\*\* = Track A \*\*\d+\*\*[^+]+\+ Track B \*\*\d+\*\*/,
    `**총량 (정본):** **${summary.ids} ids** = Track A **${summary.trackA}** (+28 DA W0–W8 · 50차 merge) + Track B **${summary.trackB}**`,
  );
  out = out.replace(
    /\*\*status 실측 \([^)]+\):\*\* `completed` \*\*\d+\*\* · `pending` \*\*\d+\*\*[^·]*/,
    `**status 실측 (2026-07-09 · 50차 merge sync):** \`completed\` **${summary.completed}** · \`pending\` **${summary.pending}** (+28 da-w*)`,
  );
  out = out.replace(
    /\*\*현재 NEXT:\*\* `[^`]+` \(YAML \*\*#\d+\*\*\)/,
    `**현재 NEXT:** \`${summary.firstPendingId}\` (YAML **#${summary.firstPendingIndex}**)`,
  );
  out = out.replace(/(\| \*\*총량\*\* \| \*\*)\d+(\*\* \| frontmatter)/, `$1${summary.ids}$2`);
  out = out.replace(
    /(\| \*\*Track A \(P0–P13\+PQA\)\*\* \| \*\*)\d+(\*\* \|)/,
    `$1${summary.trackA}$2`,
  );
  out = out.replace(/(\| \*\*Track B \(E0–E23\)\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.trackB}$2`);
  out = out.replace(
    /(\| \*\*합계 검증\*\* \| \*\*)\d+\+\d+=(\d+)(\*\* \|)/,
    `$1${summary.trackA}+${summary.trackB}=${summary.ids}$3`,
  );
  out = out.replace(/(\| \*\*pending\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.pending}$2`);
  out = out.replace(
    /\| 1 \| `ew-e3-gate-cms-promotions` \| `ew-e3-gate-cms-promotions` \|/,
    '| 1 | ~~ew-e3 dual gate~~ → **`ew-e3-gate-cms-promotions`** (50차 merge) | resolved |',
  );
  out = out.replace(
    /\| 1 \| `ew-e3-gate-cms-promotions` \| `ew-e3-gate-cms-promotions` \|/,
    '| 1 | ~~ew-e3 dual gate~~ → **`ew-e3-gate-cms-promotions`** (50차 merge) | resolved |',
  );
  out = out.replace(
    /\*\*#(\d+) = 마지막 completed \(`[^`]+`\)\*\* · \*\*현재 NEXT = `[^`]+`\*\* \(YAML \*\*#\d+\*\*\)/,
    `**#${summary.firstPendingIndex ? summary.firstPendingIndex - 1 : summary.completed} = 마지막 completed (\`pqa-gate-platform-audit\`)** · **현재 NEXT = \`${summary.firstPendingId}\`** (YAML **#${summary.firstPendingIndex}**)`,
  );
  return out;
}

function insertMergeReview50(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  const marker = '**병합 검토 (48차 · 2026-07-08):**';
  const entry = `**병합 검토 (50차 · 2026-07-09):** operator — **Composer 2.5 atomic bundle merge (Tier-1)** — ① **W0** 5→\`da-w0-foundation-ssot-bundle\` ② **W1** infra 4→\`da-w1-ds-foundation-bundle\` ③ **W2** shell 2→\`da-w2-shell-elevation-infra\` ④ **P10** \`p10-sports-parity-contract-and-board\` · \`p10-sports-live-surface-wire\` · \`p10-casino-replay-and-infra\` ⑤ **P13** prep docs 2→\`p13-prep-admin-canonical-docs\` ⑥ **E3** gates 2→\`ew-e3-gate-cms-promotions\` · **−13 ids** · **${summary.ids} ids** · pending **${summary.pending}** · NEXT=\`${summary.firstPendingId}\` · §20.1 **BUNDLE=동일 PR 필수**(route 1:1 유지 · DOC/INFRA/contract+consumer only)

`;
  if (text.includes('**병합 검토 (50차')) return text;
  return text.replace(marker, entry + marker);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const raw = readFileSync(PLAN_PATH, 'utf8');
  const fmStart = raw.indexOf('---');
  const fmEnd = raw.indexOf('---', fmStart + 3);
  const body = raw.slice(fmEnd + 3);

  const before = parsePlanYamlTodos(PLAN_PATH);
  const merged = applyMerges(before);
  const summary = summarizePlanTodos(merged);

  const todosYaml = serializeTodos(merged);
  const headerMatch = raw.slice(fmStart, fmEnd + 3).replace(/^todos:[\s\S]*?(?=\n---)/m, '');
  const patchedHeader = patchOverview(headerMatch.trimEnd(), summary);
  let newBody = replaceIdsInBody(body);
  newBody = patchSection206(newBody, summary);
  newBody = insertMergeReview50(newBody, summary);

  const fullFile = `${patchedHeader}\n${todosYaml}\n---${newBody}`;

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          before: before.length,
          after: merged.length,
          removed: before.length - merged.length,
          summary,
          firstPending: merged.find((t) => t.status === 'pending')?.id,
        },
        null,
        2,
      ),
    );
    return;
  }

  writeFileSync(PLAN_PATH, fullFile);
  console.log(
    JSON.stringify({ applied: true, removed: before.length - merged.length, summary }, null, 2),
  );
}

main();
