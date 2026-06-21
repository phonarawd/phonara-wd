import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Currency } from '@phonara/shared-types';
import { format, money, toDecimal, toFixed } from '@phonara/money';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import { useProfile } from '../../hooks/use-profile';
import { useT } from '../../lib/i18n';
import { translateError } from '../../lib/translate-error';
import { createKrwDepositRequest, requestWithdrawal, submitKyc } from '../../domain/wallet';
import { useWalletData } from './use-wallet-data';
import { isPositiveDecimalInput, normalizeDecimalInput } from '../../lib/money-input';

export type WalletTab = 'deposit' | 'withdraw' | 'staking' | 'history';

function parseWalletTabFromSearch(searchStr: string): WalletTab | undefined {
  const raw = new URLSearchParams(searchStr).get('tab');
  if (raw === 'deposit' || raw === 'withdraw' || raw === 'staking' || raw === 'history') {
    return raw;
  }
  return undefined;
}

function newRequestId(): string {
  const c = globalThis.crypto;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function groupInteger(intPart: string): string {
  const neg = intPart.startsWith('-');
  const digits = neg ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return neg ? `-${grouped}` : grouped;
}

/** Display formatting via @phonara/money — no toLocaleString for amounts. */
function formatMoneyDisplay(amount: string, currency: Currency, showCurrency = false): string {
  const canonical = format(money(amount, currency));
  const isNeg = canonical.startsWith('-');
  const unsigned = isNeg ? canonical.slice(1) : canonical;
  const parts = unsigned.split('.');
  const intPart = parts[0] ?? '0';
  const fracPart = parts[1];
  const groupedInt = groupInteger(intPart);
  let out = fracPart ? `${groupedInt}.${fracPart}` : groupedInt;
  if (isNeg) out = `-${out}`;
  if (showCurrency) out = `${out} ${currency}`;
  return out;
}

export function useWalletPageController() {
  const t = useT();
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const tabFromSearch = useMemo(() => parseWalletTabFromSearch(searchStr), [searchStr]);
  const qc = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { profile, kycVerified } = useProfile();
  const userId = session?.user.id ?? null;

  const [tab, setTab] = useState<WalletTab>(() => tabFromSearch ?? 'deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [depositConfirmOpen, setDepositConfirmOpen] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycLegalName, setKycLegalName] = useState('');
  const [kycDocumentLast4, setKycDocumentLast4] = useState('');
  const [kycCountry, setKycCountry] = useState('KR');
  const [busy, setBusy] = useState(false);
  const depositRequestIdRef = useRef<string | null>(null);
  const depositInFlightRef = useRef(false);
  const withdrawIdempotencyKeyRef = useRef<string | null>(null);
  const withdrawClientRequestIdRef = useRef<string | null>(null);
  const withdrawInFlightRef = useRef(false);
  const [lastDeposit, setLastDeposit] = useState<{
    reference_code: string;
    expected_phon: string | null;
    deposit_id: string;
    sla_hours: string | null;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  useEffect(() => {
    setTab(tabFromSearch ?? 'deposit');
  }, [tabFromSearch]);

  const { deposits, withdrawalEnabled, activePhonKrwRate, depositRateError } = useWalletData(userId);

  const activeDeposit = deposits[0] ?? null;
  const withdrawalPaused = withdrawalEnabled === false;
  const withdrawCurrency = 'PHON' as const;
  const withdrawDestination = withdrawAddress.trim();
  const withdrawAmountValid = isPositiveDecimalInput(withdrawAmount);
  const canRequestWithdraw = Boolean(
    withdrawAmountValid && withdrawDestination && !busy && kycVerified && !withdrawalPaused,
  );

  const depositPreviewPhon = useMemo(() => {
    try {
      if (!isPositiveDecimalInput(depositAmount) || !activePhonKrwRate?.rate) return null;
      const rate = toDecimal(activePhonKrwRate.rate);
      if (!rate.greaterThan(0)) return null;
      return toFixed(toDecimal(depositAmount).div(rate), 'PHON');
    } catch {
      return null;
    }
  }, [activePhonKrwRate?.rate, depositAmount]);

  const showDepositRateFallback = Boolean(
    depositAmount && !depositPreviewPhon && (depositRateError || !activePhonKrwRate),
  );
  const canRequestDeposit = Boolean(isPositiveDecimalInput(depositAmount) && !busy);

  const withdrawKrwApprox = useMemo(() => {
    try {
      if (!withdrawAmountValid || !activePhonKrwRate?.rate) return null;
      const rate = toDecimal(activePhonKrwRate.rate);
      if (!rate.greaterThan(0)) return null;
      return toFixed(toDecimal(withdrawAmount).mul(rate), 'KRW');
    } catch {
      return null;
    }
  }, [activePhonKrwRate?.rate, withdrawAmount, withdrawAmountValid]);

  const withdrawAmountSummary = useMemo(() => {
    if (!withdrawAmountValid) return withdrawAmount;
    const phonAmount = formatMoneyDisplay(withdrawAmount, withdrawCurrency, true);
    if (!withdrawKrwApprox) return phonAmount;
    return `${phonAmount} · ${t('wallet.withdraw.confirmKrwApprox', {
      amount: formatMoneyDisplay(withdrawKrwApprox, 'KRW', false),
    })}`;
  }, [t, withdrawAmount, withdrawAmountValid, withdrawCurrency, withdrawKrwApprox]);

  const refCode = lastDeposit?.reference_code ?? activeDeposit?.reference_code ?? null;
  const expectedPhon = lastDeposit?.expected_phon ?? activeDeposit?.expected_phon ?? null;
  const phonLocked = wallet?.phon_locked !== '0.000000';

  const heroBalanceDisplay = formatMoneyDisplay(wallet?.phon_available ?? '0', 'PHON', true);
  const phonAvailableDisplay = formatMoneyDisplay(wallet?.phon_available ?? '0', 'PHON', true);
  const phonLockedDisplay = formatMoneyDisplay(wallet?.phon_locked ?? '0', 'PHON', true);
  const usdtAvailableDisplay = formatMoneyDisplay(wallet?.usdt_available ?? '0', 'USDT', true);
  const krwAvailableDisplay = formatMoneyDisplay(wallet?.krw_available ?? '0', 'KRW', true);
  const depositReferenceDisplay = refCode;
  const depositExpectedPhonDisplay = expectedPhon
    ? formatMoneyDisplay(expectedPhon, 'PHON', true)
    : null;
  const depositPreviewDisplay = depositPreviewPhon
    ? formatMoneyDisplay(depositPreviewPhon, 'PHON', true)
    : null;
  const withdrawAvailableDisplay = formatMoneyDisplay(wallet?.phon_available ?? '0', 'PHON', true);

  const handleDeposit = useCallback(async () => {
    if (!canRequestDeposit || depositInFlightRef.current) return;
    const clientRequestId = depositRequestIdRef.current ?? (depositRequestIdRef.current = newRequestId());
    depositInFlightRef.current = true;
    setBusy(true);
    try {
      const row = await createKrwDepositRequest({
        amountKrw: depositAmount,
        clientRequestId,
      });
      setLastDeposit({
        deposit_id: row.deposit_id,
        reference_code: row.reference_code,
        expected_phon: row.expected_phon,
        sla_hours: row.sla_hours,
      });
      toast.success(t('wallet.deposit.success'));
      setDepositConfirmOpen(false);
      void qc.invalidateQueries({ queryKey: ['krw-deposits', userId] });
    } catch (err) {
      toast.error(t(translateError(err)));
    } finally {
      setBusy(false);
      depositInFlightRef.current = false;
      depositRequestIdRef.current = null;
    }
  }, [canRequestDeposit, depositAmount, qc, t, userId]);

  const openDepositConfirm = useCallback(() => {
    if (!canRequestDeposit || depositInFlightRef.current) return;
    depositRequestIdRef.current ??= newRequestId();
    setDepositConfirmOpen(true);
  }, [canRequestDeposit]);

  const closeDepositConfirm = useCallback(() => {
    if (depositInFlightRef.current) return;
    depositRequestIdRef.current = null;
    setDepositConfirmOpen(false);
  }, []);

  const openWithdrawConfirm = useCallback(() => {
    if (!withdrawAmountValid || busy || !kycVerified || !withdrawDestination) return;
    if (withdrawalPaused) {
      toast.error(t('wallet.withdraw.unavailableToast'));
      return;
    }
    withdrawIdempotencyKeyRef.current ??= newRequestId().replace(/-/g, '').slice(0, 24);
    withdrawClientRequestIdRef.current ??= newRequestId();
    setWithdrawConfirmOpen(true);
  }, [busy, kycVerified, t, withdrawalPaused, withdrawAmountValid, withdrawDestination]);

  const closeWithdrawConfirm = useCallback(() => {
    if (withdrawInFlightRef.current) return;
    withdrawIdempotencyKeyRef.current = null;
    withdrawClientRequestIdRef.current = null;
    setWithdrawConfirmOpen(false);
  }, []);

  const handleWithdraw = useCallback(async () => {
    if (!canRequestWithdraw || withdrawInFlightRef.current) return;
    const idem =
      withdrawIdempotencyKeyRef.current ??
      (withdrawIdempotencyKeyRef.current = newRequestId().replace(/-/g, '').slice(0, 24));
    const clientRequestId =
      withdrawClientRequestIdRef.current ?? (withdrawClientRequestIdRef.current = newRequestId());
    withdrawInFlightRef.current = true;
    setBusy(true);
    try {
      await requestWithdrawal({
        currency: withdrawCurrency,
        amount: withdrawAmount,
        destination: withdrawDestination,
        idempotencyKey: idem,
        clientRequestId,
      });
      toast.success(t('wallet.withdraw.success'));
      setWithdrawConfirmOpen(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
      void qc.invalidateQueries({ queryKey: ['withdrawals', userId] });
      void qc.invalidateQueries({ queryKey: ['wallet', userId] });
    } catch (err) {
      toast.error(t(translateError(err)));
    } finally {
      setBusy(false);
      withdrawInFlightRef.current = false;
      withdrawIdempotencyKeyRef.current = null;
      withdrawClientRequestIdRef.current = null;
    }
  }, [canRequestWithdraw, qc, t, userId, withdrawAmount, withdrawDestination]);

  const handleSubmitKyc = useCallback(async () => {
    if (!userId || !session || busy || !kycLegalName || !kycDocumentLast4 || !kycCountry) return;
    setBusy(true);
    try {
      await submitKyc({
        legalName: kycLegalName,
        documentLast4: kycDocumentLast4,
        country: kycCountry,
        idempotencyKey: `kyc-${userId}-${crypto.randomUUID()}`,
      });
      toast.success(t('wallet.kyc.submitOk'));
      setShowKycForm(false);
      await qc.invalidateQueries({ queryKey: ['kyc-submissions', userId] });
    } catch (err) {
      toast.error(t(translateError(err)));
    } finally {
      setBusy(false);
    }
  }, [busy, kycCountry, kycDocumentLast4, kycLegalName, qc, session, t, userId]);

  const copyDepositReference = useCallback(async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      toast.success(t('wallet.deposit.copyOk'));
    } catch {
      toast.error(t('wallet.deposit.copyFailed'));
    }
  }, [refCode, t]);

  const onDepositAmountChange = useCallback((value: string) => {
    setDepositAmount(normalizeDecimalInput(value, { allowDecimal: false }));
  }, []);

  const onWithdrawAmountChange = useCallback((value: string) => {
    setWithdrawAmount(normalizeDecimalInput(value));
  }, []);

  const onTabChange = useCallback(
    (value: string) => {
      if (value === 'deposit' || value === 'withdraw' || value === 'staking' || value === 'history') {
        setTab(value);
        const href = value === 'deposit' ? '/wallet' : `/wallet?tab=${value}`;
        void navigate({ to: href as '/wallet', replace: true });
      }
    },
    [navigate],
  );

  return {
    t,
    authLoading,
    walletLoading,
    tab,
    onTabChange,
    busy,
    kycVerified,
    showKycGate: !kycVerified,
    withdrawalPaused,
    phonLocked,
    profile,
    heroBalanceDisplay,
    phonAvailableDisplay,
    phonLockedDisplay,
    usdtAvailableDisplay,
    krwAvailableDisplay,
    depositReferenceDisplay,
    depositExpectedPhonDisplay,
    depositPreviewDisplay,
    showDepositRateFallback,
    withdrawAvailableDisplay,
    withdrawKrwApproxDisplay: withdrawKrwApprox
      ? formatMoneyDisplay(withdrawKrwApprox, 'KRW', true)
      : null,
    withdrawAmountSummary,
    depositAmount,
    onDepositAmountChange,
    withdrawAmount,
    onWithdrawAmountChange,
    withdrawAddress,
    setWithdrawAddress,
    canRequestDeposit,
    canRequestWithdraw,
    openDepositConfirm,
    closeDepositConfirm,
    handleDeposit,
    depositConfirmOpen,
    openWithdrawConfirm,
    closeWithdrawConfirm,
    handleWithdraw,
    withdrawConfirmOpen,
    showKycForm,
    setShowKycForm,
    kycLegalName,
    setKycLegalName,
    kycDocumentLast4,
    setKycDocumentLast4,
    kycCountry,
    setKycCountry,
    handleSubmitKyc,
    copyDepositReference,
  };
}
