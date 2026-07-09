import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadAdminMfaGateState } from '@/domain/admin-auth';
import {
  adminDeskAccessRoute,
  fetchProfileIsAdmin,
  resolveAdminDeskAccess,
  resolveAdminPostLoginDestination,
} from '@/domain/admin-post-auth';

const fromMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/domain/admin-auth', () => ({
  loadAdminMfaGateState: vi.fn(),
}));

const loadAdminMfaGateStateMock = vi.mocked(loadAdminMfaGateState);

function mockProfileRole(role: string | null) {
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: role ? { role } : null,
          error: null,
        }),
      }),
    }),
  });
}

describe('admin-post-auth funnel', () => {
  beforeEach(() => {
    fromMock.mockReset();
    loadAdminMfaGateStateMock.mockReset();
  });

  it('routes post-login to enroll when TOTP is not verified', async () => {
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: false,
      verifiedTotpFactorId: null,
    });

    await expect(resolveAdminPostLoginDestination()).resolves.toBe('/mfa/enroll');
  });

  it('routes post-login to challenge when TOTP is verified but session is aal1', async () => {
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    await expect(resolveAdminPostLoginDestination()).resolves.toBe('/mfa/challenge');
  });

  it('routes post-login to overview when session is aal2', async () => {
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    await expect(resolveAdminPostLoginDestination()).resolves.toBe('/');
  });

  it('blocks desk access for non-admin profiles', async () => {
    mockProfileRole('user');

    await expect(resolveAdminDeskAccess('user-1')).resolves.toEqual({ kind: 'forbidden' });
    expect(loadAdminMfaGateStateMock).not.toHaveBeenCalled();
  });

  it('requires MFA enroll on desk routes when admin has no verified TOTP', async () => {
    mockProfileRole('admin');
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: false,
      verifiedTotpFactorId: null,
    });

    const access = await resolveAdminDeskAccess('admin-1');
    expect(access).toEqual({ kind: 'mfa-enroll' });
    expect(adminDeskAccessRoute(access)).toBe('/mfa/enroll');
  });

  it('requires MFA challenge on desk routes when TOTP exists but session is aal1', async () => {
    mockProfileRole('admin');
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    const access = await resolveAdminDeskAccess('admin-1');
    expect(access).toEqual({ kind: 'mfa-challenge' });
    expect(adminDeskAccessRoute(access)).toBe('/mfa/challenge');
  });

  it('allows desk access when admin session is aal2', async () => {
    mockProfileRole('admin');
    loadAdminMfaGateStateMock.mockResolvedValue({
      currentLevel: 'aal2',
      nextLevel: 'aal2',
      hasVerifiedTotp: true,
      verifiedTotpFactorId: 'factor-1',
    });

    await expect(resolveAdminDeskAccess('admin-1')).resolves.toEqual({ kind: 'allowed' });
    expect(adminDeskAccessRoute({ kind: 'allowed' })).toBeNull();
  });

  it('fetchProfileIsAdmin returns false when profile is missing', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    await expect(fetchProfileIsAdmin('missing')).resolves.toBe(false);
  });
});
