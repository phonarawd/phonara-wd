import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertEngineGapE0Sync,
  ENGINE_GAP_ADR_PATH,
  ENGINE_GAP_E0_ARTIFACT_PATHS,
  ENGINE_GAP_E0_MIGRATION_IN_THIS_TODO,
  ENGINE_GAP_E0_NEXT_TODO,
  ENGINE_GAP_E0_PREREQUISITE_TODO,
  ENGINE_GAP_E0_TEST_PATHS,
  ENGINE_GAP_E0_TODO,
  ENGINE_GAP_PERMANENT_EXCLUSIONS,
  ENGINE_GAP_RED_STOP_RULES,
  ENGINE_GAP_WAVES,
} from '../engine-gap-adr-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

describe('engine-gap-adr-display-contract · YAML #239 E0', () => {
  it('registers E0 todo · T2 prerequisite · next E1 · migration 0 in this todo', () => {
    expect(ENGINE_GAP_E0_TODO).toBe('ew-e0-adr-approval');
    expect(ENGINE_GAP_E0_PREREQUISITE_TODO).toBe('launch-scale-t2-triggers');
    expect(ENGINE_GAP_E0_NEXT_TODO).toBe('ew-e1-decay-wave');
    expect(ENGINE_GAP_E0_MIGRATION_IN_THIS_TODO).toBe(false);
    expect(() => assertEngineGapE0Sync()).not.toThrow();
  });

  it('pins E1–E10 wave index', () => {
    expect(ENGINE_GAP_WAVES).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']);
  });

  it('pins permanent exclusions · RED STOP rules', () => {
    expect(ENGINE_GAP_PERMANENT_EXCLUSIONS).toContain('ad_watch_mission');
    expect(ENGINE_GAP_PERMANENT_EXCLUSIONS).toContain('survey_mission');
    expect(ENGINE_GAP_PERMANENT_EXCLUSIONS).toContain('temporal_workflows');
    expect(ENGINE_GAP_PERMANENT_EXCLUSIONS).toContain('polymarket_prediction');
    expect(ENGINE_GAP_RED_STOP_RULES).toEqual([
      'no_track_a_migration',
      'no_wave_without_adr',
      'no_ad_survey_missions',
      'no_ui_only_engine_done',
      'trade_desk_defer_independent',
    ]);
  });

  it('requires ADR · contract · approval artifacts on disk', () => {
    for (const rel of ENGINE_GAP_E0_ARTIFACT_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
    for (const rel of ENGINE_GAP_E0_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it('ADR pins Accepted · E1–E10 · RED STOP · ad/survey permanent exclusion', () => {
    const adr = readFileSync(resolve(REPO_ROOT, ENGINE_GAP_ADR_PATH), 'utf8');
    expect(adr).toContain('Accepted');
    expect(adr).toContain('ew-e0-adr-approval');
    expect(adr).toContain('ew-e1-decay-wave');
    expect(adr).toContain('launch-scale-t2-triggers');
    expect(adr).toContain('RED STOP');
    expect(adr).toContain('광고 시청 미션');
    expect(adr).toContain('설문 미션');
    expect(adr).toContain('영구 제외');
    expect(adr).toContain('engine-p0-no-migration');
    for (const wave of ENGINE_GAP_WAVES) {
      expect(adr).toContain(wave);
    }

    const approval = readFileSync(
      resolve(REPO_ROOT, 'docs/OPERATIONS/ENGINE_GAP_E0_APPROVAL.md'),
      'utf8',
    );
    expect(approval).toContain('ew-e0-adr-approval');
    expect(approval).toContain('check:plan-yaml');
    expect(approval).toContain('영구 제외');
    expect(approval).toContain('RED STOP');
  });
});
