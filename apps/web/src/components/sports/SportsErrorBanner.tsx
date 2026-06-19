import { t } from "@/i18n";

type ErrorCode =
  | "odds_changed"
  | "odds_stale"
  | "market_suspended"
  | "market_hedge_blocked"
  | "insufficient_balance"
  | "daily_bet_limit"
  | "network"
  | "unknown";

export function SportsErrorBanner({ code }: { code: ErrorCode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-(--color-warn)/40 bg-(--color-warn)/10 px-3 py-2 text-xs text-(--color-warn)"
    >
      <span aria-hidden>!</span>
      <span>{t(`sports.errors.${code}`)}</span>
    </div>
  );
}
