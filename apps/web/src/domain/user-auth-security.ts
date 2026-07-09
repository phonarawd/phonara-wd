import { supabase } from '../lib/supabase';

export type MfaAssuranceLevel = 'aal1' | 'aal2';

function toMfaLevel(level: string | null | undefined): MfaAssuranceLevel | null {
  if (level === 'aal1' || level === 'aal2') return level;
  return null;
}

export type MfaFactors = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.mfa.listFactors>>['data']
>;

export type UserSecurityState = {
  currentLevel: MfaAssuranceLevel | null;
  nextLevel: MfaAssuranceLevel | null;
  hasVerifiedTotp: boolean;
  verifiedTotpFactorId: string | null;
  passkeyCount: number;
};

export async function getAuthenticatorAssuranceLevel(): Promise<{
  currentLevel: MfaAssuranceLevel | null;
  nextLevel: MfaAssuranceLevel | null;
} | null> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  if (!data) return null;
  return {
    currentLevel: toMfaLevel(data.currentLevel),
    nextLevel: toMfaLevel(data.nextLevel),
  };
}

export async function listMfaFactors(): Promise<MfaFactors | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}

export async function enrollTotpFactor(friendlyName = 'PHONARA Authenticator'): Promise<{
  factorId: string;
  qrCode: string;
  secret: string;
}> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) throw error;
  if (!data?.totp) throw new Error('MFA enroll missing TOTP payload');
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function challengeMfaFactor(factorId: string): Promise<{ challengeId: string }> {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw error;
  if (!data?.id) throw new Error('MFA challenge missing id');
  return { challengeId: data.id };
}

export async function verifyMfaFactor(input: {
  factorId: string;
  challengeId: string;
  code: string;
}): Promise<void> {
  const { error } = await supabase.auth.mfa.verify({
    factorId: input.factorId,
    challengeId: input.challengeId,
    code: input.code.trim(),
  });
  if (error) throw error;

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) throw refreshError;
}

export function getVerifiedTotpFactor(
  factors: MfaFactors | null,
): MfaFactors['totp'][number] | null {
  if (!factors) return null;
  return factors.totp.find((factor) => factor.status === 'verified') ?? null;
}

export async function listPasskeys(): Promise<Array<{ id: string; friendly_name: string | null }>> {
  const { data, error } = await supabase.auth.passkey.list();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    friendly_name: row.friendly_name ?? null,
  }));
}

export async function registerPasskey(): Promise<void> {
  const { error } = await supabase.auth.registerPasskey();
  if (error) throw error;
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  const { error } = await supabase.auth.passkey.delete({ passkeyId });
  if (error) throw error;
}

export async function signInWithPasskey(): Promise<void> {
  const { error } = await supabase.auth.signInWithPasskey();
  if (error) throw error;
}

export async function loadUserSecurityState(): Promise<UserSecurityState> {
  const [aal, factors, passkeys] = await Promise.all([
    getAuthenticatorAssuranceLevel(),
    listMfaFactors(),
    listPasskeys().catch(() => []),
  ]);
  const verifiedTotp = getVerifiedTotpFactor(factors);
  return {
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
    hasVerifiedTotp: verifiedTotp !== null,
    verifiedTotpFactorId: verifiedTotp?.id ?? null,
    passkeyCount: passkeys.length,
  };
}

/** Step-up to AAL2 when TOTP is enrolled (e.g. before withdrawal). */
export async function stepUpWithTotp(code: string): Promise<void> {
  const factors = await listMfaFactors();
  const verified = getVerifiedTotpFactor(factors);
  if (!verified) throw new Error('totp_not_enrolled');
  const { challengeId } = await challengeMfaFactor(verified.id);
  await verifyMfaFactor({ factorId: verified.id, challengeId, code });
}

export async function unenrollTotpFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
