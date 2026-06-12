import { supabase } from '../lib/supabase';

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
      const { error } = await supabase.rpc('rpc_resolve_admin_review_queue', {
        p_queue_id: action.id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'approveWithdrawal': {
      const { error } = await supabase.rpc('rpc_approve_withdrawal', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'rejectWithdrawal': {
      const { error } = await supabase.rpc('rpc_reject_withdrawal', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'markWithdrawalSent': {
      const { error } = await supabase.rpc('rpc_mark_withdrawal_sent', {
        p_withdrawal_id: action.id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'reviewStr': {
      const { error } = await supabase.rpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'reviewing',
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'fileStr': {
      const { error } = await supabase.rpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'filed',
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'dismissStr': {
      const { error } = await supabase.rpc('rpc_update_str_case_status', {
        p_case_id: action.id,
        p_status: 'dismissed',
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'clearRiskFlag': {
      const { error } = await supabase.rpc('rpc_clear_risk_flag', {
        p_flag_id: action.id,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'approveKyc': {
      const { error } = await supabase.rpc('rpc_review_kyc_submission', {
        p_submission_id: action.id,
        p_status: 'approved',
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
    case 'rejectKyc': {
      const { error } = await supabase.rpc('rpc_review_kyc_submission', {
        p_submission_id: action.id,
        p_status: 'rejected',
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      return;
    }
  }
}
