#!/usr/bin/env node
/**
 * apply-plan-todo-merge-52.ts — 52차 Forensic Remediation 흡수
 *
 * - 전수 감사 CRITICAL/HIGH만 신규 todo (기존 P10/E21/E22/PQA/DA와 중복 0)
 * - Track B E5/E6 물리 순서 + E10 선행 순환 해소
 * - overview · §20.6 · §20.6.1 · §20.6.2 · §33 · §35 · 병합 검토 동기화
 *
 * Usage: bun run scripts/apply-plan-todo-merge-52.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos, type PlanTodo } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

const EXPECTED = {
  beforeIds: 273,
  afterIds: 278,
  added: 5,
  completed: 179,
  pending: 92,
  cancelled: 7,
  trackA: 243,
  trackB: 35,
  firstPendingId: 'r0-forensic-ssot-honesty-bundle',
} as const;

const R0_TODOS: PlanTodo[] = [
  {
    id: 'r0-forensic-ssot-honesty-bundle',
    status: 'pending',
    content:
      '[R0·DOC·BUNDLE] §35 Forensic SSOT 정직화 — overview Casino dual 허위 삭제·sibling plan 정직화·§20.6/§20.6.1/§20.6.2 수치=frontmatter ±0·§20.13 #180=da-w0·§33.2 PQA 전건 completed·Apex snapshot(191/99) vs current(211/117) 분리·ACTIVE_WORK/REBUILD/AGENTS NEXT 단일화 · **동일 PR 필수**(52차) · 선행:pqa-gate-platform-audit · gate:check:plan-yaml+check:plan-doc-sync',
  },
  {
    id: 'r0-sports-launch-gate-wire',
    status: 'pending',
    content:
      '[R0·WIRE] Sports LAUNCH_GATES 강제 — `use-sports-page-controller`에 `LAUNCH_GATES.sportsBetting` 적용 · `canPlaceBet`/`built_disabled` = contract `resolveSportsLaunchGateExposure` · kill-switch `feature_sports_enabled`와 AND · vitest controller+contract · **기존 p10-page-sports 확장만·신규 route 0** · 선행:r0-forensic-ssot-honesty-bundle · gate:ai-impl sports',
  },
  {
    id: 'r0-admin-rbac-ops-wire',
    status: 'pending',
    content:
      '[R0·WIRE] Admin RBAC+kill-switch — `useAdminOperatorRbac`/`canPerformAdminAction`를 high-risk desk(queues·withdraw·rewards·ops halt)에 연결 · `confirmKillSwitch` ops page 마운트 또는 dead-control 명시 · `admin-security-display-contract` stale route(`/casino`·`/cms`) 정정 · **신규 admin route 0** · 선행:r0-sports-launch-gate-wire · gate:ai-impl apps/admin',
  },
  {
    id: 'r0-staking-domain-sot-sync',
    status: 'pending',
    content:
      '[R0·INFRA] Staking domain SOT 단일화 — `surface-domain-boundary.ts` Earn vs Trade 충돌 해소 · Earn subnav(`/staking`) 유지 시 boundary=`earn` · rule `97` 표 동기화 · `check:phase-r-guards --strict` green · **신규 surface 0** · 선행:r0-admin-rbac-ops-wire',
  },
  {
    id: 'r0-gate-forensic-remediation',
    status: 'pending',
    content:
      '[R0·GATE] Forensic remediation 마감 — R0 4건 green · check:plan-yaml --track-a-only · check:plan-doc-sync · check:phase-r-guards --strict · typecheck · 82 ACTIVE_WORK NEXT=`da-w0-foundation-ssot-bundle` · 선행:r0-staking-domain-sot-sync → da-w0',
  },
];

const CONTENT_PATCH: Record<string, string> = {
  'ew-e21-trade-parity-wave':
    '[E·WAVE] E21 Trade parity — ADR + **신규만** hedge·reduce-only·TP/SL amend · **spot limit/stop=`rpc_place_limit_order`/`rpc_place_stop_order` EXISTS → UI unlock only(migration 0)** · trailing=`rpc_set_trailing_stop` EXISTS · **동일 PR 필수**(52차 rescope) · 선행:ew-e7-gate-engine-wave',
  'ew-e21-gate-trade-engine-parity':
    '[E·GATE] E21 Trade engine parity — 신규 hedge/reduce-only/tpsl SQL만 test:sql Σ=0 · stack:push-remote · advisor 0 · spot limit/stop UI unlock 증거(기존 RPC) · 선행:ew-e21-trade-parity-wave',
  'ew-e21-ui-trade-engine-unlocks':
    '[E·UI] Trade E21 UI unlock — hedge toggle · reduce-only · post-open TP/SL edit · spot limit/stop tabs(기존 RPC) · display contracts `live` · gate:ai-impl trade · 선행:ew-e21-gate-trade-engine-parity → E22',
  'ew-e22-sports-parity-wave':
    '[E·WAVE] E22 Sports parity — ADR + **partial cashout 신규만** · odds acceptance · market catalog · **전액 cashout=`rpc_cashout_sports_bet` EXISTS → `p10-sports-slip-advanced-wire` UI** · **동일 PR 필수**(52차 rescope) · 선행:ew-e21-ui-trade-engine-unlocks',
  'ew-e22-gate-sports-parity':
    '[E·GATE] E22 sports parity — partial cashout SQL Σ=0 · stack:push-remote · advisor 0 · unlock 부분 cashout·odds policy·correct score UI · 선행:ew-e22-sports-parity-wave',
  'ew-e10-wallet-settings-ui':
    '[E·UI] E10 wallet+settings — /wallet/transfer · /settings/api-keys · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-platform-engine-wave',
  'ew-e10-trust-support-ui':
    '[E·UI] E10 trust+support — /support/ticket · /status · /tier/leaderboard · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-wallet-settings-ui',
  'ew-e10-growth-ui':
    '[E·UI] E10 growth — Kakao share SDK · app-install mission · **동일 PR 필수**(52차 E10 linear) · 선행:ew-e10-trust-support-ui',
  'ew-e10-gate-platform-world-class':
    '[E·GATE] Platform World-Class DONE — test:engine · test:sql · stack:push-remote · advisor 0 · §12.18 gap 0(광고·설문 제외) · §32 completeness · 선행:ew-e10-growth-ui',
  'ew-e5-gate-gap-surfaces':
    '[E·GATE] STUB→live gap surfaces gate:ai-impl · 선행:ew-e5-gap-surfaces-wire → E6',
  'ew-e6-gate-admin-desks':
    '[E·GATE] Admin gap desks wire — activity·audit export·§29.5 · gate:ai-impl admin · 선행:ew-e6-admin-desks-wave → E7',
  'da-w0-foundation-ssot-bundle':
    '[DA·W0·BUNDLE] §34 W0 Foundation — ADR-004 brand DNA 5문법(Aurora Mesh·Quad Stream·Orbit Grid·Signal Pulse·Neural Glow) · elevation ladder · motion tier L0/L1/L2 · PC 12-col · §34.2–34.5 · §35.1 Tech Stack SSOT · docs/SSOT/PRODUCT_EXPERIENCE_CANON.md · UNIFIED_UX_CANON · DESIGN_PRINCIPLES §7 · **동일 PR 필수**(52차 · SSOT drift 0) · 선행:r0-gate-forensic-remediation · gate:check:ai-reference',
  'p10-sports-slip-advanced-wire':
    '[P10·BUNDLE] Sports slip advanced — **전액 cashout UI**(`rpc_cashout_sports_bet` EXISTS)·SGP·system 탭 · stake cap·odds-changed UX · slip 확장만 · **partial=E22** · **동일 PR 필수**(52차 honesty) · 선행:p10-sports-live-surface-wire',
  'p10-casino-replay-and-infra':
    '[P10·BUNDLE] §23.2.1 Casino replay+shell — `casino-outcome-replay-contract.ts`+test · 12종 one-shot · CasinoGameShell·AutoBet · PF strip · §34.17 casino-play · **USDT/PHON stake toggle**(matrix `casino-stake-currency` → live) · **동일 PR 필수**(52차) · 선행:p10-page-casino',
};

function patchContent(todo: PlanTodo): PlanTodo {
  return {
    id: todo.id,
    status: todo.status,
    content: CONTENT_PATCH[todo.id] ?? todo.content,
  };
}

function applyTransforms(todos: PlanTodo[]): PlanTodo[] {
  const byId = new Map(todos.map((t) => [t.id, t]));
  const out: PlanTodo[] = [];
  const skip = new Set([
    'ew-e5-gate-gap-surfaces',
    'ew-e6-gate-admin-desks',
    'ew-e10-gate-platform-world-class',
    'ew-e10-growth-ui',
    'ew-e10-trust-support-ui',
    'ew-e10-wallet-settings-ui',
    'ew-e10-page-admin-krw-proof-review',
  ]);

  for (const todo of todos) {
    if (todo.id.startsWith('r0-')) continue; // idempotent rebuild from base

    if (todo.id === 'pqa-gate-platform-audit') {
      out.push(patchContent(todo));
      out.push(...R0_TODOS);
      continue;
    }

    if (skip.has(todo.id)) continue;

    if (todo.id === 'ew-e5-gap-surfaces-wire') {
      out.push(patchContent(todo));
      const gate = byId.get('ew-e5-gate-gap-surfaces');
      if (gate) out.push(patchContent(gate));
      continue;
    }

    if (todo.id === 'ew-e6-admin-desks-wave') {
      out.push(patchContent(todo));
      const gate = byId.get('ew-e6-gate-admin-desks');
      if (gate) out.push(patchContent(gate));
      continue;
    }

    if (todo.id === 'ew-e10-platform-engine-wave') {
      out.push(patchContent(todo));
      for (const id of [
        'ew-e10-page-admin-krw-proof-review',
        'ew-e10-wallet-settings-ui',
        'ew-e10-trust-support-ui',
        'ew-e10-growth-ui',
        'ew-e10-gate-platform-world-class',
      ] as const) {
        const t = byId.get(id);
        if (t) out.push(patchContent(t));
      }
      continue;
    }

    out.push(patchContent(todo));
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

function patchOverview(header: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = header;
  out = out.replace(
    /Trade·Sports·Casino·Staking·Earn 전 surface USDT\+PHON/,
    'Trade·Sports·Staking·Earn USDT+PHON live · Casino dual=`p10-casino-replay-and-infra`',
  );
  out = out.replace(
    /\*\*sibling plan 0\*\*\(world-class_design_elevation 흡수·삭제\)/,
    '**orchestration SSOT=본 plan** · execute sibling=`trade_desk_*`·`phonara_수렴_*`(§35) · world-class_design_elevation 흡수·삭제',
  );
  out = out.replace(/\*\*\d+ ids\*\*/g, `**${summary.ids} ids**`);
  out = out.replace(
    /\*\*51차 −73 bundle\*\*/,
    `**51차 −73 bundle · 52차 +${EXPECTED.added} R0 forensic**`,
  );
  if (!out.includes('§35 Forensic')) {
    out = out.replace(
      /\*\*§33 Platform Zero-Defect Audit\(PQA A–F · 전수 감사 흡수\)\*\*/,
      '**§33 Platform Zero-Defect Audit(PQA A–F · `[x]` DONE)** + **§35 Forensic Remediation(R0 · 52차)**',
    );
  }
  return out;
}

function patchSection206(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  out = out.replace(
    /\*\*총량 \(정본\):\*\* \*\*\d+ ids\*\* = Track A \*\*\d+\*\*[^\n]+Track B \*\*\d+\*\*[^\n]*/,
    `**총량 (정본):** **${summary.ids} ids** = Track A **${summary.trackA}** (+18 DA · +5 R0 forensic · 52차) + Track B **${summary.trackB}**`,
  );
  out = out.replace(
    /\*\*status 실측 \([^)]+\):\*\* `completed` \*\*\d+\*\* · `pending` \*\*\d+\*\*[^\n]*/,
    `**status 실측 (2026-07-09 · 52차 forensic sync):** \`completed\` **${summary.completed}** · \`pending\` **${summary.pending}** (+5 r0-*) · \`cancelled\` **${summary.cancelled}**`,
  );
  out = out.replace(
    /\*\*현재 NEXT:\*\* `[^`]+` \(YAML \*\*#\d+\*\*\)[^\n]*/,
    `**현재 NEXT:** \`${summary.firstPendingId}\` (YAML **#${summary.firstPendingIndex}**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · R0 green 후 \`da-w0-foundation-ssot-bundle\``,
  );
  out = out.replace(/(\| \*\*총량\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.ids}$2`);
  out = out.replace(
    /(\| \*\*Track A \(P0–P13\+PQA\)\*\* \| \*\*)\d+(\*\* \|)/,
    `| **Track A (P0–P13+PQA+R0)** | **${summary.trackA}** |`,
  );
  out = out.replace(/(\| \*\*Track B \(E0–E23\)\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.trackB}$2`);
  out = out.replace(
    /(\| \*\*합계 검증\*\* \| \*\*)[^*]+(\*\* \|)/,
    `$1${summary.trackA}+${summary.trackB}=${summary.ids}$2`,
  );
  out = out.replace(/(\| \*\*active\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.active}$2`);
  out = out.replace(/(\| \*\*completed\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.completed}$2`);
  out = out.replace(/(\| \*\*pending\*\* \| \*\*)\d+(\*\* \|)/, `$1${summary.pending}$2`);
  out = out.replace(
    /\| \*\*NEXT\*\* \| `[^`]+` \|[^|\n]+\|/,
    `| **NEXT** | \`${summary.firstPendingId}\` | YAML **#${summary.firstPendingIndex}** · 52차 R0 forensic |`,
  );
  out = out.replace(
    /impl `\[x\]` · fiat stack \*\*pending\*\*/,
    'impl `[x]` · fiat stack **`[x]` DONE** (Fiat#9G)',
  );
  out = out.replace(
    /`\[x\] DONE` 5\/5 core · fiat settings pending/,
    '`[x] DONE` 5/5 core · fiat settings `[x]`',
  );
  out = out.replace(
    /`\[x\] DONE` 11\/11 core · fiat earn pending/,
    '`[x] DONE` 11/11 core · fiat earn `[x]`',
  );
  out = out.replace(
    /\*\*NEXT\*\* — audit A–E `\[x\]` · \*\*F1 `pqa-fix-error-mapping`부터\*\* pending · P10 잔여 block/,
    '**`[x] DONE` 2026-07-09** — F1–F5+gate green · **NEXT = R0 forensic**',
  );
  out = out.replace(
    /\| E0–E23 Engine \| \*\*\d+\*\*[^\n]*/,
    `| E0–E23 Engine | **${summary.trackB}** | \`ew-e10-gate-platform-world-class\` | pending (P13 후 · 52차 E10 linear) |`,
  );
  out = out.replace(
    /\*\*PASS \(48차 · 2026-07-08 실측 · Sports WORLD·Casino replay·E22\/E23 흡수\):\*\* `ids:\d+`[^\n]*/,
    `**PASS (52차 · 2026-07-09 실측 · R0 forensic + E10 linear):** \`ids:${summary.ids}\` · \`sum:${summary.ids}\` · \`trackA:${summary.trackA}\` · \`trackB:${summary.trackB}\` · \`dup:'none'\` · \`completed:${summary.completed}\` · \`pending:${summary.pending}\` · \`cancelled:${summary.cancelled}\` · \`--track-a-only\` → \`orderViolations:none\``,
  );
  out = out.replace(
    /overview \*\*\d+ ids\*\* 한 줄 동기화/,
    `overview **${summary.ids} ids** 한 줄 동기화`,
  );
  out = out.replace(
    /\*\*Track B 선행 debt \(21건 · v1\.1 YAML reorder · E0 착수 전 operator 1회\):\*\*/,
    '**Track B 선행 debt (52차: E5/E6/E10 해소 · 잔여 self-ref는 E0 전 operator 1회):**',
  );
  return out;
}

function patchSection201(text: string): string {
  return text.replace(
    /PQA \*\*#169–179\*\* → \*\*§34 DA W0–W5 #180–#215\*\* → P10 잔여 \*\*#216\+\*\* \(`p10-sports-fiat-hint-wire`…\) → da-w6/,
    'PQA **#169–179 `[x]`** → **§35 R0 forensic #180–#184** → **§34 DA W0–W5** → P10 잔여 → da-w6',
  );
}

function patchSection202Naming(text: string): string {
  if (text.includes('r0-forensic-')) return text;
  return text.replace(
    /\| Precision SSOT \| `currency-precision-display-contract\.ts` \| inline `toFixed\(8\)` in JSX \|\n/,
    `| Precision SSOT | \`currency-precision-display-contract.ts\` | inline \`toFixed(8)\` in JSX |\n| Forensic R0 todo | \`r0-<slug>-(bundle\\|wire\\|gate)\` | \`r0-forensic-ssot-honesty-bundle\` (§35 · 52차) |\n| Track B rescope | EXISTS RPC = UI unlock · migration 0 | \`ew-e21\` spot limit · \`ew-e22\` full cashout |\n`,
  );
}

function patchSection33(text: string): string {
  let out = text;
  out = out.replace(
    /migration 206\)를 \*\*읽기 전용\*\*으로 전수 대조/,
    'migration **211** · SQL tests **117**)를 **읽기 전용**으로 전수 대조',
  );
  out = out.replace(
    /\| B \| `pqa-audit-b-rpc-contract` \*\*NEXT\*\* \|/,
    '| B | `pqa-audit-b-rpc-contract` `[x]` |',
  );
  out = out.replace(
    /- `pqa-gate-platform-audit` 미green 상태로 P10 잔여\(#180\+\) 착수/,
    '- `pqa-gate-platform-audit` 미green 상태로 R0/DA(#180+) 착수',
  );
  return out;
}

function patchSection34(text: string): string {
  return text.replace(
    /\*\*NEXT:\*\* `da-w0-foundation-ssot-bundle` \(#181\)/,
    '**NEXT (R0 후):** `da-w0-foundation-ssot-bundle` · **현재 첫 pending = `r0-forensic-ssot-honesty-bundle` (#180)**',
  );
}

const SECTION_35 = `

## 35. Platform Forensic Remediation (§R0 · 52차 · 전수 감사 흡수)

> **목적:** 2026-07-09 전수 감사(플랜·web 67 route·admin 27·migration 211·SQL 117·engines)에서 확정된 CRITICAL/HIGH만 Track A **R0**로 흡수. PQA §33·P10·E21/E22·DA와 **기능 중복 0**.  
> **실행 큐:** frontmatter \`r0-*\` ×5 (#180–184) · **선행:** \`pqa-gate-platform-audit\` \`[x]\` · **후행:** \`da-w0-foundation-ssot-bundle\`.  
> **근거 대장:** 채팅 전수 감사 통합 보고 · \`docs/audit/PLATFORM_AUDIT_E_SEVERITY_REPORT_2026-07-08.md\`(PQA) 보완.

### 35.0 중복 금지 매트릭스 (non-waivable)

| 감사 결함 | 흡수 위치 | **금지** (이미 있음) |
|-----------|-----------|----------------------|
| 플랜 수치/NEXT/§33 stale | \`r0-forensic-ssot-honesty-bundle\` | PQA A–G 재실행 |
| Sports \`LAUNCH_GATES\` 미적용 | \`r0-sports-launch-gate-wire\` | \`p10-page-sports\` 재구현 |
| Admin RBAC·kill UI | \`r0-admin-rbac-ops-wire\` | \`ew-e6-admin-desks-wave\`(E6 desk 신규)와 혼동 |
| Staking domain 이중 소속 | \`r0-staking-domain-sot-sync\` | \`/staking\` parallel surface |
| 전액 cashout UI | \`p10-sports-slip-advanced-wire\` (content 정직화) | E22에 전액 재구현 |
| Partial cashout | \`ew-e22-sports-parity-wave\` (신규만) | 전액 RPC 재작성 |
| Spot limit/stop RPC | \`ew-e21\` UI unlock only | \`rpc_place_limit_order\` 재 migration |
| Casino dual currency | \`p10-casino-replay-and-infra\` | overview "전 surface" 허위 유지 |
| E10 순환·E5/E6 역전 | YAML 물리 reorder (52차 스크립트) | 신규 ew-e10-* id |
| Track 3 3a vs 세계1위 | operator 서명 \`SCOPE_TRACK3_DECISION\` · DA 보류 권고 | AI가 3a 구현 |

### 35.1 World-Class Tech Stack SSOT (지구상 현존 최고 · 신규 도입 0)

> **원칙:** 이미 repo에 있는 스택만 강제. GSAP/Three.js shell·새 state lib·새 chart lib **도입 금지**(ADR 없이).

| 계층 | 정본 스택 | 금지 |
|------|-----------|------|
| Runtime | Bun · TypeScript strict · Vitest \`maxWorkers:1\` | Node-only scripts without Bun |
| Web UI | React 19 · TanStack Router · TanStack Query · CVA · Radix/shadcn in \`product/primitives\` | \`@phonara/ui\` 복구 · parallel design system |
| Money | \`@phonara/money\` Decimal · ledger append-only | JS \`number\` settlement |
| Trade chart | Lightweight Charts v5 OSS · WS display-only | chart 가격으로 주문/PnL 재계산 |
| Casino PF | \`@phonara/game-engine\` · SQL \`rpc_place_game_bet\` | client \`settle()\` as ledger truth |
| Sports | \`@phonara/sportsbook-engine\` preview-only · RPC settle | client odds multiply as payout |
| DB | Postgres · Supabase RLS/RPC · \`stack:push-remote\` | raw \`db push\` · MCP apply_migration |
| Admin | AAL2 MFA · reason+audit dialog · RBAC matrix(\`admin-rbac.ts\`) | role=admin 전원 동일 권한 방치 |
| Quality | \`gate:ai-impl\` · \`check:phase-r-guards\` · \`check:plan-yaml\` · CI quality/sql/e2e/advisors | agent 자율 \`test:sql\`/E2E (G13) |
| Design | \`--ds-*\` tokens · Digital Aurora §34 · 4-tier 390/768/1024/2560 | inline hex · max-w-[390px] page root |

### 35.2 작업순서 (왕초보 · §20.1)

\`\`\`text
pqa-gate [x]
 → r0-forensic-ssot-honesty-bundle   (#180)  DOC
 → r0-sports-launch-gate-wire        (#181)  WIRE
 → r0-admin-rbac-ops-wire            (#182)  WIRE
 → r0-staking-domain-sot-sync        (#183)  INFRA
 → r0-gate-forensic-remediation      (#184)  GATE
 → da-w0-foundation-ssot-bundle      (#185+) DA
 → … (기존 직선 큐 유지)
\`\`\`

| 모델 | R0 담당 | 금지 |
|------|---------|------|
| **Grok 4.5** | \`r0-*-wire\` · gate | Track B migration · VISUAL completed |
| **Composer 2.5** | \`r0-*-bundle\` DOC/INFRA (파일 4+) | money RPC 신규 |
| **Operator** | Track 3 서명 · soft-launch · VISUAL | AI 대리 서명 |

### 35.3 네이밍 (§20.2 확장)

| 접미사 | 의미 | 예 |
|--------|------|-----|
| \`r0-*-bundle\` | Forensic DOC/INFRA 동일 PR | \`r0-forensic-ssot-honesty-bundle\` |
| \`r0-*-wire\` | 기존 surface/controller 확장 | \`r0-sports-launch-gate-wire\` |
| \`r0-gate-*\` | R0 마감 검증 | \`r0-gate-forensic-remediation\` |

### 35.4 Apex / Migration 정직 표 (소급 금지 · 스냅샷 분리)

| 스냅샷 | migrations | test:sql | 의미 |
|--------|------------|----------|------|
| **Apex CLOSEOUT (2026-07-03)** | 191/192 | 99/99 | 엔진 큐 0 선언 시점 |
| **Current disk (2026-07-09)** | **211** | **117** | Launch E1–E5 · Trade T0–T3 · Phase E · PQA E5 포함 |
| **정책** | post-Apex = Launch/ops/bugfix **예외** 또는 Track B | closeout 수치를 현재 gate로 쓰지 말 것 |

### 35.5 FAIL

- R0 미green으로 \`da-w0\` 착수
- \`r0-sports-launch-gate-wire\` 없이 Sports 베팅 live 주장
- E21/E22에서 EXISTS RPC 재 migration
- overview에 "Casino 전 surface USDT+PHON" 복원
- Track 3 미서명 상태로 3a 다운스케일 구현
- PQA A–D 감사 재실행을 R0로 위장

`;

function appendSection35(text: string): string {
  if (text.includes('## 35. Platform Forensic Remediation')) {
    return text.replace(
      /## 35\. Platform Forensic Remediation[\s\S]*?(?=\n## [0-9]|\n$)/,
      SECTION_35.trimStart() + '\n',
    );
  }
  if (text.includes('sibling plan `world-class_design_elevation` 재생성')) {
    return text.replace(
      /sibling plan `world-class_design_elevation` 재생성/,
      `sibling plan \`world-class_design_elevation\` 재생성\n${SECTION_35}`,
    );
  }
  return text + SECTION_35;
}

function appendMergeReview(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  const line = `**병합 검토 (52차 · 2026-07-09):** operator — **§35 Forensic Remediation 흡수** — 전수 감사 CRITICAL/HIGH → YAML **\`r0-*\` ×5** (#180–184) · Track B **E10 linear + E5/E6 reorder** · E21/E22 EXISTS-RPC UI-unlock rescope · overview Casino dual·sibling 정직화 · §20.6.1 **${summary.ids} ids** · NEXT=\`${summary.firstPendingId}\` · PQA/P10/DA **중복 0**`;
  if (text.includes('병합 검토 (52차')) {
    return text.replace(/\*\*병합 검토 \(52차[^\n]*/, line);
  }
  if (text.includes('병합 검토 (51차')) {
    return text.replace(/(\*\*병합 검토 \(51차[^\n]*\n)/, `$1\n${line}\n`);
  }
  if (text.includes('병합 검토 (48차')) {
    return text.replace(/(\*\*병합 검토 \(48차[^\n]*\n)/, `$1\n${line}\n`);
  }
  return text;
}

function patchSection2013(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  // R0 ladder row before DA/P10
  if (!out.includes('r0-forensic-ssot-honesty-bundle')) {
    out = out.replace(
      /(\| \*\*169–179\*\* \|[^\n]+\n)/,
      `$1| **180–184** | \`r0-forensic-ssot-honesty-bundle\` … \`r0-gate-forensic-remediation\` (§35) | R0 |\n`,
    );
  }
  out = out.replace(
    /\| \*\*180–192\*\* \| `p10-sports-fiat-hint-wire`[^\n]*/,
    `| **185–197** | \`da-w0\`…\`da-w5\` → \`p10-sports-fiat-hint-wire\` … hub·slip·rules · Sports# · CasinoR · games · \`p10-gate-betting\` · \`p10-operator-visual-signoff\` | DA+P10 |`,
  );
  out = out.replace(
    /\*\*#\d+ = 마지막 completed \(`[^`]+`\)\*\* · \*\*현재 NEXT = `[^`]+`\*\* \(YAML \*\*#\d+\*\*\)/,
    `**#179 = 마지막 completed (\`pqa-gate-platform-audit\`)** · **현재 NEXT = \`${summary.firstPendingId}\`** (YAML **#${summary.firstPendingIndex}**)`,
  );
  return out;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const raw = readFileSync(PLAN_PATH, 'utf8');
  const fmStart = raw.indexOf('---');
  const fmEnd = raw.indexOf('---', fmStart + 3);
  const body = raw.slice(fmEnd + 3);

  const before = parsePlanYamlTodos(PLAN_PATH);
  const already = before.some((t) => t.id === 'r0-forensic-ssot-honesty-bundle');

  // If already applied, strip r0 and re-apply for idempotent content patches
  const base = already ? before.filter((t) => !t.id.startsWith('r0-')) : before;
  if (!already && base.length !== EXPECTED.beforeIds) {
    console.error(
      JSON.stringify(
        { fail: 'beforeIds', got: base.length, expected: EXPECTED.beforeIds },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const merged = applyTransforms(base);
  const summary = summarizePlanTodos(merged);

  const ids = merged.map((t) => t.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  const errors: string[] = [];
  if (dup.length) errors.push(`dup=${[...new Set(dup)].join(',')}`);
  if (summary.ids !== EXPECTED.afterIds)
    errors.push(`ids=${summary.ids} want ${EXPECTED.afterIds}`);
  if (summary.pending !== EXPECTED.pending)
    errors.push(`pending=${summary.pending} want ${EXPECTED.pending}`);
  if (summary.completed !== EXPECTED.completed)
    errors.push(`completed=${summary.completed} want ${EXPECTED.completed}`);
  if (summary.trackA !== EXPECTED.trackA)
    errors.push(`trackA=${summary.trackA} want ${EXPECTED.trackA}`);
  if (summary.trackB !== EXPECTED.trackB)
    errors.push(`trackB=${summary.trackB} want ${EXPECTED.trackB}`);
  if (summary.firstPendingId !== EXPECTED.firstPendingId)
    errors.push(`firstPending=${summary.firstPendingId} want ${EXPECTED.firstPendingId}`);

  // E10 order check
  const e10Order = [
    'ew-e10-platform-engine-wave',
    'ew-e10-page-admin-krw-proof-review',
    'ew-e10-wallet-settings-ui',
    'ew-e10-trust-support-ui',
    'ew-e10-growth-ui',
    'ew-e10-gate-platform-world-class',
  ];
  const e10Idx = e10Order.map((id) => ids.indexOf(id));
  for (let i = 1; i < e10Idx.length; i++) {
    if (e10Idx[i] <= e10Idx[i - 1]) errors.push(`E10 order broken at ${e10Order[i]}`);
  }
  const e5w = ids.indexOf('ew-e5-gap-surfaces-wire');
  const e5g = ids.indexOf('ew-e5-gate-gap-surfaces');
  if (e5g <= e5w) errors.push('E5 gate before wire');
  const e6w = ids.indexOf('ew-e6-admin-desks-wave');
  const e6g = ids.indexOf('ew-e6-gate-admin-desks');
  if (e6g <= e6w) errors.push('E6 gate before wave');

  if (errors.length) {
    console.error(JSON.stringify({ validation: 'FAIL', errors, summary }, null, 2));
    process.exit(1);
  }

  const todosYaml = serializeTodos(merged);
  let headerBase = raw
    .slice(fmStart, fmEnd + 3)
    .replace(/^todos:[\s\S]*?(?=\n---)/m, '')
    .trimEnd();
  if (headerBase.endsWith('---')) headerBase = headerBase.slice(0, -3).trimEnd();

  const patchedHeader = patchOverview(headerBase, summary);
  let newBody = body;
  newBody = patchSection201(newBody);
  newBody = patchSection202Naming(newBody);
  newBody = patchSection206(newBody, summary);
  newBody = patchSection2013(newBody, summary);
  newBody = patchSection33(newBody);
  newBody = patchSection34(newBody);
  newBody = appendSection35(newBody);
  newBody = appendMergeReview(newBody, summary);

  const fullFile = `${patchedHeader}\n${todosYaml}\n---${newBody}`;

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          validation: 'PASS',
          before: base.length,
          after: merged.length,
          added: merged.length - base.length,
          summary,
          firstPending: summary.firstPendingId,
          r0Ids: merged.filter((t) => t.id.startsWith('r0-')).map((t) => t.id),
        },
        null,
        2,
      ),
    );
    return;
  }

  writeFileSync(PLAN_PATH, fullFile);
  console.log(
    JSON.stringify(
      {
        applied: true,
        validation: 'PASS',
        before: base.length,
        after: merged.length,
        summary,
      },
      null,
      2,
    ),
  );
}

main();
