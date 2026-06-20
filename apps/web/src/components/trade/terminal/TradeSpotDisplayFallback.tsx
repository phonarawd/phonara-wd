import { Link } from "@/shims/react-router-dom";
import { t } from "@/i18n";

export function TradeSpotDisplayFallback({ readOnly = true }: { readOnly?: boolean }) {
  return (
    <div
      data-testid="trade-panel-spot"
      data-read-only={readOnly ? "1" : "0"}
      className="trade-terminal mx-auto w-full max-w-[1600px] p-4"
    >
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/login" className="text-(--color-primary) underline-offset-2 hover:underline">
          {t("trade.loginRequired")}
        </Link>
      </p>
    </div>
  );
}
