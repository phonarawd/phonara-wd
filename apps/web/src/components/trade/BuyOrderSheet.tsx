import { useEffect } from "react";
import { Drawer, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { OrderTypeTabs, type OrderType } from "./OrderTypeTabs";
import { AmountPercentChips } from "./AmountPercentChips";
import { LeverageSlider } from "./LeverageSlider";
import { OrderSummaryRow } from "./OrderSummaryRow";
import { FomoStack } from "./FomoStack";
import type { Tier } from "@/components/fomo/TierBadge";

export type Side = "long" | "short";

export interface BuyOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  side: Side;
  onSideChange: (s: Side) => void;

  symbol: string;
  /** Live last price as a display string (never used for calculation). */
  lastPriceDisplay: string;
  /** Optional prefilled price from order book row tap. Display string only. */
  prefillPriceDisplay?: string;

  priceInput: string;
  onPriceInput: (v: string) => void;
  amountInput: string;
  onAmountInput: (v: string) => void;

  availableBalanceDisplay: string;
  estFeeDisplay: string;
  estLiqPriceDisplay: string;
  marginDisplay?: string;

  leverage: number;
  onLeverageChange: (n: number) => void;
  maxLeverage?: number;

  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;

  tpEnabled?: boolean;
  onTpToggle?: (b: boolean) => void;
  slEnabled?: boolean;
  onSlToggle?: (b: boolean) => void;

  fomo?: {
    countdownEndsAt?: number;
    streakDays?: number;
    streakGoal?: number;
    missionCurrent?: number;
    missionGoal?: number;
    missionRewardLabel?: string;
    tier?: Tier;
  };
}

export function BuyOrderSheet(props: BuyOrderSheetProps) {
  const {
    open,
    onOpenChange,
    side,
    onSideChange,
    symbol,
    lastPriceDisplay,
    prefillPriceDisplay,
    priceInput,
    onPriceInput,
    amountInput,
    onAmountInput,
    availableBalanceDisplay,
    estFeeDisplay,
    estLiqPriceDisplay,
    marginDisplay,
    leverage,
    onLeverageChange,
    maxLeverage = 125,
    orderType,
    onOrderTypeChange,
    tpEnabled,
    onTpToggle,
    slEnabled,
    onSlToggle,
    fomo,
  } = props;

  // When a prefill arrives (order book row tap), mirror it into priceInput.
  useEffect(() => {
    if (open && prefillPriceDisplay && prefillPriceDisplay !== priceInput) {
      onPriceInput(prefillPriceDisplay);
    }
    // intentionally only on open / prefill change
     
  }, [open, prefillPriceDisplay]);

  const isLong = side === "long";
  const sideAccent = isLong ? "text-(--color-up)" : "text-(--color-down)";
  const sideBg = isLong ? "bg-(--color-up)" : "bg-(--color-down)";
  const sideText = isLong ? "text-black" : "text-white";
  const ctaLabel = isLong ? `매수 / 롱  ·  ${symbol}` : `매도 / 숏  ·  ${symbol}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex h-auto max-h-[92svh] flex-col rounded-t-2xl border border-border bg-background",
            "focus-visible:outline-none",
          )}
        >
          {/* drag handle */}
          <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-(--color-surface-elev)" />

          {/* header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <DrawerPrimitive.Title className="text-base font-semibold">
                {isLong ? "롱 진입" : "숏 진입"}
              </DrawerPrimitive.Title>
              <span className="truncate text-xs text-muted-foreground">{symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">마지막 가격</div>
                <div className={cn("text-sm tabular-nums", sideAccent)}>{lastPriceDisplay}</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="닫기"
                className="grid size-12 place-items-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* side toggle */}
            <SideSegment value={side} onChange={onSideChange} />

            {/* FOMO */}
            {fomo && (
              <div className="mt-4">
                <FomoStack {...fomo} />
              </div>
            )}

            {/* leverage */}
            <div className="mt-5">
              <LeverageSlider value={leverage} onChange={onLeverageChange} max={maxLeverage} />
            </div>

            {/* order type */}
            <div className="mt-5">
              <OrderTypeTabs value={orderType} onChange={onOrderTypeChange} />
            </div>

            {/* price */}
            <div className="mt-3">
              <FieldInput
                label="가격 (USDT)"
                value={orderType === "market" ? "시장가" : priceInput}
                onChange={onPriceInput}
                disabled={orderType === "market"}
                placeholder={lastPriceDisplay}
                inputMode="decimal"
              />
            </div>

            {/* amount */}
            <div className="mt-3">
              <FieldInput
                label={`수량 (${symbol.replace(/USDT$/, "")})`}
                value={amountInput}
                onChange={onAmountInput}
                placeholder="0.00"
                inputMode="decimal"
              />
              <div className="mt-2">
                <AmountPercentChips
                  onPick={(label) => onAmountInput(label)}
                  active={amountInput.endsWith("%") ? amountInput : undefined}
                />
              </div>
            </div>

            {/* TP / SL */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ToggleRow label="익절 (TP)" checked={!!tpEnabled} onChange={onTpToggle} />
              <ToggleRow label="손절 (SL)" checked={!!slEnabled} onChange={onSlToggle} />
            </div>

            {/* summary */}
            <div className="mt-4">
              <OrderSummaryRow
                availableBalanceDisplay={availableBalanceDisplay}
                estFeeDisplay={estFeeDisplay}
                estLiqPriceDisplay={estLiqPriceDisplay}
                marginDisplay={marginDisplay}
              />
            </div>
          </div>

          {/* sticky CTA */}
          <div
            className="border-t border-border bg-background/95 px-4 pt-3 backdrop-blur"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => {
                // Mock display only — no order submission, no balance change.
                onOpenChange(false);
              }}
              className={cn(
                "flex min-h-14 w-full items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                sideBg,
                sideText,
                "transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              )}
            >
              {ctaLabel}
            </button>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}

function SideSegment({ value, onChange }: { value: Side; onChange: (s: Side) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-(--color-surface) p-1">
      <SegBtn
        active={value === "long"}
        onClick={() => onChange("long")}
        activeClass="bg-(--color-up) text-black"
        label="롱 / 매수"
      />
      <SegBtn
        active={value === "short"}
        onClick={() => onChange("short")}
        activeClass="bg-(--color-down) text-white"
        label="숏 / 매도"
      />
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  activeClass,
  label,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-12 rounded-md text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        active ? activeClass : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className={cn(
          "h-12 w-full rounded-lg border border-border bg-(--color-surface) px-3 text-sm tabular-nums",
          "placeholder:text-muted-foreground/60",
          "focus-visible:border-(--color-ring)/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
          disabled && "opacity-50",
        )}
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange?: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-lg border px-3 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
        checked
          ? "border-foreground/40 bg-(--color-surface-elev) text-foreground"
          : "border-border bg-(--color-surface) text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          checked ? "bg-(--color-up)" : "bg-muted-foreground/40",
        )}
      />
    </button>
  );
}
