import { Drawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface OneHandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  /** Anchor at the bottom for one-hand reach. */
  anchor?: "bottom";
  className?: string;
}

/**
 * Bottom sheet sized for one-hand mobile reach.
 * Built on vaul Drawer to match GameRulesSheet styling.
 */
export function OneHandSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: OneHandSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Drawer.Content
          data-testid="casino-one-hand-sheet"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[70vh] flex-col rounded-t-2xl border border-border bg-(--color-surface) p-4 pb-[env(safe-area-inset-bottom)]",
            className,
          )}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
          {title && <Drawer.Title className="mb-2 text-base font-semibold">{title}</Drawer.Title>}
          <div className="overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
