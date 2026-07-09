import { describe, expect, it } from 'vitest';
import { checkE2eShellCommandForHook } from '../../scripts/lib/e2e-shell-guard';

describe('e2e-shell-guard', () => {
  it('allows canonical bun run test:e2e variants', () => {
    const allowed = [
      'bun run test:e2e',
      'bun run posttest:e2e',
      'bun run e2e:pretest',
      'bun run e2e:posttest',
      'bun run e2e:kill',
      'bun run setup:playwright',
    ];
    for (const command of allowed) {
      expect(checkE2eShellCommandForHook(command).allowed, command).toBe(true);
    }
  });

  it('denies raw playwright and manual dev servers', () => {
    const denied = [
      'bunx playwright test',
      'npx playwright test tests/e2e',
      'bun run dev:web',
      'bun run dev:admin',
      'bun run check:full > check-full-log.txt',
    ];
    for (const command of denied) {
      expect(checkE2eShellCommandForHook(command).allowed, command).toBe(false);
    }
  });
});
