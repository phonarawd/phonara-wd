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

export interface RequestWithdrawalInput {
  currency: Currency;
  amount: string;
  destination: string;
  idempotencyKey: string;
  clientRequestId: string;
}

export async function requestWithdrawal(input: RequestWithdrawalInput): Promise<void> {
  await callRpc('rpc_request_withdrawal', {
    p_currency: input.currency,
    p_amount: input.amount,
    p_destination: { address: input.destination, currency: input.currency },
    p_idempotency_key: input.idempotencyKey,
    p_client_request_id: input.clientRequestId,
  });
}

export interface SubmitKycInput {
  legalName: string;
  documentLast4: string;
  country: string;
  idempotencyKey: string;
}

export async function submitKyc(input: SubmitKycInput): Promise<void> {
  await callRpc('rpc_submit_kyc', {
    p_payload: {
      legal_name: input.legalName,
      document_type: 'id_card',
      document_last4: input.documentLast4,
      country: input.country.toUpperCase(),
    },
    p_idempotency_key: input.idempotencyKey,
  });
}
