import { formatOpsTelegramMessage } from './ops-telegram-dispatch.ts';

Deno.test('formatOpsTelegramMessage includes severity and runbook', () => {
  const text = formatOpsTelegramMessage({
    notify_kind: 'immediate',
    severity: 'critical',
    summary: 'Ledger drift detected',
    runbook_key: 'reconciliation_mismatch',
    source_check_id: 'reconciliation',
  });
  if (!text.includes('CRITICAL')) throw new Error('missing severity');
  if (!text.includes('Ledger drift detected')) throw new Error('missing summary');
  if (!text.includes('reconciliation_mismatch')) throw new Error('missing runbook');
});

Deno.test('formatOpsTelegramMessage marks digest kind', () => {
  const text = formatOpsTelegramMessage({
    notify_kind: 'digest',
    severity: 'critical',
    summary: 'Open critical alerts',
    runbook_key: 'ops_digest',
  });
  if (!text.includes('DIGEST')) throw new Error('missing digest marker');
});
