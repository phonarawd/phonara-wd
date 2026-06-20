import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, formatMoney } from "@phonara/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import {
  useFuturesActions,
  type FuturesPosition,
} from "@/hooks/use-trading";
import { useConfirmSnapshot } from "@/hooks/use-confirm-snapshot";
import { computePnl } from "@phonara/trading-engine";
import { isNegativeAmount } from "@/lib/money-display";

export function LovableFuturesPositionsCard({
  positions,
  prices,
  isPriceStale,
  realtimeDisconnected,
  onClosed,
}: {
  positions: FuturesPosition[];
  prices: Record<string, string>;
  isPriceStale: (symbol: string | null | undefined) => boolean;
  realtimeDisconnected: boolean;
  onClosed: () => void;
}) {
  const { closePosition, partialClosePosition, busy } = useFuturesActions(onClosed);
  const [closing, setClosing] = useState<FuturesPosition | null>(null);
  const open = positions.filter((p) => p.status === "open");

  const closingCcy = (closing?.margin_currency ?? "USDT") as "PHON" | "USDT";
  const closingMark = closing ? (prices[closing.market] ?? closing.entry_price) : "0";
  const closingPnl = closing
    ? computePnl(closing.side, closing.quantity, closing.entry_price, closingMark, closingCcy)
    : "0";
  const closingPriceStale = closing ? isPriceStale(closing.market) : false;
  const closingTradeBlocked = closingPriceStale || realtimeDisconnected;

  const handleConfirmDrift = useCallback(() => {
    toast.warning(t("trade.confirm.priceChanged"));
  }, []);
  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: closing !== null,
    fingerprint: closing ? `${closing.market}:${closingMark}` : "",
    onDrift: handleConfirmDrift,
  });

  async function submitClose() {
    if (!closing || closingTradeBlocked) return;
    const id = closing.id;
    setClosing(null);
    await closePosition(id);
  }

  return (
    <>
      <Card>
        <CardHeader className="py-2">
          <CardTitle className="text-xs">{t("trade.panel.positions")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-3 text-xs">
          {open.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("trade.empty.positions")}</p>
          ) : (
            open.map((pos) => {
              const mark = prices[pos.market] ?? pos.entry_price;
              const marginCcy = pos.margin_currency as "PHON" | "USDT";
              const uPnl = computePnl(pos.side, pos.quantity, pos.entry_price, mark, marginCcy);
              const stale = isPriceStale(pos.market);
              return (
                <div
                  key={pos.id}
                  className="grid gap-2 rounded-lg border border-border bg-(--color-surface) p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{pos.market}</span>
                    <span className={pos.side === "long" ? "text-(--color-up)" : "text-(--color-down)"}>
                      {t(pos.side === "long" ? "trade.long" : "trade.short")} {pos.leverage}x
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                    <span>{t("trade.entryPrice")}: {formatMoney(pos.entry_price, "USDT")}</span>
                    <span>{t("trade.markPrice")}: {formatMoney(mark, "USDT")}</span>
                    <span className={isNegativeAmount(uPnl) ? "text-(--color-down)" : "text-(--color-up)"}>
                      {t("trade.unrealizedPnl")}: {formatMoney(uPnl, marginCcy, { signed: true })} {marginCcy}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      data-testid="futures-partial-close"
                      disabled={busy || stale || realtimeDisconnected}
                      onClick={() => void partialClosePosition(pos.id, "0.5")}
                      className="min-h-10 rounded-md border border-border bg-(--color-surface-elev) text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {t("trade.partialClose50Btn")}
                    </button>
                    <button
                      type="button"
                      data-testid="futures-close"
                      disabled={busy || stale || realtimeDisconnected}
                      onClick={() => setClosing(pos)}
                      className="min-h-10 rounded-md border border-border bg-(--color-surface-elev) text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {t("trade.closePositionBtn")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={closing !== null}
        title={t("confirm.futuresClose.title")}
        description={t("trade.confirm.review")}
        notice={
          closingTradeBlocked
            ? t("trade.confirm.staleBlocked")
            : isDrifted
              ? t("trade.confirm.priceChanged")
              : undefined
        }
        noticeTone={closingTradeBlocked ? "danger" : "warning"}
        tone="danger"
        rows={
          closing
            ? [
                { label: t("confirm.row.market"), value: closing.market },
                { label: t("confirm.row.markPrice"), value: formatMoney(closingMark, "USDT") },
                {
                  label: t("trade.unrealizedPnl"),
                  value: `${formatMoney(closingPnl, closingCcy, { signed: true })} ${closingCcy}`,
                },
              ]
            : []
        }
        confirmLabel={t("trade.closePositionBtn")}
        cancelLabel={t("common.cancel")}
        processingLabel={t("common.processing")}
        busy={busy}
        confirmDisabled={!canConfirm || closingTradeBlocked}
        testId="futures-close"
        onConfirm={() => void submitClose()}
        onCancel={() => setClosing(null)}
      />
    </>
  );
}
