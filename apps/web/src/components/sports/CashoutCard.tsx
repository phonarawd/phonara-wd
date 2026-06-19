// S2/S6 — Cashout preview card · mock flow · display-only string math
// disabled = bet.status !== 'pending' || fixture.status !== 'live' || market.status === 'suspended'
// half-time enum 발명 0 · rpc_*/supabase/잔액 commit 0.
import { useState } from "react";
import { toast } from "sonner";
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
import { displayCashoutPreview } from "./display-odds-multiply";
import type { SportsFixtureStatus, SportsMarketStatus } from "./types";

export interface CashoutCardBet {
  id: string;
  status: "pending" | "won" | "lost" | "void" | "cashed_out";
  stake: string;
  placedCombinedOdds: string;
  currentCombinedOdds: string;
  fixtureStatus: SportsFixtureStatus;
  marketStatus: SportsMarketStatus;
}

interface Props {
  bet: CashoutCardBet;
  onCashedOut?: (id: string) => void;
}

export function CashoutCard({ bet, onCashedOut }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<CashoutCardBet["status"]>(bet.status);

  const value = displayCashoutPreview(
    bet.stake.replace(/,/g, ""),
    bet.placedCombinedOdds,
    bet.currentCombinedOdds,
  );

  // S6 LOCK — half-time enum 발명 0.
  const disabled =
    local !== "pending" ||
    bet.fixtureStatus !== "live" ||
    bet.marketStatus === "suspended";

  return (
    <>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-dashed border-(--color-info)/40 bg-(--color-info)/5 px-3 py-2">
        <div className="grid">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("sports.cashout.preview")}
          </span>
          <span className="text-sm font-black tabular-nums text-(--color-info)">
            {value}
          </span>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "min-h-9 rounded-md px-3 text-xs font-bold uppercase tracking-wider transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
            disabled
              ? "cursor-not-allowed border border-border bg-(--color-surface-elev) text-muted-foreground opacity-50"
              : "bg-(--color-primary) text-(--color-primary-foreground) shadow-[0_8px_24px_-12px_var(--color-primary)] active:scale-95",
          )}
        >
          {t("sports.cashout.cta")}
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sports.cashout.cta")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sports.cashout.preview")}{" "}
              <span className="tabular-nums">{value}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("sports.slip.clear")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLocal("cashed_out");
                toast.success(t("sports.bet.status.cashed_out"));
                onCashedOut?.(bet.id);
                setOpen(false);
              }}
            >
              {t("sports.cashout.cta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
