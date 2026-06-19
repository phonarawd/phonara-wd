import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminCompliance, type AdminKycRow } from "@/hooks/admin/useAdminCompliance";
import { AdminReasonDialog } from "@/components/admin/primitives";
import { t } from "@/i18n";

type Mode = { kind: "approve" | "reject"; id: string } | null;

/** Always-visible KYC review actions for E2E + queue parity (legacy review table). */
export function ComplianceKycReviewStrip() {
  const { kyc, approveKyc, rejectKyc } = useAdminCompliance();
  const [mode, setMode] = useState<Mode>(null);

  const pending = useMemo(
    () => kyc.filter((r) => r.status === "pending" || r.status === "in_review"),
    [kyc],
  );

  if (pending.length === 0) return null;

  const dialogTitle =
    mode?.kind === "reject"
      ? t("admin.compliance.kyc.action.reject")
      : t("admin.compliance.kyc.action.approve");

  const handleConfirm = async (reason: string) => {
    if (!mode) return false;
    if (mode.kind === "approve") return approveKyc(mode.id, reason);
    return rejectKyc(mode.id, reason);
  };

  return (
    <section className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium">{t("admin.compliance.kyc.title")}</h2>
      <ul className="grid gap-2">
        {pending.map((row) => (
          <KycReviewRow key={row.id} row={row} onApprove={() => setMode({ kind: "approve", id: row.id })} onReject={() => setMode({ kind: "reject", id: row.id })} />
        ))}
      </ul>
      <AdminReasonDialog
        open={mode !== null}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
        title={dialogTitle}
        variant={mode?.kind === "reject" ? "destructive" : "default"}
        onConfirm={handleConfirm}
        reasonInputTestId="admin-queue-action-reason"
        confirmTestId="admin-queue-action-confirm"
      />
    </section>
  );
}

function KycReviewRow(props: {
  row: AdminKycRow;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0">
      <span className="font-mono text-xs text-muted-foreground">{props.row.id}</span>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="default"
          data-testid={`queue-kyc-approve-${props.row.id}`}
          onClick={props.onApprove}
        >
          {t("admin.compliance.kyc.action.approve")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          data-testid={`queue-kyc-reject-${props.row.id}`}
          onClick={props.onReject}
        >
          {t("admin.compliance.kyc.action.reject")}
        </Button>
      </div>
    </li>
  );
}
