import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/hilo/*` — export `ImportedHiloGame`. */
export function ImportedHiloGame(props: ImportedGameSurfaceProps) {
  void props;
  return <PresentationImportPlaceholder path="apps/web/src/components/games/hilo/" />;
}
