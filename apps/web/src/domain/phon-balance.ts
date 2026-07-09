import { callRpc } from '../lib/rpc';

/** Engine read shape for rpc_get_phon_balance_breakdown — display via phon-bonus-display-contract (E8). */
export interface PhonBalanceBreakdown {
  ok: boolean;
  phon_bonus_available: string;
  phon_real_available: string;
  phon_bonus_locked: string;
  phon_real_locked: string;
  phon_available: string;
  phon_locked: string;
  wagering_remaining: string;
}

export async function fetchPhonBalanceBreakdown(): Promise<PhonBalanceBreakdown> {
  const data = await callRpc('rpc_get_phon_balance_breakdown', {});
  return data as unknown as PhonBalanceBreakdown;
}
