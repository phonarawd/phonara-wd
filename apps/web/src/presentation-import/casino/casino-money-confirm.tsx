import { ConfirmDialog, formatMoney } from '@phonara/ui';
import { CASINO_E2E_TESTIDS } from '../../features/casino/casino-e2e-testids';
import type { Currency, RoundCommitment } from '../../features/casino/types';

type CasinoMoneyConfirmProps = {
  open: boolean;
  busy: boolean;
  canConfirm: boolean;
  confirmNotice?: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  processingLabel: string;
  gameLabel: string;
  gameValue: string;
  stakeLabel: string;
  stake: string;
  currency: Currency;
  clientSeedLabel: string;
  clientSeed: string;
  seedHashLabel: string;
  commitment: RoundCommitment | null;
  waitingLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** High-risk money confirm — engine adapter only (not Lovable visual source). */
export function CasinoMoneyConfirm({
  open,
  busy,
  canConfirm,
  confirmNotice,
  title,
  description,
  confirmLabel,
  cancelLabel,
  processingLabel,
  gameLabel,
  gameValue,
  stakeLabel,
  stake,
  currency,
  clientSeedLabel,
  clientSeed,
  seedHashLabel,
  commitment,
  waitingLabel,
  onConfirm,
  onCancel,
}: CasinoMoneyConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      testId={CASINO_E2E_TESTIDS.betConfirm}
      title={title}
      description={description}
      notice={confirmNotice}
      tone="primary"
      rows={[
        { label: gameLabel, value: gameValue },
        {
          label: stakeLabel,
          value: `${formatMoney(stake, currency)} ${currency}`,
          emphasis: 'hero',
        },
        { label: clientSeedLabel, value: clientSeed.slice(0, 16), wrap: true },
        {
          label: seedHashLabel,
          value: commitment?.server_seed_hash.slice(0, 16) ?? waitingLabel,
          wrap: true,
        },
      ]}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      processingLabel={processingLabel}
      busy={busy}
      confirmDisabled={!canConfirm || !commitment}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
