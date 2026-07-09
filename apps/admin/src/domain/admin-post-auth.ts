import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_MFA_CHALLENGE_ROUTE,
  ADMIN_MFA_ENROLL_ROUTE,
} from './admin-security-display-contract';
import { loadAdminMfaGateState } from './admin-auth';
import { supabase } from '../lib/supabase';

export function isAdminAuthSurfacePath(pathname: string): boolean {
  return (
    pathname === ADMIN_LOGIN_ROUTE ||
    pathname === ADMIN_MFA_ENROLL_ROUTE ||
    pathname === ADMIN_MFA_CHALLENGE_ROUTE
  );
}

export async function fetchProfileIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.role === 'admin';
}

export async function resolveAdminPostLoginDestination(): Promise<string> {
  const gate = await loadAdminMfaGateState();
  if (gate.currentLevel === 'aal2') return '/';
  if (gate.hasVerifiedTotp) return ADMIN_MFA_CHALLENGE_ROUTE;
  return ADMIN_MFA_ENROLL_ROUTE;
}

export type AdminDeskAccess =
  | { kind: 'allowed' }
  | { kind: 'forbidden' }
  | { kind: 'mfa-enroll' }
  | { kind: 'mfa-challenge' };

export function adminDeskAccessRoute(access: AdminDeskAccess): string | null {
  if (access.kind === 'mfa-enroll') return ADMIN_MFA_ENROLL_ROUTE;
  if (access.kind === 'mfa-challenge') return ADMIN_MFA_CHALLENGE_ROUTE;
  return null;
}

/** Profiles role gate + MFA step-up for AdminShell desk routes (not auth surfaces). */
export async function resolveAdminDeskAccess(userId: string): Promise<AdminDeskAccess> {
  const isAdmin = await fetchProfileIsAdmin(userId);
  if (!isAdmin) return { kind: 'forbidden' };

  const gate = await loadAdminMfaGateState();
  if (gate.currentLevel === 'aal2') return { kind: 'allowed' };
  if (gate.hasVerifiedTotp) return { kind: 'mfa-challenge' };
  return { kind: 'mfa-enroll' };
}
