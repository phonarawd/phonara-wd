#!/usr/bin/env tsx
/**
 * Cursor hook: deny reading real secret files (.env, credentials, key material).
 * Allows .env.example and template paths.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function deny(reason: string): never {
  process.stdout.write(
    JSON.stringify({
      permission: 'deny' as const,
      user_message: `Secret file read blocked: ${reason}`,
      agent_message: reason,
    }) + '\n',
  );
  process.exit(2);
}

function allow(): never {
  process.stdout.write('{ "permission": "allow" }\n');
  process.exit(0);
}

const BLOCKED_BASENAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.dev.vars',
  'credentials.json',
  '.auth.json',
  '.admin-auth.json',
  '.env.secrets',
]);

const BLOCKED_SUFFIXES = ['.pem', '.key', '.p12', '.pfx'];

const ALLOWED_PATTERNS = [
  /\.env\.example$/i,
  /\.env\.template$/i,
  /\.env\.sample$/i,
  /\.key\.example$/i,
];

const raw = readStdin();
let filePath = '';
if (raw.trim()) {
  try {
    const input = JSON.parse(raw) as Record<string, unknown>;
    filePath =
      typeof input['file_path'] === 'string'
        ? input['file_path']
        : typeof input['path'] === 'string'
          ? input['path']
          : typeof input['filePath'] === 'string'
            ? input['filePath']
            : '';
  } catch {
    deny('invalid hook JSON');
  }
}

if (!filePath) allow();

const normalized = filePath.replace(/\\/g, '/');
const base = path.basename(normalized);

for (const pattern of ALLOWED_PATTERNS) {
  if (pattern.test(normalized) || pattern.test(base)) allow();
}

if (BLOCKED_BASENAMES.has(base)) {
  deny(`Reading ${base} is blocked — use .env.example for structure; secrets are operator-managed`);
}

if (base.startsWith('.env.') && !base.endsWith('.example')) {
  deny(`Reading ${base} is blocked — local env files may contain secrets`);
}

// setup/.env.secrets (basename already covered; path guard for clarity)
if (
  normalized.endsWith('/setup/.env.secrets') ||
  normalized === 'setup/.env.secrets' ||
  normalized.endsWith('setup/.env.secrets')
) {
  deny('Reading setup/.env.secrets is blocked — operator-managed PAT vault');
}

// *credentials*.json (e.g. .local-admin-dev.credentials.json)
if (base.toLowerCase().endsWith('.json') && /credentials/i.test(base)) {
  deny(`Reading ${base} is blocked — local credentials files must not be loaded by agents`);
}

// E2E ephemeral auth tokens
if (
  normalized.includes('/tests/e2e/') &&
  (base === '.auth.json' || base === '.admin-auth.json' || /\.auth.*\.json$/i.test(base))
) {
  deny(`Reading ${base} is blocked — E2E auth tokens are ephemeral session residue`);
}

for (const suffix of BLOCKED_SUFFIXES) {
  if (base.endsWith(suffix)) {
    deny(`Reading key material (${base}) is blocked`);
  }
}

if (/\/\.cursor\/mcp\.json$/i.test(normalized) && normalized.includes('credentials')) {
  deny('Reading MCP credentials path is blocked');
}

allow();
