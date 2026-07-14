/**
 * Temporarily allow Google/Naver ownership verification through Cloudflare Bot Fight.
 *
 * Needs a Cloudflare API token with:
 *   Zone → Zone Settings → Edit
 *   Zone → Firewall Services → Edit
 *   Zone → Cache Purge → Purge
 * Scope: phonara.net only
 *
 * Usage:
 *   1) Create token: https://dash.cloudflare.com/profile/api-tokens
 *      Template "Edit zone DNS" is NOT enough — use Custom token with settings above
 *   2) Put in .env: CLOUDFLARE_API_TOKEN=...
 *   3) bun run cf:allow-search-verification
 *
 * After Google + Naver verify succeed, optionally re-enable Bot Fight in Dashboard.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ZONE_NAME = 'phonara.net';
const ACCOUNT_HINT = '46420ec935f9f8257a61bf1ed1984322';

function loadEnvToken(): string {
  const fromEnv = process.env['CLOUDFLARE_API_TOKEN']?.trim();
  if (fromEnv) return fromEnv;

  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN (and no .env)');
  }
  const text = readFileSync(envPath, 'utf8');
  const match = text.match(/^CLOUDFLARE_API_TOKEN=(.+)$/m);
  const value = match?.[1]?.trim().replace(/^["']|["']$/g, '');
  if (!value) {
    throw new Error(
      'Add CLOUDFLARE_API_TOKEN to .env then re-run. Dashboard shortcut: Security → Bots → Bot Fight Mode Off',
    );
  }
  return value;
}

async function cfFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok && json['success'] === true, status: res.status, json };
}

async function main(): Promise<void> {
  const token = loadEnvToken();
  process.stdout.write(`[cf:search] account hint ${ACCOUNT_HINT}\n`);

  const zones = await cfFetch(token, `/zones?name=${ZONE_NAME}`);
  const zoneList = zones.json['result'] as Array<{ id?: string }> | undefined;
  const zoneId = zoneList?.[0]?.id;
  if (!zoneId) {
    process.stderr.write(`[cf:search] zone ${ZONE_NAME} not found / token lacks Zone Read\n`);
    process.stderr.write(`${JSON.stringify(zones.json)}\n`);
    process.exit(1);
  }
  process.stdout.write(`[cf:search] zone=${zoneId}\n`);

  for (const [id, value] of [
    ['bot_fight_mode', 'off'],
    ['browser_check', 'off'],
    ['security_level', 'medium'],
  ] as const) {
    const patch = await cfFetch(token, `/zones/${zoneId}/settings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
    if (patch.ok) {
      process.stdout.write(`[cf:search] ${id}=${value}\n`);
    } else {
      process.stderr.write(
        `[cf:search] ${id} failed (${patch.status}): ${JSON.stringify(patch.json)}\n`,
      );
    }
  }

  // Skip WAF/bot fight for ownership HTML files (Ruleset custom firewall)
  const entry = await cfFetch(
    token,
    `/zones/${zoneId}/rulesets/phases/http_request_firewall_custom/entrypoint`,
  );
  const description = 'PHONARA allow Search Console / Naver ownership HTML';
  const expression =
    '(starts_with(http.request.uri.path, "/google") and ends_with(http.request.uri.path, ".html")) or (starts_with(http.request.uri.path, "/naver") and ends_with(http.request.uri.path, ".html"))';
  const rule = {
    action: 'skip',
    action_parameters: {
      products: ['bic', 'hot', 'securityLevel', 'uaBlock', 'waf', 'zoneLockdown'],
      phases: ['http_request_firewall_managed'],
    },
    description,
    enabled: true,
    expression,
  };

  if (entry.ok && entry.json['result'] && typeof entry.json['result'] === 'object') {
    const result = entry.json['result'] as {
      id?: string;
      rules?: Array<{ id?: string; description?: string }>;
    };
    const existing = result.rules?.find((r) => r.description === description);
    if (existing?.id && result.id) {
      const upd = await cfFetch(
        token,
        `/zones/${zoneId}/rulesets/${result.id}/rules/${existing.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(rule),
        },
      );
      process.stdout.write(
        upd.ok
          ? `[cf:search] updated skip rule ${existing.id}\n`
          : `[cf:search] update skip rule failed: ${JSON.stringify(upd.json)}\n`,
      );
    } else if (result.id) {
      const add = await cfFetch(token, `/zones/${zoneId}/rulesets/${result.id}/rules`, {
        method: 'POST',
        body: JSON.stringify(rule),
      });
      process.stdout.write(
        add.ok
          ? `[cf:search] created skip rule\n`
          : `[cf:search] create skip rule failed: ${JSON.stringify(add.json)}\n`,
      );
    }
  } else {
    // Create entrypoint ruleset with the skip rule
    const create = await cfFetch(token, `/zones/${zoneId}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'PHONARA custom firewall',
        kind: 'zone',
        phase: 'http_request_firewall_custom',
        rules: [rule],
      }),
    });
    process.stdout.write(
      create.ok
        ? `[cf:search] created custom firewall ruleset with skip rule\n`
        : `[cf:search] ruleset create failed: ${JSON.stringify(create.json)}\n`,
    );
  }

  const purge = await cfFetch(token, `/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body: JSON.stringify({
      files: [
        'https://phonara.net/googleb262cce23bd3d508.html',
        'https://phonara.net/naverba24284efb230dee9f04ad79fee9a841.html',
        'https://phonara.net/',
        'https://www.phonara.net/googleb262cce23bd3d508.html',
        'https://www.phonara.net/naverba24284efb230dee9f04ad79fee9a841.html',
      ],
    }),
  });
  process.stdout.write(
    purge.ok
      ? '[cf:search] cache purged for verification URLs\n'
      : `[cf:search] purge failed: ${JSON.stringify(purge.json)}\n`,
  );

  process.stdout.write(
    '[cf:search] DONE — retry Naver/Google 소유확인 now.\n' +
      '  Check: https://phonara.net/naverba24284efb230dee9f04ad79fee9a841.html\n',
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
