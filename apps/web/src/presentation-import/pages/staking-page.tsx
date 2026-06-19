import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6" data-testid="staking-page">
        <header className="grid gap-1">
          <h1 className="text-2xl font-medium">{t("wallet.staking.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("wallet.staking.subtitle")}</p>
          {balanceDisplay ? (
            <p className="text-sm tabular-nums text-(--color-primary)" data-testid="staking-hero-balance">
              {balanceDisplay}
            </p>
          ) : null}
        </header>
        <GateBanner kind="kyc" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("wallet.staking.apr")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-medium text-(--color-primary) tabular-nums">
              {aprDisplay}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("wallet.staking.rewards")}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-medium tabular-nums">
              {rewardsDisplay}
            </CardContent>
          </Card>
        </div>
        {errorMessage ? (
          <p className="text-sm text-(--color-destructive)" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
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
          <section className="grid gap-2" data-testid="staking-positions">
            <h2 className="text-sm font-medium text-muted-foreground">{t("staking.myStaking")}</h2>
            {activePositions.map((position) => (
              <Card key={position.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="grid gap-1 text-sm">
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
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}
        <p className="text-xs text-muted-foreground">{t("wallet.staking.note")}</p>
      </div>
    </AppShell>
  );
}
