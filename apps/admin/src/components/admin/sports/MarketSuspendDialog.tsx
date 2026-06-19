import { AdminReasonDialog } from "@/components/admin/primitives";
import { useAdminSports, type SportsFixtureRow } from "@/hooks/admin/useAdminSports";
import { t } from "@/i18n";

// L1-15-P0 E1 — thin wrapper around AdminReasonDialog.
// SOT unchanged: suspendMarket (minLength 4 enforced both client + SOT · F2 LOCK).

const MIN_REASON = 4;

export function MarketSuspendDialog(props: {
  fixture: SportsFixtureRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { suspendMarket } = useAdminSports();

  const handleConfirm = (reason: string) => {
    if (!props.fixture) return;
    suspendMarket(props.fixture.id, reason);
  };

  return (
    <AdminReasonDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t("admin.sports.suspend.title")}
      description={t("admin.sports.suspend.desc")}
      minLength={MIN_REASON}
      variant="destructive"
      confirmLabel={t("admin.sports.suspend.confirm")}
      cancelLabel={t("admin.sports.suspend.cancel")}
      placeholder={t("admin.sports.suspend.reason.placeholder")}
      reasonInputTestId="suspend-reason"
      confirmTestId="suspend-confirm"
      onConfirm={handleConfirm}
      subject={
        props.fixture ? (
          <>
            <div className="font-medium">
              {props.fixture.home}{" "}
              <span className="text-muted-foreground">vs</span>{" "}
              {props.fixture.away}
            </div>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              {props.fixture.id} · {props.fixture.league}
            </div>
          </>
        ) : null
      }
    />
  );
}
