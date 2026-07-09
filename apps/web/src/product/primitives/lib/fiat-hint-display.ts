/**
 * FiatHint presentation helpers — §13.1.4.3 · Fiat#5 primitive layer.
 * Domain conversion stays in `toFiatHint`; this module formats tooltip timestamps only.
 */

export function formatFiatHintAsOfTime(
  capturedAt: string | null | undefined,
  locale: string,
): string | null {
  if (!capturedAt) return null;
  const ms = Date.parse(capturedAt);
  if (!Number.isFinite(ms)) return null;

  const language = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}
