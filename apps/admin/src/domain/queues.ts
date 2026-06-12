import { callRpc } from '../lib/rpc';

export type QueueAction =
  | { kind: 'resolveQueue'; id: string }
  | { kind: 'approveWithdrawal'; id: string }
  | { kind: 'rejectWithdrawal'; id: string }
  | { kind: 'markWithdrawalSent'; id: string }
  | { kind: 'reviewStr'; id: string }
  | { kind: 'fileStr'; id: string }
  | { kind: 'dismissStr'; id: string }
  | { kind: 'clearRiskFlag'; id: string }
  | { kind: 'approveKyc'; id: string }
  | { kind: 'rejectKyc'; id: string };

export async function runQueueAction(action: QueueAction, reason: string): Promise<void> {
  switch (action.kind) {
    case 'resolveQueue': {
      await callRpc('rpc_resolve_admin_review_queue', {
        p_queue_id: action.id,
        p_reason: reason,
      });
      return;
    }
    case 'approveWithdrawal': {
      await callRpc('rpc_approve_withdrawal', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      return;
    }
    case 'rejectWithdrawal': {
      await callRpc('rpc_reject_withdrawal', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      return;
    }
    case 'markWithdrawalSent': {
      await callRpc('rpc_mark_withdrawal_sent', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      return;
    }
    case 'reviewStr': {
      await callRpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'reviewing',
        p_reason: reason,
      });
      return;
    }
    case 'fileStr': {
      await callRpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'filed',
        p_reason: reason,
      });
      return;
    }
    case 'dismissStr': {
      await callRpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'dismissed',
        p_reason: reason,
      });
      return;
    }
    case 'clearRiskFlag': {
      await callRpc('rpc_clear_risk_flag', {
        p_flag_id: action.id,
        p_reason: reason,
      });
      return;
    }
    case 'approveKyc': {
      await callRpc('rpc_review_kyc_submission', {
        p_submission_id: action.id,
        p_status: 'approved',
        p_reason: reason,
      });
      return;
    }
    case 'rejectKyc': {
      await callRpc('rpc_review_kyc_submission', {
        p_submission_id: action.id,
        p_status: 'rejected',
        p_reason: reason,
      });
      return;
    }
  }
}
