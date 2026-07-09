import { describe, expect, it } from 'vitest';

import { SETTINGS_REFERRAL_ROUTE as HUB_REFERRAL_ROUTE } from '../settings-hub-display-contract';
import {
  assertSettingsReferralForbidsWebShare,
  resolveReferralShareCode,
  resolveSettingsReferralInviteRoute,
  SETTINGS_REFERRAL_CODE_READ_ENGINE_RPC,
  SETTINGS_REFERRAL_FORBIDS_WEB_SHARE,
  SETTINGS_REFERRAL_ROUTE,
  SETTINGS_REFERRAL_SURFACE_CTA,
} from '../settings-referral-display-contract';

describe('settings-referral-display-contract', () => {
  it('locks route and invite link-only CTA ownership', () => {
    expect(SETTINGS_REFERRAL_ROUTE).toBe('/settings/referral');
    expect(HUB_REFERRAL_ROUTE).toBe(SETTINGS_REFERRAL_ROUTE);
    expect(SETTINGS_REFERRAL_SURFACE_CTA).toBe('link-only');
    expect(resolveSettingsReferralInviteRoute()).toBe('/referral/invite');
  });

  it('forbids Web Share on this surface (§3.4.3)', () => {
    expect(SETTINGS_REFERRAL_FORBIDS_WEB_SHARE).toBe(true);
    expect(() => assertSettingsReferralForbidsWebShare()).not.toThrow();
  });

  it('reads referral code via existing register lookup helper', () => {
    expect(SETTINGS_REFERRAL_CODE_READ_ENGINE_RPC).toBe('rpc_register_referral');
    expect(resolveReferralShareCode('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'phon_user')).toBe(
      'phon_user',
    );
    expect(resolveReferralShareCode('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', null)).toBe('aaaaaaaa');
  });
});
