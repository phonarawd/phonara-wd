import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Ticket } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useBetSlip } from "./BetSlipProvider";
import { BetSlipLegRow } from "./BetSlipLegRow";
import { BetSlipModeTabs } from "./BetSlipModeTabs";
import { BetSlipStakeForm } from "./BetSlipStakeForm";
import { BetSlipSystemMatrix } from "./BetSlipSystemMatrix";

export function BetSlipPanel() {
  const { legs, mode, place, clear } = useBetSlip();
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const count = legs.length;

  useEffect(() => {
    if (count === 0) setOpenMobile(false);
  }, [count]);

  const body = (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Ticket className="size-4 text-(--color-primary)" aria-hidden />
          <h2 className="text-base font-bold uppercase tracking-wider">
            {t("sports.slip.title")}
          </h2>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-(--color-primary)/15 px-2 text-xs font-black tabular-nums text-(--color-primary)">
            {count}
          </span>
        </div>
        <div className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            aria-label={collapsed ? t("sports.slip.title") : t("sports.slip.clear")}
            onClick={() => setCollapsed((c) => !c)}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-(--color-surface-elev) hover:text-foreground"
          >
            {collapsed ? (
              <ChevronUp className="size-4" aria-hidden />
            ) : (
              <ChevronDown className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </header>
      {!collapsed && (
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto overflow-x-hidden p-4">
          <BetSlipModeTabs />
          {count === 0 ? (
            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border bg-(--color-surface-elev) px-3 py-10 text-center">
              <Ticket className="size-8 text-muted-foreground/60" aria-hidden />
              <p className="text-sm font-medium text-muted-foreground">
                {t("sports.slip.empty")}
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {legs.map((leg) => (
                <BetSlipLegRow key={leg.outcomeId} leg={leg} />
              ))}
            </div>
          )}
          {mode === "system" && <BetSlipSystemMatrix />}
          <BetSlipStakeForm />
          <div className="grid gap-2">
            <button
              type="button"
              data-testid="sports-slip-place"
              disabled={count === 0}
              onClick={() => setConfirmOpen(true)}
              className="h-14 w-full rounded-xl bg-(--color-primary) text-base font-black uppercase tracking-wider text-(--color-primary-foreground) shadow-[0_10px_30px_-10px_var(--color-primary)] transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              {t("sports.slip.place")}
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={clear}
                className="min-h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("sports.slip.clear")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop fixed right rail */}
      <aside
        aria-label={t("sports.slip.title")}
        className="pointer-events-none fixed right-6 top-[88px] z-30 hidden max-h-[calc(100dvh-104px)] w-[380px] lg:flex"
      >
        <div className="pointer-events-auto flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-(--color-surface) shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
          {body}
        </div>
      </aside>

      {/* Mobile FAB */}
      <button
        type="button"
        aria-label={t("sports.slip.title")}
        onClick={() => setOpenMobile(true)}
        className={cn(
          "fixed right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-(--color-primary) px-5 text-sm font-bold text-(--color-primary-foreground) shadow-[0_10px_30px_-10px_var(--color-primary)] ring-1 ring-(--color-primary-foreground)/20 transition-transform duration-200 active:scale-95 lg:hidden",
          "bottom-[calc(env(safe-area-inset-bottom)+88px)]",
        )}
      >
        <Ticket className="size-4" aria-hidden />
        {t("sports.slip.title")}
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--color-primary-foreground)/20 px-1.5 text-[11px] font-black tabular-nums">
          {count}
        </span>
      </button>

      {/* Mobile bottom sheet */}
      {openMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("sports.slip.title")}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label={t("sports.slip.clear")}
            onClick={() => setOpenMobile(false)}
            className="absolute inset-0 bg-(--color-scrim-soft) backdrop-blur-sm"
          />
          <div
            className="absolute inset-x-0 bottom-0 flex w-full max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-(--color-surface) transition-transform duration-200 ease-out motion-safe:animate-in motion-safe:slide-in-from-bottom"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/60"
              aria-hidden
            />
            {body}
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sports.slip.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sports.slip.confirm.body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="grid gap-1 text-xs">
            {legs.map((leg) => (
              <li
                key={leg.outcomeId}
                className="flex items-center justify-between rounded-md bg-(--color-surface) px-2 py-1.5"
              >
                <span className="min-w-0 truncate">
                  {leg.homeName} {t("sports.fixture.vs")} {leg.awayName} ·{" "}
                  {leg.selection}
                </span>
                <span className="shrink-0 tabular-nums">{leg.oddsDisplay}</span>
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("sports.slip.clear")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="sports-slip-place"
              onClick={() => {
                place();
                setConfirmOpen(false);
              }}
            >
              {t("sports.slip.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
