import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// L1-15-P0 N4 — responsive detail drawer (right md+, bottom mobile).

export interface AdminDetailDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
}

export function AdminDetailDrawer(props: AdminDetailDrawerProps) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side={props.side ?? "right"}
        className="w-full max-w-md overflow-y-auto max-h-[85svh] sm:max-w-md"
        data-testid="admin-detail-drawer"
      >
        <SheetHeader>
          <SheetTitle>{props.title}</SheetTitle>
          {props.description ? (
            <SheetDescription>{props.description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="mt-4">{props.children}</div>
      </SheetContent>
    </Sheet>
  );
}
