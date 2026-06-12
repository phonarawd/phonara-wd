import type { MessageKey } from '@phonara/i18n';
import { translateError } from '../../lib/translate-error';

export function getSelectionValue(selection: Record<string, unknown>, key: string): unknown {
  if (key === 'guesses.0') {
    const guesses = selection['guesses'];
    return Array.isArray(guesses) ? guesses[0] : 'higher';
  }
  return selection[key];
}

export function cellsFromText(text: string, max: number): number[] {
  const values = text
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= max);
  return [...new Set(values)].slice(0, 24);
}

export function randomHex(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function errorToKey(error: unknown): MessageKey {
  const translated = translateError(error);
  if (translated !== 'error.UNKNOWN') return translated;
  return 'error.UNKNOWN';
}
