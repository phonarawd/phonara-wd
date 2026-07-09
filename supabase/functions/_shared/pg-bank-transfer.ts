export interface PgBankTransferItem {
  transfer_id: string;
  amount_krw: string;
  depositor_name: string;
  reference_code: string;
}

export type PgBankBatchSource = 'pg_webhook' | 'pg_batch';

const REQUIRED_KEYS = ['transfer_id', 'amount_krw', 'depositor_name', 'reference_code'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePgBankTransferItem(raw: unknown): PgBankTransferItem | null {
  if (!isRecord(raw)) return null;
  const transfer_id = trimString(raw.transfer_id);
  const amount_krw = trimString(raw.amount_krw);
  const depositor_name = trimString(raw.depositor_name);
  const reference_code = trimString(raw.reference_code);
  if (!transfer_id || !amount_krw || !depositor_name || !reference_code) return null;
  return { transfer_id, amount_krw, depositor_name, reference_code };
}

export function parsePgBankIngestBody(body: unknown):
  | {
      items: PgBankTransferItem[];
      source: PgBankBatchSource;
    }
  | { error: string } {
  if (!isRecord(body)) return { error: 'invalid_body' };

  const sourceRaw = trimString(body.source);
  const source: PgBankBatchSource = sourceRaw === 'pg_batch' ? 'pg_batch' : 'pg_webhook';

  if (Array.isArray(body.transfers)) {
    if (body.transfers.length < 1 || body.transfers.length > 100) {
      return { error: 'invalid_batch_size' };
    }
    const items: PgBankTransferItem[] = [];
    for (const raw of body.transfers) {
      const item = normalizePgBankTransferItem(raw);
      if (!item) return { error: 'invalid_transfer_item' };
      items.push(item);
    }
    return { items, source };
  }

  const single = normalizePgBankTransferItem(body);
  if (!single) {
    const missing = REQUIRED_KEYS.filter((k) => !trimString(body[k]));
    if (missing.length > 0) return { error: 'invalid_transfer_item' };
    return { error: 'invalid_body' };
  }

  return { items: [single], source };
}
