import type { RoundCommitment, VerificationEvidence } from '../../features/casino/types';
import { CASINO_E2E_TESTIDS } from '../../features/casino/casino-e2e-testids';

type CasinoE2EFairnessAnchorProps = {
  commitment: RoundCommitment | null;
  verification: VerificationEvidence | null;
};

/** Playwright anchor — stays on adapter until Lovable FairnessSheet exposes the same test id. */
export function CasinoE2EFairnessAnchor({ commitment, verification }: CasinoE2EFairnessAnchorProps) {
  const seedHash =
    verification?.server_seed_hash ?? commitment?.server_seed_hash ?? '';
  const resultText = verification ? JSON.stringify(verification.result) : '';

  return (
    <div
      data-testid={CASINO_E2E_TESTIDS.fairnessVerifier}
      className="pointer-events-none fixed bottom-0 left-0 z-[1] max-h-8 max-w-full overflow-hidden opacity-[0.01]"
      aria-live="polite"
    >
      {seedHash}
      {resultText}
    </div>
  );
}
