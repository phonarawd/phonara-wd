import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, Headphones } from "lucide-react";
import { Link, useRouter, useRouterState } from "@/shims/react-router-dom";
import { t } from "@/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtKRW } from "@/lib/format";
import { userInitial } from "@/lib/user-display";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { useLoginPageController } from "@/features/auth/use-login-page-controller";
import { AccountSheet } from "./AccountSheet";
import { LoginModal } from "./LoginModal";

const TITLE_KEYS: Record<string, string> = {
  "/trade": "shell.title.trade",
  "/earn": "shell.title.earn",
  "/games": "shell.title.games",
  "/wallet": "shell.title.wallet",
  "/leaderboard": "shell.title.leaderboard",
  "/referral": "shell.title.referral",
  "/account": "shell.title.account",
  "/settings": "shell.title.settings",
};

function titleForPath(pathname: string): string {
  if (TITLE_KEYS[pathname]) return t(TITLE_KEYS[pathname]);
  for (const key of Object.keys(TITLE_KEYS)) {
    const titleKey = TITLE_KEYS[key];
    if (titleKey && pathname.startsWith(key + "/")) return t(titleKey);
  }
  return "";
}

export interface TopBarProps {
  assets?: number;
  /** Hide 총자??chip (set by AppShell hideAssets, e.g. on /home). */
  hideAssets?: boolean;
  /** Open the shared Support sheet owned by AppShell. */
  onSupportOpen?: () => void;
}

export function TopBar({ assets = 0, hideAssets = false, onSupportOpen }: TopBarProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/" || pathname === "/home";
  const title = titleForPath(pathname);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { session, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { wallet, loading: walletLoading } = useWallet();
  const loginEngine = useLoginPageController({ redirectOnSuccess: false });
  const isLoggedIn = !!session;

  const assetsDisplay = useMemo(() => {
    if (authLoading || (isLoggedIn && walletLoading)) return null;
    if (wallet?.krw_available != null) {
      const parsed = Number.parseInt(wallet.krw_available, 10);
      if (!Number.isNaN(parsed)) return fmtKRW(parsed);
    }
    if (isLoggedIn) return "—";
    if (assets != null && assets > 0) return fmtKRW(assets);
    return null;
  }, [assets, authLoading, isLoggedIn, wallet?.krw_available, walletLoading]);

  const avatarInitial = userInitial(
    session,
    profile,
    t("shell.account.guestInitial"),
  );

  useEffect(() => {
    if (!authLoading && session && loginOpen) setLoginOpen(false);
  }, [session, authLoading, loginOpen]);

  const goBack = () => {
    try {
      if (router.history.canGoBack && router.history.canGoBack()) {
        router.history.back();
        return;
      }
    } catch {
      // ignore
    }
    router.navigate({ to: "/home" });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-(--color-surface)/95 px-2 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-1 md:hidden">
          {isRoot ? (
            <Link
              to="/home"
              className="ml-2 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              aria-label={t("shell.topbar.home")}
            >
              <span className="text-(--color-primary)">◆</span>
              <span className="text-sm font-medium">PHONARA</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={goBack}
                aria-label={t("shell.topbar.back")}
                className="grid h-12 w-12 place-items-center rounded-md text-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="truncate text-sm font-medium">{title}</span>
            </>
          )}
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 rounded-md bg-(--color-up)/10 px-2 py-1 text-(--color-up)">
            <span className="size-1.5 rounded-full bg-(--color-up)" />
            {t("shell.system.ok")}
          </span>
          {!hideAssets && isLoggedIn && (
            <>
              <span className="hidden text-muted-foreground sm:inline">
                {t("shell.assets")}
              </span>
              <span
                className="hidden font-medium tabular-nums sm:inline"
                aria-busy={assetsDisplay === null ? true : undefined}
              >
                {assetsDisplay === null ? (
                  <span
                    className="inline-block h-4 w-20 animate-pulse rounded bg-(--color-surface-elev)"
                    aria-label={t("shell.topbar.balanceLoading")}
                  />
                ) : (
                  assetsDisplay
                )}
              </span>
            </>
          )}
          {!isLoggedIn && (
            <>
              <Link
                to="/signup"
                className="hidden min-h-10 items-center rounded-md px-3 text-xs font-bold text-(--color-primary-foreground) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) md:inline-flex"
                style={{
                  backgroundImage: "var(--gradient-cta)",
                  boxShadow: "var(--shadow-glow-cta)",
                }}
              >
                {t("shell.topbar.signup")}
              </Link>
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="hidden min-h-10 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) md:inline-flex"
              >
                {t("shell.topbar.login")}
              </button>
            </>
          )}
          {onSupportOpen && (
            <button
              type="button"
              aria-label={t("shell.support.open")}
              onClick={onSupportOpen}
              className="hidden size-10 place-items-center rounded-md text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) md:grid"
            >
              <Headphones className="size-4" />
            </button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t("shell.topbar.notif")}
                className="grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
              >
                <Bell className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4" data-testid="topbar-notif-empty">
              <div className="flex flex-col items-center gap-2 py-2 text-center text-sm text-muted-foreground">
                <Bell className="size-5 opacity-50" aria-hidden />
                <p>{t("shell.topbar.noNotif")}</p>
              </div>
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            aria-label={t("shell.topbar.avatar")}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className="grid h-11 w-11 place-items-center rounded-full text-[10px] text-(--color-primary) hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            <span className="grid size-7 place-items-center rounded-full bg-(--color-surface-elev)">
              {avatarInitial}
            </span>
          </button>
        </div>
      </header>
      <AccountSheet
        open={accountOpen}
        onOpenChange={setAccountOpen}
        onLoginOpen={() => {
          setAccountOpen(false);
          setLoginOpen(true);
        }}
        onSupportOpen={() => {
          setAccountOpen(false);
          onSupportOpen?.();
        }}
      />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} engine={loginEngine} />
    </>
  );
}
