/**
 * `/support/ticket` — user support ticket intake + history (E9 engine · E10 UI).
 */

import type { MessageKey } from '@phonara/i18n';

import {
  EW_E9_CREATE_SUPPORT_TICKET_RPC,
  EW_E9_LIST_SUPPORT_TICKETS_RPC,
} from './ew-e9-identity-support-display-contract';
import {
  SUPPORT_TICKET_ROUTE,
  SUPPORT_TICKET_SEO_DESCRIPTION_KEY,
  SUPPORT_TICKET_SEO_TITLE_KEY,
  isSupportTicketHubLive,
} from './support-hub-display-contract';

export const SUPPORT_TICKET_CREATE_RPC = EW_E9_CREATE_SUPPORT_TICKET_RPC;
export const SUPPORT_TICKET_LIST_RPC = EW_E9_LIST_SUPPORT_TICKETS_RPC;
export const SUPPORT_TICKET_UI_UNLOCK_TODO = 'ew-e10-trust-support-ui' as const;

export const SUPPORT_TICKET_CATEGORIES = [
  'account',
  'wallet',
  'trade',
  'sports',
  'casino',
  'earn',
  'other',
] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export const SUPPORT_TICKET_CATEGORY_KEYS = {
  account: 'support.ticket.category.account',
  wallet: 'support.ticket.category.wallet',
  trade: 'support.ticket.category.trade',
  sports: 'support.ticket.category.sports',
  casino: 'support.ticket.category.casino',
  earn: 'support.ticket.category.earn',
  other: 'support.ticket.category.other',
} as const satisfies Record<SupportTicketCategory, MessageKey>;

export const SUPPORT_TICKET_STATUS_KEYS = {
  open: 'support.ticket.status.open',
  in_progress: 'support.ticket.status.in_progress',
  resolved: 'support.ticket.status.resolved',
  closed: 'support.ticket.status.closed',
} as const satisfies Record<string, MessageKey>;

export const SUPPORT_TICKET_ERROR_KEY = 'support.ticket.error' as const satisfies MessageKey;

export type SupportTicketRowView = {
  id: string;
  category: SupportTicketCategory;
  subject: string;
  status: keyof typeof SUPPORT_TICKET_STATUS_KEYS;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SupportTicketCreateResult = {
  ticketId: string;
  status: string;
  idempotent: boolean;
};

export { SUPPORT_TICKET_ROUTE, SUPPORT_TICKET_SEO_TITLE_KEY, SUPPORT_TICKET_SEO_DESCRIPTION_KEY };

export function isSupportTicketCategory(
  value: string | null | undefined,
): value is SupportTicketCategory {
  return (SUPPORT_TICKET_CATEGORIES as readonly string[]).includes(value ?? '');
}

export function canSubmitSupportTicket(): boolean {
  return (
    isSupportTicketHubLive() &&
    SUPPORT_TICKET_CREATE_RPC === 'rpc_create_support_ticket' &&
    SUPPORT_TICKET_LIST_RPC === 'rpc_list_support_tickets'
  );
}

function parseTicketRow(raw: unknown): SupportTicketRowView | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row['id'] === 'string' ? row['id'] : '';
  const categoryRaw = typeof row['category'] === 'string' ? row['category'] : '';
  const subject = typeof row['subject'] === 'string' ? row['subject'] : '';
  const statusRaw = typeof row['status'] === 'string' ? row['status'] : 'open';
  if (!id || !isSupportTicketCategory(categoryRaw) || !subject.trim()) return null;
  const status = statusRaw in SUPPORT_TICKET_STATUS_KEYS ? statusRaw : 'open';
  return {
    id,
    category: categoryRaw,
    subject: subject.trim(),
    status: status as keyof typeof SUPPORT_TICKET_STATUS_KEYS,
    createdAt: typeof row['created_at'] === 'string' ? row['created_at'] : null,
    updatedAt: typeof row['updated_at'] === 'string' ? row['updated_at'] : null,
  };
}

export function parseSupportTicketList(raw: unknown): SupportTicketRowView[] {
  if (!raw || typeof raw !== 'object') return [];
  const payload = raw as Record<string, unknown>;
  if (payload['ok'] === false) return [];
  const ticketsRaw = Array.isArray(payload['tickets']) ? payload['tickets'] : [];
  const rows: SupportTicketRowView[] = [];
  for (const item of ticketsRaw) {
    const parsed = parseTicketRow(item);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

export function parseSupportTicketCreate(raw: unknown): SupportTicketCreateResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload['ok'] === false) return null;
  const ticketId = typeof payload['ticket_id'] === 'string' ? payload['ticket_id'] : '';
  const status = typeof payload['status'] === 'string' ? payload['status'] : 'open';
  if (!ticketId) return null;
  return {
    ticketId,
    status,
    idempotent: payload['idempotent'] === true,
  };
}

export function resolveSupportTicketCategoryKey(category: SupportTicketCategory): MessageKey {
  return SUPPORT_TICKET_CATEGORY_KEYS[category];
}

export function resolveSupportTicketStatusKey(status: string): MessageKey {
  if (status in SUPPORT_TICKET_STATUS_KEYS) {
    return SUPPORT_TICKET_STATUS_KEYS[status as keyof typeof SUPPORT_TICKET_STATUS_KEYS];
  }
  return SUPPORT_TICKET_STATUS_KEYS.open;
}
