import type { GameCode } from '@phonara/game-engine';
import { GameSurfaceLoader } from '../../components/games/game-surface-loader';
import { useCasinoPageController } from '../../features/casino/use-casino-page-controller';
import { PresentationRoot } from '../presentation-root';
import { CasinoE2EFairnessAnchor } from './casino-e2e-fairness-anchor';
import { CasinoMoneyConfirm } from './casino-money-confirm';

type CasinoLovableSurfaceProps = {
  initialGame: GameCode;
};

/**
 * Target casino route body after Lovable ZIP paste.
 * Engine: `useCasinoPageController` · Visual: `GameSurfaceLoader` + Lovable components.
 */
export function CasinoLovableSurface({ initialGame }: CasinoLovableSurfaceProps) {
  const controller = useCasinoPageController(initialGame);
  const {
    t,
    authLoading,
    gameSurfaceProps,
    config,
    commitment,
    verificationEvidence,
    confirmOpen,
    busy,
    canConfirm,
    confirmNotice,
    stake,
    currency,
    clientSeed,
    submitBet,
    cancelBetConfirm,
  } = controller;

  if (authLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <GameSurfaceLoader {...gameSurfaceProps} />
      <CasinoE2EFairnessAnchor commitment={commitment} verification={verificationEvidence} />
      <CasinoMoneyConfirm
        open={confirmOpen}
        busy={busy}
        canConfirm={canConfirm}
        confirmNotice={confirmNotice}
        title={t('casino.confirm.title')}
        description={t('casino.confirm.description')}
        confirmLabel={t('casino.placeBet')}
        cancelLabel={t('common.cancel')}
        processingLabel={t('common.processing')}
        gameLabel={t('casino.confirm.game')}
        gameValue={t(config.labelKey)}
        stakeLabel={t('casino.stake')}
        stake={stake}
        currency={currency}
        clientSeedLabel={t('casino.field.clientSeed')}
        clientSeed={clientSeed}
        seedHashLabel={t('casino.verify.seedHash')}
        commitment={commitment}
        waitingLabel={t('casino.timeline.waiting')}
        onConfirm={() => void submitBet()}
        onCancel={cancelBetConfirm}
      />
    </PresentationRoot>
  );
}
