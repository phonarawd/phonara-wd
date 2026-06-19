import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WalletDeskWithdrawQueue } from "@/components/admin/wallet/WalletDeskWithdrawQueue";
import { WalletDeskDepositRecon } from "@/components/admin/wallet/WalletDeskDepositRecon";
import { ComplianceKycQueue } from "@/components/admin/compliance/ComplianceKycQueue";
import { ComplianceKycReviewStrip } from "@/components/admin/compliance/ComplianceKycReviewStrip";
import { ComplianceStrQueue } from "@/components/admin/compliance/ComplianceStrQueue";
import { ComplianceRiskRgQueue } from "@/components/admin/compliance/ComplianceRiskRgQueue";
import { useAdminWalletDesk } from "@/hooks/admin/useAdminWalletDesk";
import { useAdminCompliance } from "@/hooks/admin/useAdminCompliance";
import { t } from "@/i18n";

export function ImportedAdminQueuesPage() {
  const { withdrawals } = useAdminWalletDesk();
  const { kyc, str, risk } = useAdminCompliance();
  const pendingWithdraw = withdrawals.filter((w) => w.status === "pending").length;
  const pendingKyc = kyc.filter(
    (r) => r.status === "pending" || r.status === "in_review",
  ).length;
  const openStr = str.filter((r) => r.status === "open").length;
  const activeRisk = risk.filter((r) => r.status === "active").length;

  return (
    <div data-testid="admin-queues-page" className="min-w-0">
      <header className="mb-4">
        <h1 className="text-2xl font-medium">{t("admin.queues.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("admin.queues.subtitle")}
        </p>
      </header>
      <ComplianceKycReviewStrip />
      <Tabs defaultValue="withdraw">
        <TabsList>
          <TabsTrigger value="withdraw" className="gap-2">
            {t("admin.queues.tab.withdraw")}
            {pendingWithdraw > 0 ? (
              <Badge
                variant="destructive"
                className="tabular-nums"
                data-testid="withdraw-tab-badge"
              >
                {pendingWithdraw}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-2">
            {t("admin.queues.tab.kyc")}
            {pendingKyc > 0 ? (
              <Badge
                variant="destructive"
                className="tabular-nums"
                data-testid="kyc-tab-badge"
              >
                {pendingKyc}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="str" className="gap-2">
            {t("admin.queues.tab.str")}
            {openStr > 0 ? (
              <Badge
                variant="destructive"
                className="tabular-nums"
                data-testid="str-tab-badge"
              >
                {openStr}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            {t("admin.queues.tab.risk")}
            {activeRisk > 0 ? (
              <Badge
                variant="default"
                className="tabular-nums"
                data-testid="risk-tab-badge"
              >
                {activeRisk}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="grid gap-6">
          <WalletDeskWithdrawQueue />
          <WalletDeskDepositRecon />
        </TabsContent>
        <TabsContent value="kyc">
          <ComplianceKycQueue />
        </TabsContent>
        <TabsContent value="str">
          <ComplianceStrQueue />
        </TabsContent>
        <TabsContent value="risk">
          <ComplianceRiskRgQueue />
        </TabsContent>
      </Tabs>
      </div>
  );
}
