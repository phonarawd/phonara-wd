import { PresentationRoot } from '../presentation-root';
import { ImportedTradePage } from '../pages/trade-page';
import { useTradePageController } from '../../features/trading/use-trade-page-controller';

/**
 * L2 Wave B — /trade route body.
 * Engine: `useTradePageController` · Visual: Lovable `ImportedTradePage`.
 */
export function TradeLovableSurface() {
  const controller = useTradePageController();

  if (controller.authLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="trade-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedTradePage
        priceDisplay={controller.priceDisplay}
        priceDir={controller.priceDir}
        engine={controller.session ? controller : undefined}
      />
    </PresentationRoot>
  );
}
