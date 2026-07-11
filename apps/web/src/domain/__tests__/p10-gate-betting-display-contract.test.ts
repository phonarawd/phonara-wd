import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_CODES } from '@phonara/game-engine';
import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { CASINO_SUBNAV } from '../../product/shell/casino-subnav';
import { SPORTS_SUBNAV } from '../../product/shell/sports-subnav';
import {
  filterRegisteredSubnavItems,
  P10_CASINO_FAIRNESS_REGISTERED_ROUTES,
  P10_SPORTS_HUB_REGISTERED_ROUTES as SHELL_SPORTS_HUB_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';
import { CASINO_GAME_SLUGS } from '../../product/shell/surface-domain-boundary';
import { findFiatHintComplaintRisk } from '../fiat-reference-display-contract';
import {
  assertP10GateBettingSync,
  P10_FIRST_BET_EDUCATION_TODO,
  P10_GATE_BETTING_ARTIFACT_PATHS,
  P10_GATE_BETTING_CASINO_E2E_AUTHORITY,
  P10_GATE_BETTING_CASINO_E2E_SPEC,
  P10_GATE_BETTING_FIAT12_COMPLAINT_IDS,
  P10_GATE_BETTING_H5_STAKE_COMPLAINT_IDS,
  P10_GATE_BETTING_MANIFEST_ROUTES,
  P10_GATE_BETTING_PREREQUISITE_TODOS,
  P10_GATE_BETTING_SECTION_31_4_SPORTS_RISK_IDS,
  P10_GATE_BETTING_STAGE_FILE_BY_CODE,
  P10_GATE_BETTING_TEST_PATHS,
  P10_GATE_BETTING_TODO,
  P10_OPERATOR_VISUAL_SIGNOFF_TODO,
} from '../p10-gate-betting-display-contract';
import { findSportsComplaintRisk } from '../sports-exchange-parity-display-contract';
import { P10_SPORTS_HUB_REGISTERED_ROUTES } from '../sports-hub-pages-display-contract';
import { findTradeComplaintRisk } from '../trade-exchange-parity-display-contract';
import { casinoGamePlayPath } from '../casino-outcome-replay-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

describe('p10-gate-betting-display-contract §12.19.6 · §32.7 H5 · Fiat#12 · YAML #214', () => {
  it('registers GATE todo · first-bet prerequisite · next VISUAL', () => {
    expect(P10_GATE_BETTING_TODO).toBe('p10-gate-betting');
    expect(P10_FIRST_BET_EDUCATION_TODO).toBe('p10-first-bet-education');
    expect(P10_OPERATOR_VISUAL_SIGNOFF_TODO).toBe('p10-operator-visual-signoff');
    expect(P10_GATE_BETTING_PREREQUISITE_TODOS).toContain(P10_FIRST_BET_EDUCATION_TODO);
    expect(P10_GATE_BETTING_PREREQUISITE_TODOS).toContain('p10-page-casino-fairness');
    expect(P10_GATE_BETTING_PREREQUISITE_TODOS).toContain('p10-sports-layout-dedup-gate');
    expect(() => assertP10GateBettingSync()).not.toThrow();
  });

  it('locks Sports+Casino 12 game codes · stage files · play paths', () => {
    expect(GAME_CODES).toHaveLength(12);
    expect(CASINO_GAME_SLUGS).toHaveLength(12);
    for (const code of GAME_CODES) {
      const stageFile = P10_GATE_BETTING_STAGE_FILE_BY_CODE[code];
      expect(stageFile).toBeTruthy();
      expect(existsSync(resolve(WEB_SRC, 'product/surfaces/games', stageFile))).toBe(true);
      expect(casinoGamePlayPath(code).startsWith('/games/')).toBe(true);
    }
    expect(assertRegisteredFullPath('/games/$gameCode')).toBe('/games/$gameCode');
    expect(assertRegisteredFullPath('/casino/fairness')).toBe('/casino/fairness');
  });

  it('keeps §12.19.6 subnav manifest dead link 0 for sports + casino', () => {
    expect([...P10_SPORTS_HUB_REGISTERED_ROUTES]).toEqual([...SHELL_SPORTS_HUB_ROUTES]);
    for (const route of P10_GATE_BETTING_MANIFEST_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    for (const route of P10_CASINO_FAIRNESS_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }

    const sportsVisible = filterRegisteredSubnavItems(SPORTS_SUBNAV);
    expect(sportsVisible.map((item) => item.to)).toEqual([
      '/sports',
      '/sports/prematch',
      '/sports/live',
      '/sports/my-bets',
      '/sports/rules',
      '/sports/vip',
    ]);
    for (const item of sportsVisible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }

    const casinoVisible = filterRegisteredSubnavItems(CASINO_SUBNAV);
    expect(casinoVisible.map((item) => item.to)).toEqual(['/casino', '/casino/fairness']);
    expect(casinoVisible.map((item) => item.to)).not.toContain('/casino/tournaments');
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/casino/tournaments')).toBe(false);
  });

  it('requires first-bet education + money-path artifacts on disk', () => {
    for (const rel of P10_GATE_BETTING_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel)), rel).toBe(true);
    }
    for (const rel of P10_GATE_BETTING_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel)), rel).toBe(true);
    }

    const slip = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/sports/sports-bet-slip-panel.tsx'),
      'utf8',
    );
    expect(slip).toContain('SpendCurrencySelector');
    expect(slip).toContain('potential_return');

    const shell = readFileSync(
      resolve(WEB_SRC, 'product/surfaces/games/casino-game-shell.tsx'),
      'utf8',
    );
    expect(shell).toContain("useState<SpendCurrency>('USDT')");
    expect(shell).toMatch(/PHON|USDT/);

    const appshell = readFileSync(resolve(WEB_SRC, 'product/shell/appshell.tsx'), 'utf8');
    expect(appshell).toContain('BetFirstVisitEducationGate');
  });

  it('maps §32.7 H5 stake + Fiat#12 hint ComplaintRisk rows to live', () => {
    for (const id of P10_GATE_BETTING_H5_STAKE_COMPLAINT_IDS) {
      const row = findTradeComplaintRisk(id);
      expect(row?.mitigatedBy).toBe('live');
    }
    expect(findTradeComplaintRisk('sports-stake-usdt-only')?.ownerTodo).toBe('p10-page-sports');
    expect(findTradeComplaintRisk('casino-stake-usdt-only')?.ownerTodo).toBe(
      'p10-casino-replay-and-infra',
    );

    for (const id of P10_GATE_BETTING_FIAT12_COMPLAINT_IDS) {
      const row = findFiatHintComplaintRisk(id);
      expect(row?.mitigatedBy).toBe('live');
    }
    expect(findFiatHintComplaintRisk('fiat-hint-sports-odds-order')?.ownerTodo).toBe(
      'p10-sports-fiat-hint-wire',
    );
    expect(findFiatHintComplaintRisk('fiat-hint-casino-drift')?.ownerTodo).toBe(
      'p10-casino-fiat-hint-session-lock',
    );
  });

  it('registers §31.4 sports risk ComplaintRisk and casino E2E CI authority', () => {
    for (const id of P10_GATE_BETTING_SECTION_31_4_SPORTS_RISK_IDS) {
      expect(findSportsComplaintRisk(id)).toBeDefined();
    }
    expect(P10_GATE_BETTING_CASINO_E2E_AUTHORITY).toBe('operator-or-ci');
    expect(P10_GATE_BETTING_CASINO_E2E_SPEC).toBe('tests/e2e/casino.spec.ts');
    // Spec path is CI/operator canonical — Demolition may leave file absent until P13 restore.
    expect(P10_GATE_BETTING_CASINO_E2E_SPEC.endsWith('casino.spec.ts')).toBe(true);
  });
});
