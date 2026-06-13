import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/plinko/*` — export `ImportedPlinkoGame`. */
export function ImportedPlinkoGame(_props: ImportedGameSurfaceProps) {
  return <PresentationImportPlaceholder path="apps/web/src/components/games/plinko/" />;
}
