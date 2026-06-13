import { PresentationImportPlaceholder } from '../../../presentation-import/placeholder-page';
import type { ImportedGameSurfaceProps } from '../shared/types';

/** Paste Lovable `src/games/crash/*` — export `ImportedCrashGame`. */
export function ImportedCrashGame(_props: ImportedGameSurfaceProps) {
  return <PresentationImportPlaceholder path="apps/web/src/components/games/crash/" />;
}
