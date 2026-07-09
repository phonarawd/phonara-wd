import { NOTIFICATIONS_INBOX_READ_STORAGE_KEY } from '@/domain/notifications-center-display-contract';

function readStoredIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(NOTIFICATIONS_INBOX_READ_STORAGE_KEY) ?? '[]',
    ) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function persistIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    NOTIFICATIONS_INBOX_READ_STORAGE_KEY,
    JSON.stringify([...ids].slice(0, 500)),
  );
}

export function readNotificationInboxReadIds(): Set<string> {
  return readStoredIds();
}

export function markNotificationInboxRead(id: string): Set<string> {
  const next = readStoredIds();
  next.add(id);
  persistIds(next);
  return next;
}

export function markAllNotificationInboxRead(ids: readonly string[]): Set<string> {
  const next = readStoredIds();
  for (const id of ids) {
    next.add(id);
  }
  persistIds(next);
  return next;
}

export function clearNotificationInboxReadState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(NOTIFICATIONS_INBOX_READ_STORAGE_KEY);
}
