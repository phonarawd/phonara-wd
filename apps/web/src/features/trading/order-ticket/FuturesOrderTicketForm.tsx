import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { toDecimal } from "@phonara/money";
import type { FuturesTerminalWire } from "@/components/trade/terminal/useFuturesTerminalWire";
import { MarginModeSegment } from "./MarginModeSegment";
import { OrderTypeTabs } from "./OrderTypeTabs";
import { LeverageControl } from "./LeverageControl";
import { TpSlFields } from "./TpSlFields";
import { OrderTicketSummaryFromPreview } from "./OrderTicketSummary";

export type FuturesOrderTicketFormProps = {
  wire: FuturesTerminalWire;
  variant?: "desktop" | "sheet";
  /** When set, renders inline submit (desktop). Sheet uses parent onSubmit. */
  onSubmit?: () => void;
  showHeader?: boolean;
  className?: string;
};

export function FuturesOrderTicketForm({
  wire,
  variant = "desktop",
  onSubmit,
  showHeader = variant === "desktop",
  className,
}: FuturesOrderTicketFormProps) {
  const {
    side,
    setSide,
    marginCurrency,
    setMarginCurrency,
    margin,
    onMarginInput,
    leverage,
    setLeverage,
    maxLeverageNum,
    tpEnabled,
    setTpEnabled,
    tpPrice,
    setTpPrice,
    slEnabled,
    setSlEnabled,
    slPrice,
    setSlPrice,
    preview,
    avail,
    busy,
    error,
    walletLoading,
    tradeBlocked,
    isHighLeverage,
    riskAck,
    oracleMarkDisplay,
    tone,
    orderType,
    setOrderType,
    limitPrice,
    setLimitPrice,
    stopPrice,
    setStopPrice,
    orderPricesReady,
    marginMode,
    setMarginMode,
    marginModeBusy,
    crossMarginEnabled,
    marginModeError,
  } = wire;

  const compact = variant === "sheet";

  const insufficientAvail = useMemo(() => {
    if (!preview) return false;
    try {
      const required = toDecimal(margin).plus(toDecimal(preview.openFee));
      return toDecimal(avail).lessThan(required);
    } catch {
      return false;
    }
  }, [avail, margin, preview]);

  return (
    <div className={cn("grid gap-2", compact ? "text-sm" : "text-xs", className)}>
      {showHeader ? (
        <div className="trade-terminal__panel-header -mx-3 -mt-0 px-3">{t("trade.order.title")}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          data-active={side === "long"}
          onClick={() => setSide("long")}
          className={cn(
            "rounded bg-(--color-up) font-semibold text-black data-[active=false]:opacity-50",
            compact ? "min-h-11" : "min-h-10 px-3 py-2",
          )}
        >
          {t("trade.order.long")}
        </button>
        <button
          type="button"
          data-active={side === "short"}
          onClick={() => setSide("short")}
          className={cn(
            "rounded bg-(--color-down) font-semibold text-white data-[active=false]:opacity-50",
            compact ? "min-h-11" : "min-h-10 px-3 py-2",
          )}
        >
          {t("trade.order.short")}
        </button>
      </div>

      <MarginModeSegment
        value={marginMode}
        onChange={(mode) => void setMarginMode(mode)}
        crossEnabled={crossMarginEnabled}
      />

      <OrderTypeTabs
        value={orderType}
        onChange={setOrderType}
        limitEnabled
        stopEnabled
      />

      {orderType === "limit" || orderType === "stop_limit" ? (
        <label className="grid gap-1">
          <span className="text-[10px] text-muted-foreground">{t("trade.order.limitPrice")}</span>
          <input
            inputMode="decimal"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums"
          />
        </label>
      ) : null}

      {orderType === "stop_market" || orderType === "stop_limit" ? (
        <label className="grid gap-1">
          <span className="text-[10px] text-muted-foreground">{t("trade.order.triggerPrice")}</span>
          <input
            inputMode="decimal"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums"
          />
        </label>
      ) : null}

      <Field
        label={t("trade.markPrice")}
        value={oracleMarkDisplay}
        hint={t("trade.chart.oracleLineDescription")}
        unavailable={wire.oracleMarkUnavailable}
      />

      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          data-active={marginCurrency === "USDT"}
          onClick={() => setMarginCurrency("USDT")}
          className="min-h-9 rounded border border-border px-2 py-1 data-[active=true]:bg-(--color-surface-elev)"
        >
          USDT
        </button>
        <button
          type="button"
          data-active={marginCurrency === "PHON"}
          onClick={() => setMarginCurrency("PHON")}
          className="min-h-9 rounded border border-border px-2 py-1 data-[active=true]:bg-(--color-surface-elev)"
        >
          PHON
        </button>
      </div>

      <label className="grid gap-1">
        <span className="text-[10px] text-muted-foreground">{t("trade.margin")}</span>
        <input
          inputMode="decimal"
          value={margin}
          onChange={(e) => onMarginInput(e.target.value)}
          className="h-10 rounded border border-border bg-(--color-surface) px-2 tabular-nums"
        />
      </label>

      <LeverageControl
        leverage={leverage}
        onLeverageChange={setLeverage}
        maxLeverage={maxLeverageNum}
        compact={compact}
      />

      <TpSlFields
        tpEnabled={tpEnabled}
        onTpToggle={setTpEnabled}
        tpPrice={tpPrice}
        onTpPriceChange={setTpPrice}
        slEnabled={slEnabled}
        onSlToggle={setSlEnabled}
        slPrice={slPrice}
        onSlPriceChange={setSlPrice}
      />

      {orderType === "market" ? (
        <OrderTicketSummaryFromPreview
          avail={wire.avail}
          marginCurrency={marginCurrency}
          availLabel={t("trade.order.avail")}
          openFeeLabel={t("trade.openFee")}
          liqLabel={t("trade.liquidationPrice")}
          preview={preview}
        />
      ) : null}

      {isHighLeverage && !riskAck.acknowledged ? (
        <button
          type="button"
          data-testid="trading-risk-ack"
          disabled={riskAck.busy}
          onClick={() => void riskAck.acknowledge()}
          className="rounded border border-(--color-warn)/40 px-2 py-1 text-[11px] text-(--color-warn)"
        >
          {t("trade.riskAckCta")}
        </button>
      ) : null}

      {error || marginModeError ? (
        <p className="text-[11px] text-(--color-down)">{t(error ?? marginModeError!)}</p>
      ) : null}

      {insufficientAvail && preview ? (
        <p className="text-[11px] text-(--color-down)">{t("error.INSUFFICIENT_BALANCE")}</p>
      ) : null}

      {onSubmit ? (
        <button
          type="button"
          data-testid="futures-open"
          disabled={
            busy ||
            walletLoading ||
            marginModeBusy ||
            (orderType === "market" && !preview) ||
            !orderPricesReady ||
            tradeBlocked ||
            (isHighLeverage && !riskAck.acknowledged) ||
            insufficientAvail
          }
          onClick={onSubmit}
          className={cn(
            "flex items-center justify-center rounded-md font-bold whitespace-nowrap hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
            compact ? "min-h-14 text-base" : "min-h-12 text-sm",
            tone.includes("down") && side === "short"
              ? "bg-(--color-down) text-white"
              : "bg-(--color-up) text-black",
          )}
        >
          {busy
            ? t("common.processing")
            : t(side === "long" ? "trade.order.submitLong" : "trade.order.submitShort")}
        </button>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  hint,
  unavailable,
}: {
  label: string;
  value: string;
  hint?: string;
  unavailable?: boolean;
}) {
  return (
    <div
      className="rounded border border-border bg-(--color-surface) px-2 py-1.5"
      title={hint}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn("tabular-nums", unavailable && "text-muted-foreground")}>{value}</div>
    </div>
  );
}
