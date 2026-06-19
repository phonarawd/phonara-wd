import { t } from "@/i18n";
import { OnlineCountBadge } from "@/components/fomo/OnlineCountBadge";
import { useHomeWalletDisplay } from "@/features/home/use-home-wallet-display";

/**
 * L1-16b · Single consolidated balance card replacing the legacy hero balance
 * stack. Balance is the SOT on `/home`; shell TopBar 총자산 is hidden here.
 */
export function HomeWalletSnapshotCard() {
  const { balanceDisplay, todayEarnDisplay } = useHomeWalletDisplay();
  return (
    <section
      data-hub-id="home-wallet-snapshot"
      data-testid="home-wallet-snapshot"
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-[var(--shadow-soft)] md:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("home.wallet.balanceLabel")}
          </p>
          <p
            className="mt-1 truncate font-mono text-3xl font-bold tabular-nums md:text-4xl"
            data-testid="dashboard-hero-balance"
          >
            {balanceDisplay}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("home.wallet.todayEarnLabel")}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-(--color-primary)">
            {todayEarnDisplay}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <OnlineCountBadge count={3214} />
        <span className="text-[10px] text-muted-foreground">
          {t("home.wallet.onlineLabel")}
        </span>
      </div>
    </section>
  );
}
