import { FuturesOrderTicketForm } from "@/features/trading/order-ticket/FuturesOrderTicketForm";
import { ConfirmDialog, formatMoney } from "@phonara/ui";
import { t } from "@/i18n";
import type { FuturesTerminalWire } from "../useFuturesTerminalWire";

export function FuturesOrderTicket({ wire }: { wire: FuturesTerminalWire }) {
  return (
    <div className="trade-terminal__panel flex h-full flex-col">
      <div className="grid flex-1 gap-2 p-3">
        <FuturesOrderTicketForm
          wire={wire}
          variant="desktop"
          onSubmit={() => wire.setConfirmOpen(true)}
        />
      </div>
    </div>
  );
}

function buildOpenConfirmRows(wire: FuturesTerminalWire) {
  const {
    side,
    market,
    price,
    margin,
    marginCurrency,
    leverage,
    preview,
    orderType,
  } = wire;

  const baseRows = [
    {
      label: t("confirm.row.market"),
      value: market?.display_name ?? market?.symbol ?? "",
    },
    {
      label: t("confirm.row.side"),
      value: t(side === "long" ? "trade.long" : "trade.short"),
    },
    { label: t("confirm.row.leverage"), value: `${leverage}x` },
    { label: t("confirm.row.markPrice"), value: formatMoney(price, "USDT") },
    {
      label: t("trade.margin"),
      value: `${formatMoney(margin, marginCurrency)} ${marginCurrency}`,
    },
  ];

  if (orderType === "market" && preview) {
    return [
      ...baseRows,
      {
        label: t("trade.liquidationPrice"),
        value: formatMoney(preview.liquidationPrice, "USDT"),
        tone: "danger" as const,
      },
      {
        label: t("trade.openFee"),
        value: `${formatMoney(preview.openFee, marginCurrency)} ${marginCurrency}`,
      },
    ];
  }

  if (orderType !== "market") {
    return [
      ...baseRows,
      {
        label: t("trade.liquidationPrice"),
        value: t("trade.confirm.liqAfterFill"),
        wrap: true,
      },
    ];
  }

  return baseRows;
}

export function FuturesConfirmDialog({ wire }: { wire: FuturesTerminalWire }) {
  const {
    confirmOpen,
    setConfirmOpen,
    confirmNotice,
    tradeBlocked,
    canConfirm,
    busy,
    side,
    submitOpen,
  } = wire;

  return (
    <ConfirmDialog
      open={confirmOpen}
      title={t("confirm.futuresOpen.title")}
      description={t("trade.confirm.review")}
      notice={confirmNotice}
      noticeTone={tradeBlocked ? "danger" : "warning"}
      tone={side === "long" ? "primary" : "danger"}
      rows={confirmOpen ? buildOpenConfirmRows(wire) : []}
      confirmLabel={t(side === "long" ? "trade.openLongPosition" : "trade.openShortPosition")}
      cancelLabel={t("common.cancel")}
      processingLabel={t("common.processing")}
      busy={busy}
      confirmDisabled={!canConfirm || tradeBlocked}
      testId="futures-open"
      onConfirm={() => void submitOpen()}
      onCancel={() => setConfirmOpen(false)}
    />
  );
}
