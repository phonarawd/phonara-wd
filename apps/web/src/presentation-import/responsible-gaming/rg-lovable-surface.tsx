import { PresentationRoot } from '../presentation-root';
import { ImportedResponsibleGamingPage } from '../pages/responsible-gaming-page';
import { useRgPageController } from '../../features/responsible-gaming/use-rg-page-controller';

/** L2 Wave C — /responsible-gaming route body. */
export function RgLovableSurface() {
  const { authLoading, sessionReady, viewProps } = useRgPageController();

  if (authLoading || !sessionReady) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="rg-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      <ImportedResponsibleGamingPage rg={viewProps} />
    </PresentationRoot>
  );
}
