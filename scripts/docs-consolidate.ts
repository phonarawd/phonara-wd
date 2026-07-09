#!/usr/bin/env tsx
/**
 * Move completed/superseded docs/*.md into docs/archive/ — keeps paste + engine essentials in docs/ root.
 * Run: bun run docs:consolidate
 * Dry-run: bun run docs:consolidate -- --dry-run
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const docsRoot = join(repoRoot, 'docs');
const dryRun = process.argv.includes('--dry-run');

/** Stay in docs/ — paste · engine · ops · active queue */
const KEEP_ROOT = new Set([
  'CASINO_SLO.md',
  'CURRENT_STATUS.md',
  'CURSOR_ENGINE_MASTER_PROMPT.md',
  'ENGINE_100_HANDOFF.md',
  'ENVIRONMENT_SETUP.md',
  'FOLDER_STRUCTURE.md',
  'GAMES-INTEGRATION.md',
  'LEGAL_BASIS.md',
  'PRESENTATION_ABSORPTION_PLAN_FINAL.md',
  'PRESENTATION_AI_MASTER_PROMPT.md',
  'PRESENTATION_OPERATOR_PROMPT_DISPATCH.md',
  'PRESENTATION_VISUAL_REFERENCE_LINKS.md',
  'PRESENTATION_ZENITH_INDEX.md',
  'PRESENTATION_ZENITH_PHASE12_E_LOCK.md',
  'OBSERVABILITY_PRIVACY.md',
  'PHONARA_CURSOR_PASTE_CRUSH_LOCK.md',
  'PHONARA_CURSOR_PASTE_CRUSH_P2_0_LOCK.md',
  'PHONARA_CURSOR_PASTE_CRUSH_P2_0_PASTE_MAP.md',
  'PHONARA_CURSOR_PASTE_CRUSH_P2_LOCK.md',
  'PHONARA_DEEPSHAFT_MOMENTUM_ENGINE_DELIVERABLE.md',
  'PHONARA_ENGINE_WAVE_S1_SPORTSBOOK_LOCK.md',
  'PHONARA_ENGINE_WAVE_S2_ODDS_INGEST_LOCK.md',
  'PHONARA_ENGINE_WAVE_S3_PLACE_BET_LOCK.md',
  'PHONARA_ENGINE_WAVE_S4_SETTLE_LOCK.md',
  'PHONARA_ENGINE_WAVE_S5_INPLAY_LOCK.md',
  'PHONARA_ENGINE_WAVE_S_SPORTSBOOK_PLAN.md',
  'PHONARA_ENGINE_WORLD_CRUSH_GAP_ROADMAP.md',
  'PHONARA_PRESENTATION_P2_GAMES_HANDOFF.md',
  'PHONARA_PRESENTATION_ZIP_INTAKE_READY.md',
  'PHONARA_NEW_CHAT_HANDOFF_GAMES_POLISH_2026-06-18.md',
  'PHONARA_NORTH_STAR_PLAN.md',
  'PHONARA_SEQUENTIAL_EXECUTION_CONTRACT.md',
  'PHONARA_SPORTSBOOK_ADMIN_DESK_PLAN.md',
  'PHONARA_SPORTSBOOK_DEFERRED_TODO.md',
  'PHONARA_SPORTSBOOK_E2E_MATRIX.md',
  'PHONARA_SPORTSBOOK_ENGINE_STANDARD.md',
  'PHONARA_SPORTSBOOK_ENGINE_TIER_STRATEGY.md',
  'PHONARA_SPORTSBOOK_INSTALL_STATUS.md',
  'PHONARA_SPORTSBOOK_LEGAL_GATE.md',
  'PHONARA_SPORTSBOOK_MASTER_PLAN.md',
  'PHONARA_SPORTSBOOK_VENDOR_DECISION.md',
  'PHONARA_UI_UX_MASTER.md',
  'PHONARA_V2_MASTER_PLAN.md',
  'PRODUCT_VISION.md',
  'QUALITY_GATES.md',
  'RUNBOOK.md',
  'SUPABASE_ACCESS_MATRIX.md',
  'THREAT_MODEL.md',
  'DOCS_INDEX.md',
]);

type ArchiveBucket =
  | 'completed-locks/presentation-phase12'
  | 'completed-locks/world-crush-l1'
  | 'completed-locks/games-polish'
  | 'completed-locks/paste-crush'
  | 'completed-locks/admin-defer'
  | 'completed-locks/sports-presentation'
  | 'handoffs'
  | 'audits'
  | 'superseded-plans'
  | 'legacy-handoff';

function bucketFor(name: string): ArchiveBucket {
  if (name.startsWith('PRESENTATION_WORLD_CRUSH_')) return 'completed-locks/world-crush-l1';
  if (name.startsWith('PHONARA_PRESENTATION_GAMES_POLISH_')) return 'completed-locks/games-polish';
  if (name.startsWith('PHONARA_CURSOR_PASTE_CRUSH_P1_')) return 'completed-locks/paste-crush';
  if (
    name.startsWith('PHONARA_CURSOR_PASTE_CRUSH_P2_0B') ||
    name.startsWith('PHONARA_CURSOR_PASTE_CRUSH_P2_0C') ||
    name === 'PHONARA_CURSOR_PASTE_ROUTE_DEDUP_LOCK.md'
  ) {
    return 'completed-locks/paste-crush';
  }
  if (name.startsWith('PRESENTATION_ADMIN_')) return 'completed-locks/admin-defer';
  if (name.startsWith('PRESENTATION_ZENITH_PHASE12_'))
    return 'completed-locks/presentation-phase12';
  if (name.startsWith('PRESENTATION_SPORTSBOOK_') || name.startsWith('PRESENTATION_WALLET_')) {
    return 'completed-locks/sports-presentation';
  }
  if (
    name.includes('HANDOFF') ||
    name.includes('NEW_CHAT') ||
    name === 'PRESENTATION_ZENITH_CRUSH_HANDOFF.md'
  ) {
    return 'handoffs';
  }
  if (
    name.startsWith('AUDIT_') ||
    name.startsWith('WORK_LOG') ||
    name.startsWith('CHAT_HANDOFF') ||
    name === 'SCORECARD.md'
  ) {
    return 'audits';
  }
  if (
    name.startsWith('PRESENTATION_') ||
    name.startsWith('PHONARA_WORLD_') ||
    name.startsWith('PHONARA_PRESENTATION_') ||
    name === 'GAMES-INTEGRATION.delta.md' ||
    name === 'PHONARA_UI_UX_REBUILD_LOG.md'
  ) {
    return 'superseded-plans';
  }
  return 'superseded-plans';
}

function listRootMd(): string[] {
  return readdirSync(docsRoot)
    .filter((n) => n.endsWith('.md'))
    .sort();
}

const moved: { from: string; to: string }[] = [];
const kept: string[] = [];

for (const name of listRootMd()) {
  if (KEEP_ROOT.has(name)) {
    kept.push(name);
    continue;
  }

  const bucket = bucketFor(name);
  const destDir = join(docsRoot, 'archive', bucket);
  const dest = join(destDir, name);

  if (!dryRun) {
    mkdirSync(destDir, { recursive: true });
    if (existsSync(dest)) {
      // already archived — remove duplicate from root if identical
      const srcText = readFileSync(join(docsRoot, name), 'utf8');
      const destText = readFileSync(dest, 'utf8');
      if (srcText === destText) {
        unlinkSync(join(docsRoot, name));
        moved.push({ from: name, to: `${bucket}/ (duplicate removed)` });
        continue;
      }
    }
    renameSync(join(docsRoot, name), dest);
  }
  moved.push({ from: name, to: `${bucket}/${name}` });
}

const manifest = {
  date: new Date().toISOString().slice(0, 10),
  dryRun,
  kept: [...KEEP_ROOT].filter((k) => k !== 'DOCS_INDEX.md').sort(),
  movedCount: moved.length,
  moved,
};

const manifestPath = join(docsRoot, 'archive', 'MANIFEST.json');
if (!dryRun) {
  mkdirSync(join(docsRoot, 'archive'), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

console.log(`docs:consolidate ${dryRun ? '(dry-run)' : 'APPLY'}`);
console.log(`  kept in docs/: ${kept.length}`);
console.log(`  archived/moved: ${moved.length}`);
if (moved.length > 0) {
  console.log(
    '  sample:',
    moved
      .slice(0, 8)
      .map((m) => m.from)
      .join(', '),
    moved.length > 8 ? '…' : '',
  );
}
if (!dryRun) console.log(`  manifest: docs/archive/MANIFEST.json`);
