import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  Headphones,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sliders,
  UserCog,
  Users,
  Verified,
} from "lucide-react";
import { TierBadge } from "@/components/fomo/TierBadge";
import { toast } from "sonner";
import { t } from "@/i18n";

// Phase 12-E · A1 whitelist — the ONLY in-app deep link to /partner.
// MOCK-only mock gate; nav shell/home/earn/fomo MUST NOT link to /partner.
const showPartnerLink = true;


export function ImportedAccountPage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-2xl gap-4 p-4 md:p-6">
        <Card aria-label={t("account.identity.aria")}>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              aria-hidden
              className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-(--color-primary)/25 to-(--color-surface-elev) text-lg font-semibold text-(--color-primary) ring-1 ring-(--color-primary)/30 shadow-[0_0_24px_-8px_var(--color-primary)]"
            >
              JP
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-lg font-semibold tracking-tight">
                  {t("account.profile.guestName")}
                </h1>
                <TierBadge tier="bronze" />
              </div>
              <div className="mt-1 truncate font-mono text-xs tracking-tight text-muted-foreground">
                <span className="sr-only">{t("account.profile.emailLabel")}: </span>
                guest@phonara.app
              </div>
            </div>
          </CardContent>
        </Card>

        <div
          role="group"
          aria-label={t("account.stats.aria")}
          className="grid grid-cols-3 gap-2"
        >
          <StatCard label={t("account.stat.points")} value="5,000P" />
          <StatCard label={t("account.stat.volume")} value="—" muted />
          <StatCard label={t("account.stat.joinedAt")} value="2026.06" />
        </div>

        <Card>
          <CardContent className="grid gap-0.5 p-2">
            <MenuRow
              Icon={UserCog}
              label={t("account.menu.profile")}
              tag={t("account.tag.comingSoon")}
              onClick={() => toast(t("account.toast.profileSoon"))}
            />
            <MenuRow
              Icon={ShieldCheck}
              label={t("account.menu.security")}
              tag={t("account.tag.comingSoon")}
              onClick={() => toast(t("account.toast.securitySoon"))}
            />
            <MenuRow
              Icon={Verified}
              label={t("account.menu.kyc")}
              tag={t("account.tag.comingSoon")}
              onClick={() => toast(t("account.toast.kycSoon"))}
            />
            <MenuRow
              Icon={KeyRound}
              label={t("account.menu.api")}
              tag={t("account.tag.comingSoon")}
              onClick={() => toast(t("account.toast.apiSoon"))}
            />
            <MenuRow Icon={Sliders} label={t("account.menu.settings")} to="/settings" />
            {showPartnerLink && (
              <MenuRow
                Icon={Users}
                label={t("referral.partner.nav.account")}
                to="/partner"
              />
            )}
            <MenuRow
              Icon={Headphones}
              label={t("account.menu.support")}
              tag={t("account.tag.comingSoon")}
              onClick={() => toast(t("account.toast.supportSoon"))}
            />

          </CardContent>
        </Card>

        <div
          role="group"
          aria-label={t("account.section.danger")}
          className="mt-1 grid gap-3 border-t border-border/50 pt-4"
        >
          <button
            type="button"
            onClick={() => toast.success(t("account.toast.logoutDone"))}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-(--color-down)/40 bg-transparent text-sm font-semibold text-(--color-down) hover:bg-(--color-down)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            <LogOut className="size-4" aria-hidden />
            {t("account.action.logout")}
          </button>

          <button
            type="button"
            onClick={() => toast(t("account.toast.deleteSoon"))}
            className="mx-auto text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            {t("account.action.deleteSoon")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-(--color-primary)/30">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 text-base font-semibold tabular-nums" +
          (muted ? " text-muted-foreground/60" : "")
        }
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function MenuRow({
  Icon,
  label,
  tag,
  to,
  onClick,
}: {
  Icon: typeof UserCog;
  label: string;
  tag?: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="group flex min-h-12 items-center gap-3 rounded-md border-l-2 border-transparent px-3 transition-colors hover:border-(--color-primary) hover:bg-(--color-surface-elev)">
      <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-(--color-primary)" aria-hidden />
      <span className="flex-1 text-sm">{label}</span>
      {tag && (
        <span className="rounded bg-(--color-warn)/15 px-2 py-0.5 text-[10px] font-medium text-(--color-warn)">
          {tag}
        </span>
      )}
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </div>
  );
  if (to)
    return (
      <Link
        to={to as '/settings'}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
      >
        {inner}
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
    >
      {inner}
    </button>
  );
}
