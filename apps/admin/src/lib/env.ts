import { z } from 'zod';

function looksLikeServiceRoleKey(key: string): boolean {
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  const payload = parts[1];
  if (!payload) return false;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { role?: string };
    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

const TEST_ENV_DEFAULTS = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
} as const;

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required')
    .refine(
      (key) => !looksLikeServiceRoleKey(key),
      'VITE_SUPABASE_ANON_KEY must not be a service_role key (server-only secret)',
    ),
});

function isTestEnv(): boolean {
  return (
    import.meta.env['VITEST'] === true ||
    import.meta.env['VITEST'] === 'true' ||
    import.meta.env.MODE === 'test'
  );
}

function loadEnv() {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env['VITE_SUPABASE_URL'] as string | undefined,
    VITE_SUPABASE_ANON_KEY: import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined,
  };

  const input = isTestEnv()
    ? {
        VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL ?? TEST_ENV_DEFAULTS.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY:
          raw.VITE_SUPABASE_ANON_KEY ?? TEST_ENV_DEFAULTS.VITE_SUPABASE_ANON_KEY,
      }
    : raw;

  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid admin environment configuration — ${detail}`);
  }
  return parsed.data;
}

export const env = loadEnv();
