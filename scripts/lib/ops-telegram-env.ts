/** Ops Telegram pager — `.env` → Supabase Edge secrets (ops-notify). */

export const OPS_TELEGRAM_ENV_KEYS = [
  'OPS_TELEGRAM_BOT_TOKEN',
  'OPS_TELEGRAM_CHAT_ID',
  'OPS_TELEGRAM_WEBHOOK_URL',
  'OPS_TELEGRAM_WEBHOOK_HMAC_SECRET',
  'OPS_TELEGRAM_FALLBACK_URL',
  'OPS_TELEGRAM_FALLBACK_HMAC_SECRET',
] as const;

export type OpsTelegramEnvKey = (typeof OPS_TELEGRAM_ENV_KEYS)[number];

const REQUIRED_KEYS: OpsTelegramEnvKey[] = ['OPS_TELEGRAM_BOT_TOKEN', 'OPS_TELEGRAM_CHAT_ID'];

const PLACEHOLDER_RE = /^(YOUR_VALUE_HERE|changeme|xxx|replace_me|todo|<.*>|your_.*_here)$/i;

export function isPlaceholderEnvValue(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return true;
  return PLACEHOLDER_RE.test(trimmed);
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}

export function readOpsTelegramEnv(
  env: NodeJS.ProcessEnv = process.env,
): Partial<Record<OpsTelegramEnvKey, string>> {
  const out: Partial<Record<OpsTelegramEnvKey, string>> = {};
  for (const key of OPS_TELEGRAM_ENV_KEYS) {
    const raw = env[key]?.trim();
    if (!raw || isPlaceholderEnvValue(raw)) continue;
    out[key] = raw;
  }
  return out;
}

export function validateOpsTelegramEnv(
  env: NodeJS.ProcessEnv = process.env,
):
  | { ok: true; secrets: Partial<Record<OpsTelegramEnvKey, string>> }
  | { ok: false; missing: OpsTelegramEnvKey[] } {
  const secrets = readOpsTelegramEnv(env);
  const missing = REQUIRED_KEYS.filter((key) => !secrets[key]);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, secrets };
}

export function formatSupabaseSecretArgs(
  secrets: Partial<Record<OpsTelegramEnvKey, string>>,
): string[] {
  return Object.entries(secrets).map(([key, value]) => `${key}=${value}`);
}
