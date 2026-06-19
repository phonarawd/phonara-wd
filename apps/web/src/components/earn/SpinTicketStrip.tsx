import { cn } from "@/lib/utils";
import { Ticket } from "lucide-react";
import { t } from "@/i18n";

export interface SpinTicketStripProps {
  /** Ticket count as display string only (no calculation). */
  ticketsDisplay: string;
  /** Mock trigger — should reveal the WheelOfFortune. No reward payout. */
  onSpin: () => void;
  className?: string;
}

export function SpinTicketStrip({
  ticketsDisplay,
  onSpin,
  className,
}: SpinTicketStripProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-(--color-gold)/15 text-(--color-gold)">
        <Ticket className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{t("earn.spin.title")}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {t("earn.spin.tickets")}{" "}
          <span className="tabular-nums text-(--color-gold)">{ticketsDisplay}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onSpin}
        className="min-h-12 shrink-0 rounded-md bg-(--color-gold) px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        {t("earn.wheel.spin")}
      </button>
    </div>
  );
}
