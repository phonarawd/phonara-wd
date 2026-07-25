import { loadRepoEnvFiles } from './lib/load-repo-env';
import { looksLikeServiceRoleJwt } from './lib/secrets-deploy-deny';

loadRepoEnvFiles();

const requiredClientEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

const missing = requiredClientEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(`Missing local env values: ${missing.join(', ')}`);
  console.warn('Create .env from .env.example before running the app against Supabase.');
}

function viteKeyExposesServiceRole(key: string): boolean {
  return key.startsWith('VITE_') && key.toUpperCase().includes('SERVICE_ROLE');
}

for (const [key, value] of Object.entries(process.env)) {
  if (viteKeyExposesServiceRole(key)) {
    throw new Error(
      'Service role keys must never be exposed through VITE_ env values ' +
        `(forbidden key: ${key}).`,
    );
  }

  if (
    key.startsWith('VITE_') &&
    typeof value === 'string' &&
    value.length > 0 &&
    looksLikeServiceRoleJwt(value)
  ) {
    throw new Error(
      `VITE_ env value must not be a service_role JWT (server-only secret): ${key}`,
    );
  }
}
