import type { MessageKey } from '@phonara/i18n';
import { Badge } from '@phonara/ui';
import { useT } from '../../lib/i18n';

const DIRECTION_KEY: Record<string, MessageKey> = {
  credit: 'ledger.direction.credit',
  debit: 'ledger.direction.debit',
  lock: 'ledger.direction.lock',
  unlock: 'ledger.direction.unlock',
  reverse: 'ledger.direction.reverse',
};

export function DirectionBadge({ direction }: { direction: string }) {
  const t = useT();
  const tone =
    direction === 'credit' || direction === 'unlock'
      ? 'up'
      : direction === 'debit'
        ? 'down'
        : direction === 'lock'
          ? 'warning'
          : 'neutral';
  return <Badge tone={tone}>{t(DIRECTION_KEY[direction] ?? 'ledger.direction.unknown')}</Badge>;
}
