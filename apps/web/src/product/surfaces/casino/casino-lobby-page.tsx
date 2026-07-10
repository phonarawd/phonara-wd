import { useEffect, useState } from 'react';
import { GAME_CODES, type GameCode } from '@phonara/game-engine';
import { ShieldCheck } from 'lucide-react';

import {
  CASINO_FAIRNESS_ROUTE,
  CASINO_LOBBY_BALANCE_LABEL_KEY,
  CASINO_LOBBY_CATEGORY_CHIPS,
  CASINO_LOBBY_CATEGORY_LABEL_KEYS,
  CASINO_LOBBY_EXPOSURE,
  CASINO_LOBBY_FEATURED_GAME_CODES,
  CASINO_LOBBY_FEATURED_TITLE_KEY,
  CASINO_LOBBY_GRID_TITLE_KEY,
  CASINO_LOBBY_HERO_DESC_KEY,
  CASINO_LOBBY_HERO_TITLE_KEY,
  CASINO_LOBBY_PF_DEFERRED_REASON_KEY,
  CASINO_LOBBY_SEO_TITLE_KEY,
  P10_PAGE_CASINO_FAIRNESS_TODO,
  P10_PAGE_CASINO_TODO,
  casinoLobbyGamePath,
  filterCasinoLobbyGamesByCategory,
  resolveCasinoLobbyPfCtaEnabled,
  type CasinoLobbyCategoryChip,
} from '@/domain/casino-lobby-display-contract';
import { GAME_BY_CODE } from '@/features/casino/game-config';
import { useWallet } from '@/hooks/use-wallet';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody } from '@/product/primitives/card';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';
import type { MessageKey } from '@phonara/i18n';

type LobbyCategoryFilter = CasinoLobbyCategoryChip | 'all';

function gameLabelKey(code: GameCode): MessageKey {
  return GAME_BY_CODE[code].labelKey;
}

function gameDescKey(code: GameCode): MessageKey {
  return GAME_BY_CODE[code].descriptionKey;
}

function CasinoGameTile({
  code,
  featured,
  playTileTestId,
}: {
  code: GameCode;
  featured?: boolean;
  playTileTestId?: string;
}) {
  const t = useT();
  const href = casinoLobbyGamePath(code);

  return (
    <Card
      variant="casino-play"
      className="h-full"
      data-testid={playTileTestId}
      data-game-code={code}
      data-featured={featured ? 'true' : undefined}
    >
      <CardBody className="flex h-full flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground m-0 text-base font-semibold md:text-lg">
            {t(gameLabelKey(code))}
          </h3>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(gameDescKey(code))}
          </p>
        </div>
        <a
          href={href}
          className="bg-accent text-accent-foreground mt-auto inline-flex min-h-12 items-center justify-center rounded-md px-4 text-sm font-semibold no-underline"
          data-testid={`casino-lobby-play-${code}`}
        >
          {t('casino.hub.cta.playNow')}
        </a>
      </CardBody>
    </Card>
  );
}

/** Canonical `/casino` lobby — category chips · featured · 12-game grid · balance · PF cue. */
export function CasinoLobbyPage() {
  const t = useT();
  const { wallet, loading: walletLoading } = useWallet();
  const [category, setCategory] = useState<LobbyCategoryFilter>('all');

  useEffect(() => {
    document.title = t(CASINO_LOBBY_SEO_TITLE_KEY);
  }, [t]);

  const filteredCodes = filterCasinoLobbyGamesByCategory(GAME_CODES, category);
  const gridCodes =
    category === 'all'
      ? filteredCodes.filter(
          (code) => !(CASINO_LOBBY_FEATURED_GAME_CODES as readonly GameCode[]).includes(code),
        )
      : filteredCodes;
  const pfEnabled = resolveCasinoLobbyPfCtaEnabled();

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4 md:py-6"
      data-testid="casino-lobby-page"
      data-owner-todo={P10_PAGE_CASINO_TODO}
      data-lobby-exposure={CASINO_LOBBY_EXPOSURE}
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
            {t(CASINO_LOBBY_HERO_TITLE_KEY)}
          </h1>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed md:text-base">
            {t(CASINO_LOBBY_HERO_DESC_KEY)}
          </p>
        </div>

        <div
          className="border-line bg-surface flex min-w-[12rem] flex-col gap-2 rounded-lg border px-4 py-3"
          data-testid="casino-lobby-balance"
          aria-label={t(CASINO_LOBBY_BALANCE_LABEL_KEY)}
        >
          <p className="text-foreground-muted m-0 text-xs font-medium">
            {t(CASINO_LOBBY_BALANCE_LABEL_KEY)}
          </p>
          {walletLoading ? (
            <p
              className="text-foreground-muted m-0 text-sm"
              data-testid="casino-lobby-balance-loading"
            >
              …
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              <MoneyDisplay
                amount={wallet?.usdt_available ?? '0'}
                currency="USDT"
                showCurrency
                className="text-foreground text-sm"
              />
              <MoneyDisplay
                amount={wallet?.phon_available ?? '0'}
                currency="PHON"
                showCurrency
                className="text-foreground text-sm"
              />
            </div>
          )}
        </div>
      </header>

      <div
        className="border-line bg-surface flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        data-testid="casino-lobby-pf-strip"
        data-fairness-todo={P10_PAGE_CASINO_FAIRNESS_TODO}
      >
        <div className="flex items-start gap-2">
          <ShieldCheck className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <p className="text-foreground m-0 text-sm font-medium">{t('casino.hub.pf.label')}</p>
            <p className="text-foreground-muted m-0 text-xs leading-relaxed">
              {t('casino.hub.pf.tooltip')}
            </p>
          </div>
        </div>
        {pfEnabled ? (
          <a
            href={CASINO_FAIRNESS_ROUTE}
            className="text-accent text-sm font-medium underline-offset-4 hover:underline"
            data-testid="casino-lobby-pf-verify"
          >
            {t('casino.hub.pf.verify')}
          </a>
        ) : (
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled
              data-testid="casino-lobby-pf-verify"
              aria-disabled="true"
            >
              {t('casino.hub.pf.verify')}
            </Button>
            <p className="text-foreground-muted m-0 text-xs" role="status">
              {t(CASINO_LOBBY_PF_DEFERRED_REASON_KEY)}
            </p>
          </div>
        )}
      </div>

      <nav aria-label={t('casino.tabs.aria')} data-testid="casino-lobby-category-chips">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li>
            <button
              type="button"
              className={cn(
                'min-h-11 rounded-md px-3 text-sm font-medium',
                category === 'all'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface text-foreground border-line border',
              )}
              aria-pressed={category === 'all'}
              data-testid="casino-lobby-chip-all"
              onClick={() => setCategory('all')}
            >
              {t('games.category.all')}
            </button>
          </li>
          {CASINO_LOBBY_CATEGORY_CHIPS.map((chip) => (
            <li key={chip}>
              <button
                type="button"
                className={cn(
                  'min-h-11 rounded-md px-3 text-sm font-medium',
                  category === chip
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-surface text-foreground border-line border',
                )}
                aria-pressed={category === chip}
                data-testid={`casino-lobby-chip-${chip}`}
                onClick={() => setCategory(chip)}
              >
                {t(CASINO_LOBBY_CATEGORY_LABEL_KEYS[chip])}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {category === 'all' ? (
        <section className="flex flex-col gap-3" data-testid="casino-lobby-featured">
          <h2 className="text-foreground m-0 text-lg font-semibold">
            {t(CASINO_LOBBY_FEATURED_TITLE_KEY)}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CASINO_LOBBY_FEATURED_GAME_CODES.map((code, index) => (
              <CasinoGameTile
                key={code}
                code={code}
                featured
                playTileTestId={index === 0 ? 'casino-hub-play-tile' : undefined}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3" data-testid="casino-lobby-grid">
        <h2 className="text-foreground m-0 text-lg font-semibold">
          {t(CASINO_LOBBY_GRID_TITLE_KEY)}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gridCodes.map((code, index) => (
            <CasinoGameTile
              key={code}
              code={code}
              playTileTestId={
                category !== 'all' && index === 0 ? 'casino-hub-play-tile' : undefined
              }
            />
          ))}
        </div>
      </section>
    </section>
  );
}
