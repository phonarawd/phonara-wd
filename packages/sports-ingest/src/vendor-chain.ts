export const THE_ODDS_API_VENDOR = 'the-odds-api';
export const ODDS_API_IO_VENDOR = 'odds-api-io';
export const SPORTSGAMEODDS_VENDOR = 'sportsgameodds';

export const DEFAULT_VENDOR_PRIORITY: readonly string[] = [
  THE_ODDS_API_VENDOR,
  ODDS_API_IO_VENDOR,
];

export interface VendorCredential {
  readonly vendor: string;
  readonly apiKey: string;
}

export interface ResolveVendorChainInput {
  readonly vendor?: string;
  readonly vendorPriority?: string;
  readonly theOddsApiKey?: string;
  readonly oddsApiIoKey?: string;
  readonly sportsGameOddsKey?: string;
  readonly legacyOddsApiKey?: string;
}

function normalizeVendorId(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === 'the-odds-api.com' || value === 'the_odds_api') return THE_ODDS_API_VENDOR;
  if (value === 'odds-api.io' || value === 'odds_api_io') return ODDS_API_IO_VENDOR;
  if (value === 'sportsgameodds.com' || value === 'sports_game_odds') return SPORTSGAMEODDS_VENDOR;
  return value;
}

function keyForVendor(
  vendor: string,
  keys: { theOdds: string; oddsApiIo: string; sportsGameOdds: string; legacy: string },
): string | undefined {
  if (vendor === THE_ODDS_API_VENDOR) {
    return keys.theOdds || keys.legacy || undefined;
  }
  if (vendor === ODDS_API_IO_VENDOR) {
    return keys.oddsApiIo || undefined;
  }
  if (vendor === SPORTSGAMEODDS_VENDOR) {
    return keys.sportsGameOdds || undefined;
  }
  return undefined;
}

function parsePriority(raw: string | undefined): readonly string[] {
  if (!raw?.trim()) return DEFAULT_VENDOR_PRIORITY;
  const parsed = raw
    .split(',')
    .map((part) => normalizeVendorId(part))
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_VENDOR_PRIORITY;
}

function isAutoVendorMode(vendor: string | undefined): boolean {
  if (!vendor?.trim()) return true;
  const normalized = normalizeVendorId(vendor);
  return normalized === 'auto' || normalized === 'failover';
}

/**
 * Resolves ingest vendor order from env.
 * - `SPORTS_ODDS_VENDOR=auto` (or unset + any keys): try each vendor that has a key.
 * - `SPORTS_ODDS_VENDOR=the-odds-api`: single vendor only.
 * - Priority: `SPORTS_ODDS_VENDOR_PRIORITY=the-odds-api,odds-api-io`
 */
export function resolveVendorChain(input: ResolveVendorChainInput): readonly VendorCredential[] {
  const keys = {
    theOdds: input.theOddsApiKey?.trim() ?? '',
    oddsApiIo: input.oddsApiIoKey?.trim() ?? '',
    sportsGameOdds: input.sportsGameOddsKey?.trim() ?? '',
    legacy: input.legacyOddsApiKey?.trim() ?? '',
  };

  const priority = parsePriority(input.vendorPriority);

  if (!isAutoVendorMode(input.vendor)) {
    const vendor = normalizeVendorId(input.vendor!);
    const apiKey = keyForVendor(vendor, keys);
    if (!apiKey) {
      throw new Error(`[sports-ingest] no API key configured for vendor "${vendor}"`);
    }
    return [{ vendor, apiKey }];
  }

  const chain: VendorCredential[] = [];
  for (const vendor of priority) {
    const apiKey = keyForVendor(vendor, keys);
    if (apiKey) chain.push({ vendor, apiKey });
  }

  if (chain.length === 0) {
    throw new Error(
      '[sports-ingest] auto vendor mode requires THE_ODDS_API_KEY, ODDS_API_IO_KEY, and/or SPORTSGAMEODDS_API_KEY (server-only, never VITE_*)',
    );
  }

  return chain;
}

export function isVendorQuotaExhausted(
  vendor: string,
  requestsRemaining: string | undefined,
): boolean {
  if (vendor !== THE_ODDS_API_VENDOR || requestsRemaining === undefined) return false;
  const remaining = Number(requestsRemaining);
  return Number.isFinite(remaining) && remaining <= 0;
}
