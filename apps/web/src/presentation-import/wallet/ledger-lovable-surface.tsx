import { PresentationRoot } from '../presentation-root';
import { ImportedLedgerPage } from '../pages/ledger-page';
import { useLedgerPageController } from '../../features/wallet/use-ledger-page-controller';

export function LedgerLovableSurface() {
  const { authLoading, loading, rows, empty } = useLedgerPageController();

  if (authLoading || loading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="ledger-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedLedgerPage rows={rows} empty={empty} />
    </PresentationRoot>
  );
}
