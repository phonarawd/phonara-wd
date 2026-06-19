import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Activity,
  ScrollText,
  Bell,
  ShieldAlert,
  Dices,
  Coins,
  FileText,
  KeyRound,
  Settings as SettingsIcon,
} from "lucide-react";
import { ADMIN_ROUTES } from "@/lib/admin-nav";
import { t } from "@/i18n";
import { useAdminHotkeyContext } from "./AdminHotkeyProvider";

// L1-15-J · J2 — Admin command palette (Raycast / Linear class).
// admin-only — controlled by AdminHotkeyProvider scope (pathname /admin).
// Routes: overview · queues · users · sports · audit · alerts · operations ·
// casino · earn · cms · settings · mfa  ⇒ 12 (≥10).

export interface AdminCommandRoute {
  to: string;
  labelKey: string;
  sectionKey: string;
  shortcut: string;
  Icon: typeof LayoutDashboard;
  testId: string;
}

export const ADMIN_COMMAND_ROUTES: AdminCommandRoute[] = [
  {
    to: ADMIN_ROUTES.overview,
    labelKey: "admin.command.route.overview",
    sectionKey: "admin.command.section.operations",
    shortcut: "G O",
    Icon: LayoutDashboard,
    testId: "cmdk-go-overview",
  },
  {
    to: ADMIN_ROUTES.queues,
    labelKey: "admin.command.route.queues",
    sectionKey: "admin.command.section.operations",
    shortcut: "G Q",
    Icon: Inbox,
    testId: "cmdk-go-queues",
  },
  {
    to: ADMIN_ROUTES.operations,
    labelKey: "admin.command.route.operations",
    sectionKey: "admin.command.section.operations",
    shortcut: "G P",
    Icon: ShieldAlert,
    testId: "cmdk-go-operations",
  },
  {
    to: ADMIN_ROUTES.alerts,
    labelKey: "admin.command.route.alerts",
    sectionKey: "admin.command.section.operations",
    shortcut: "G L",
    Icon: Bell,
    testId: "cmdk-go-alerts",
  },
  {
    to: ADMIN_ROUTES.audit,
    labelKey: "admin.command.route.audit",
    sectionKey: "admin.command.section.operations",
    shortcut: "G A",
    Icon: ScrollText,
    testId: "cmdk-go-audit",
  },
  {
    to: ADMIN_ROUTES.casino,
    labelKey: "admin.command.route.casino",
    sectionKey: "admin.command.section.surfaces",
    shortcut: "G C",
    Icon: Dices,
    testId: "cmdk-go-casino",
  },
  {
    to: ADMIN_ROUTES.sports,
    labelKey: "admin.command.route.sports",
    sectionKey: "admin.command.section.surfaces",
    shortcut: "G S",
    Icon: Activity,
    testId: "cmdk-go-sports",
  },
  {
    to: ADMIN_ROUTES.earn,
    labelKey: "admin.command.route.earn",
    sectionKey: "admin.command.section.surfaces",
    shortcut: "G E",
    Icon: Coins,
    testId: "cmdk-go-earn",
  },
  {
    to: ADMIN_ROUTES.cms,
    labelKey: "admin.command.route.cms",
    sectionKey: "admin.command.section.surfaces",
    shortcut: "G N",
    Icon: FileText,
    testId: "cmdk-go-cms",
  },
  {
    to: ADMIN_ROUTES.users,
    labelKey: "admin.command.route.users",
    sectionKey: "admin.command.section.surfaces",
    shortcut: "G U",
    Icon: Users,
    testId: "cmdk-go-users",
  },
  {
    to: ADMIN_ROUTES.settings,
    labelKey: "admin.command.route.settings",
    sectionKey: "admin.command.section.access",
    shortcut: "G T",
    Icon: SettingsIcon,
    testId: "cmdk-go-settings",
  },
  {
    to: ADMIN_ROUTES.mfaPolicy,
    labelKey: "admin.command.route.mfa",
    sectionKey: "admin.command.section.access",
    shortcut: "G M",
    Icon: KeyRound,
    testId: "cmdk-go-mfa",
  },
];

export function AdminCommandPalette() {
  const navigate = useNavigate();
  const { paletteOpen, closePalette } = useAdminHotkeyContext();

  const grouped = useMemo(() => {
    const out = new Map<string, AdminCommandRoute[]>();
    for (const r of ADMIN_COMMAND_ROUTES) {
      const arr = out.get(r.sectionKey) ?? [];
      arr.push(r);
      out.set(r.sectionKey, arr);
    }
    return Array.from(out.entries());
  }, []);

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={(o) => {
        if (!o) closePalette();
      }}
    >
      <CommandInput
        placeholder={t("admin.command.placeholder")}
        data-testid="admin-command-input"
      />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>{t("admin.command.empty")}</CommandEmpty>
        {grouped.map(([sectionKey, items], idx) => (
          <div key={sectionKey}>
            {idx > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={t(sectionKey)}>
              {items.map((r) => (
                <CommandItem
                  key={r.to}
                  value={`${t(r.labelKey)} ${r.to}`}
                  onSelect={() => {
                    closePalette();
                    navigate({ to: r.to });
                  }}
                  data-testid={r.testId}
                  className="gap-3"
                >
                  <r.Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="flex-1 truncate">{t(r.labelKey)}</span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {r.to}
                  </span>
                  <CommandShortcut className="font-mono text-[10px] uppercase tracking-wider">
                    {r.shortcut}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="border-t border-border bg-(--color-surface-elev)/40 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>{t("admin.command.footer.hint")}</span>
        <span className="font-mono">⌘K · /</span>
      </div>
    </CommandDialog>
  );
}
