import { describe, expect, it } from 'vitest';

import {
  filterInboxItemsByTab,
  mapOutboxRowToInboxItem,
  resolveInboxKindFromEventType,
  resolveInboxTabForKind,
} from '@/domain/notifications-center-display-contract';
import { mergeNotificationInboxItems } from '@/features/notifications/notifications-inbox-read';

describe('notifications-center-display-contract', () => {
  it('maps outbox event types to inbox tabs', () => {
    expect(resolveInboxKindFromEventType('deposit_credited')).toBe('deposit_credited');
    expect(resolveInboxKindFromEventType('trade_position')).toBe('trade_position');
    expect(resolveInboxTabForKind('tier_decay_warning')).toBe('mission');
    expect(resolveInboxTabForKind('tier_upgrade')).toBe('reward');
    expect(resolveInboxTabForKind('deposit_credited')).toBe('reward');
    expect(resolveInboxTabForKind('price_alert')).toBe('price');
    expect(resolveInboxTabForKind('trade_position')).toBe('price');
  });

  it('builds liquidated trade_position inbox row from outbox payload', () => {
    const item = mapOutboxRowToInboxItem({
      id: 'liq-1',
      channel: 'push',
      event_type: 'trade_position',
      payload: { market: 'PHONUSDT-PERP', position_id: '00000000-0000-0000-0000-000000000001' },
      created_at: '2026-07-06T10:00:00.000Z',
    });

    expect(item.kind).toBe('trade_position');
    expect(item.tab).toBe('price');
    expect(item.tone).toBe('danger');
    expect(item.bodyValues?.market).toBe('PHONUSDT-PERP');
    expect(item.nextAction?.route).toBe('/trade');
  });

  it('builds inbox rows from outbox payload display fields only', () => {
    const item = mapOutboxRowToInboxItem({
      id: 'abc',
      channel: 'push',
      event_type: 'deposit_credited',
      payload: { amount: '100.00000000', currency: 'PHON', rail: 'giftcard' },
      created_at: '2026-07-05T10:00:00.000Z',
    });

    expect(item.id).toBe('outbox:abc');
    expect(item.tab).toBe('reward');
    expect(item.bodyValues?.amount).toBe('100.00000000');
    expect(item.nextAction?.route).toBe('/wallet');
  });

  it('filters inbox tabs without duplicating items', () => {
    const items = [
      mapOutboxRowToInboxItem({
        id: '1',
        channel: 'push',
        event_type: 'mission_reward',
        payload: {},
        created_at: '2026-07-05T09:00:00.000Z',
      }),
      mapOutboxRowToInboxItem({
        id: '2',
        channel: 'push',
        event_type: 'deposit_credited',
        payload: { amount: '1', currency: 'PHON' },
        created_at: '2026-07-05T10:00:00.000Z',
      }),
    ];

    expect(filterInboxItemsByTab(items, 'mission')).toHaveLength(1);
    expect(filterInboxItemsByTab(items, 'all')).toHaveLength(2);
  });
});

describe('notifications-inbox-read merge', () => {
  it('merges outbox and local rows newest-first', () => {
    const merged = mergeNotificationInboxItems(
      [
        {
          id: 'older',
          channel: 'push',
          event_type: 'deposit_credited',
          payload: { amount: '1', currency: 'PHON' },
          created_at: '2026-07-05T08:00:00.000Z',
        },
      ],
      [
        {
          id: 'local-1',
          tone: 'info',
          title: 'BTCUSDT alert',
          body: 'Target reached',
          createdAt: '2026-07-05T12:00:00.000Z',
        },
      ],
    );

    expect(merged[0]?.id).toBe('local:local-1');
    expect(merged[1]?.id).toBe('outbox:older');
  });
});
