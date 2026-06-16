import { spawnSync } from 'node:child_process';

const LOCKED_REF = 'yocjhjsdwoijfdrehzoq';

interface Lint {
  name: string;
  title?: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  detail?: string;
}

export interface RemoteProdLayer {
  projectRef: string;
  skipped: boolean;
  reason?: string;
  migrationListOk?: boolean;
  migrationListTail?: string[];
  migrationParity?: boolean;
  migrationListError?: string;
  securityAdvisorErrors?: number;
  performanceAdvisorErrors?: number;
  authUsers?: number;
  reconciliationOk?: boolean;
  reconciliationDetail?: string;
  reconciliationRaw?: unknown;
  opsHealth?: unknown;
  projectHealth?: unknown;
}

async function managementQuery(token: string, sql: string): Promise<{ ok: boolean; data: unknown; error: string }> {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${LOCKED_REF}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, data: null, error: `${res.status} ${text}` };
    }
    try {
      return { ok: true, data: JSON.parse(text), error: '' };
    } catch {
      return { ok: true, data: text, error: '' };
    }
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchAdvisor(token: string, type: 'security' | 'performance'): Promise<number> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${LOCKED_REF}/advisors/${type}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) return -1;
  const data = (await res.json()) as { lints?: Lint[]; result?: { lints?: Lint[] } };
  const lints = data.lints ?? data.result?.lints ?? [];
  return lints.filter((l) => l.level === 'ERROR').length;
}

async function fetchRemoteMigrations(token: string): Promise<{ ok: boolean; tail: string[]; parity: boolean; error: string }> {
  const migCli = spawnSync('supabase', ['migration', 'list', '--linked'], {
    encoding: 'utf8',
    cwd: process.cwd(),
    shell: process.platform === 'win32',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });
  if (migCli.status === 0) {
    const lines = (migCli.stdout ?? '').trim().split(/\r?\n/).filter(Boolean);
    return {
      ok: true,
      tail: lines.slice(-8),
      parity: (migCli.stdout ?? '').includes('20260615000098'),
      error: '',
    };
  }

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${LOCKED_REF}/database/migrations`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, tail: [], parity: false, error: `${res.status} ${await res.text()}` };
    }
    const data = (await res.json()) as Array<{ version?: string; name?: string }>;
    const versions = data.map((m) => m.version ?? m.name ?? '').filter(Boolean);
    return {
      ok: true,
      tail: versions.slice(-8),
      parity: versions.some((v) => v.includes('20260615000098')),
      error: '',
    };
  } catch (error) {
    return {
      ok: false,
      tail: [],
      parity: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function collectRemoteProdLayer(token: string | undefined): Promise<RemoteProdLayer> {
  if (!token?.trim()) {
    return { projectRef: LOCKED_REF, skipped: true, reason: 'SUPABASE_ACCESS_TOKEN absent' };
  }

  const out: RemoteProdLayer = { projectRef: LOCKED_REF, skipped: false };

  const mig = await fetchRemoteMigrations(token);
  out.migrationListOk = mig.ok;
  out.migrationListTail = mig.tail;
  out.migrationParity = mig.parity;
  if (!mig.ok) out.migrationListError = mig.error;

  try {
    out.securityAdvisorErrors = await fetchAdvisor(token, 'security');
    out.performanceAdvisorErrors = await fetchAdvisor(token, 'performance');
  } catch (error) {
    out.migrationListError = `${out.migrationListError ?? ''} advisor: ${error instanceof Error ? error.message : String(error)}`.trim();
  }

  try {
    const healthRes = await fetch(`https://api.supabase.com/v1/projects/${LOCKED_REF}/health`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (healthRes.ok) out.projectHealth = await healthRes.json();
  } catch {
    /* optional */
  }

  const authUsers = await managementQuery(token, 'SELECT count(*)::int AS auth_users FROM auth.users');
  if (authUsers.ok && Array.isArray(authUsers.data) && authUsers.data[0]) {
    out.authUsers = Number((authUsers.data[0] as { auth_users?: number }).auth_users ?? NaN);
  }

  const recon = await managementQuery(token, 'SELECT rpc_run_reconciliation() AS result');
  if (recon.ok) {
    out.reconciliationRaw = recon.data;
    const row = Array.isArray(recon.data) ? recon.data[0] : recon.data;
    const payload = row && typeof row === 'object' && 'result' in row ? (row as { result: unknown }).result : row;
    const parsed =
      typeof payload === 'string'
        ? (JSON.parse(payload) as { ok?: boolean; mismatch?: boolean })
        : (payload as { ok?: boolean; mismatch?: boolean });
    out.reconciliationOk = parsed?.ok === true && parsed?.mismatch !== true;
    out.reconciliationDetail = out.reconciliationOk
      ? 'rpc_run_reconciliation ok=true mismatch=false'
      : JSON.stringify(parsed).slice(0, 500);
  } else {
    out.reconciliationDetail = recon.error;
    out.reconciliationOk = false;
  }

  const ops = await managementQuery(token, 'SELECT rpc_ops_health_summary() AS summary LIMIT 1');
  if (ops.ok) out.opsHealth = ops.data;

  return out;
}
