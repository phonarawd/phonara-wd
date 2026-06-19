/**
 * Fast MC RTP smoke — complements closed-form `theoreticalRtp` / policy formulas.
 * Uses Hoeffding (payout/stake bounded in [0, 1] per unit stake) for tolerance width.
 */
export function mcRtpTolerance(stakeCount: number, confidence = 0.999): number {
  if (stakeCount < 1) return 1;
  const delta = 1 - confidence;
  return Math.sqrt(Math.log(2 / delta) / (2 * stakeCount));
}

export function assertMcRtpSmoke(
  measured: number,
  theoretical: number,
  stakeCount: number,
  label: string,
): void {
  const eps = Math.max(0.035, mcRtpTolerance(stakeCount));
  if (measured < theoretical - eps || measured > theoretical + eps) {
    throw new Error(
      `${label}: measured=${measured.toFixed(4)} theoretical=${theoretical.toFixed(4)} ±${eps.toFixed(3)} (n=${stakeCount})`,
    );
  }
}
