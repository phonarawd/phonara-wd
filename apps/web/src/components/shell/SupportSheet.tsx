import { Headphones } from "lucide-react";
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { t } from "@/i18n";

export interface SupportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * SupportSheet — support chat surface, controlled externally.
 * Opened via AccountSheet "고객센터" row or BottomNav MoreMenu "고객센터" row.
 * No floating FAB (Wave 1.3: removed for shell clarity).
 */
export function SupportSheet({ open, onOpenChange }: SupportSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        aria-label={t("shell.support.title")}
        className="flex h-dvh w-[88vw] max-w-sm flex-col gap-0 border-l border-border bg-(--color-surface) p-0"
      >
        <SheetHeader className="px-5 pt-6 pb-3">
          <SheetTitle className="text-base font-semibold">
            {t("shell.support.title")}
          </SheetTitle>
        </SheetHeader>
        <div className="h-px bg-border" />
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="rounded-xl border border-border bg-(--color-surface-elev) px-4 py-6 text-center">
            <Headphones className="mx-auto size-8 text-(--color-primary)" aria-hidden />
            <p className="mt-3 text-sm text-foreground">
              {t("shell.support.placeholder")}
            </p>
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <SheetClose asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border text-sm text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              {t("shell.support.close")}
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
