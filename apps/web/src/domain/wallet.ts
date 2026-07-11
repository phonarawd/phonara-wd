import { callRpc } from '../lib/rpc';
import type { Database } from '@phonara/shared-types';

type Currency = Database['public']['Enums']['currency'];

/** Result of a KRW deposit request, narrowed from the RPC's Json return. */
export interface KrwDepositResult {
  ok: boolean;
  deposit_id: string;
  reference_code: string;
  expected_phon: string;
  sla_hours: string;
}

export interface CreateKrwDepositInput {
  amountKrw: string;
  clientRequestId: string;
}

export async function createKrwDepositRequest(
  input: CreateKrwDepositInput,
): Promise<KrwDepositResult> {
  const data = await callRpc('rpc_create_krw_deposit_request', {
    p_amount_krw: input.amountKrw,
    p_client_request_id: input.clientRequestId,
  });
  return data as unknown as KrwDepositResult;
}

export type WithdrawDestinationPayload =
  | string
  | {
      address: string;
      chain?: 'TRC20' | 'ERC20';
      currency?: Currency;
      account?: string;
    };

export interface RequestWithdrawalInput {
  currency: Currency;
  amount: string;
  destination: WithdrawDestinationPayload;
  idempotencyKey: string;
  clientRequestId: string;
}

function normalizeWithdrawDestination(
  currency: Currency,
  destination: WithdrawDestinationPayload,
): Record<string, string> {
  if (typeof destination === 'string') {
    const trimmed = destination.trim();
    if (currency === 'PHON') {
      return {
        type: 'bank',
        chain: 'BANK',
        account: trimmed,
        address: trimmed,
        currency,
      };
    }
    return { address: trimmed, currency };
  }
  const account = destination.account?.trim() ?? destination.address.trim();
  if (currency === 'PHON') {
    return {
      type: 'bank',
      chain: 'BANK',
      account,
      address: account,
      currency: destination.currency ?? currency,
    };
  }
  const payload: Record<string, string> = {
    address: destination.address,
    currency: destination.currency ?? currency,
  };
  if (destination.chain) payload['chain'] = destination.chain;
  if (destination.account) payload['account'] = destination.account;
  return payload;
}

/** Result of a PHON → KRW bank withdrawal request (narrowed from RPC Json return). */
export interface KrwWithdrawalResult {
  ok: boolean;
  withdrawal_id: string;
  expected_krw: string;
  rate_snapshot_id: string;
}

export async function requestWithdrawal(input: RequestWithdrawalInput): Promise<void> {
  await callRpc('rpc_request_withdrawal', {
    p_currency: input.currency,
    p_amount: input.amount,
    p_destination: normalizeWithdrawDestination(input.currency, input.destination),
    p_idempotency_key: input.idempotencyKey,
    p_client_request_id: input.clientRequestId,
  });
}

export interface RequestPhonKrwWithdrawalInput {
  amountPhon: string;
  bankAccount: string;
  idempotencyKey: string;
  clientRequestId: string;
}

export async function requestPhonKrwWithdrawal(
  input: RequestPhonKrwWithdrawalInput,
): Promise<KrwWithdrawalResult> {
  const data = await callRpc('rpc_request_withdrawal', {
    p_currency: 'PHON',
    p_amount: input.amountPhon,
    p_destination: {
      type: 'bank',
      chain: 'BANK',
      account: input.bankAccount,
      address: input.bankAccount,
      currency: 'PHON',
    },
    p_idempotency_key: input.idempotencyKey,
    p_client_request_id: input.clientRequestId,
  });
  return data as unknown as KrwWithdrawalResult;
}

export type UsdtWithdrawChain = 'TRC20' | 'ERC20';

/** Result of a USDT crypto withdrawal request (RPC fields + display snapshot at submit). */
export interface CryptoWithdrawalResult {
  ok: boolean;
  withdrawal_id: string;
  idempotent?: boolean;
  amount_usdt: string;
  chain: UsdtWithdrawChain;
  address: string;
  estimated_net_usdt: string;
}

export interface RequestUsdtWithdrawalInput {
  amountUsdt: string;
  chain: UsdtWithdrawChain;
  address: string;
  idempotencyKey: string;
  clientRequestId: string;
  estimatedNetUsdt: string;
}

export async function requestUsdtWithdrawal(
  input: RequestUsdtWithdrawalInput,
): Promise<CryptoWithdrawalResult> {
  const data = await callRpc('rpc_request_withdrawal', {
    p_currency: 'USDT',
    p_amount: input.amountUsdt,
    p_destination: {
      address: input.address,
      chain: input.chain,
      currency: 'USDT',
    },
    p_idempotency_key: input.idempotencyKey,
    p_client_request_id: input.clientRequestId,
  });
  const rpc = data as { ok?: boolean; withdrawal_id?: string; idempotent?: boolean };
  return {
    ok: Boolean(rpc.ok),
    withdrawal_id: rpc.withdrawal_id ?? '',
    idempotent: rpc.idempotent,
    amount_usdt: input.amountUsdt,
    chain: input.chain,
    address: input.address,
    estimated_net_usdt: input.estimatedNetUsdt,
  };
}

export interface SubmitKycInput {
  legalName: string;
  documentLast4: string;
  country: string;
  idempotencyKey: string;
  documentFrontPath: string;
  documentBackPath: string;
  selfiePath: string;
}

export async function submitKyc(input: SubmitKycInput): Promise<void> {
  await callRpc('rpc_submit_kyc', {
    p_payload: {
      legal_name: input.legalName,
      document_type: 'id_card',
      document_last4: input.documentLast4,
      country: input.country.toUpperCase(),
      document_front_path: input.documentFrontPath,
      document_back_path: input.documentBackPath,
      selfie_path: input.selfiePath,
    },
    p_idempotency_key: input.idempotencyKey,
  });
}

export type GiftcardKind = 'culture' | 'happy' | 'book' | 'department' | 'mobile' | 'game';

/** Server-computed gift card deposit preview (fee market + PHON/KRW snapshot). */
export interface GiftcardDepositSnapshot {
  ok: boolean;
  kind: GiftcardKind;
  provider_name: string;
  giftcard_type: string;
  face_value_krw: string;
  payout_rate_bps: number;
  percent_fee_bps: number;
  fixed_fee_krw: string;
  total_fee_krw: string;
  net_krw: string;
  expected_phon: string;
  sla_minutes: number;
  evidence_url: string | null;
  last_checked_at: string;
  deposit_id?: string;
}

export interface GiftcardFeeMarketRow {
  kind: GiftcardKind;
  provider_name: string;
  giftcard_type: string;
  payout_rate_bps: number;
  percent_fee_bps: number;
  fixed_fee_krw: string;
  min_face_value_krw: string;
  max_face_value_krw: string;
  sla_minutes: number;
  last_checked_at: string;
}

export async function listGiftcardFeeMarket(): Promise<GiftcardFeeMarketRow[]> {
  const data = await callRpc('rpc_list_giftcard_fee_market', {});
  return (data ?? []) as unknown as GiftcardFeeMarketRow[];
}

export async function previewGiftcardDeposit(
  kind: GiftcardKind,
  faceValueKrw: string,
): Promise<GiftcardDepositSnapshot> {
  const data = await callRpc('rpc_preview_giftcard_deposit', {
    p_kind: kind,
    p_face_value_krw: faceValueKrw,
  });
  return data as unknown as GiftcardDepositSnapshot;
}

export interface CreateGiftcardDepositInput {
  kind: GiftcardKind;
  pin: string;
  faceValueKrw: string;
  clientRequestId: string;
}

export async function createGiftcardDepositRequest(
  input: CreateGiftcardDepositInput,
): Promise<GiftcardDepositSnapshot> {
  const data = await callRpc('rpc_create_giftcard_deposit_request', {
    p_kind: input.kind,
    p_pin: input.pin,
    p_face_value_krw: input.faceValueKrw,
    p_client_request_id: input.clientRequestId,
  });
  return data as unknown as GiftcardDepositSnapshot;
}

// ─── E8 / E10 — P2P transfer · giftcard redeem reverse ───────────────────────

export interface P2pTransferRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  amount: string;
  fee_amount: string;
  net_amount: string;
  memo: string | null;
  status: string;
  created_at: string;
}

export interface TransferToUserResult {
  ok: boolean;
  transfer_id: string;
  amount: string;
  fee_amount: string;
  net_amount: string;
  recipient_id: string;
  idempotent?: boolean;
}

export interface TransferToUserInput {
  recipient: string;
  amount: string;
  memo?: string;
  clientRequestId: string;
}

export async function transferToUser(input: TransferToUserInput): Promise<TransferToUserResult> {
  const data = await callRpc('rpc_transfer_to_user', {
    p_recipient: input.recipient,
    p_amount: input.amount,
    p_memo: input.memo,
    p_client_request_id: input.clientRequestId,
  });
  return data as unknown as TransferToUserResult;
}

export async function listP2pTransfers(limit = 50): Promise<P2pTransferRow[]> {
  const data = await callRpc('rpc_list_p2p_transfers', { p_limit: limit });
  const payload = data as unknown as { ok?: boolean; transfers?: P2pTransferRow[] };
  return payload.transfers ?? [];
}

export interface GiftcardRedeemQuote {
  ok: boolean;
  kind: GiftcardKind;
  face_value_krw: string;
  phon_gross: string;
  fee_phon: string;
  phon_cost: string;
  fee_rate_bps: number;
  rate_snapshot_id: string;
  fee_market_id: string;
}

export interface GiftcardRedeemRequestResult {
  ok: boolean;
  redeem_id: string;
  kind: GiftcardKind;
  face_value_krw: string;
  phon_cost: string;
  fee_phon: string;
  phon_gross: string;
  status: string;
}

export interface CreateGiftcardRedeemInput {
  kind: GiftcardKind;
  faceValueKrw: string;
  clientRequestId: string;
}

export async function previewGiftcardRedeem(
  kind: GiftcardKind,
  faceValueKrw: string,
): Promise<GiftcardRedeemQuote> {
  const data = await callRpc('rpc_preview_giftcard_redeem', {
    p_kind: kind,
    p_face_value_krw: faceValueKrw,
  });
  return data as unknown as GiftcardRedeemQuote;
}

export async function createGiftcardRedeemRequest(
  input: CreateGiftcardRedeemInput,
): Promise<GiftcardRedeemRequestResult> {
  const data = await callRpc('rpc_create_giftcard_redeem_request', {
    p_kind: input.kind,
    p_face_value_krw: input.faceValueKrw,
    p_client_request_id: input.clientRequestId,
  });
  return data as unknown as GiftcardRedeemRequestResult;
}
