import { describe, expect, it } from 'vitest';

import {
  ANNOUNCEMENTS_FULL_UNLOCK_TODO,
  ANNOUNCEMENTS_KIND,
  ANNOUNCEMENTS_LIST_RPC,
  ANNOUNCEMENTS_ROUTE,
  assertAnnouncementsContractSync,
  isAnnouncementsFullUnlocked,
  mapRpcNoticeRow,
} from '../announcements-display-contract';

describe('announcements-display-contract', () => {
  it('binds notice list route and RPC · E3 GATE full unlock', () => {
    expect(ANNOUNCEMENTS_ROUTE).toBe('/announcements');
    expect(ANNOUNCEMENTS_KIND).toBe('notice');
    expect(ANNOUNCEMENTS_LIST_RPC).toBe('rpc_list_cms_content');
    expect(ANNOUNCEMENTS_FULL_UNLOCK_TODO).toBe('ew-e3-gate-cms-promotions');
    expect(isAnnouncementsFullUnlocked()).toBe(true);
    expect(() => assertAnnouncementsContractSync()).not.toThrow();
  });

  it('maps RPC notice rows to display rows', () => {
    expect(
      mapRpcNoticeRow({
        id: 'n1',
        content_key: 'notice.welcome',
        kind: 'notice',
        locale: 'ko',
        title: 'Welcome',
        body: 'Body',
        published_at: '2026-07-11',
        starts_at: null,
        ends_at: null,
        status: 'published',
      }),
    ).toEqual({
      id: 'n1',
      contentKey: 'notice.welcome',
      title: 'Welcome',
      body: 'Body',
      publishedAt: '2026-07-11',
    });
  });
});
