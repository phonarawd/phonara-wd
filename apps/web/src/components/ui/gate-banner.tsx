import { AlertTriangle, Lock, ShieldCheck, Clock, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

export type GateKind =
  | "killswitch"
  | "parity"
  | "withdrawal"
  | "kyc"
  | "sanction"
  | "rg"
  | "cooldown"
  | "dailyLimit";

const map: Record<
  GateKind,
  { icon: typeof AlertTriangle; tone: string; titleKey: string; descKey: string }
> = {
  killswitch: { icon: AlertTriangle, tone: "warn", titleKey: "gate.killswitch.title", descKey: "gate.killswitch.desc" },
  parity: { icon: ShieldCheck, tone: "info", titleKey: "gate.parity.title", descKey: "gate.parity.desc" },
  withdrawal: { icon: Lock, tone: "warn", titleKey: "gate.withdrawal.title", descKey: "gate.withdrawal.desc" },
  kyc: { icon: ShieldCheck, tone: "info", titleKey: "gate.kyc.title", descKey: "gate.kyc.desc" },
  sanction: { icon: Hand, tone: "down", titleKey: "gate.sanction.title", descKey: "gate.sanction.desc" },
  rg: { icon: Hand, tone: "warn", titleKey: "gate.rg.title", descKey: "gate.rg.desc" },
  cooldown: { icon: Clock, tone: "info", titleKey: "gate.cooldown.title", descKey: "gate.cooldown.desc" },
  dailyLimit: { icon: Clock, tone: "warn", titleKey: "gate.dailyLimit.title", descKey: "gate.dailyLimit.desc" },
};

const toneClass: Record<string, string> = {
  warn: "border-(--color-warn)/40 bg-(--color-warn)/10 text-(--color-warn)",
  info: "border-(--color-info)/40 bg-(--color-info)/10 text-(--color-info)",
  down: "border-(--color-down)/40 bg-(--color-down)/10 text-(--color-down)",
};

export interface GateBannerProps {
  kind: GateKind;
  action?: React.ReactNode;
  className?: string;
}

export function GateBanner({ kind, action, className }: GateBannerProps) {
  const m = map[kind];
  const Icon = m.icon;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        toneClass[m.tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{t(m.titleKey)}</div>
        <div className="text-xs opacity-80">{t(m.descKey)}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
