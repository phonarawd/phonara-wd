import type { MessageKey } from '@phonara/i18n';

import type { AuthErrorCode } from './auth';

export type AuthFieldErrorCode =
  | AuthErrorCode
  | 'emailRequired'
  | 'emailInvalid'
  | 'passwordRequired';

export function authErrorMessageKey(code: AuthFieldErrorCode): MessageKey {
  switch (code) {
    case 'invalidCredentials':
      return 'auth.entry.errors.invalidCredentials';
    case 'emailInvalid':
      return 'auth.entry.errors.emailInvalid';
    case 'emailNotConfirmed':
      return 'auth.entry.errors.emailNotConfirmed';
    case 'rateLimited':
      return 'auth.entry.errors.rateLimited';
    case 'network':
      return 'auth.entry.errors.network';
    case 'generic':
      return 'auth.entry.errors.generic';
    case 'emailRequired':
      return 'auth.entry.errors.emailRequired';
    case 'passwordRequired':
      return 'auth.entry.errors.passwordRequired';
    default:
      return 'auth.entry.errors.generic';
  }
}

const LOCAL_PART_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?$/;
const DOMAIN_LABEL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if (trimmed.includes('..')) return false;

  const at = trimmed.indexOf('@');
  if (at <= 0 || at !== trimmed.lastIndexOf('@')) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  if (!LOCAL_PART_RE.test(local)) return false;
  if (domain.length === 0 || domain.length > 253) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;

  const tld = labels[labels.length - 1]!;
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return labels.every((label) => DOMAIN_LABEL_RE.test(label));
}
