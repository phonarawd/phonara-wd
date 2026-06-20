import { ConfirmDialog, formatMoney } from "@phonara/ui";
import { t } from "@/i18n";
import type { SpotTerminalWire } from "./useSpotTerminalWire";

export function SpotOrderTicket({ wire }: { wire: SpotTerminalWire }) {
  const { side, setSide, amount, onAmountInput, usdtAvail, phonAvail, estimate, busy, error, tradeBlocked } =
    wire;

  return (
    <div className="trade-terminal__panel flex h-full flex-col">
      <div className="trade-terminal__panel-header">{t("trade.spot.orderTitle")}</div>
      <div className="grid flex-1 gap-2 p-3 text-xs">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            data-active={side === "buy"}
            onClick={() => setSide("buy")}
            className="min-h-11 rounded px-3 py-2 font-semibold data-[active=true]:bg-(--color-up) data-[active=true]:text-black"
          >
            {t("trade.spot.buy")}
          </button>
          <button
            type="button"
            data-active={side === "sell"}
            onClick={() => setSide("sell")}
            className="min-h-11 rounded px-3 py-2 font-semibold data-[active=true]:bg-(--color-down) data-[active=true]:text-white"
          >
            {t("trade.spot.sell")}
          </button>
        </div>
        <label className="grid gap-1">
          <span className="text-[10px] text-muted-foreground">
            {side === "buy" ? t("trade.payUsdt") : t("trade.sellPhonLabel")}
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountInput(e.target.value)}
            className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums"
          />
        </label>
        <div className="grid gap-1 rounded border border-border bg-(--color-surface) p-2 text-[11px] text-muted-foreground">
          <Row
            k={t("trade.order.avail")}
            v={
              side === "buy"
                ? formatMoney(usdtAvail, "USDT")
                : formatMoney(phonAvail, "PHON")
            }
          />
          <Row
            k={t("trade.estReceiveFee")}
            v={formatMoney(estimate ?? "0", side === "buy" ? "PHON" : "USDT")}
          />
        </div>
        {error ? <p className="text-[11px] text-(--color-down)">{t(error)}</p> : null}
        <button
          type="button"
          data-testid="spot-submit"
          disabled={busy || !estimate || tradeBlocked}
          onClick={() => wire.setConfirmOpen(true)}
          className={`flex min-h-12 items-center justify-center rounded-md text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
            side === "buy" ? "bg-(--color-up) text-black" : "bg-(--color-down) text-white"
          }`}
        >
          {busy
            ? t("common.processing")
            : side === "buy"
              ? t("trade.spot.submitBuy")
              : t("trade.spot.submitSell")}
        </button>
      </div>
    </div>
  );
}

export function SpotConfirmDialog({ wire }: { wire: SpotTerminalWire }) {
  const {
    confirmOpen,
    setConfirmOpen,
    confirmNotice,
    tradeBlocked,
    canConfirm,
    busy,
    side,
    price,
    amount,
    submit,
  } = wire;

  return (
    <ConfirmDialog
      open={confirmOpen}
      title={t(side === "buy" ? "confirm.spotBuy.title" : "confirm.spotSell.title")}
      description={t("trade.confirm.review")}
      notice={confirmNotice}
      tone={side === "buy" ? "primary" : "danger"}
      rows={[
        { label: t("confirm.row.markPrice"), value: formatMoney(price, "USDT") },
        {
          label: t("confirm.row.pay"),
          value: `${formatMoney(amount, side === "buy" ? "USDT" : "PHON")} ${side === "buy" ? "USDT" : "PHON"}`,
        },
      ]}
      confirmLabel={side === "buy" ? t("trade.buyPhon") : t("trade.sellPhonBtn")}
      cancelLabel={t("common.cancel")}
      processingLabel={t("common.processing")}
      busy={busy}
      confirmDisabled={!canConfirm || tradeBlocked}
      testId="spot"
      onConfirm={() => void submit()}
      onCancel={() => setConfirmOpen(false)}
    />
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
