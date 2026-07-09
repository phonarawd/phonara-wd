import { supabase } from './supabase';

/** Reads `profiles.geo_blocked` for the signed-in user (used with `geo_block_enabled` app_config). */
export async function fetchProfileGeoBlocked(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('geo_blocked')
    .eq('id', session.session.user.id)
    .maybeSingle();

  if (error) throw error;
  return Boolean((data as { geo_blocked?: boolean } | null)?.geo_blocked);
}

/** Returns true when geo-block policy denies access for the signed-in user. */
export async function checkGeoBlocked(): Promise<boolean> {
  return fetchProfileGeoBlocked();
}
