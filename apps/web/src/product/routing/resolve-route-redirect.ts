import {
  LEGACY_TRADE_SECTION_REDIRECTS,
  ROUTE_REDIRECT_RULES,
  type RouteRedirectRule,
  type RouteRedirectSearch,
} from './route-redirect-registry';

export type RouteRedirectTarget = {
  pathname: string;
  search?: RouteRedirectSearch;
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return pathname || '/';
  const withoutTrailing = pathname.replace(/\/+$/, '');
  return withoutTrailing.length === 0 ? '/' : withoutTrailing;
}

function parseSearchRecord(search: string | RouteRedirectSearch | undefined): RouteRedirectSearch {
  if (!search) return {};
  if (typeof search !== 'string') return { ...search };

  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw) return {};

  const params = new URLSearchParams(raw);
  const record: RouteRedirectSearch = {};
  for (const [key, value] of params.entries()) {
    record[key] = value;
  }
  return record;
}

function serializeSearch(search: RouteRedirectSearch | undefined): string {
  if (!search) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function formatRedirectHref(target: RouteRedirectTarget): string {
  return `${target.pathname}${serializeSearch(target.search)}`;
}

function resolveQueryRule(
  pathname: string,
  search: RouteRedirectSearch,
  rule: Extract<RouteRedirectRule, { kind: 'query' }>,
): RouteRedirectTarget | null {
  if (pathname !== rule.pathname) return null;
  if (search[rule.param] !== rule.value) return null;

  const nextSearch = { ...search };
  delete nextSearch[rule.param];
  return {
    pathname: rule.to,
    search: Object.keys(nextSearch).length > 0 ? nextSearch : undefined,
  };
}

function resolveExactRule(
  pathname: string,
  rule: Extract<RouteRedirectRule, { kind: 'exact' }>,
): RouteRedirectTarget | null {
  if (pathname !== rule.from) return null;
  return {
    pathname: rule.to,
    search: rule.search,
  };
}

function resolvePrefixRule(
  pathname: string,
  rule: Extract<RouteRedirectRule, { kind: 'prefix' }>,
): RouteRedirectTarget | null {
  if (!pathname.startsWith(rule.fromPrefix)) return null;
  const suffix = pathname.slice(rule.fromPrefix.length);
  return {
    pathname: `${rule.toPrefix}${suffix}`,
  };
}

/** Strip legacy `?section=trade` on canonical `/trade` (Bet hub history). */
function resolveLegacyTradeSectionStrip(
  pathname: string,
  search: RouteRedirectSearch,
): RouteRedirectTarget | null {
  if (pathname !== '/trade') return null;
  const section = search['section'];
  if (section !== 'trade') return null;

  const nextSearch = { ...search };
  delete nextSearch['section'];
  return {
    pathname: '/trade',
    search: Object.keys(nextSearch).length > 0 ? nextSearch : undefined,
  };
}

/**
 * Resolve §12.17 redirect target for a pathname + search.
 * Returns null when the URL is already canonical (no redirect).
 */
export function resolveRouteRedirect(
  pathname: string,
  search?: string | RouteRedirectSearch,
): RouteRedirectTarget | null {
  const normalizedPath = normalizePathname(pathname);
  const searchRecord = parseSearchRecord(search);

  for (const rule of ROUTE_REDIRECT_RULES) {
    if (rule.kind === 'query') {
      const target = resolveQueryRule(normalizedPath, searchRecord, rule);
      if (target) return target;
    }
  }

  const legacyStrip = resolveLegacyTradeSectionStrip(normalizedPath, searchRecord);
  if (legacyStrip) return legacyStrip;

  for (const rule of ROUTE_REDIRECT_RULES) {
    if (rule.kind === 'exact') {
      const target = resolveExactRule(normalizedPath, rule);
      if (target) return target;
    }
  }

  for (const rule of ROUTE_REDIRECT_RULES) {
    if (rule.kind === 'prefix') {
      const target = resolvePrefixRule(normalizedPath, rule);
      if (target) return target;
    }
  }

  return null;
}

/** True when `/trade` carries a forbidden legacy Bet hub section deeplink. */
export function isForbiddenTradeSectionSearch(
  pathname: string,
  search?: string | RouteRedirectSearch,
): boolean {
  if (normalizePathname(pathname) !== '/trade') return false;
  const section = parseSearchRecord(search)['section'];
  return section != null && section in LEGACY_TRADE_SECTION_REDIRECTS;
}

/** True when pathname is a §12.17 redirect-only alias (not a canonical hub). */
export function isRedirectOnlyPath(pathname: string): boolean {
  return resolveRouteRedirect(pathname) != null;
}
