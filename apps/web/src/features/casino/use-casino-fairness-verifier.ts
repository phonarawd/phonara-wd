import { useCallback, useState } from 'react';
import {
  verifyRound,
  type GameCode,
  type VerifyResult,
} from '@phonara/game-engine';
import type { MessageKey } from '@phonara/i18n';

import {
  CASINO_FAIRNESS_GAME_CODES,
  CASINO_FAIRNESS_NONCE,
  isCasinoFairnessGameCode,
} from '@/domain/casino-fairness-display-contract';
import { GAME_BY_CODE } from '@/features/casino/game-config';

export type CasinoFairnessVerifierForm = {
  game: GameCode;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  selectionJson: string;
  expectedResultJson: string;
};

export type CasinoFairnessVerifierView = {
  form: CasinoFairnessVerifierForm;
  nonce: typeof CASINO_FAIRNESS_NONCE;
  gameCodes: readonly GameCode[];
  busy: boolean;
  errorKey: MessageKey | null;
  result: VerifyResult | null;
  recomputedJson: string | null;
  setGame: (game: GameCode) => void;
  setServerSeed: (value: string) => void;
  setServerSeedHash: (value: string) => void;
  setClientSeed: (value: string) => void;
  setSelectionJson: (value: string) => void;
  setExpectedResultJson: (value: string) => void;
  runVerify: () => Promise<void>;
  resetResult: () => void;
};

function defaultSelectionJson(game: GameCode): string {
  return JSON.stringify(GAME_BY_CODE[game].defaultSelection, null, 2);
}

function parseOptionalJson(
  raw: string,
): { ok: true; value: unknown | undefined } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch {
    return { ok: false };
  }
}

export function useCasinoFairnessVerifier(
  initialGame: GameCode = 'dice',
): CasinoFairnessVerifierView {
  const startGame = isCasinoFairnessGameCode(initialGame) ? initialGame : 'dice';
  const [form, setForm] = useState<CasinoFairnessVerifierForm>(() => ({
    game: startGame,
    serverSeed: '',
    serverSeedHash: '',
    clientSeed: '',
    selectionJson: defaultSelectionJson(startGame),
    expectedResultJson: '',
  }));
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [recomputedJson, setRecomputedJson] = useState<string | null>(null);

  const resetResult = useCallback(() => {
    setResult(null);
    setRecomputedJson(null);
    setErrorKey(null);
  }, []);

  const setGame = useCallback((game: GameCode) => {
    setForm((prev) => ({
      ...prev,
      game,
      selectionJson: defaultSelectionJson(game),
    }));
    setResult(null);
    setRecomputedJson(null);
    setErrorKey(null);
  }, []);

  const setServerSeed = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, serverSeed: value }));
  }, []);

  const setServerSeedHash = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, serverSeedHash: value }));
  }, []);

  const setClientSeed = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, clientSeed: value }));
  }, []);

  const setSelectionJson = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, selectionJson: value }));
  }, []);

  const setExpectedResultJson = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, expectedResultJson: value }));
  }, []);

  const runVerify = useCallback(async () => {
    const serverSeed = form.serverSeed.trim();
    const serverSeedHash = form.serverSeedHash.trim();
    const clientSeed = form.clientSeed.trim();
    if (!serverSeed || !serverSeedHash || !clientSeed) {
      setErrorKey('casino.fairness.verify.missingFields');
      setResult(null);
      setRecomputedJson(null);
      return;
    }

    const selectionParsed = parseOptionalJson(form.selectionJson);
    if (!selectionParsed.ok) {
      setErrorKey('casino.fairness.verify.invalidJson');
      setResult(null);
      setRecomputedJson(null);
      return;
    }

    const expectedParsed = parseOptionalJson(form.expectedResultJson);
    if (!expectedParsed.ok) {
      setErrorKey('casino.fairness.verify.invalidJson');
      setResult(null);
      setRecomputedJson(null);
      return;
    }

    const expectedResult =
      expectedParsed.value !== undefined &&
      expectedParsed.value !== null &&
      typeof expectedParsed.value === 'object' &&
      !Array.isArray(expectedParsed.value)
        ? (expectedParsed.value as Record<string, unknown>)
        : undefined;

    setBusy(true);
    setErrorKey(null);
    try {
      const verified = await verifyRound({
        game: form.game,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: CASINO_FAIRNESS_NONCE,
        selection: selectionParsed.value,
        expectedResult,
      });
      setResult(verified);
      setRecomputedJson(
        verified.recomputedResult === null
          ? null
          : JSON.stringify(verified.recomputedResult, null, 2),
      );
    } finally {
      setBusy(false);
    }
  }, [form]);

  return {
    form,
    nonce: CASINO_FAIRNESS_NONCE,
    gameCodes: CASINO_FAIRNESS_GAME_CODES,
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
    resetResult,
  };
}
