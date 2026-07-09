/** Ops pager secrets — ntfy (free push) and/or Telegram → Supabase Edge `ops-notify`. */

import {
  isPlaceholderEnvValue,
  maskSecret,
  readOpsTelegramEnv,
  OPS_TELEGRAM_ENV_KEYS,
  type OpsTelegramEnvKey,
} from './ops-telegram-env';

export { isPlaceholderEnvValue, maskSecret, OPS_TELEGRAM_ENV_KEYS, type OpsTelegramEnvKey };

export const OPS_NTFY_ENV_KEYS = ['OPS_NTFY_SERVER', 'OPS_NTFY_TOPIC', 'OPS_NTFY_TOKEN'] as const;

export type OpsNtfyEnvKey = (typeof OPS_NTFY_ENV_KEYS)[number];

export type OpsPagerEnvKey = OpsTelegramEnvKey | OpsNtfyEnvKey;

export const OPS_PAGER_ENV_KEYS = [...OPS_NTFY_ENV_KEYS, ...OPS_TELEGRAM_ENV_KEYS] as const;

export function generateOpsNtfyTopic(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `phonara-ops-${hex}`;
}

export function readOpsNtfyEnv(
  env: NodeJS.ProcessEnv = process.env,
): Partial<Record<OpsNtfyEnvKey, string>> {
  const out: Partial<Record<OpsNtfyEnvKey, string>> = {};
  for (const key of OPS_NTFY_ENV_KEYS) {
    const raw = env[key]?.trim();
    if (!raw || isPlaceholderEnvValue(raw)) continue;
    out[key] = raw;
  }
  if (!out.OPS_NTFY_SERVER) {
    out.OPS_NTFY_SERVER = 'https://ntfy.sh';
  }
  return out;
}

export function readOpsPagerEnv(
  env: NodeJS.ProcessEnv = process.env,
): Partial<Record<OpsPagerEnvKey, string>> {
  return { ...readOpsNtfyEnv(env), ...readOpsTelegramEnv(env) };
}

export function hasNtfyPagerConfig(secrets: Partial<Record<OpsPagerEnvKey, string>>): boolean {
  return Boolean(secrets.OPS_NTFY_TOPIC);
}

export function hasTelegramPagerConfig(secrets: Partial<Record<OpsPagerEnvKey, string>>): boolean {
  return Boolean(secrets.OPS_TELEGRAM_BOT_TOKEN && secrets.OPS_TELEGRAM_CHAT_ID);
}

export function validateOpsPagerEnv(env: NodeJS.ProcessEnv = process.env):
  | {
      ok: true;
      secrets: Partial<Record<OpsPagerEnvKey, string>>;
      channel: 'ntfy' | 'telegram' | 'both';
    }
  | { ok: false; reason: 'missing_channel' } {
  const secrets = readOpsPagerEnv(env);
  const ntfy = hasNtfyPagerConfig(secrets);
  const telegram = hasTelegramPagerConfig(secrets);
  if (!ntfy && !telegram) return { ok: false, reason: 'missing_channel' };
  const channel = ntfy && telegram ? 'both' : ntfy ? 'ntfy' : 'telegram';
  return { ok: true, secrets, channel };
}

export function formatSupabaseSecretArgs(
  secrets: Partial<Record<OpsPagerEnvKey, string>>,
): string[] {
  return Object.entries(secrets).map(([key, value]) => `${key}=${value}`);
}

export function ntfySubscribeUrl(secrets: Partial<Record<OpsPagerEnvKey, string>>): string | null {
  const topic = secrets.OPS_NTFY_TOPIC;
  if (!topic) return null;
  const server = (secrets.OPS_NTFY_SERVER ?? 'https://ntfy.sh').replace(/\/+$/, '');
  return `${server}/${encodeURIComponent(topic)}`;
}
