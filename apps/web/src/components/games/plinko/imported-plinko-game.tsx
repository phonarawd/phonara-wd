import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/plinko/*` — export `ImportedPlinkoGame`. */
export function ImportedPlinkoGame(props: ImportedGameSurfaceProps) {
  void props;
  return <PresentationImportPlaceholder path="apps/web/src/components/games/plinko/" />;
}
