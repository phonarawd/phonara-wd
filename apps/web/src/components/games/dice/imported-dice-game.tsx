import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/dice/*` — export `ImportedDiceGame`. */
export function ImportedDiceGame(props: ImportedGameSurfaceProps) {
  void props;
  return <PresentationImportPlaceholder path="apps/web/src/components/games/dice/" />;
}
