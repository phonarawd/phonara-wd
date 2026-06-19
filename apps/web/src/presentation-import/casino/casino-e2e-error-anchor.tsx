import type { MessageKey } from '@phonara/i18n';
import { ErrorState } from '@phonara/ui';
import { CASINO_E2E_TESTIDS } from '../../features/casino/casino-e2e-testids';

type CasinoE2EErrorAnchorProps = {
  errorKey: MessageKey | null;
  title: string;
  description: string;
};

/** Engine error surface for paste casino — exposes `casino-error` for Playwright. */
export function CasinoE2EErrorAnchor({ errorKey, title, description }: CasinoE2EErrorAnchorProps) {
  if (!errorKey) return null;
  return (
    <ErrorState
      className="mx-auto mt-3 max-w-lg px-4"
      data-testid={CASINO_E2E_TESTIDS.error}
      title={title}
      description={description}
      role="alert"
    />
  );
}
