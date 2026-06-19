import { Link } from "@/shims/react-router-dom";
import { Goal, Sparkles, Users, Trophy, User, Settings, Headphones, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { t } from "@/i18n";

export interface MoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Open AppShell-owned Support sheet (LOCK L3 bridge). */
  onSupportOpen?: () => void;
}

type LinkItem = {
  kind: "link";
  to: "/sports" | "/earn" | "/referral" | "/leaderboard" | "/account" | "/settings";
  label: string;
  Icon: LucideIcon;
};

type ActionItem = {
  kind: "action";
  action: "support";
  label: string;
  Icon: LucideIcon;
};

type OverflowItem = LinkItem | ActionItem;

const items: readonly OverflowItem[] = [
  { kind: "link", to: "/sports", label: "nav.sports", Icon: Goal },
  { kind: "link", to: "/earn", label: "nav.earn", Icon: Sparkles },
  { kind: "link", to: "/referral", label: "nav.referral", Icon: Users },
  { kind: "link", to: "/leaderboard", label: "nav.leaderboard", Icon: Trophy },
  { kind: "link", to: "/account", label: "nav.account", Icon: User },
  { kind: "link", to: "/settings", label: "nav.settings", Icon: Settings },
  { kind: "action", action: "support", label: "shell.account.menu.support", Icon: Headphones },
];

/**
 * MoreMenu ??bottom Sheet surfacing BottomNav overflow items + Support entry.
 * Support row opens the AppShell-owned SupportSheet via onSupportOpen callback
 * (Wave 1.3: FAB removed, MoreMenu is the mobile entry).
 */
export function MoreMenu({ open, onOpenChange, onSupportOpen }: MoreMenuProps) {
  const tileClass =
    "flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-(--color-surface-elev) text-xs text-foreground transition-colors hover:bg-(--color-surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        aria-label={t("shell.more.title")}
        className="gap-0 border-t border-border bg-(--color-surface) p-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="text-base font-semibold">
            {t("shell.more.title")}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t("shell.more.desc")}
          </SheetDescription>
        </SheetHeader>
        <ul className="grid grid-cols-3 gap-2 px-5 pt-3 pb-6 md:grid-cols-5">
          {items.map((item) => {
            const Icon = item.Icon;
            if (item.kind === "link") {
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => onOpenChange(false)}
                    className={tileClass}
                  >
                    <Icon className="size-5 text-(--color-primary)" aria-hidden />
                    <span>{t(item.label)}</span>
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.action}>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onSupportOpen?.();
                  }}
                  className={tileClass}
                >
                  <Icon className="size-5 text-(--color-primary)" aria-hidden />
                  <span>{t(item.label)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
