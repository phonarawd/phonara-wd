/**
 * Stable Playwright anchors for casino money flows.
 * Keep on the route adapter layer after Lovable ZIP — game UI may omit these.
 */
export const CASINO_E2E_TESTIDS = {
  fairnessVerifier: 'casino-fairness-verifier',
  stakeInput: 'casino-stake-input',
  clientSeedInput: 'casino-client-seed-input',
  prepareHash: 'casino-prepare-hash',
  placeBet: 'casino-place-bet',
  error: 'casino-error',
  betConfirm: 'casino-bet-confirm',
  betConfirmConfirm: 'casino-bet-confirm-confirm',
  betConfirmCancel: 'casino-bet-confirm-cancel',
} as const;

export type CasinoE2ETestId = (typeof CASINO_E2E_TESTIDS)[keyof typeof CASINO_E2E_TESTIDS];
