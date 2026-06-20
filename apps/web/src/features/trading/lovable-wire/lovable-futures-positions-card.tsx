import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, formatMoney } from "@phonara/ui";
import { toDecimal } from "@phonara/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import {
  useFuturesActions,
  type FuturesPosition,
} from "@/hooks/use-trading";
import { useConfirmSnapshot } from "@/hooks/use-confirm-snapshot";
import { computePnl } from "@phonara/trading-engine";
import { isNegativeAmount } from "@/lib/money-display";
import {
  formatLiquidationDistance,
  isLiquidationDistanceCritical,
} from "@/lib/format-liquidation-distance";

const PARTIAL_CLOSE_RATIO = "0.5";

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
  const [partialClosing, setPartialClosing] = useState<FuturesPosition | null>(null);
  const open = positions.filter((p) => p.status === "open");

  const closingCcy = (closing?.margin_currency ?? "USDT") as "PHON" | "USDT";
  const closingMark = closing ? (prices[closing.market] ?? closing.entry_price) : "0";
  const closingPnl = closing
    ? computePnl(closing.side, closing.quantity, closing.entry_price, closingMark, closingCcy)
    : "0";
  const closingPriceStale = closing ? isPriceStale(closing.market) : false;
  const closingTradeBlocked = closingPriceStale || realtimeDisconnected;

  const partialCcy = (partialClosing?.margin_currency ?? "USDT") as "PHON" | "USDT";
  const partialMark = partialClosing
    ? (prices[partialClosing.market] ?? partialClosing.entry_price)
    : "0";
  const partialHalfQty = partialClosing
    ? toDecimal(partialClosing.quantity).mul(PARTIAL_CLOSE_RATIO).toString()
    : "0";
  const partialEstPnl = partialClosing
    ? computePnl(
        partialClosing.side,
        partialHalfQty,
        partialClosing.entry_price,
        partialMark,
        partialCcy,
      )
    : "0";
  const partialPriceStale = partialClosing ? isPriceStale(partialClosing.market) : false;
  const partialTradeBlocked = partialPriceStale || realtimeDisconnected;

  const handleConfirmDrift = useCallback(() => {
    toast.warning(t("trade.confirm.priceChanged"));
  }, []);
  const { canConfirm, isDrifted } = useConfirmSnapshot({
    open: closing !== null,
    fingerprint: closing ? `${closing.market}:${closingMark}` : "",
    onDrift: handleConfirmDrift,
  });
  const { canConfirm: canConfirmPartial, isDrifted: isPartialDrifted } = useConfirmSnapshot({
    open: partialClosing !== null,
    fingerprint: partialClosing ? `${partialClosing.market}:${partialMark}` : "",
    onDrift: handleConfirmDrift,
  });

  async function submitClose() {
    if (!closing || closingTradeBlocked) return;
    const id = closing.id;
    setClosing(null);
    await closePosition(id);
  }

  async function submitPartialClose() {
    if (!partialClosing || partialTradeBlocked) return;
    const id = partialClosing.id;
    setPartialClosing(null);
    await partialClosePosition(id, PARTIAL_CLOSE_RATIO);
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
              const liqDistance = formatLiquidationDistance(mark, pos.liquidation_price);
              const liqCritical = isLiquidationDistanceCritical(liqDistance);
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
                    <span data-testid="futures-pos-liq-margin">
                      {t("trade.margin")}: {formatMoney(pos.margin_amount, marginCcy)} {marginCcy}
                    </span>
                    <span
                      data-testid="futures-pos-liq-price"
                      className="text-(--color-down)"
                    >
                      {t("trade.liquidationPrice")}: {formatMoney(pos.liquidation_price, "USDT")}
                    </span>
                    {liqDistance ? (
                      <span
                        data-testid="futures-pos-liq-distance"
                        className={
                          liqCritical
                            ? "col-span-2 text-(--color-down) font-semibold"
                            : "col-span-2"
                        }
                      >
                        {liqCritical ? "⚠ " : ""}
                        {t("trade.liquidationDistance")}: {liqDistance}
                      </span>
                    ) : null}
                    <span
                      className={`col-span-2 ${isNegativeAmount(uPnl) ? "text-(--color-down)" : "text-(--color-up)"}`}
                    >
                      {t("trade.unrealizedPnl")}: {formatMoney(uPnl, marginCcy, { signed: true })} {marginCcy}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      data-testid="futures-partial-close"
                      disabled={busy || stale || realtimeDisconnected}
                      onClick={() => setPartialClosing(pos)}
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
        open={partialClosing !== null}
        title={t("confirm.futuresPartialClose.title")}
        description={t("trade.confirm.review")}
        notice={
          partialTradeBlocked
            ? t("trade.confirm.staleBlocked")
            : isPartialDrifted
              ? t("trade.confirm.priceChanged")
              : undefined
        }
        noticeTone={partialTradeBlocked ? "danger" : "warning"}
        tone="danger"
        rows={
          partialClosing
            ? [
                { label: t("confirm.row.market"), value: partialClosing.market },
                {
                  label: t("confirm.row.side"),
                  value: `${t(partialClosing.side === "long" ? "trade.long" : "trade.short")} ${partialClosing.leverage}x`,
                },
                { label: t("confirm.row.closeRatio"), value: "50%" },
                { label: t("confirm.row.markPrice"), value: formatMoney(partialMark, "USDT") },
                {
                  label: t("trade.liquidationPrice"),
                  value: formatMoney(partialClosing.liquidation_price, "USDT"),
                  tone: "danger",
                },
                {
                  label: t("trade.margin"),
                  value: `${formatMoney(partialClosing.margin_amount, partialCcy)} ${partialCcy}`,
                },
                {
                  label: t("confirm.row.estRealizedPnl"),
                  value: `${formatMoney(partialEstPnl, partialCcy, { signed: true })} ${partialCcy}`,
                },
              ]
            : []
        }
        confirmLabel={t("trade.partialClose50Btn")}
        cancelLabel={t("common.cancel")}
        processingLabel={t("common.processing")}
        busy={busy}
        confirmDisabled={!canConfirmPartial || partialTradeBlocked}
        testId="futures-partial-close"
        onConfirm={() => void submitPartialClose()}
        onCancel={() => setPartialClosing(null)}
      />

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
                {
                  label: t("confirm.row.side"),
                  value: `${t(closing.side === "long" ? "trade.long" : "trade.short")} ${closing.leverage}x`,
                },
                { label: t("confirm.row.markPrice"), value: formatMoney(closingMark, "USDT") },
                {
                  label: t("trade.liquidationPrice"),
                  value: formatMoney(closing.liquidation_price, "USDT"),
                  tone: "danger",
                },
                {
                  label: t("trade.margin"),
                  value: `${formatMoney(closing.margin_amount, closingCcy)} ${closingCcy}`,
                },
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
