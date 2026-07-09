import type { MessageKey } from '@phonara/i18n';

export { ERROR_KEY_MAP } from '../../../../packages/i18n/src/translate-error';
import { translateError as translateErrorBase } from '../../../../packages/i18n/src/translate-error';

export function translateError(err: unknown, fallback: MessageKey = 'error.UNKNOWN'): MessageKey {
  return translateErrorBase(err, fallback) as MessageKey;
}
