import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import type { GameCode } from '@phonara/game-engine';
import { IMPORTED_GAME_LOADERS } from './registry';
import type { ImportedGameSurfaceProps } from './shared/types';

type GameSurfaceLoaderProps = ImportedGameSurfaceProps & {
  fallback?: ReactNode;
};

function GameSurfaceFallback({ gameCode }: { gameCode: GameCode }) {
  return (
    <div
      className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border/40 bg-surface/30"
      aria-busy="true"
      aria-label={gameCode}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

export function GameSurfaceLoader({ fallback, gameCode, ...props }: GameSurfaceLoaderProps) {
  const LazyGame = useMemo(
    () => lazy(() => IMPORTED_GAME_LOADERS[gameCode]().then((m) => ({ default: m.ImportedGame }))),
    [gameCode],
  );

  return (
    <Suspense fallback={fallback ?? <GameSurfaceFallback gameCode={gameCode} />}>
      <LazyGame {...props} gameCode={gameCode} />
    </Suspense>
  );
}
