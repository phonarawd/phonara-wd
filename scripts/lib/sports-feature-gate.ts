import { resolveServiceClient } from './sports-engine-client';

export async function readSportsFeatureEnabled(): Promise<boolean> {
  const client = resolveServiceClient();
  const { data, error } = await client
    .from('app_config')
    .select('value')
    .eq('key', 'feature_sports_enabled')
    .maybeSingle();

  if (error) {
    throw new Error(`[sports-feature-gate] read failed: ${error.message}`);
  }

  const row = data as { value?: string } | null;
  return row?.value === 'true';
}
