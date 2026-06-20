import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { GateBanner } from "@/components/ui/gate-banner";
import { formatMoney } from "@phonara/ui";
import { t } from "@/i18n";
import type { StakingPosition } from "../../features/wallet/use-staking-page-controller";
import { stakingTermLabelKey } from "../../features/wallet/use-staking-page-controller";

export type ImportedStakingPageProps = {
  balanceDisplay?: string;
  aprDisplay?: string;
  rewardsDisplay?: string;
  busy?: boolean;
  errorMessage?: string | null;
  canStake?: boolean;
  canUnstake?: boolean;
  activePositions?: StakingPosition[];
  onRequestStake?: () => void;
  onUnstake?: () => void;
  onRequestClaim?: (positionId: string) => void;
};

export function ImportedStakingPage({
  balanceDisplay,
  aprDisplay = "8.2%",
  rewardsDisplay = "0 USDT",
  busy = false,
  errorMessage = null,
  canStake = true,
  canUnstake = false,
  activePositions = [],
  onRequestStake,
  onUnstake,
  onRequestClaim,
}: ImportedStakingPageProps) {
  return (
    <AppShell density="app">
      <div
        className="trade-terminal mx-auto grid w-full max-w-5xl gap-0 border border-border"
        data-testid="staking-page"
      >
        <header className="trade-terminal__ticker grid gap-1 p-4">
          <h1 className="text-lg font-semibold">{t("wallet.staking.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("wallet.staking.subtitle")}</p>
          {balanceDisplay ? (
            <p className="text-sm tabular-nums text-(--color-primary)" data-testid="staking-hero-balance">
              {balanceDisplay}
            </p>
          ) : null}
        </header>
        <GateBanner kind="kyc" />
        <div className="grid border-t border-border sm:grid-cols-2">
          <div className="trade-terminal__panel border-r border-border p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("wallet.staking.apr")}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums text-(--color-up)">
              {aprDisplay}
            </div>
          </div>
          <div className="trade-terminal__panel p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("wallet.staking.rewards")}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{rewardsDisplay}</div>
          </div>
        </div>
        {errorMessage ? (
          <p className="border-t border-border px-4 py-2 text-sm text-(--color-destructive)" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          <Button
            disabled={busy || !canStake || !onRequestStake}
            data-testid="stake-submit"
            onClick={onRequestStake}
          >
            {busy ? t("common.processing") : t("wallet.staking.stake")}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !canUnstake || !onUnstake}
            data-testid="stake-unstake"
            onClick={onUnstake}
          >
            {t("wallet.staking.unstake")}
          </Button>
        </div>
        {activePositions.length > 0 ? (
          <section className="border-t border-border" data-testid="staking-positions">
            <div className="trade-terminal__panel-header">{t("staking.myStaking")}</div>
            {activePositions.map((position) => (
              <div
                key={position.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm"
              >
                <div className="grid gap-1">
                  <span className="font-medium">{t(stakingTermLabelKey(position.term))}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(position.principal, "PHON")} PHON
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={busy || !onRequestClaim}
                  data-testid="stake-claim"
                  onClick={() => onRequestClaim?.(position.id)}
                >
                  {t("staking.claimReward")}
                </Button>
              </div>
            ))}
          </section>
        ) : null}
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {t("wallet.staking.note")}
        </p>
      </div>
    </AppShell>
  );
}
