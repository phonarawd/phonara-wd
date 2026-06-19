import type { GameCode } from '@phonara/game-engine';
import { AppShell } from '@/components/shell/AppShell';
import { GameDetailFrame } from '@/components/casino/detail/GameDetailFrame';
import { GameBackLink } from '@/components/games/shared/GameBackLink';
import type { CasinoGameId } from '@/data/casino-game-meta';
import { GameSurfaceLoader } from '../../components/games/game-surface-loader';
import { useCasinoPageController } from '../../features/casino/use-casino-page-controller';
import { PresentationRoot } from '../presentation-root';
import { CasinoE2EFairnessAnchor } from './casino-e2e-fairness-anchor';
import { CasinoE2EErrorAnchor } from './casino-e2e-error-anchor';
import { CasinoMoneyConfirm } from './casino-money-confirm';

type CasinoLovableSurfaceProps = {
  initialGame: GameCode;
};

/** Engine `GameCode` → presentation route slug (`mint_reels` → `mint-reels`). */
function gameCodeToDetailId(code: GameCode): CasinoGameId {
  return code.replace(/_/g, '-') as CasinoGameId;
}

/**
 * Target casino route body after Lovable ZIP paste.
 * Engine: `useCasinoPageController` · Visual: Lovable shell + `GameSurfaceLoader`.
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
    settledResult,
    confirmOpen,
    busy,
    canConfirm,
    confirmNotice,
    stake,
    currency,
    clientSeed,
    errorKey,
    submitBet,
    cancelBetConfirm,
  } = controller;

  const detailGameId = gameCodeToDetailId(initialGame);
  const detailWide = initialGame === 'crash';

  if (authLoading) {
    return (
      <PresentationRoot>
        <AppShell density="app" hideMobileNav>
          <div className="flex min-h-[60dvh] items-center justify-center" aria-busy="true">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        </AppShell>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <AppShell density="app" hideMobileNav>
        <div className="grid gap-4 p-0 md:gap-4 md:p-6">
          <div className="hidden md:block">
            <GameBackLink />
          </div>
          <h1 className="sr-only">{t(config.labelKey)}</h1>
          <GameDetailFrame gameId={detailGameId} wide={detailWide}>
            <GameSurfaceLoader {...gameSurfaceProps} />
          </GameDetailFrame>
        </div>
      </AppShell>
      <CasinoE2EErrorAnchor
        errorKey={errorKey}
        title={t('casino.error.title')}
        description={errorKey ? t(errorKey) : ''}
      />
      <CasinoE2EFairnessAnchor
        commitment={commitment}
        verification={verificationEvidence}
        settledResult={settledResult}
      />
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
