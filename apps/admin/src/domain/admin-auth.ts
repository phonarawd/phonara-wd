import { supabase } from '../lib/supabase';

export type MfaAssuranceLevel = 'aal1' | 'aal2';

function toMfaLevel(level: string | null | undefined): MfaAssuranceLevel | null {
  if (level === 'aal1' || level === 'aal2') return level;
  return null;
}

export type MfaFactors = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.mfa.listFactors>>['data']
>;

export type AdminMfaGateState = {
  currentLevel: MfaAssuranceLevel | null;
  nextLevel: MfaAssuranceLevel | null;
  hasVerifiedTotp: boolean;
  verifiedTotpFactorId: string | null;
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

export async function enrollTotpFactor(friendlyName = 'PHONARA Admin'): Promise<{
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

/** Wait until the client session reports MFA assurance level aal2. */
export async function waitForAdminAal2(maxAttempts = 12, delayMs = 100): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const aal = await getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2') return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error('ERR_MFA_AAL2_TIMEOUT');
}

export function getVerifiedTotpFactor(
  factors: MfaFactors | null,
): MfaFactors['totp'][number] | null {
  if (!factors) return null;
  return factors.totp.find((factor) => factor.status === 'verified') ?? null;
}

export async function loadAdminMfaGateState(): Promise<AdminMfaGateState> {
  const [aal, factors] = await Promise.all([getAuthenticatorAssuranceLevel(), listMfaFactors()]);
  const verifiedTotp = getVerifiedTotpFactor(factors);
  return {
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
    hasVerifiedTotp: verifiedTotp !== null,
    verifiedTotpFactorId: verifiedTotp?.id ?? null,
  };
}
