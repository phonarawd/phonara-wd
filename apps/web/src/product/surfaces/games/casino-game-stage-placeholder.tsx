import { useT } from '@/product/i18n';
import { Card, CardBody } from '@/product/primitives/card';
import type { GameCode } from '@phonara/game-engine';

import { findCasinoOutcomeReplayRow } from '@/domain/casino-outcome-replay-contract';

/** Stage slot fallback — Batch A–D live; unknown game codes only. */
export function CasinoGameStagePlaceholder({ gameCode }: { gameCode: GameCode }) {
  const t = useT();
  const row = findCasinoOutcomeReplayRow(gameCode);

  return (
    <Card
      variant="casino-play"
      data-testid="casino-game-stage-placeholder"
      data-game-code={gameCode}
    >
      <CardBody className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center md:min-h-[320px]">
        <p className="text-foreground m-0 text-base font-semibold">
          {t('casino.shell.stage.deferredTitle')}
        </p>
        <p className="text-foreground-muted m-0 max-w-md text-sm leading-relaxed">
          {t('casino.shell.stage.deferredBody')}
        </p>
        <p
          className="text-foreground-muted m-0 max-w-lg text-xs leading-relaxed"
          data-testid="casino-replay-contract-note"
        >
          {row.replayPhase}
        </p>
      </CardBody>
    </Card>
  );
}
