/**
 * Untyped casino live RPC helper — E23 RPCs may land before `gen:types` sync.
 * Mirrors sports `sportsRpc` pattern (exists typed path stays on `callRpc`).
 */
import { supabase } from '../../lib/supabase';

export async function casinoLiveRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw error;
  return data as T;
}
