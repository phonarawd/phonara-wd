import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/mines/*` — export `ImportedMinesGame`. */
export function ImportedMinesGame(_props: ImportedGameSurfaceProps) {
  return <PresentationImportPlaceholder path="apps/web/src/components/games/mines/" />;
}
