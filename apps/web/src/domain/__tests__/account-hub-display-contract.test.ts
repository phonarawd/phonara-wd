import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_DELETE_REASON_MIN,
  ACCOUNT_HUB_NAV_ITEMS,
  ACCOUNT_HUB_P8_MANIFEST_ROUTES,
  ACCOUNT_HUB_P8_TODO,
  ACCOUNT_HUB_ROUTE,
  ACCOUNT_KYC_ROUTE,
  ACCOUNT_RG_ROUTE,
  accountDeleteReasonGateKey,
  resolveAccountAvatarInitial,
  resolveAccountHubNavItems,
} from '../account-hub-display-contract';
import { ACCOUNT_PROFILE_ROUTE } from '../account-profile-display-contract';

describe('account-hub-display-contract', () => {
  it('locks hub route and P8 manifest', () => {
    expect(ACCOUNT_HUB_ROUTE).toBe('/account');
    expect(ACCOUNT_HUB_P8_TODO).toBe('p8-page-account');
    expect(ACCOUNT_HUB_P8_MANIFEST_ROUTES).toEqual(['/account']);
  });

  it('lists profile · KYC · RG canonical routes', () => {
    const routes = ACCOUNT_HUB_NAV_ITEMS.map((item) => item.route);
    expect(routes).toContain(ACCOUNT_PROFILE_ROUTE);
    expect(routes).toContain(ACCOUNT_KYC_ROUTE);
    expect(routes).toContain(ACCOUNT_RG_ROUTE);
    expect(ACCOUNT_KYC_ROUTE).toBe('/account/kyc');
    expect(ACCOUNT_RG_ROUTE).toBe('/account/responsible-gaming');
  });

  it('filters notifications nav when center is hidden', () => {
    const visible = resolveAccountHubNavItems().map((item) => item.id);
    expect(visible).toContain('profile');
    expect(visible).toContain('kyc');
    expect(visible).toContain('responsible-gaming');
  });

  it('resolves avatar initial from profile fields', () => {
    expect(
      resolveAccountAvatarInitial({
        displayName: 'Alice',
        username: 'alice',
        email: 'a@example.com',
        guestInitial: 'G',
      }),
    ).toBe('A');
    expect(
      resolveAccountAvatarInitial({
        displayName: null,
        username: 'bob',
        email: 'b@example.com',
        guestInitial: 'G',
      }),
    ).toBe('B');
    expect(
      resolveAccountAvatarInitial({
        displayName: null,
        username: null,
        email: 'c@example.com',
        guestInitial: 'G',
      }),
    ).toBe('C');
    expect(
      resolveAccountAvatarInitial({
        displayName: null,
        username: null,
        email: null,
        guestInitial: 'G',
      }),
    ).toBe('G');
  });

  it('gates account deletion reason length', () => {
    expect(accountDeleteReasonGateKey('short')).toBe('account.delete.reasonTooShort');
    expect(accountDeleteReasonGateKey('a'.repeat(ACCOUNT_DELETE_REASON_MIN))).toBeNull();
  });
});
