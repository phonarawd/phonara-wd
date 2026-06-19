import { ConfirmDialog } from '@phonara/ui';

import { PresentationRoot } from '../presentation-root';

import { ImportedStakingPage } from '../pages/staking-page';

import { useStakingPageController } from '../../features/wallet/use-staking-page-controller';



export function StakingLovableSurface() {

  const controller = useStakingPageController();



  if (controller.authLoading || controller.walletLoading) {

    return (

      <PresentationRoot>

        <div

          className="flex min-h-dvh items-center justify-center"

          aria-busy="true"

          data-testid="staking-loading"

        >

          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />

        </div>

      </PresentationRoot>

    );

  }



  const primaryTermKey = controller.primaryPool

    ? controller.stakingTermLabelKey(controller.primaryPool.term)

    : 'staking.term.flexible';



  return (

    <PresentationRoot>

      <ImportedStakingPage

        balanceDisplay={controller.balanceDisplay}

        aprDisplay={controller.aprDisplay}

        rewardsDisplay={controller.rewardsDisplay}

        busy={controller.busy}

        errorMessage={controller.errorMessage}

        canStake={controller.canStake}

        canUnstake={controller.canUnstake}

        activePositions={controller.activePositions}

        onRequestStake={controller.requestStakePrimary}

        onUnstake={() => void controller.handleUnstakePrimary()}

        onRequestClaim={controller.requestClaim}

      />



      <ConfirmDialog

        open={controller.stakeConfirmOpen}

        title={controller.t('confirm.stake.title')}

        description={controller.t('trade.confirm.review')}

        rows={[

          {

            label: controller.t('staking.term.flexible'),

            value: controller.t(primaryTermKey),

          },

          {

            label: controller.t('staking.principal'),

            value: `${controller.stakeAmountDisplay} PHON`,

            emphasis: 'hero',

          },

        ]}

        confirmLabel={controller.t('wallet.staking.stake')}

        cancelLabel={controller.t('common.cancel')}

        processingLabel={controller.t('common.processing')}

        busy={controller.busy}

        testId="stake"

        onConfirm={() => void controller.confirmStakePrimary()}

        onCancel={() => controller.setStakeConfirmOpen(false)}

      />



      <ConfirmDialog

        open={controller.actionConfirm !== null}

        title={controller.t('staking.claimReward')}

        description={controller.t('trade.confirm.review')}

        confirmLabel={controller.t('staking.claimReward')}

        cancelLabel={controller.t('common.cancel')}

        processingLabel={controller.t('common.processing')}

        busy={controller.busy}

        testId="staking-action"

        onConfirm={() => void controller.confirmStakingAction()}

        onCancel={() => controller.setActionConfirm(null)}

      />

    </PresentationRoot>

  );

}

