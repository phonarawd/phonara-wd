import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { setLocale, t, type Locale } from "@/i18n";
import { LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useHandedness, type Handed } from "@/hooks/useHandedness";

const TRADE_CONFIRM_KEY = "phonara.settings.trade.confirmDialog";

const LANG_KEY = "phonara.lang";

const NOTIF_KEYS = {
  priceAlert: "phonara.settings.notifications.priceAlert",
  mission: "phonara.settings.notifications.mission",
  referral: "phonara.settings.notifications.referral",
  marketing: "phonara.settings.notifications.marketing",
} as const;

const readBool = (key: string, fallback: boolean) => {
  try {
    const v = window.localStorage.getItem(key);
    if (v === "1" || v === "true") return true;
    if (v === "0" || v === "false") return false;
  } catch {
    // SSR / privacy mode
  }
  return fallback;
};

const writeBool = (key: string, on: boolean) => {
  try {
    window.localStorage.setItem(key, on ? "1" : "0");
  } catch {
    // ignore
  }
};

export function ImportedSettingsPage() {
  const [lang, setLang] = useState<Locale>("ko");
  const [theme, setTheme] = useState<"dark" | "system">("dark");
  const [currency, setCurrency] = useState<"KRW" | "USDT">("KRW");
  const [notifPrice, setNotifPrice] = useState(true);
  const [notifMission, setNotifMission] = useState(true);
  const [notifReferral, setNotifReferral] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(true);
  const [handed, setHanded] = useHandedness();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === "ko" || saved === "en") {
        setLang(saved);
        setLocale(saved);
      }
    } catch {
      // ignore — SSR / privacy mode
    }
    setNotifPrice(readBool(NOTIF_KEYS.priceAlert, true));
    setNotifMission(readBool(NOTIF_KEYS.mission, true));
    setNotifReferral(readBool(NOTIF_KEYS.referral, true));
    setNotifMarketing(readBool(NOTIF_KEYS.marketing, false));
    setConfirmOrder(readBool(TRADE_CONFIRM_KEY, true));
  }, []);

  const toggleNotif = (
    id: "priceAlert" | "mission" | "referral" | "marketing",
    next: boolean,
    setter: (v: boolean) => void,
  ) => {
    setter(next);
    writeBool(NOTIF_KEYS[id], next);
    toast(t(`settings.notifications.toast.${id}.${next ? "on" : "off"}`));
  };

  const toggleConfirmOrder = (next: boolean) => {
    setConfirmOrder(next);
    writeBool(TRADE_CONFIRM_KEY, next);
    toast(t(next ? "settings.trade.toast.confirmOn" : "settings.trade.toast.confirmOff"));
  };

  const changeLang = (next: Locale) => {
    setLang(next);
    setLocale(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
    toast.success(next === "ko" ? t("settings.toast.langKo") : t("settings.toast.langEn"));
  };

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-2xl gap-4 p-4 md:p-6">
        <Card aria-labelledby="settings-display-title">
          <CardHeader>
            <CardTitle id="settings-display-title" className="text-base">
              {t("settings.section.display")}
            </CardTitle>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("settings.display.sectionHint")}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label={t("settings.field.language")}>
              <Segment
                ariaLabel={t("settings.display.aria.language")}
                options={[
                  { value: "ko", label: t("settings.lang.ko") },
                  { value: "en", label: t("settings.lang.en") },
                ]}
                value={lang}
                onChange={(v) => changeLang(v as Locale)}
              />
            </Field>
            <Field label={t("settings.field.theme")}>
              <Segment
                ariaLabel={t("settings.display.aria.theme")}
                options={[
                  { value: "dark", label: t("settings.theme.dark") },
                  { value: "system", label: t("settings.theme.system"), tag: t("settings.tag.comingSoon") },
                ]}
                value={theme}
                onChange={(v) => {
                  if (v === "system") {
                    toast(t("settings.toast.themeSystemSoon"));
                    return;
                  }
                  setTheme(v as "dark");
                }}
              />
            </Field>
            <Field label={t("settings.field.currency")}>
              <Segment
                ariaLabel={t("settings.display.aria.currency")}
                tabular
                options={[
                  { value: "KRW", label: "KRW" },
                  { value: "USDT", label: "USDT" },
                ]}
                value={currency}
                onChange={(v) => setCurrency(v as "KRW" | "USDT")}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {t("settings.currency.caption")}
              </p>
            </Field>
            <Field label={t("settings.field.handed")}>
              <Segment
                ariaLabel={t("settings.display.aria.handed")}
                options={[
                  { value: "right", label: t("settings.handed.right") },
                  { value: "left", label: t("settings.handed.left") },
                ]}
                value={handed}
                onChange={(v) => {
                  setHanded(v as Handed);
                  toast.success(
                    v === "left" ? t("settings.toast.handedLeft") : t("settings.toast.handedRight"),
                  );
                }}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {t("settings.handed.caption")}
              </p>
            </Field>
          </CardContent>
        </Card>

        <Card aria-labelledby="settings-notif-title">
          <CardHeader>
            <CardTitle id="settings-notif-title" className="text-base">
              {t("settings.section.notif")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ToggleRow
              label={t("settings.notifications.priceAlert.label")}
              hint={t("settings.notifications.priceAlert.hint")}
              checked={notifPrice}
              onChange={(v) => toggleNotif("priceAlert", v, setNotifPrice)}
            />
            <ToggleRow
              label={t("settings.notifications.mission.label")}
              checked={notifMission}
              onChange={(v) => toggleNotif("mission", v, setNotifMission)}
            />
            <ToggleRow
              label={t("settings.notifications.referral.label")}
              checked={notifReferral}
              onChange={(v) => toggleNotif("referral", v, setNotifReferral)}
            />
            <ToggleRow
              label={t("settings.notifications.marketing.label")}
              hint={t("settings.notifications.marketing.hint")}
              checked={notifMarketing}
              onChange={(v) => toggleNotif("marketing", v, setNotifMarketing)}
            />
          </CardContent>
        </Card>

        <Card aria-labelledby="settings-trade-title">
          <CardHeader>
            <CardTitle id="settings-trade-title" className="text-base">
              {t("settings.section.trade")}
            </CardTitle>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("settings.trade.sectionHint")}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ToggleRow
              label={t("settings.trade.confirmDialog.label")}
              hint={t("settings.trade.confirmDialog.hint")}
              checked={confirmOrder}
              onChange={toggleConfirmOrder}
            />
            <ToggleRow
              label={t("settings.trade.oneClick.label")}
              hint={t("settings.trade.oneClick.hint")}
              checked={false}
              tag={t("settings.tag.comingSoon")}
              onChange={() => toast(t("settings.trade.oneClick.toast"))}
            />
          </CardContent>
        </Card>

        <Card aria-labelledby="settings-info-title">
          <CardHeader>
            <CardTitle id="settings-info-title" className="text-base">
              {t("settings.section.info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <Link
              to="/terms"
              className="flex min-h-11 items-center justify-between rounded-md px-1 text-(--color-info) hover:bg-(--color-surface) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <span>{t("settings.info.terms")}</span>
              <span aria-hidden className="text-muted-foreground">›</span>
            </Link>
            <Link
              to="/privacy"
              className="flex min-h-11 items-center justify-between rounded-md px-1 text-(--color-info) hover:bg-(--color-surface) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <span>{t("settings.info.privacy")}</span>
              <span aria-hidden className="text-muted-foreground">›</span>
            </Link>
            <div className="mt-1 flex min-h-11 items-center justify-between px-1">
              <span className="text-muted-foreground">{t("settings.info.version")}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">v0.0.0-demo</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-2 border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={() => toast.success(t("account.toast.logoutDone"))}
            aria-label={t("account.action.logout")}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-(--color-down)/40 bg-transparent text-sm font-semibold text-(--color-down) hover:bg-(--color-down)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
          >
            <LogOut className="size-4" aria-hidden />
            {t("account.action.logout")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Segment({
  options,
  value,
  onChange,
  ariaLabel,
  tabular,
}: {
  options: { value: string; label: string; tag?: string }[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
  tabular?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-(--color-surface) p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            aria-selected={active}
            className={cn(
              "min-h-11 rounded-md border px-3 text-xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
              tabular && "tabular-nums",
              active
                ? "border-(--color-primary)/40 bg-(--color-surface-elev) text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.tag && (
              <span className="ml-1 rounded bg-(--color-warn)/15 px-2 py-0.5 text-[9px] text-(--color-warn)">
                {o.tag}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
  tag,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange?: (b: boolean) => void;
  disabled?: boolean;
  tag?: string;
}) {
  return (
    <div className="flex min-h-12 items-start gap-3 py-1">
      <div className="flex-1">
        <span className={cn("block text-sm", disabled && "text-muted-foreground")}>{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {tag && (
        <span className="mt-1 rounded bg-(--color-warn)/15 px-1.5 py-0.5 text-[10px] text-(--color-warn)">
          {tag}
        </span>
      )}
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange?.(v)}
        aria-label={label}
        role="switch"
      />
    </div>
  );
}
