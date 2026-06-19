import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReferralTree } from "@/components/fomo/ReferralTree";
import { BonusTierTable } from "@/components/fomo/BonusTier";
import { Copy } from "lucide-react";
import { t } from "@/i18n";
import type { ReferralPageViewProps } from "../../features/referral/use-referral-page-controller";

const STATIC_DEFAULTS = {
  referralCode: "—",
  inviteUrl: "",
  pendingCount: 0,
  approvedCount: 0,
  paidPhonDisplay: "0 PHON",
};

export type ImportedReferralPageProps = Partial<ReferralPageViewProps>;

export function ImportedReferralPage(props: ImportedReferralPageProps = {}) {
  const referralCode = props.referralCode ?? STATIC_DEFAULTS.referralCode;
  const inviteUrl = props.inviteUrl ?? STATIC_DEFAULTS.inviteUrl;
  const pendingCount = props.pendingCount ?? STATIC_DEFAULTS.pendingCount;
  const approvedCount = props.approvedCount ?? STATIC_DEFAULTS.approvedCount;
  const paidPhonDisplay = props.paidPhonDisplay ?? STATIC_DEFAULTS.paidPhonDisplay;

  const handleCopy = () => {
    if (props.onCopyCode) {
      props.onCopyCode();
      return;
    }
    navigator.clipboard?.writeText(referralCode);
  };

  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-medium">{t("referral.title")}</h1>

        <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-card p-3 text-center text-sm">
          <div>
            <div className="text-xs text-muted-foreground">{t("referral.pending")}</div>
            <div className="mt-1 font-medium tabular-nums">{pendingCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("referral.approved")}</div>
            <div className="mt-1 font-medium tabular-nums text-(--color-up)">{approvedCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("referral.paid")}</div>
            <div className="mt-1 font-medium tabular-nums">{paidPhonDisplay}</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("referral.code")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-border bg-(--color-surface) px-3 py-2 text-sm">
              {referralCode || t("referral.codeUnavailable")}
            </code>
            <Button variant="ghost" onClick={handleCopy} disabled={!referralCode}>
              <Copy className="size-4" />
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("referral.tiers.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BonusTierTable
              tiers={[
                { from: 1, to: 5, bonusP: 10_000, label: t("referral.demo.tier.early") },
                { from: 6, to: 20, bonusP: 5_000, label: t("referral.demo.tier.mid") },
                { from: 21, to: 100, bonusP: 2_000 },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("referral.tree.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReferralTree
              root={{
                id: "me",
                name: t("referral.demo.user.me"),
                joinedAt: t("referral.demo.joinedAt.today"),
                rewardP: 0,
                children: [
                  {
                    id: "1",
                    name: t("referral.demo.user.minjun"),
                    joinedAt: t("referral.demo.joinedAt.twoDaysAgo"),
                    rewardP: 10_000,
                    children: [
                      {
                        id: "1-1",
                        name: t("referral.demo.user.jiyu"),
                        joinedAt: t("referral.demo.joinedAt.yesterday"),
                        rewardP: 2_000,
                      },
                    ],
                  },
                  {
                    id: "2",
                    name: t("referral.demo.user.seoyeon"),
                    joinedAt: t("referral.demo.joinedAt.oneWeekAgo"),
                    rewardP: 10_000,
                  },
                ],
              }}
            />
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">{inviteUrl}</p>
      </div>
    </AppShell>
  );
}
