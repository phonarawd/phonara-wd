import { supabase } from '../../lib/supabase';
import type { RecentBet } from './types';

export async function loadRecentBets(): Promise<RecentBet[]> {
  const { data } = await supabase
    .from('v_game_bets_client')
    .select('id,game,status,stake,payout,currency,created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as RecentBet[];
}
