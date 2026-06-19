import { Link } from "@/shims/react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import { TierBadge, type Tier } from "@/components/fomo/TierBadge";
import { toast } from "sonner";
import {
  Bell,
  ChevronRight,
  Crown,
  Globe2,
  Headphones,
  Megaphone,
  ShieldCheck,
  User,
  Users,
  Wallet,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "@/i18n";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { useReferralDashboard } from "@/hooks/use-retention";
import { formatMoney } from "@/hooks/use-money";
import { signOut } from "@/lib/auth";
import { userDisplayName, userInitial } from "@/lib/user-display";
import { toDecimal } from "@phonara/money";

interface MenuRow {
  icon: LucideIcon;
  /** i18n key for the row label. */
  labelKey: string;
  /** Optional i18n key for a small badge pill (e.g. NEW). */
  badgeKey?: string;
  /** Navigate to a route (sheet closes via SheetClose wrapper). */
  to?: "/account" | "/settings" | "/referral" | "/tier";
  /** Bridge to AppShell-owned Support sheet (LOCK L3). */
  action?: "support";
}

const MENU: MenuRow[] = [
  { icon: Crown, labelKey: "shell.account.menu.tier", badgeKey: "shell.account.menu.tier.badge", to: "/tier" },
  { icon: User, labelKey: "shell.account.menu.account", to: "/account" },
  { icon: ShieldCheck, labelKey: "shell.account.menu.security" },
  { icon: Bell, labelKey: "shell.account.menu.notif" },
  { icon: Globe2, labelKey: "shell.account.menu.locale", to: "/settings" },
  { icon: Users, labelKey: "shell.account.menu.referral", to: "/referral" },
  { icon: Wallet, labelKey: "shell.account.menu.rewards" },
  { icon: Headphones, labelKey: "shell.account.menu.support", action: "support" },
  { icon: Megaphone, labelKey: "shell.account.menu.notice" },
];

function tierFromPhon(phon: string): Tier {
  try {
    const phonBal = toDecimal(phon);
    if (phonBal.greaterThanOrEqualTo("100000")) return "diamond";
    if (phonBal.greaterThanOrEqualTo("50000")) return "platinum";
    if (phonBal.greaterThanOrEqualTo("10000")) return "gold";
    if (phonBal.greaterThanOrEqualTo("1000")) return "silver";
  } catch {
    // fall through
  }
  return "bronze";
}

export interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Trigger LoginModal owned by TopBar. */
  onLoginOpen?: () => void;
  /** Trigger Support sheet owned by AppShell (LOCK L3). */
  onSupportOpen?: () => void;
}

export function AccountSheet({
  open,
  onOpenChange,
  onLoginOpen,
  onSupportOpen,
}: AccountSheetProps) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const { wallet } = useWallet();
  const { data: referralData } = useReferralDashboard();
  const isLoggedIn = !!session;

  const displayName = userDisplayName(session, profile, t("shell.account.guest"));
  const initial = userInitial(session, profile, t("shell.account.guestInitial"));
  const phon = wallet?.phon_available ?? "0";
  const krw = wallet?.krw_available ?? "0";
  const tier = isLoggedIn ? tierFromPhon(phon) : "bronze";

  const stats = isLoggedIn
    ? [
        { labelKey: "shell.account.stat.points", value: `${formatMoney(phon, "PHON")} P` },
        { labelKey: "shell.account.stat.assets", value: `₩${formatMoney(krw, "KRW")}` },
        {
          labelKey: "shell.account.stat.referral",
          value: String(referralData?.approved ?? 0),
        },
      ]
    : [
        { labelKey: "shell.account.stat.points", value: "5,000 P" },
        { labelKey: "shell.account.stat.assets", value: "—" },
        { labelKey: "shell.account.stat.referral", value: "0" },
      ];

  const handleSoon = () =>
    toast(t("shell.account.soon"), { description: t("shell.account.soon.desc") });

  const handleLogout = () => {
    void signOut().then(() => {
      onOpenChange(false);
      toast.success(t("shell.account.loggedOut"));
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        aria-label={t("shell.account.aria")}
        className="flex h-dvh w-[88vw] max-w-sm flex-col gap-0 border-l border-border bg-(--color-surface) p-0"
      >
        {/* Header */}
        <div className="relative px-5 pt-7 pb-5">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-32 opacity-60"
            style={{
              background:
                "radial-gradient(80% 100% at 100% 0%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <div
              aria-hidden
              className="grid size-14 place-items-center rounded-full bg-(--color-surface-elev) text-base font-semibold text-(--color-primary)"
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{displayName}</span>
                <TierBadge tier={tier} />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {isLoggedIn
                  ? (session?.user.email ?? t("shell.account.tagline"))
                  : t("shell.account.tagline")}
              </div>
            </div>
          </div>

          {!isLoggedIn && (
            <>
              <SheetClose asChild>
                <Link
                  to="/signup"
                  className="mt-5 flex min-h-14 w-full items-center justify-center rounded-xl text-sm font-bold text-(--color-primary-foreground) transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                  style={{
                    backgroundImage: "var(--gradient-cta)",
                    boxShadow: "var(--shadow-glow-cta)",
                  }}
                >
                  {t("shell.account.signupCta")}
                </Link>
              </SheetClose>

              <button
                type="button"
                onClick={() => (onLoginOpen ? onLoginOpen() : handleSoon())}
                className="mt-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground transition hover:bg-(--color-surface-elev) active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              >
                {t("shell.account.cta")}
              </button>
            </>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div
                key={s.labelKey}
                className="rounded-lg border border-border bg-(--color-surface-elev) px-2 py-2 text-center"
              >
                <div className="text-[10px] text-muted-foreground">
                  {t(s.labelKey)}
                </div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Menu list */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label={t("shell.account.menu.aria")}>
          <ul className="flex flex-col">
            {MENU.map((row) => {
              const label = t(row.labelKey);
              const badge = row.badgeKey ? t(row.badgeKey) : null;
              if (row.to) {
                return (
                  <li key={row.labelKey}>
                    <SheetClose asChild>
                      <Link
                        to={row.to}
                        className="flex min-h-12 items-center gap-3 px-5 py-2 text-sm hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                      >
                        <row.icon className="size-5 text-muted-foreground" aria-hidden />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="rounded-full bg-(--color-warn)/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-(--color-warn)">
                            {badge}
                          </span>
                        )}
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </Link>
                    </SheetClose>
                  </li>
                );
              }
              const onClick =
                row.action === "support"
                  ? () => (onSupportOpen ? onSupportOpen() : handleSoon())
                  : handleSoon;
              return (
                <li key={row.labelKey}>
                  <button
                    type="button"
                    onClick={onClick}
                    className="flex min-h-12 w-full items-center gap-3 px-5 py-2 text-left text-sm hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                  >
                    <row.icon className="size-5 text-muted-foreground" aria-hidden />
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <LogOut className="size-4" aria-hidden /> {t("shell.account.logout")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toast(t("shell.account.loggedOut"))}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <LogOut className="size-4" aria-hidden /> {t("shell.account.logout")}
            </button>
          )}
          <div className="mt-3 text-center text-[10px] text-muted-foreground">
            {t("shell.account.version")}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
