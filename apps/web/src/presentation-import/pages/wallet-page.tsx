import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GateBanner } from "@/components/ui/gate-banner";
import { t } from "@/i18n";
import type { WalletTab } from "@/features/wallet/use-wallet-page-controller";

export type ImportedWalletPageProps = {
  walletLoading?: boolean;
  tab?: WalletTab;
  onTabChange?: (value: string) => void;
  heroBalanceDisplay?: string;
  phonAvailableDisplay?: string;
  phonLockedDisplay?: string;
  usdtAvailableDisplay?: string;
  krwAvailableDisplay?: string;
  depositReferenceDisplay?: string | null;
  depositExpectedPhonDisplay?: string | null;
  showKycGate?: boolean;
  kycVerified?: boolean;
  withdrawalPaused?: boolean;
  withdrawAvailableDisplay?: string;
  copyDepositReference?: () => void;
  depositAmount?: string;
  onDepositAmountChange?: (value: string) => void;
  depositPreviewDisplay?: string | null;
  showDepositRateFallback?: boolean;
  canRequestDeposit?: boolean;
  busy?: boolean;
  onDepositSubmit?: () => void;
  withdrawAmount?: string;
  onWithdrawAmountChange?: (value: string) => void;
  withdrawAddress?: string;
  onWithdrawAddressChange?: (value: string) => void;
  onWithdrawSubmit?: () => void;
  showKycForm?: boolean;
  onOpenKycForm?: () => void;
  kycLegalName?: string;
  onKycLegalNameChange?: (value: string) => void;
  kycDocumentLast4?: string;
  onKycDocumentLast4Change?: (value: string) => void;
  kycCountry?: string;
  onKycCountryChange?: (value: string) => void;
  onKycSubmit?: () => void;
  profileKycTier?: string | null;
};

export function ImportedWalletPage({
  walletLoading = false,
  tab = "deposit",
  onTabChange,
  heroBalanceDisplay = "0 PHON",
  phonAvailableDisplay,
  phonLockedDisplay,
  usdtAvailableDisplay,
  krwAvailableDisplay,
  depositReferenceDisplay,
  depositExpectedPhonDisplay,
  showKycGate = false,
  kycVerified = false,
  withdrawalPaused = false,
  withdrawAvailableDisplay,
  copyDepositReference,
  depositAmount = "",
  onDepositAmountChange,
  depositPreviewDisplay,
  showDepositRateFallback = false,
  canRequestDeposit = false,
  busy = false,
  onDepositSubmit,
  withdrawAmount = "",
  onWithdrawAmountChange,
  withdrawAddress = "",
  onWithdrawAddressChange,
  onWithdrawSubmit,
  showKycForm = false,
  onOpenKycForm,
  kycLegalName = "",
  onKycLegalNameChange,
  kycDocumentLast4 = "",
  onKycDocumentLast4Change,
  kycCountry = "KR",
  onKycCountryChange,
  onKycSubmit,
  profileKycTier,
}: ImportedWalletPageProps) {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-medium">{t("wallet.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("wallet.deposit.subtitle")}</p>
        {showKycGate ? (
          <GateBanner kind="kyc" action={<Button size="sm">{t("gate.kyc.cta")}</Button>} />
        ) : null}
        <Card>
          <CardContent className="p-5">
            <div className="text-xs text-muted-foreground">{t("wallet.assets")}</div>
            {walletLoading ? (
              <div
                className="mt-2 h-9 w-40 animate-pulse rounded bg-muted"
                data-testid="wallet-hero-loading"
              />
            ) : (
              <div className="text-3xl font-medium tabular-nums" data-testid="wallet-hero-balance">
                {heroBalanceDisplay}
              </div>
            )}
            {!walletLoading && phonAvailableDisplay && phonLockedDisplay ? (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  {t("wallet.available")}: {phonAvailableDisplay}
                </span>
                <span>
                  {t("wallet.locked")}: {phonLockedDisplay}
                </span>
              </div>
            ) : null}
            {!walletLoading && usdtAvailableDisplay && krwAvailableDisplay ? (
              <div className="mt-3 flex flex-wrap gap-3 text-xs tabular-nums text-muted-foreground">
                <span>
                  {t("wallet.currency.usdt")}: {usdtAvailableDisplay}
                </span>
                <span>
                  {t("wallet.currency.krw")}: {krwAvailableDisplay}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Tabs value={tab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="deposit" data-testid="wallet-tab-deposit">
              {t("wallet.tab.deposit")}
            </TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="wallet-tab-withdraw">
              {t("wallet.tab.withdraw")}
            </TabsTrigger>
            <TabsTrigger value="staking">{t("wallet.tab.staking")}</TabsTrigger>
            <TabsTrigger value="history">{t("wallet.tab.history")}</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("wallet.deposit.title")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-5 text-sm">
                <div className="grid gap-1">
                  <div className="text-xs text-muted-foreground">{t("wallet.deposit.network")}</div>
                  <div className="font-medium">USDT · TRC-20</div>
                </div>
                {depositReferenceDisplay ? (
                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">{t("wallet.deposit.referenceCode")}</div>
                    <div
                      className="rounded border border-border bg-(--color-surface) px-3 py-2 font-mono text-xs tabular-nums"
                      data-testid="wallet-deposit-ref"
                    >
                      {depositReferenceDisplay}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("wallet.deposit.timeline.pending")}</p>
                )}
                {depositExpectedPhonDisplay ? (
                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">{t("wallet.deposit.expectedPhon")}</div>
                    <div className="tabular-nums">{depositExpectedPhonDisplay}</div>
                  </div>
                ) : null}
                <div className="grid gap-1">
                  <label className="text-xs text-muted-foreground" htmlFor="wallet-deposit-amount">
                    {t("wallet.deposit.amountLabel")}
                  </label>
                  <Input
                    id="wallet-deposit-amount"
                    data-testid="wallet-deposit-amount"
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(event) => onDepositAmountChange?.(event.target.value)}
                  />
                </div>
                {depositPreviewDisplay ? (
                  <p className="text-xs text-muted-foreground" data-testid="wallet-deposit-preview">
                    {t("wallet.deposit.previewRate")}: {depositPreviewDisplay}
                  </p>
                ) : showDepositRateFallback ? (
                  <p className="text-xs text-muted-foreground" data-testid="wallet-deposit-rate-fallback">
                    {t("wallet.deposit.rateFallback")}
                  </p>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="wallet-deposit-copy"
                  disabled={!depositReferenceDisplay}
                  onClick={() => copyDepositReference?.()}
                >
                  {t("wallet.deposit.copyCode")}
                </Button>
                <Button
                  size="sm"
                  data-testid="wallet-deposit-submit"
                  disabled={!canRequestDeposit || busy}
                  onClick={() => onDepositSubmit?.()}
                >
                  {busy ? t("common.processing") : t("wallet.deposit.submit")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("wallet.deposit.warning")}</p>
                <div className="text-xs text-muted-foreground" data-testid="wallet-deposit-timeline">
                  {t("wallet.deposit.timeline.request")} → {t("wallet.deposit.timeline.match")} →{" "}
                  {t("wallet.deposit.timeline.credit")}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="withdraw">
            <section className="wallet-withdraw-section relative">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("wallet.withdraw.title")}</CardTitle>
                </CardHeader>
                <CardContent className="relative p-5">
                  {withdrawalPaused ? (
                    <div
                      className="mb-4 rounded-lg border border-border bg-(--color-surface) p-4 text-sm"
                      data-testid="wallet-withdraw-paused"
                    >
                      <p className="font-medium">{t("wallet.withdraw.unavailableTitle")}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{t("wallet.withdraw.unavailableDesc")}</p>
                    </div>
                  ) : null}
                  <div className="grid max-w-md gap-3 text-sm">
                    {withdrawAvailableDisplay ? (
                      <p className="text-muted-foreground">
                        {t("wallet.available")}: {withdrawAvailableDisplay}
                      </p>
                    ) : null}
                    <label className="text-xs text-muted-foreground" htmlFor="wallet-withdraw-amount">
                      {t("wallet.withdraw.amountLabel")} (PHON)
                    </label>
                    <Input
                      id="wallet-withdraw-amount"
                      data-testid="wallet-withdraw-amount"
                      inputMode="decimal"
                      value={withdrawAmount}
                      onChange={(event) => onWithdrawAmountChange?.(event.target.value)}
                    />
                    <label className="text-xs text-muted-foreground" htmlFor="wallet-withdraw-address">
                      {t("wallet.withdraw.addressLabel")}
                    </label>
                    <Input
                      id="wallet-withdraw-address"
                      data-testid="wallet-withdraw-address"
                      autoComplete="off"
                      value={withdrawAddress}
                      placeholder={t("wallet.withdraw.addressPlaceholder")}
                      onChange={(event) => onWithdrawAddressChange?.(event.target.value)}
                    />
                    <Button
                      data-testid="wallet-withdraw-submit"
                      disabled={busy || withdrawalPaused || !withdrawAmount || !withdrawAddress.trim()}
                      onClick={() => onWithdrawSubmit?.()}
                    >
                      {busy ? t("common.processing") : t("wallet.withdraw.submit")}
                    </Button>
                  </div>

                  {!kycVerified ? (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/90 p-6 text-center backdrop-blur-sm"
                      data-testid="wallet-kyc-lock"
                    >
                      <p className="text-lg font-semibold">{t("wallet.withdraw.kycLockTitle")}</p>
                      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("wallet.withdraw.kycLockDesc")}</p>
                      <div className="mt-4 w-full max-w-sm text-left text-xs text-muted-foreground" data-testid="wallet-kyc-timeline">
                        {t("wallet.kyc.timeline.submit")} → {t("wallet.kyc.timeline.review")} → {t("wallet.kyc.timeline.complete")}
                      </div>
                      {!showKycForm ? (
                        <Button className="mt-4" data-testid="wallet-kyc-cta" onClick={() => onOpenKycForm?.()}>
                          {t("wallet.withdraw.kycCta")}
                        </Button>
                      ) : (
                        <div className="mt-4 grid w-full max-w-sm gap-3 text-left" data-testid="wallet-kyc-form">
                          <label className="text-xs text-muted-foreground" htmlFor="kyc-legal-name">
                            {t("wallet.kyc.legalName")}
                          </label>
                          <Input
                            id="kyc-legal-name"
                            data-testid="wallet-kyc-legal-name"
                            value={kycLegalName}
                            onChange={(event) => onKycLegalNameChange?.(event.target.value)}
                          />
                          <label className="text-xs text-muted-foreground" htmlFor="kyc-document-last4">
                            {t("wallet.kyc.documentLast4")}
                          </label>
                          <Input
                            id="kyc-document-last4"
                            data-testid="wallet-kyc-document-last4"
                            maxLength={4}
                            value={kycDocumentLast4}
                            onChange={(event) => onKycDocumentLast4Change?.(event.target.value)}
                          />
                          <label className="text-xs text-muted-foreground" htmlFor="kyc-country">
                            {t("wallet.kyc.country")}
                          </label>
                          <Input
                            id="kyc-country"
                            data-testid="wallet-kyc-country"
                            maxLength={2}
                            value={kycCountry}
                            onChange={(event) => onKycCountryChange?.(event.target.value.toUpperCase())}
                          />
                          <Button
                            data-testid="wallet-kyc-submit"
                            disabled={busy || !kycLegalName || !kycDocumentLast4 || !kycCountry}
                            onClick={() => onKycSubmit?.()}
                          >
                            {busy ? t("common.processing") : t("wallet.kyc.submit")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <div className="mt-6 text-sm text-muted-foreground" data-testid="wallet-withdraw-timeline">
                {t("wallet.withdraw.timeline.request")} → {t("wallet.withdraw.timeline.review")} →{" "}
                {t("wallet.withdraw.timeline.send")} → {t("wallet.withdraw.timeline.done")}
              </div>
              {profileKycTier ? (
                <p className="sr-only" data-testid="wallet-kyc-tier">
                  {profileKycTier}
                </p>
              ) : null}
            </section>
          </TabsContent>
          <TabsContent value="staking">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("wallet.staking.apr")}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-medium text-(--color-primary)">8.2%</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                {t("common.empty.title")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
