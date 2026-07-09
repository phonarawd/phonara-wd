import type { MessageKey } from '@phonara/i18n';

import {
  krwWithdrawAccountGateKey,
  normalizeBankAccountInput,
} from '@/features/wallet/krw-withdraw-page-display';

export const BANK_WHITELIST_CHAIN = 'BANK' as const;

export type BankAccountRowView = {
  id: string;
  account: string;
  displayAccount: string;
  label: string | null;
  cooldownActive: boolean;
  cooldownUntilDisplay: string | null;
};

export function bankAccountGateKey(account: string): MessageKey | null {
  return krwWithdrawAccountGateKey(account);
}

export function normalizeSettingsBankAccountInput(raw: string): string {
  return normalizeBankAccountInput(raw);
}

export function isBankAccountCooldownActive(cooldownUntil: string | null): boolean {
  if (!cooldownUntil) return false;
  const ms = Date.parse(cooldownUntil);
  return Number.isFinite(ms) && ms > Date.now();
}

export function formatBankAccountCooldownUntil(
  cooldownUntil: string | null | undefined,
  locale: string,
): string | null {
  if (!cooldownUntil) return null;
  const ms = Date.parse(cooldownUntil);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function maskBankAccountNumber(account: string): string {
  const digits = normalizeBankAccountInput(account);
  if (digits.length <= 4) return digits;
  return `•••• ${digits.slice(-4)}`;
}
