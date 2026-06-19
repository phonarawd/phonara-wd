import type { Session } from '@supabase/supabase-js';
import type { Tables } from '@phonara/shared-types';

type Profile = Pick<Tables<'profiles'>, 'display_name' | 'username'>;

export function userDisplayName(
  session: Session | null,
  profile: Profile | null,
  guestLabel: string,
): string {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (profile?.username?.trim()) return profile.username.trim();
  const email = session?.user.email;
  if (email) {
    const local = email.split('@')[0];
    return local || email;
  }
  return guestLabel;
}

export function userInitial(session: Session | null, profile: Profile | null, guestInitial: string): string {
  const name = userDisplayName(session, profile, '');
  if (name) return name.slice(0, 1).toUpperCase();
  return guestInitial;
}
