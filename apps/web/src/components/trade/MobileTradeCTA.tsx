import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export interface MobileTradeCTAProps {
  onBuy?: () => void;
  onSell?: () => void;
  buyDisabled?: boolean;
  sellDisabled?: boolean;
  className?: string;
}

/**
 * Mobile-only sticky bottom dual CTA. --up / --down only — never --primary.
 */
export function MobileTradeCTA({
  onBuy,
  onSell,
  buyDisabled = false,
  sellDisabled = false,
  className,
}: MobileTradeCTAProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden",
        className,
      )}
    >
      {/* fade above CTA for separation from content */}
      <div className="h-6 bg-gradient-to-t from-background to-transparent" />
      <div
        className="pointer-events-auto border-t-2 border-border bg-background px-3 pt-3 shadow-[0_-8px_24px_rgb(0_0_0/0.4)]"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={buyDisabled ? undefined : onBuy}
            disabled={buyDisabled}
            className="flex min-h-14 items-center justify-center rounded-xl bg-(--color-up) text-base font-bold tracking-tight text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("trade.mobile.buyLong")}
          </button>
          <button
            type="button"
            onClick={sellDisabled ? undefined : onSell}
            disabled={sellDisabled}
            className="flex min-h-14 items-center justify-center rounded-xl bg-(--color-down) text-base font-bold tracking-tight text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("trade.mobile.sellShort")}
          </button>
        </div>
      </div>
    </div>
  );
}
