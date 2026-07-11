import type { OpsTelegramDispatchPayload } from './ops-telegram-dispatch.ts';
import { formatOpsTelegramMessage } from './ops-telegram-dispatch.ts';

export interface OpsNtfyConfig {
  server: string;
  topic: string;
  token?: string;
  /** Absolute Admin URL for ntfy Click → pending work queue. */
  clickUrl?: string;
}

const DEFAULT_NTFY_SERVER = 'https://ntfy.sh';

export function normalizeNtfyServer(server: string | undefined): string {
  const trimmed = server?.trim() ?? DEFAULT_NTFY_SERVER;
  return trimmed.replace(/\/+$/, '');
}

export function buildNtfyPublishUrl(server: string, topic: string): string {
  const base = normalizeNtfyServer(server);
  const encodedTopic = encodeURIComponent(topic.trim());
  return `${base}/${encodedTopic}`;
}

export function ntfyPriorityForSeverity(severity: string | undefined): string {
  return severity === 'critical' ? '5' : '3';
}

export function ntfyTagsForPayload(payload: OpsTelegramDispatchPayload): string {
  const tags = ['phonara', payload.notify_kind === 'digest' ? 'digest' : 'alert'];
  if (payload.severity === 'critical') tags.push('rotating_light');
  else tags.push('warning');
  return tags.join(',');
}

export function readOpsNtfyConfigFromEnv(env: Pick<typeof Deno.env, 'get'>): OpsNtfyConfig | null {
  const topic = env.get('OPS_NTFY_TOPIC')?.trim();
  if (!topic) return null;
  const adminPublicUrl = env.get('OPS_ADMIN_PUBLIC_URL')?.trim();
  let clickUrl: string | undefined;
  if (adminPublicUrl) {
    try {
      clickUrl = new URL('/queues', adminPublicUrl.endsWith('/') ? adminPublicUrl : `${adminPublicUrl}/`)
        .href;
    } catch {
      clickUrl = undefined;
    }
  }
  return {
    server: normalizeNtfyServer(env.get('OPS_NTFY_SERVER') ?? undefined),
    topic,
    token: env.get('OPS_NTFY_TOKEN')?.trim() || undefined,
    clickUrl,
  };
}

export async function sendOpsNtfyMessage(
  config: OpsNtfyConfig,
  payload: OpsTelegramDispatchPayload,
): Promise<{ ok: boolean; status: number }> {
  const message = formatOpsTelegramMessage(payload);
  const kind = payload.notify_kind === 'digest' ? 'DIGEST' : 'ALERT';
  const title = `[PHONARA ${kind}] ${String(payload.severity ?? 'critical').toUpperCase()}`;

  const headers: Record<string, string> = {
    Title: title,
    Priority: ntfyPriorityForSeverity(payload.severity),
    Tags: ntfyTagsForPayload(payload),
  };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  if (config.clickUrl) {
    headers.Click = config.clickUrl;
  }

  const res = await fetch(buildNtfyPublishUrl(config.server, config.topic), {
    method: 'POST',
    headers,
    body: message,
  });
  return { ok: res.ok, status: res.status };
}
