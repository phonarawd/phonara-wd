import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import type { GameCode } from '@phonara/game-engine';

import {
  CASINO_FAIRNESS_CLIENT_SEED_LABEL_KEY,
  CASINO_FAIRNESS_CLIENT_SEED_MODE,
  CASINO_FAIRNESS_EXPECTED_LABEL_KEY,
  CASINO_FAIRNESS_EXPOSURE,
  CASINO_FAIRNESS_GAME_LABEL_KEY,
  CASINO_FAIRNESS_HERO_DESC_KEY,
  CASINO_FAIRNESS_HERO_TITLE_KEY,
  CASINO_FAIRNESS_INVALID_JSON_KEY,
  CASINO_FAIRNESS_LIMITS_CLIENT_SEED_KEY,
  CASINO_FAIRNESS_LIMITS_NONCE_KEY,
  CASINO_FAIRNESS_LIMITS_ROTATION_KEY,
  CASINO_FAIRNESS_LIMITS_TITLE_KEY,
  CASINO_FAIRNESS_MISSING_FIELDS_KEY,
  CASINO_FAIRNESS_NONCE_LABEL_KEY,
  CASINO_FAIRNESS_RESULT_HASH_MATCH_KEY,
  CASINO_FAIRNESS_RESULT_HASH_MISMATCH_KEY,
  CASINO_FAIRNESS_RESULT_OUTCOME_MATCH_KEY,
  CASINO_FAIRNESS_RESULT_OUTCOME_MISMATCH_KEY,
  CASINO_FAIRNESS_RESULT_OUTCOME_SKIPPED_KEY,
  CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED,
  CASINO_FAIRNESS_SELECTION_LABEL_KEY,
  CASINO_FAIRNESS_SEO_TITLE_KEY,
  CASINO_FAIRNESS_SERVER_HASH_LABEL_KEY,
  CASINO_FAIRNESS_SERVER_SEED_LABEL_KEY,
  CASINO_FAIRNESS_VERIFY_CTA_KEY,
  P10_PAGE_CASINO_FAIRNESS_TODO,
} from '@/domain/casino-fairness-display-contract';
import { CASINO_LOBBY_ROUTE } from '@/domain/casino-lobby-display-contract';
import { CASINO_E2E_TESTIDS } from '@/features/casino/casino-e2e-testids';
import { GAME_BY_CODE } from '@/features/casino/game-config';
import { useCasinoFairnessVerifier } from '@/features/casino/use-casino-fairness-verifier';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/product/primitives/card';
import { Input } from '@/product/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import type { MessageKey } from '@phonara/i18n';

function gameLabelKey(code: GameCode): MessageKey {
  return GAME_BY_CODE[code].labelKey;
}

/** Canonical `/casino/fairness` — verifyRound browser verifier · §23.2.1 PF limits. */
export function CasinoFairnessPage() {
  const t = useT();
  const verifier = useCasinoFairnessVerifier('dice');
  const {
    form,
    nonce,
    gameCodes,
    busy,
    errorKey,
    result,
    recomputedJson,
    setGame,
    setServerSeed,
    setServerSeedHash,
    setClientSeed,
    setSelectionJson,
    setExpectedResultJson,
    runVerify,
  } = verifier;

  useEffect(() => {
    document.title = t(CASINO_FAIRNESS_SEO_TITLE_KEY);
  }, [t]);

  return (
    <section
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 md:py-6"
      data-testid="casino-fairness-page"
      data-owner-todo={P10_PAGE_CASINO_FAIRNESS_TODO}
      data-fairness-exposure={CASINO_FAIRNESS_EXPOSURE}
      data-client-seed-mode={CASINO_FAIRNESS_CLIENT_SEED_MODE}
      data-seed-rotation-ui={CASINO_FAIRNESS_SEED_ROTATION_UI_EXPOSED ? 'true' : 'false'}
      data-nonce={String(nonce)}
    >
      <header className="flex flex-col gap-3">
        <Link
          to={CASINO_LOBBY_ROUTE}
          className="text-foreground-muted hover:text-foreground inline-flex items-center text-sm font-medium underline-offset-4 hover:underline"
          data-testid="casino-fairness-back"
        >
          {t('casino.subnav.lobby')}
        </Link>
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-accent mt-1 size-6 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
              {t(CASINO_FAIRNESS_HERO_TITLE_KEY)}
            </h1>
            <p className="text-foreground-muted m-0 text-sm leading-relaxed md:text-base">
              {t(CASINO_FAIRNESS_HERO_DESC_KEY)}
            </p>
          </div>
        </div>
      </header>

      <Card data-testid="casino-fairness-steps">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('casino.fairness.step1')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t('casino.fairness.step1.desc')}
          </p>
          <div>
            <h3 className="text-foreground m-0 text-sm font-semibold">{t('casino.fairness.step2')}</h3>
            <p className="text-foreground-muted m-0 mt-1 text-sm leading-relaxed">
              {t('casino.fairness.step2.desc')}
            </p>
          </div>
          <div>
            <h3 className="text-foreground m-0 text-sm font-semibold">{t('casino.fairness.step3')}</h3>
            <p className="text-foreground-muted m-0 mt-1 text-sm leading-relaxed">
              {t('casino.fairness.step3.desc')}
            </p>
          </div>
          <pre className="border-line bg-surface-raised text-foreground-muted m-0 overflow-x-auto rounded-md border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {t('casino.fairness.formula')}
          </pre>
        </CardBody>
      </Card>

      <Card data-testid="casino-fairness-limits">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t(CASINO_FAIRNESS_LIMITS_TITLE_KEY)}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-2 pt-0">
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(CASINO_FAIRNESS_LIMITS_CLIENT_SEED_KEY)}
          </p>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(CASINO_FAIRNESS_LIMITS_NONCE_KEY)}
          </p>
          <p className="text-foreground-muted m-0 text-sm leading-relaxed">
            {t(CASINO_FAIRNESS_LIMITS_ROTATION_KEY)}
          </p>
        </CardBody>
      </Card>

      <Card data-testid={CASINO_E2E_TESTIDS.fairnessVerifier}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('casino.verify.title')}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4 pt-0">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="casino-fairness-game" className="text-foreground text-sm font-medium">
              {t(CASINO_FAIRNESS_GAME_LABEL_KEY)}
            </label>
            <Select value={form.game} onValueChange={(value) => setGame(value as GameCode)}>
              <SelectTrigger id="casino-fairness-game" data-testid="casino-fairness-game">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gameCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {t(gameLabelKey(code))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="casino-fairness-server-hash"
              className="text-foreground text-sm font-medium"
            >
              {t(CASINO_FAIRNESS_SERVER_HASH_LABEL_KEY)}
            </label>
            <Input
              id="casino-fairness-server-hash"
              value={form.serverSeedHash}
              onChange={(event) => setServerSeedHash(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-sm"
              data-testid="casino-fairness-server-hash"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="casino-fairness-server-seed"
              className="text-foreground text-sm font-medium"
            >
              {t(CASINO_FAIRNESS_SERVER_SEED_LABEL_KEY)}
            </label>
            <Input
              id="casino-fairness-server-seed"
              value={form.serverSeed}
              onChange={(event) => setServerSeed(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-sm"
              data-testid="casino-fairness-server-seed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="casino-fairness-client-seed"
              className="text-foreground text-sm font-medium"
            >
              {t(CASINO_FAIRNESS_CLIENT_SEED_LABEL_KEY)}
            </label>
            <Input
              id="casino-fairness-client-seed"
              value={form.clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-sm"
              data-testid="casino-fairness-client-seed"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="casino-fairness-nonce" className="text-foreground text-sm font-medium">
              {t(CASINO_FAIRNESS_NONCE_LABEL_KEY)}
            </label>
            <Input
              id="casino-fairness-nonce"
              value={String(nonce)}
              readOnly
              disabled
              className="font-mono text-sm tabular-nums"
              data-testid="casino-fairness-nonce"
              aria-describedby="casino-fairness-nonce-hint"
            />
            <p
              id="casino-fairness-nonce-hint"
              className="text-foreground-muted m-0 text-xs leading-relaxed"
            >
              {t(CASINO_FAIRNESS_LIMITS_NONCE_KEY)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="casino-fairness-selection"
              className="text-foreground text-sm font-medium"
            >
              {t(CASINO_FAIRNESS_SELECTION_LABEL_KEY)}
            </label>
            <textarea
              id="casino-fairness-selection"
              value={form.selectionJson}
              onChange={(event) => setSelectionJson(event.target.value)}
              rows={5}
              spellCheck={false}
              className="border-line bg-surface text-foreground focus-visible:ring-focus min-h-28 w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
              data-testid="casino-fairness-selection"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="casino-fairness-expected"
              className="text-foreground text-sm font-medium"
            >
              {t(CASINO_FAIRNESS_EXPECTED_LABEL_KEY)}
            </label>
            <textarea
              id="casino-fairness-expected"
              value={form.expectedResultJson}
              onChange={(event) => setExpectedResultJson(event.target.value)}
              rows={4}
              spellCheck={false}
              className="border-line bg-surface text-foreground focus-visible:ring-focus min-h-24 w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
              data-testid="casino-fairness-expected"
            />
          </div>

          {errorKey ? (
            <p className="text-danger m-0 text-sm" role="alert" data-testid="casino-fairness-error">
              {t(
                errorKey === 'casino.fairness.verify.invalidJson'
                  ? CASINO_FAIRNESS_INVALID_JSON_KEY
                  : CASINO_FAIRNESS_MISSING_FIELDS_KEY,
              )}
            </p>
          ) : null}

          <Button
            type="button"
            onClick={() => {
              void runVerify();
            }}
            disabled={busy}
            data-testid="casino-fairness-verify-run"
          >
            {busy ? t('common.processing') : t(CASINO_FAIRNESS_VERIFY_CTA_KEY)}
          </Button>

          {result ? (
            <div
              className="border-line bg-surface-raised flex flex-col gap-3 rounded-md border p-3"
              data-testid="casino-fairness-result"
              data-hash-match={result.seedHashMatch ? 'true' : 'false'}
              data-result-match={
                result.resultMatch === null ? 'skipped' : result.resultMatch ? 'true' : 'false'
              }
            >
              <p
                className={
                  result.seedHashMatch
                    ? 'text-success m-0 text-sm font-medium'
                    : 'text-danger m-0 text-sm font-medium'
                }
                data-testid="casino-fairness-hash-status"
              >
                {result.seedHashMatch
                  ? t(CASINO_FAIRNESS_RESULT_HASH_MATCH_KEY)
                  : t(CASINO_FAIRNESS_RESULT_HASH_MISMATCH_KEY)}
              </p>
              <p
                className={
                  result.resultMatch === true
                    ? 'text-success m-0 text-sm font-medium'
                    : result.resultMatch === false
                      ? 'text-danger m-0 text-sm font-medium'
                      : 'text-foreground-muted m-0 text-sm'
                }
                data-testid="casino-fairness-outcome-status"
              >
                {result.resultMatch === true
                  ? t(CASINO_FAIRNESS_RESULT_OUTCOME_MATCH_KEY)
                  : result.resultMatch === false
                    ? t(CASINO_FAIRNESS_RESULT_OUTCOME_MISMATCH_KEY)
                    : t(CASINO_FAIRNESS_RESULT_OUTCOME_SKIPPED_KEY)}
              </p>
              {recomputedJson ? (
                <pre
                  className="text-foreground-muted m-0 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap"
                  data-testid="casino-fairness-recomputed"
                >
                  {recomputedJson}
                </pre>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </section>
  );
}
