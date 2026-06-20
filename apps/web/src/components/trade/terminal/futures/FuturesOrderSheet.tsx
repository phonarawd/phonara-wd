import { Drawer, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { FuturesOrderTicketForm } from "@/features/trading/order-ticket/FuturesOrderTicketForm";
import type { FuturesTerminalWire } from "../useFuturesTerminalWire";

export type FuturesOrderSheetProps = {
  wire: FuturesTerminalWire;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "long" | "short";
  onSideChange: (side: "long" | "short") => void;
  onSubmit: () => void;
};

export function FuturesOrderSheet({
  wire,
  open,
  onOpenChange,
  side,
  onSubmit,
}: FuturesOrderSheetProps) {
  const isLong = side === "long";
  const sideAccent = isLong ? "text-(--color-up)" : "text-(--color-down)";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay className="trade-terminal__sheet-overlay" />
        <DrawerPrimitive.Content className="trade-terminal__sheet fixed inset-x-0 bottom-0 flex max-h-[92svh] flex-col rounded-t-2xl border border-border bg-background">
          <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-(--color-surface-elev)" />
          <div className="flex items-center justify-between px-4 py-3">
            <DrawerPrimitive.Title className="text-base font-semibold whitespace-nowrap">
              {isLong ? t("trade.mobile.longEntry") : t("trade.mobile.shortEntry")}
            </DrawerPrimitive.Title>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">{t("trade.mobile.lastPrice")}</div>
                <div className={cn("text-sm tabular-nums", sideAccent)}>{wire.priceDisplay}</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("common.close")}
                className="grid size-10 place-items-center text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <FuturesOrderTicketForm
              wire={wire}
              variant="sheet"
              showHeader={false}
              onSubmit={onSubmit}
            />
          </div>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </Drawer>
  );
}
