import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/limbo/*` — export `ImportedLimboGame`. */
export function ImportedLimboGame(props: ImportedGameSurfaceProps) {
  void props;
  return <PresentationImportPlaceholder path="apps/web/src/components/games/limbo/" />;
}
