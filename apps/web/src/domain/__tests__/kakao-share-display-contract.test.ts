import { describe, expect, it } from 'vitest';

import {
  buildKakaoFeedShareArgs,
  canConfigureKakaoShare,
  KAKAO_SHARE_UI_UNLOCK_TODO,
  resolveKakaoShareRoute,
} from '../kakao-share-display-contract';

describe('kakao-share-display-contract', () => {
  it('pins unlock todo and invite route owner', () => {
    expect(KAKAO_SHARE_UI_UNLOCK_TODO).toBe('ew-e10-growth-ui');
    expect(resolveKakaoShareRoute()).toBe('/referral/invite');
  });

  it('builds feed share args from invite payload', () => {
    expect(
      buildKakaoFeedShareArgs({
        shareTitle: 'Join PHONARA',
        shareText: 'Use my code',
        inviteUrl: 'https://phonara.net/r/abc',
        imageUrl: 'https://phonara.net/brand.png',
      }),
    ).toEqual({
      title: 'Join PHONARA',
      description: 'Use my code',
      inviteUrl: 'https://phonara.net/r/abc',
      imageUrl: 'https://phonara.net/brand.png',
    });
  });

  it('reads Kakao key availability from env contract', () => {
    expect(typeof canConfigureKakaoShare()).toBe('boolean');
  });
});
