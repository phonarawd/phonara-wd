/**
 * CI RTP harness gate — short Monte Carlo vs theoreticalRtp().
 * Full run: PHONARA_RTP_FULL=1 bun run check:rtp
 */
import { assertRtpHarness, runRtpHarness } from '../packages/game-engine/src/lib/rtp-harness.ts';

const seeds = process.env.PHONARA_RTP_FULL === '1' ? 100_000 : 25_000;
const epsilon = Number(process.env.PHONARA_RTP_EPSILON ?? '0.015');

if (!Number.isFinite(epsilon) || epsilon <= 0) {
  console.error('check:rtp: invalid PHONARA_RTP_EPSILON');
  process.exit(1);
}

const results = await runRtpHarness({
  seeds,
  epsilon,
  defaultSelections: {},
});

assertRtpHarness(results);
console.log(
  `check:rtp OK (${results.length} games × ${seeds.toLocaleString('en-US')} seeds, ε=${epsilon})`,
);
