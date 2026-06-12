import { supabase } from '../../lib/supabase';
import type { RecentBet } from './types';

export async function loadRecentBets(): Promise<RecentBet[]> {
  const { data } = await supabase
    .from('game_bets')
    .select('id,game,status,stake,payout,currency,created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return (data ?? []) as RecentBet[];
}
