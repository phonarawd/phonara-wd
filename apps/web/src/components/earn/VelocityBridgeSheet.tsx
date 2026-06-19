// VelocityBridgeSheet uses plain <a href> for the 3 casino deep-links
// (full navigation acceptable across surfaces; avoids router-context dep in tests).
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { t } from "@/i18n";

// Wave 4R — VelocityBridgeSheet (Earn → Casino)
// Presentation-only sheet. Opens after a Wave 3R micro task completes
// (WatchAd/Survey/Quiz). 3 game recommendations deep-link to existing
// casino routes. No engine, no wallet credit, no Math.random.

export type VelocityBridgeSource = "watch" | "survey" | "quiz" | "wheel";

export interface VelocityBridgeSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: VelocityBridgeSource;
}

const RECS = [
  { id: "crash", to: "/casino/crash" },
  { id: "plinko", to: "/casino/plinko" },
  { id: "momentum", to: "/casino/momentum" },
] as const;

export function VelocityBridgeSheet({
  open,
  onOpenChange,
  source = "watch",
}: VelocityBridgeSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="velocity-bridge-sheet"
        className="max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{t("earn.velocityBridge.title")}</SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`earn.velocityBridge.desc.${source}`)}
        </p>

        <ul className="mt-4 grid gap-2">
          {RECS.map((rec) => (
            <li key={rec.id}>
              <a
                href={rec.to}
                onClick={() => onOpenChange(false)}
                data-testid={`velocity-bridge-rec-${rec.id}`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-(--color-surface) px-3 py-2 text-left hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {t(`earn.velocityBridge.rec.${rec.id}.title`)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(`earn.velocityBridge.rec.${rec.id}.subtitle`)}
                  </div>
                </div>
                <span aria-hidden className="text-(--color-primary)">→</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          data-testid="velocity-bridge-later"
          className="mt-4 min-h-10 w-full rounded-md border border-border bg-transparent text-xs font-medium text-muted-foreground hover:bg-(--color-surface-elev)"
        >
          {t("earn.velocityBridge.cta.later")}
        </button>

        <p className="mt-2 text-[10px] text-muted-foreground/80">
          {t("earn.velocityBridge.disclosure")}
        </p>
      </SheetContent>
    </Sheet>
  );
}
