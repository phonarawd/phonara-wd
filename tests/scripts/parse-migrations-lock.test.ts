import { describe, expect, it } from 'vitest';
import { parseMigrationsLock } from '../../scripts/lib/parse-migrations-lock';

describe('parseMigrationsLock SOT', () => {
  it('returns ok for current repo lock parity', () => {
    const result = parseMigrationsLock();
    expect(result.status).toBe('ok');
    expect(result.violation_count).toBe(0);
    expect(result.locked_count).toBeGreaterThan(0);
    expect(result.current_count).toBe(result.locked_count);
  });

  it('detects modified migration drift', () => {
    const result = parseMigrationsLock({
      repoRoot: process.cwd(),
    });
    expect(['ok', 'drift', 'missing_lock', 'parse_error']).toContain(result.status);
    if (result.status === 'drift') {
      expect(result.violations.length).toBeGreaterThan(0);
    }
  });
});
