import {
  mapLocalTradeNotificationToInboxItem,
  mapOutboxRowToInboxItem,
  type NotificationInboxItem,
  type OutboxNotificationRow,
} from '@/domain/notifications-center-display-contract';
import { supabase } from '@/lib/supabase';
import type { TradeNotification } from '@/stores/notifications';

export const NOTIFICATIONS_INBOX_QUERY_KEY = 'notifications-inbox' as const;

const OUTBOX_SELECT = 'id, channel, event_type, payload, created_at' as const;

const INBOX_EVENT_TYPES = [
  'deposit_credited',
  'withdrawal_sent',
  'trade_position',
  'mission_reward',
  'viral_mission_reward',
  'tier_upgrade',
  'tier_decay_warning',
  'referral_bonus',
  'referral_qualified',
] as const;

type NotificationOutboxQueryClient = {
  from(relation: 'notification_outbox'): {
    select(columns: typeof OUTBOX_SELECT): {
      eq(
        column: 'user_id',
        value: string,
      ): {
        in(
          column: 'event_type',
          values: readonly string[],
        ): {
          order(
            column: 'created_at',
            options: { ascending: boolean },
          ): {
            limit(count: number): Promise<{
              data: OutboxNotificationRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
};

function notificationOutboxClient(): NotificationOutboxQueryClient {
  return supabase as unknown as NotificationOutboxQueryClient;
}

export async function fetchNotificationOutboxRows(
  userId: string,
): Promise<OutboxNotificationRow[]> {
  const { data, error } = await notificationOutboxClient()
    .from('notification_outbox')
    .select(OUTBOX_SELECT)
    .eq('user_id', userId)
    .in('event_type', [...INBOX_EVENT_TYPES])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export function mergeNotificationInboxItems(
  outboxRows: readonly OutboxNotificationRow[],
  localRows: readonly TradeNotification[],
): NotificationInboxItem[] {
  const outboxItems = outboxRows.map(mapOutboxRowToInboxItem);
  const localItems = localRows.map((row) =>
    mapLocalTradeNotificationToInboxItem({
      id: row.id,
      tone: row.tone,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
    }),
  );

  const seen = new Set<string>();
  const merged: NotificationInboxItem[] = [];

  for (const item of [...outboxItems, ...localItems]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}
