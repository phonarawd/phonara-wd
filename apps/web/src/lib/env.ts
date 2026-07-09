import { z } from 'zod';

// Fail-closed client environment validation. If any required value is missing or
// malformed — or if a service_role key is ever pasted into the anon slot — the
// app throws at module load instead of silently booting with a broken/unsafe
// Supabase client.

function looksLikeServiceRoleKey(key: string): boolean {
  // Legacy Supabase keys are JWTs: header.payload.signature (base64url).
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
  VITE_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
});

function isTestEnv(): boolean {
  return (
    import.meta.env['VITEST'] === true ||
    import.meta.env['VITEST'] === 'true' ||
    import.meta.env.MODE === 'test'
  );
}

function isE2eEngineEnv(): boolean {
  return import.meta.env['VITE_PHONARA_E2E_ENGINE'] === '1';
}

function loadEnv() {
  const raw = {
    VITE_SUPABASE_URL: import.meta.env['VITE_SUPABASE_URL'] as string | undefined,
    VITE_SUPABASE_ANON_KEY: import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined,
    VITE_VAPID_PUBLIC_KEY: import.meta.env['VITE_VAPID_PUBLIC_KEY'] as string | undefined,
  };

  const input =
    isTestEnv() || isE2eEngineEnv()
      ? {
          VITE_SUPABASE_URL: raw.VITE_SUPABASE_URL ?? TEST_ENV_DEFAULTS.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY:
            raw.VITE_SUPABASE_ANON_KEY ?? TEST_ENV_DEFAULTS.VITE_SUPABASE_ANON_KEY,
          VITE_VAPID_PUBLIC_KEY: raw.VITE_VAPID_PUBLIC_KEY,
        }
      : raw;

  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid client environment configuration — ${detail}`);
  }
  return parsed.data;
}

export const env = loadEnv();
