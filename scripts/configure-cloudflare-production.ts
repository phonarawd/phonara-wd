import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ACCOUNT_ID = '46420ec935f9f8257a61bf1ed1984322';
const PROJECT_NAME = 'phonara-web';
const DOMAINS = ['phonara.net', 'www.phonara.net'] as const;

function readWranglerOAuthToken(): string {
  const candidates = [
    join(homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml'),
    join(homedir(), '.wrangler', 'config', 'default.toml'),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    const match = text.match(/^oauth_token\s*=\s*"([^"]+)"/m);
    if (match?.[1]) return match[1];
  }
  throw new Error('Wrangler OAuth token not found. Run: bunx wrangler login');
}

async function cfFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function main(): Promise<void> {
  const token = readWranglerOAuthToken();

  for (const name of DOMAINS) {
    const existing = await cfFetch(
      token,
      `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`,
    );
    const list = existing.json as { result?: Array<{ name?: string }> };
    const already = list.result?.some((row) => row.name === name);
    if (already) {
      process.stdout.write(`[cf:pages] domain already linked: ${name}\n`);
      continue;
    }

    const add = await cfFetch(
      token,
      `/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains`,
      { method: 'POST', body: JSON.stringify({ name }) },
    );
    if (!add.ok) {
      process.stderr.write(
        `[cf:pages] add ${name} failed (${add.status}): ${JSON.stringify(add.json)}\n`,
      );
      continue;
    }
    process.stdout.write(`[cf:pages] linked domain: ${name}\n`);
  }

  const zones = await cfFetch(token, `/zones?name=phonara.net`);
  const zoneResult = (zones.json as { result?: Array<{ id?: string; status?: string }> })
    .result?.[0];
  if (!zoneResult?.id) {
    process.stderr.write('[cf:zone] phonara.net zone not found in this Cloudflare account\n');
    return;
  }

  process.stdout.write(
    `[cf:zone] phonara.net zone=${zoneResult.id} status=${zoneResult.status ?? '—'}\n`,
  );

  const settings: Array<{ id: string; value: string }> = [
    { id: 'ssl', value: 'strict' },
    { id: 'always_use_https', value: 'on' },
    { id: 'security_level', value: 'high' },
    { id: 'browser_check', value: 'on' },
  ];

  for (const setting of settings) {
    const patch = await cfFetch(token, `/zones/${zoneResult.id}/settings/${setting.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value: setting.value }),
    });
    if (patch.ok) {
      process.stdout.write(`[cf:zone] ${setting.id}=${setting.value}\n`);
    } else {
      process.stderr.write(
        `[cf:zone] ${setting.id} patch failed (${patch.status}) — enable in Dashboard if needed\n`,
      );
    }
  }
}

void main();
