import { REFERRAL_REGISTER_RPC } from '@/domain/affiliate-partner-display-contract';
import { supabase } from '@/lib/supabase';

export type ReferralRegisterResult = {
  registered: boolean;
  reason?: string;
  referrer_id?: string;
};

/** Post-auth silent wire — optional referral; failures do not block signup funnel. */
export async function registerReferralCode(code: string): Promise<ReferralRegisterResult> {
  const trimmed = code.trim();
  if (!trimmed) return { registered: false, reason: 'empty' };

  const { data, error } = await supabase.rpc(REFERRAL_REGISTER_RPC, {
    p_referrer_code: trimmed,
  });

  if (error) return { registered: false, reason: 'rpc_error' };
  return (data ?? { registered: false }) as ReferralRegisterResult;
}
