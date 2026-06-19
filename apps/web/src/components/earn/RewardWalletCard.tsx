import { cn } from "@/lib/utils";
import { Coins, Percent, Ticket } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";

export interface RewardWalletCardProps {
  /** All display-only strings — never compute on these. */
  pointsDisplay: string;
  usdtConvertibleDisplay: string;
  discountTicketsDisplay: string;
  freeTradeTicketsDisplay: string;
  className?: string;
}

/**
 * Reward wallet summary. All buttons are mock — no conversion, no usage,
 * no balance/ticket mutation. Toast feedback only.
 */
export function RewardWalletCard({
  pointsDisplay,
  usdtConvertibleDisplay,
  discountTicketsDisplay,
  freeTradeTicketsDisplay,
  className,
}: RewardWalletCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">{t("earn.wallet.title")}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("earn.wallet.stat.points")} value={pointsDisplay} accent="text-(--color-primary)" />
        <Stat
          label={t("earn.wallet.stat.usdt")}
          value={usdtConvertibleDisplay}
          accent="text-foreground"
        />
        <Stat
          label={t("earn.wallet.stat.discount")}
          value={discountTicketsDisplay}
          accent="text-(--color-gold)"
        />
        <Stat
          label={t("earn.wallet.stat.freeTrade")}
          value={freeTradeTicketsDisplay}
          accent="text-(--color-info)"
        />
      </div>

      <div className="mt-4 grid gap-2">
        <ActionRow
          Icon={Coins}
          label={t("earn.wallet.action.convert")}
          tag={t("earn.wallet.comingSoon")}
          onClick={() => toast(t("earn.wallet.toast.convertSoon"))}
          disabled
        />
        <ActionRow
          Icon={Percent}
          label={t("earn.wallet.action.useDiscount")}
          onClick={() => toast.success(t("earn.wallet.toast.discountUsed"))}
        />
        <ActionRow
          Icon={Ticket}
          label={t("earn.wallet.action.useFreeTrade")}
          onClick={() => toast.success(t("earn.wallet.toast.freeTradeUsed"))}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-(--color-surface) p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-base font-semibold tabular-nums", accent)}>
        {value}
      </div>
    </div>
  );
}

function ActionRow({
  Icon,
  label,
  tag,
  onClick,
  disabled,
}: {
  Icon: typeof Coins;
  label: string;
  tag?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-12 items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 text-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        disabled ? "opacity-70" : "hover:bg-(--color-surface-elev)",
      )}
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      <span className="flex-1 text-left">{label}</span>
      {tag && (
        <span className="rounded bg-(--color-warn)/15 px-1.5 py-0.5 text-[10px] text-(--color-warn)">
          {tag}
        </span>
      )}
    </button>
  );
}

