/** Shared relative-time formatter for admin desks (no mock hook dependency). */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 1) return 'now';
  if (Math.abs(mins) < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 48) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function formatKrwGrouped(intStr: string): string {
  const neg = intStr.startsWith('-');
  const body = neg ? intStr.slice(1) : intStr;
  const out = body.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}₩${out}`;
}
