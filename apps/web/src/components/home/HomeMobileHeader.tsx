import { useState } from "react";
import { Bell } from "lucide-react";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/i18n";
import { useAuth } from "@/contexts/auth-context";
import { useProfile } from "@/hooks/use-profile";
import { userInitial } from "@/lib/user-display";
import { useLoginPageController } from "@/features/auth/use-login-page-controller";
import { AccountSheet } from "@/components/shell/AccountSheet";
import { LoginModal } from "@/components/shell/LoginModal";

export interface HomeMobileHeaderProps {
  onMenuOpen: () => void;
}

/**
 * L1-16c · Mobile stake-lobby chrome (menu · brand · account).
 * Replaces the floating hamburger that overlapped countdown/tabs.
 */
export function HomeMobileHeader({ onMenuOpen }: HomeMobileHeaderProps) {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [accountOpen, setAccountOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginEngine = useLoginPageController({ redirectOnSuccess: false });
  const avatarInitial = userInitial(session, profile, t("shell.account.guestInitial"));

  return (
    <>
      <header
        data-hub-id="home-mobile-header"
        data-testid="home-mobile-header"
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-(--color-surface)/95 px-3 backdrop-blur md:hidden"
      >
        <button
          type="button"
          aria-label={t("home.side.open")}
          data-testid="home-side-trigger"
          onClick={onMenuOpen}
          className="grid size-10 place-items-center rounded-lg border border-border bg-(--color-surface-elev) text-foreground"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span className="text-(--color-primary)" aria-hidden>
            ◆
          </span>
          <span className="truncate text-sm font-semibold">{t("home.side.brand")}</span>
        </div>

        <span className="hidden shrink-0 items-center gap-1 rounded-md bg-(--color-up)/10 px-1.5 py-0.5 text-[10px] text-(--color-up) min-[380px]:inline-flex">
          <span className="size-1.5 rounded-full bg-(--color-up)" aria-hidden />
          {t("shell.system.ok")}
        </span>

        <button
          type="button"
          aria-label={t("shell.topbar.notif")}
          onClick={() => toast(t("shell.topbar.noNotif"))}
          className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-(--color-surface-elev)"
        >
          <Bell className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          aria-label={t("shell.topbar.avatar")}
          aria-haspopup="dialog"
          aria-expanded={accountOpen}
          className="grid size-10 place-items-center rounded-full text-[10px] text-(--color-primary)"
        >
          <span className="grid size-8 place-items-center rounded-full bg-(--color-surface-elev)">
            {avatarInitial}
          </span>
        </button>
      </header>

      <AccountSheet
        open={accountOpen}
        onOpenChange={setAccountOpen}
        onLoginOpen={() => {
          setAccountOpen(false);
          setLoginOpen(true);
        }}
      />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} engine={loginEngine} />
    </>
  );
}
