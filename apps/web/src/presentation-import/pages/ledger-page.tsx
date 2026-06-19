import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import type { LedgerRowView } from "../../features/wallet/use-ledger-page-controller";

export type ImportedLedgerPageProps = {
  rows?: LedgerRowView[];
  empty?: boolean;
};

export function ImportedLedgerPage({ rows = [], empty = true }: ImportedLedgerPageProps) {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-6">
        <header className="grid gap-1">
          <h1 className="text-2xl font-medium">{t("wallet.ledger.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("wallet.ledger.subtitle")}</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("wallet.ledger.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-4 gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>{t("wallet.ledger.col.date")}</span>
              <span>{t("wallet.ledger.col.type")}</span>
              <span className="text-right">{t("wallet.ledger.col.amount")}</span>
              <span className="text-right">{t("wallet.ledger.col.status")}</span>
            </div>
            {empty ? (
              <div className="grid h-40 place-items-center px-4 text-sm text-muted-foreground" data-testid="ledger-empty">
                {t("wallet.ledger.empty")}
              </div>
            ) : (
              <div className="divide-y divide-border" data-testid="ledger-table">
                {rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{row.dateDisplay}</span>
                    <span>{row.typeDisplay}</span>
                    <span className="text-right tabular-nums">{row.amountDisplay}</span>
                    <span className="text-right text-muted-foreground">{row.statusDisplay}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
