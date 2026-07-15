import { describe, expect, it } from 'vitest';
import {
  buildHighReasons,
  classifySeverity,
  formatGateDiagnosisSummaryLine,
} from '../../scripts/lib/gate-diagnosis-core';
import { dominantRamConsumer } from '../../scripts/lib/dominant-ram-consumer';
import {
  ageDays,
  isEvidenceValid,
  normalizeMaxContextToken,
} from '../../scripts/lib/max-context-evidence';

describe('gate-diagnosis summary + contracts', () => {
  it('formats perf-summary reference line', () => {
    const line = formatGateDiagnosisSummaryLine({
      ram_free_mb: 980,
      cursor_core_mb: 2374,
      claude_desktop_mb: 1170,
      claude_desktop_count: 9,
      dominant_ram_consumer: dominantRamConsumer(2374, 1170),
      high_reasons: buildHighReasons({
        cursor_core_mb: 2374,
        claude_desktop_mb: 1170,
        ram_free_mb: 980,
        orphan_drift: false,
        orphan_repo_count: 0,
      }),
    });
    expect(line).toBe(
      '[perf-summary] RAM free 980MB · Cursor core 2374MB · Claude desktop 1170MB (9 proc) · dominant=cursor · high=[cursor_core_mb,claude_desktop_mb,ram_free_mb]',
    );
  });

  it('classifies HIGH from cursor/claude/ram/orphan triggers', () => {
    const high = buildHighReasons({
      cursor_core_mb: 1800,
      claude_desktop_mb: 1000,
      ram_free_mb: 1023,
      orphan_drift: true,
      orphan_repo_count: 2,
    });
    expect(high).toEqual([
      'cursor_core_mb',
      'claude_desktop_mb',
      'ram_free_mb',
      'orphan_drift',
      'orphan_repo_count',
    ]);
    expect(classifySeverity(high, 100)).toBe('HIGH');
  });

  it('validates max-context evidence TTL', () => {
    const fresh = {
      max_context: '6k' as const,
      verified_at: new Date().toISOString(),
      method: 'cli-attest',
      ttl_days: 7,
    };
    expect(isEvidenceValid(fresh)).toBe(true);
    expect(ageDays(fresh.verified_at)).toBeLessThan(1);
  });

  it('normalizes max context tokens', () => {
    expect(normalizeMaxContextToken('6k')).toBe('6k');
    expect(normalizeMaxContextToken('200k')).toBe('200k');
    expect(normalizeMaxContextToken(200_000)).toBe('200k');
  });
});
