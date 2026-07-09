import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ALLOW_ENV,
  checkAgentHeavyGateCommandForHook,
} from '../../scripts/lib/agent-heavy-gate-guard';

describe('agent-heavy-gate-guard', () => {
  let savedAllowEnv: string | undefined;

  beforeEach(() => {
    savedAllowEnv = process.env[ALLOW_ENV];
    delete process.env[ALLOW_ENV];
  });

  afterEach(() => {
    if (savedAllowEnv === undefined) {
      delete process.env[ALLOW_ENV];
    } else {
      process.env[ALLOW_ENV] = savedAllowEnv;
    }
  });

  it('blocks agent heavy gates by default', () => {
    const blocked = [
      'bun run test:e2e',
      'bun run test:e2e:casino -- tests/e2e/casino.spec.ts',
      'bun run pretest:e2e',
      'bun run test:sql',
      'bun run check:full',
      'bun run gate:phase-r',
      'supabase db reset',
    ];
    for (const command of blocked) {
      expect(checkAgentHeavyGateCommandForHook(command).allowed, command).toBe(false);
    }
  });

  it('allows lightweight gates', () => {
    const allowed = [
      'bun run typecheck',
      'bun run gate:ai-impl -- --test apps/web/src/foo.test.ts',
      'bun run test -- apps/web/src/foo.test.ts',
      'bun run check:i18n',
      'bun run check:hygiene',
      'bun run check:money-formula-citations',
      'bun run stack:push-remote',
      'bun run gate:local-autopilot',
      'bun run gate:local-autopilot -- --from=e2e-wallet-d3',
      'bun run e2e:kill',
    ];
    for (const command of allowed) {
      expect(checkAgentHeavyGateCommandForHook(command).allowed, command).toBe(true);
    }
  });
});
