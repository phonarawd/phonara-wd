/**
 * Notifications center — inbox read/display contract (P8).
 * Inbox hub: `/notifications` · prefs owner: `/settings/notifications` (§3.4.2).
 */

import type { MessageKey } from '@phonara/i18n';

import {
  NOTIFICATIONS_CENTER_ROUTE,
  type NotificationLocalPrefKey,
} from './notifications-pwa-display-contract';

export const NOTIFICATIONS_PREFS_ROUTE = '/settings/notifications' as const;

export const NOTIFICATIONS_INBOX_READ_STORAGE_KEY = 'phonara.notifications.read.v1' as const;

export type NotificationInboxTab = 'all' | 'mission' | 'price' | 'reward';

export const NOTIFICATION_INBOX_TABS: readonly NotificationInboxTab[] = [
  'all',
  'mission',
  'price',
  'reward',
] as const;

export type NotificationInboxSource = 'outbox' | 'local';

export type NotificationInboxKind =
  | 'deposit_credited'
  | 'withdrawal_sent'
  | 'mission_reward'
  | 'viral_mission_reward'
  | 'tier_upgrade'
  | 'tier_decay_warning'
  | 'referral_bonus'
  | 'referral_qualified'
  | 'price_alert'
  | 'trade_position'
  | 'security'
  | 'unknown';

export type NotificationInboxTone = 'success' | 'danger' | 'warning' | 'info';

export type NotificationInboxNextAction = {
  route: string;
  labelKey: MessageKey;
};

export type NotificationInboxItem = {
  id: string;
  source: NotificationInboxSource;
  kind: NotificationInboxKind;
  tab: Exclude<NotificationInboxTab, 'all'>;
  tone: NotificationInboxTone;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  titleValues?: Record<string, string | number>;
  bodyValues?: Record<string, string | number>;
  /** Local trade/price rows keep stored copy — not recomputed client-side. */
  inlineTitle?: string;
  inlineBody?: string;
  createdAt: string;
  nextAction: NotificationInboxNextAction | null;
  prefKey: NotificationLocalPrefKey | null;
};

const MISSION_KINDS: ReadonlySet<NotificationInboxKind> = new Set([
  'mission_reward',
  'viral_mission_reward',
  'tier_decay_warning',
]);

const PRICE_KINDS: ReadonlySet<NotificationInboxKind> = new Set(['price_alert', 'trade_position']);

const REWARD_KINDS: ReadonlySet<NotificationInboxKind> = new Set([
  'deposit_credited',
  'withdrawal_sent',
  'tier_upgrade',
  'referral_bonus',
  'referral_qualified',
]);

export function resolveInboxTabForKind(
  kind: NotificationInboxKind,
): Exclude<NotificationInboxTab, 'all'> {
  if (MISSION_KINDS.has(kind)) return 'mission';
  if (PRICE_KINDS.has(kind)) return 'price';
  if (REWARD_KINDS.has(kind)) return 'reward';
  return 'reward';
}

export function resolveInboxKindFromEventType(eventType: string): NotificationInboxKind {
  switch (eventType) {
    case 'deposit_credited':
      return 'deposit_credited';
    case 'withdrawal_sent':
      return 'withdrawal_sent';
    case 'mission_reward':
      return 'mission_reward';
    case 'viral_mission_reward':
      return 'viral_mission_reward';
    case 'tier_upgrade':
      return 'tier_upgrade';
    case 'tier_decay_warning':
      return 'tier_decay_warning';
    case 'referral_bonus':
    case 'referral_qualified':
      return 'referral_bonus';
    case 'trade_position':
      return 'trade_position';
    default:
      return 'unknown';
  }
}

export function resolveInboxToneForKind(kind: NotificationInboxKind): NotificationInboxTone {
  switch (kind) {
    case 'tier_decay_warning':
    case 'withdrawal_sent':
      return 'warning';
    case 'trade_position':
      return 'danger';
    case 'deposit_credited':
    case 'mission_reward':
    case 'viral_mission_reward':
    case 'tier_upgrade':
    case 'referral_bonus':
    case 'referral_qualified':
      return 'success';
    case 'price_alert':
      return 'info';
    default:
      return 'info';
  }
}

export function resolveInboxCopyKeys(kind: NotificationInboxKind): {
  titleKey: MessageKey;
  bodyKey: MessageKey;
} {
  switch (kind) {
    case 'deposit_credited':
      return {
        titleKey: 'notif.deposit.credited.title',
        bodyKey: 'notif.deposit.credited.body',
      };
    case 'withdrawal_sent':
      return {
        titleKey: 'notifications.event.withdrawal_sent.title',
        bodyKey: 'notifications.event.withdrawal_sent.body',
      };
    case 'mission_reward':
    case 'viral_mission_reward':
      return {
        titleKey: 'notifications.event.mission_reward.title',
        bodyKey: 'notifications.event.mission_reward.body',
      };
    case 'tier_upgrade':
      return {
        titleKey: 'notifications.event.tier_upgrade.title',
        bodyKey: 'notifications.event.tier_upgrade.body',
      };
    case 'tier_decay_warning':
      return {
        titleKey: 'notifications.event.tier_decay_warning.title',
        bodyKey: 'notifications.event.tier_decay_warning.body',
      };
    case 'referral_bonus':
    case 'referral_qualified':
      return {
        titleKey: 'notifications.event.referral_reward.title',
        bodyKey: 'notifications.event.referral_reward.body',
      };
    case 'price_alert':
      return {
        titleKey: 'notif.priceAlert.title',
        bodyKey: 'notif.priceAlert.body',
      };
    case 'trade_position':
      return {
        titleKey: 'notif.liquidated.title',
        bodyKey: 'notif.liquidated.body',
      };
    case 'security':
      return {
        titleKey: 'notifications.event.security.title',
        bodyKey: 'notifications.event.security.body',
      };
    default:
      return {
        titleKey: 'notifications.event.generic.title',
        bodyKey: 'notifications.event.generic.body',
      };
  }
}

export function resolveInboxNextAction(
  kind: NotificationInboxKind,
): NotificationInboxNextAction | null {
  switch (kind) {
    case 'deposit_credited':
      return { route: '/wallet', labelKey: 'notifications.next.wallet' };
    case 'withdrawal_sent':
      return { route: '/wallet/withdraw', labelKey: 'notifications.next.withdraw' };
    case 'mission_reward':
    case 'viral_mission_reward':
      return { route: '/home/missions', labelKey: 'notifications.next.missions' };
    case 'tier_upgrade':
    case 'tier_decay_warning':
      return { route: '/tier/me', labelKey: 'notifications.next.tier' };
    case 'referral_bonus':
    case 'referral_qualified':
      return { route: '/referral', labelKey: 'notifications.next.referral' };
    case 'price_alert':
    case 'trade_position':
      return { route: '/trade', labelKey: 'notifications.next.trade' };
    default:
      return null;
  }
}

export function resolveInboxPrefKey(kind: NotificationInboxKind): NotificationLocalPrefKey | null {
  switch (kind) {
    case 'deposit_credited':
      return 'deposit';
    case 'price_alert':
    case 'trade_position':
      return 'priceAlert';
    case 'mission_reward':
    case 'viral_mission_reward':
      return 'mission';
    case 'tier_upgrade':
      return 'tierUpgrade';
    case 'tier_decay_warning':
      return 'tierDecayWarning';
    case 'referral_bonus':
    case 'referral_qualified':
      return 'referral';
    default:
      return null;
  }
}

export function filterInboxItemsByTab(
  items: readonly NotificationInboxItem[],
  tab: NotificationInboxTab,
): NotificationInboxItem[] {
  if (tab === 'all') return [...items];
  return items.filter((item) => item.tab === tab);
}

export function countUnreadInboxItems(
  items: readonly NotificationInboxItem[],
  readIds: ReadonlySet<string>,
): number {
  return items.filter((item) => !readIds.has(item.id)).length;
}

export type OutboxNotificationRow = {
  id: string;
  channel: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export function mapOutboxRowToInboxItem(row: OutboxNotificationRow): NotificationInboxItem {
  const kind = resolveInboxKindFromEventType(row.event_type);
  const copy = resolveInboxCopyKeys(kind);
  const payload = row.payload ?? {};
  const amount = typeof payload['amount'] === 'string' ? payload['amount'] : '';
  const currency = typeof payload['currency'] === 'string' ? payload['currency'] : 'PHON';
  const symbol = typeof payload['symbol'] === 'string' ? payload['symbol'] : '';
  const target = typeof payload['target'] === 'string' ? payload['target'] : '';
  const price = typeof payload['price'] === 'string' ? payload['price'] : '';
  const market = typeof payload['market'] === 'string' ? payload['market'] : symbol;
  const daysLeftRaw = payload['days_left'];
  const daysLeft =
    typeof daysLeftRaw === 'number'
      ? daysLeftRaw
      : typeof daysLeftRaw === 'string'
        ? Number(daysLeftRaw)
        : undefined;
  const tier =
    typeof payload['tier'] === 'string'
      ? payload['tier']
      : typeof payload['next_tier'] === 'string'
        ? payload['next_tier']
        : '';

  const titleValues: Record<string, string | number> = {};
  const bodyValues: Record<string, string | number> = {
    amount,
    currency,
    symbol,
    target,
    price,
    market,
    tier,
  };
  if (daysLeft !== undefined && Number.isFinite(daysLeft)) {
    bodyValues['days'] = daysLeft;
  }

  return {
    id: `outbox:${row.id}`,
    source: 'outbox',
    kind,
    tab: resolveInboxTabForKind(kind),
    tone: resolveInboxToneForKind(kind),
    titleKey: copy.titleKey,
    bodyKey: copy.bodyKey,
    titleValues: Object.keys(titleValues).length > 0 ? titleValues : undefined,
    bodyValues,
    createdAt: row.created_at,
    nextAction: resolveInboxNextAction(kind),
    prefKey: resolveInboxPrefKey(kind),
  };
}

export function mapLocalTradeNotificationToInboxItem(input: {
  id: string;
  tone: NotificationInboxTone;
  title: string;
  body: string;
  createdAt: string;
}): NotificationInboxItem {
  const isPriceAlert = input.id.includes('price-alert') || input.id.startsWith('price:');
  const kind: NotificationInboxKind = isPriceAlert ? 'price_alert' : 'trade_position';
  const copy = resolveInboxCopyKeys(kind);

  return {
    id: `local:${input.id}`,
    source: 'local',
    kind,
    tab: resolveInboxTabForKind(kind),
    tone: input.tone,
    titleKey: copy.titleKey,
    bodyKey: copy.bodyKey,
    inlineTitle: input.title,
    inlineBody: input.body,
    createdAt: input.createdAt,
    nextAction: resolveInboxNextAction(kind),
    prefKey: resolveInboxPrefKey(kind),
  };
}

export function notificationsCenterHubRoute(): typeof NOTIFICATIONS_CENTER_ROUTE {
  return NOTIFICATIONS_CENTER_ROUTE;
}
