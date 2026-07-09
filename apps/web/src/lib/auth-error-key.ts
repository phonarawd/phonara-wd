import type { MessageKey } from '@phonara/i18n';
import type { AuthErrorCode } from './auth';

// Form-level validation codes that never reach Supabase, combined with the
// provider-mapped AuthErrorCode. Kept separate from AuthErrorCode because these
// are produced by client-side guards, not by the auth backend.
export type AuthFieldErrorCode =
  | AuthErrorCode
  | 'emailRequired'
  | 'emailInvalid'
  | 'emailBlocked'
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'passwordDigitsOnly'
  | 'passwordWeak'
  | 'passwordMismatch';

// Explicit switch (never a template-string key) so the returned value stays a
// statically-checked MessageKey and missing catalog entries fail typecheck.
export function authErrorMessageKey(code: AuthFieldErrorCode): MessageKey {
  switch (code) {
    case 'invalidCredentials':
      return 'auth.entry.errors.invalidCredentials';
    case 'emailInvalid':
      return 'auth.entry.errors.emailInvalid';
    case 'emailAlreadyRegistered':
      return 'auth.entry.errors.emailAlreadyRegistered';
    case 'emailBlocked':
      return 'auth.entry.errors.emailBlocked';
    case 'passwordTooShort':
      return 'auth.entry.errors.passwordTooShort';
    case 'passwordDigitsOnly':
    case 'passwordWeak':
      return 'auth.entry.errors.passwordWeak';
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
    case 'passwordMismatch':
      return 'auth.entry.errors.passwordMismatch';
  }
}

/** Toast copy — warmer tone; inline alerts keep {@link authErrorMessageKey}. */
export function authErrorToastMessageKey(code: AuthFieldErrorCode): MessageKey {
  switch (code) {
    case 'invalidCredentials':
      return 'auth.entry.toast.invalidCredentials';
    case 'emailInvalid':
      return 'auth.entry.toast.emailInvalid';
    case 'emailAlreadyRegistered':
      return 'auth.entry.toast.emailAlreadyRegistered';
    case 'emailBlocked':
      return 'auth.entry.toast.emailBlocked';
    case 'passwordTooShort':
      return 'auth.entry.toast.passwordTooShort';
    case 'passwordDigitsOnly':
      return 'auth.entry.toast.passwordDigitsOnly';
    case 'passwordWeak':
      return 'auth.entry.toast.passwordWeak';
    case 'emailNotConfirmed':
      return 'auth.entry.toast.emailNotConfirmed';
    case 'rateLimited':
      return 'auth.entry.toast.rateLimited';
    case 'network':
      return 'auth.entry.toast.network';
    case 'generic':
      return 'auth.entry.toast.generic';
    case 'emailRequired':
      return 'auth.entry.toast.emailRequired';
    case 'passwordRequired':
      return 'auth.entry.toast.passwordRequired';
    case 'passwordMismatch':
      return 'auth.entry.toast.passwordMismatch';
  }
}

const LOCAL_PART_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?$/;
const DOMAIN_LABEL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/**
 * Stricter than HTML5 / zod default `.email()` — blocks `test@`, `user@domain`,
 * missing TLD, consecutive dots, and other typo-shaped addresses.
 */
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

export const SIGNUP_MIN_PASSWORD_LENGTH = 8;

/** Allowed specials — aligned with remote Supabase Auth (GoTrue) signup policy. */
export const SIGNUP_PASSWORD_SPECIAL_CHARS = String.raw`!@#$%^&*()_+-=[]{};':"|<>?,./` + '~';

const SIGNUP_PASSWORD_LOWER_RE = /[a-z]/;
const SIGNUP_PASSWORD_UPPER_RE = /[A-Z]/;
const SIGNUP_PASSWORD_DIGIT_RE = /[0-9]/;
const SIGNUP_PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export type SignupPasswordIssue = 'tooShort' | 'weak';

/** True when every entered character is a digit (e.g. 12345678). */
export function isPasswordDigitsOnly(password: string): boolean {
  return password.length > 0 && /^\d+$/.test(password);
}

export function hasSignupPasswordLowercase(password: string): boolean {
  return SIGNUP_PASSWORD_LOWER_RE.test(password);
}

export function hasSignupPasswordUppercase(password: string): boolean {
  return SIGNUP_PASSWORD_UPPER_RE.test(password);
}

export function hasSignupPasswordDigit(password: string): boolean {
  return SIGNUP_PASSWORD_DIGIT_RE.test(password);
}

export function hasSignupPasswordSpecial(password: string): boolean {
  return SIGNUP_PASSWORD_SPECIAL_RE.test(password);
}

/** @deprecated Prefer {@link hasSignupPasswordLowercase} / {@link hasSignupPasswordUppercase}. */
export function hasSignupPasswordLetter(password: string): boolean {
  return /[a-zA-Z]/.test(password);
}

export function meetsSignupPasswordComplexity(password: string): boolean {
  if (!isSignupPasswordCharsetAllowed(password)) return false;
  return (
    hasSignupPasswordLowercase(password) &&
    hasSignupPasswordUppercase(password) &&
    hasSignupPasswordDigit(password) &&
    hasSignupPasswordSpecial(password)
  );
}

/** Every character must be ASCII letter, digit, or Supabase-allowed special (repeats OK). */
export function isSignupPasswordCharsetAllowed(password: string): boolean {
  if (password.length === 0) return true;
  return /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(password);
}

export function getSignupPasswordIssue(password: string): SignupPasswordIssue | null {
  if (password.length === 0) return null;
  if (password.length < SIGNUP_MIN_PASSWORD_LENGTH) return 'tooShort';
  if (!isSignupPasswordCharsetAllowed(password)) return 'weak';
  if (!meetsSignupPasswordComplexity(password)) return 'weak';
  return null;
}

export function isSignupPasswordAcceptable(password: string): boolean {
  return getSignupPasswordIssue(password) === null && password.length >= SIGNUP_MIN_PASSWORD_LENGTH;
}

export { getSignupEmailIssue } from './signup-email-policy';
export type { SignupEmailIssue } from './signup-email-policy';
