import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  useAddWithdrawalAddress,
  useRemoveWithdrawalAddress,
  useWithdrawalWhitelist,
  type WithdrawalWhitelistEntry,
} from '@/features/wallet/use-crypto-withdraw';
import { useI18n, useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

import {
  BANK_WHITELIST_CHAIN,
  bankAccountGateKey,
  formatBankAccountCooldownUntil,
  isBankAccountCooldownActive,
  maskBankAccountNumber,
  normalizeSettingsBankAccountInput,
  type BankAccountRowView,
} from './bank-accounts-settings-display';

export type SettingsBankAccountsControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  errorKey: MessageKey | null;
  bankAccounts: BankAccountRowView[];
  whitelistEnabled: boolean;
  accountInput: string;
  setAccountInput: (value: string) => void;
  labelInput: string;
  setLabelInput: (value: string) => void;
  accountGateKey: MessageKey | null;
  addBusy: boolean;
  removeBusyId: string | null;
  addFormOpen: boolean;
  openAddForm: () => void;
  closeAddForm: () => void;
  refresh: () => Promise<void>;
  handleAddBankAccount: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleRemoveBankAccount: (id: string) => Promise<void>;
};

function toBankAccountRow(entry: WithdrawalWhitelistEntry, locale: string): BankAccountRowView {
  const cooldownActive = isBankAccountCooldownActive(entry.cooldown_until);
  return {
    id: entry.id,
    account: entry.address,
    displayAccount: maskBankAccountNumber(entry.address),
    label: entry.label,
    cooldownActive,
    cooldownUntilDisplay: cooldownActive
      ? formatBankAccountCooldownUntil(entry.cooldown_until, locale)
      : null,
  };
}

/** Canonical `/settings/bank-accounts` — KRW withdrawal destination whitelist (P5). */
export function useSettingsBankAccountsController(): SettingsBankAccountsControllerView {
  const t = useT();
  const { locale } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    addresses,
    whitelistEnabled,
    loading: whitelistLoading,
    refetch,
  } = useWithdrawalWhitelist();
  const { registerAddress, loading: addBusy } = useAddWithdrawalAddress();
  const { removeAddress } = useRemoveWithdrawalAddress();

  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [accountInput, setAccountInputRaw] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null);

  const setAccountInput = useCallback((value: string) => {
    setAccountInputRaw(normalizeSettingsBankAccountInput(value));
  }, []);

  const bankAccounts = useMemo(
    () =>
      addresses
        .filter((entry) => entry.chain === BANK_WHITELIST_CHAIN)
        .map((entry) => toBankAccountRow(entry, locale)),
    [addresses, locale],
  );

  const accountGateKey = bankAccountGateKey(accountInput);
  const loading = authLoading || whitelistLoading;

  const refresh = useCallback(async () => {
    setErrorKey(null);
    try {
      await refetch();
    } catch {
      setErrorKey('common.error.generic');
    }
  }, [refetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
    }
  }, [session, authLoading, navigate]);

  const openAddForm = useCallback(() => {
    setAddFormOpen(true);
    setAccountInputRaw('');
    setLabelInput('');
  }, []);

  const closeAddForm = useCallback(() => {
    setAddFormOpen(false);
    setAccountInputRaw('');
    setLabelInput('');
  }, []);

  async function handleAddBankAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addBusy || accountGateKey) return;

    const normalizedAccount = normalizeSettingsBankAccountInput(accountInput);
    const trimmedLabel = labelInput.trim();

    try {
      await registerAddress({
        chain: BANK_WHITELIST_CHAIN,
        address: normalizedAccount,
        label: trimmedLabel || undefined,
      });
      closeAddForm();
      productToast.show({ zone: 'strict', key: 'bankAccounts.addOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'bankAccounts.addError' });
    }
  }

  async function handleRemoveBankAccount(id: string) {
    if (removeBusyId) return;
    setRemoveBusyId(id);
    try {
      await removeAddress(id);
      productToast.show({ zone: 'strict', key: 'bankAccounts.removeOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'bankAccounts.removeError' });
    } finally {
      setRemoveBusyId(null);
    }
  }

  return {
    t,
    loading,
    errorKey,
    bankAccounts,
    whitelistEnabled,
    accountInput,
    setAccountInput,
    labelInput,
    setLabelInput,
    accountGateKey,
    addBusy,
    removeBusyId,
    addFormOpen,
    openAddForm,
    closeAddForm,
    refresh,
    handleAddBankAccount,
    handleRemoveBankAccount,
  };
}
