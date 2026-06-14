import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import { getGame, listGames, type GameDefinition } from '../registry';

// Register all games for harness iteration.
import '../games/crash';
import '../games/limbo';
import '../games/dice';
import '../games/mines';
import '../games/hilo';
import '../games/plinko';
import '../games/mint-reels';
import '../games/gold-rush';
import '../games/roulette';
import '../games/blackjack';

export interface RtpHarnessOptions {
  seeds: number;
  epsilon: number;
  /** Default selections per game for Monte Carlo sampling. */
  defaultSelections: Partial<Record<string, unknown>>;
}

export interface RtpHarnessResult {
  game: string;
  theoretical: number;
  measured: number;
  delta: number;
  passed: boolean;
}

const DEFAULT_SERVER = 'rtp_harness_server_seed_phonara_v2';
const DEFAULT_CLIENT = 'rtp_harness_client';

function defaultSelectionFor(def: GameDefinition<unknown, unknown>): unknown {
  switch (def.code) {
    case 'crash':
      return { autoCashout: '2.00' };
    case 'limbo':
      return { target: '2.00' };
    case 'dice':
      return { target: '50.00', direction: 'over' };
    case 'mines':
      return { mineCount: 3, revealedCells: [0, 1, 2] };
    case 'hilo':
      return { startCard: null, guesses: ['higher'] };
    case 'plinko':
      return { rows: 12, risk: 'medium' };
    case 'mint_reels':
    case 'gold_rush':
      return { lines: 20 };
    case 'roulette':
      return { bets: [{ type: 'red', value: null, stakeWeight: 1 }] };
    case 'blackjack':
      return { actions: [{ seat: 0, move: 'stand' }] };
    default:
      return {};
  }
}

/**
 * Monte Carlo RTP harness — compares measured return to theoreticalRtp() when defined.
 */
export async function runRtpHarness(opts: RtpHarnessOptions): Promise<RtpHarnessResult[]> {
  const stake = new Decimal('1');
  const results: RtpHarnessResult[] = [];

  for (const code of listGames()) {
    const def = getGame(code);
    if (!def.theoreticalRtp) continue;

    const theoretical = def.theoreticalRtp().toNumber();
    const selection = opts.defaultSelections[code] ?? defaultSelectionFor(def);
    let totalReturn = 0;

    for (let i = 0; i < opts.seeds; i += 1) {
      const serverSeed = `${DEFAULT_SERVER}:${code}:${i}`;
      const clientSeed = `${DEFAULT_CLIENT}:${i % 997}`;
      const nonce = (i % 251) + 1;
      const floats = await floatStream(serverSeed, clientSeed, nonce, def.floatCount);
      const result = def.resultFromFloats(floats, selection);
      const { payout } = def.settle(stake, selection, result);
      totalReturn += payout.div(stake).toNumber();
    }

    const measured = totalReturn / opts.seeds;
    const delta = Math.abs(measured - theoretical);
    results.push({
      game: code,
      theoretical,
      measured,
      delta,
      passed: delta <= opts.epsilon,
    });
  }

  return results;
}

export function assertRtpHarness(results: RtpHarnessResult[]): void {
  const failures = results.filter((r) => !r.passed);
  if (failures.length > 0) {
    const detail = failures
      .map(
        (f) =>
          `${f.game}: theoretical=${f.theoretical.toFixed(4)} measured=${f.measured.toFixed(4)} delta=${f.delta.toFixed(4)}`,
      )
      .join('; ');
    throw new Error(`RTP harness failed: ${detail}`);
  }
}
