import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/dice/*` — export `ImportedDiceGame`. */
export function ImportedDiceGame(_props: ImportedGameSurfaceProps) {
  return <PresentationImportPlaceholder path="apps/web/src/components/games/dice/" />;
}
