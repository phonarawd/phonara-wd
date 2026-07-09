export const BET_SECTIONS = ['casino', 'sports', 'trade'] as const;
export type BetSection = (typeof BET_SECTIONS)[number];

function parseSearchEnum<T extends string>(
  searchStr: string,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const qs = searchStr.startsWith('?') ? searchStr.slice(1) : searchStr;
  const raw = new URLSearchParams(qs).get(key);
  if (raw && (allowed as readonly string[]).includes(raw)) {
    return raw as T;
  }
  return undefined;
}

function buildSearchHref(
  pathname: string,
  searchStr: string,
  updates: Record<string, string | null | undefined>,
): string {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export const BET_HUB_SECTION_STORAGE_KEY = 'phonara-bet-section-v1';

const SECTION_LABEL_KEYS: Record<BetSection, string> = {
  casino: 'bet.section.casino',
  sports: 'bet.section.sports',
  trade: 'bet.section.trade',
};

export const BET_HUB_SECTION_OPTIONS = BET_SECTIONS.map((id) => ({
  id,
  labelKey: SECTION_LABEL_KEYS[id],
}));

export function isBetSection(value: unknown): value is BetSection {
  return value === 'casino' || value === 'sports' || value === 'trade';
}

export function readBetHubSectionStorage(): BetSection | null {
  try {
    const stored = window.localStorage.getItem(BET_HUB_SECTION_STORAGE_KEY);
    return isBetSection(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeBetHubSectionStorage(section: BetSection): void {
  try {
    window.localStorage.setItem(BET_HUB_SECTION_STORAGE_KEY, section);
  } catch {
    /* ignore quota / private mode */
  }
}

/** URL `?section=` → localStorage → default (BetHubShell state machine). */
export function resolveBetHubSection(
  sectionFromSearch: BetSection | undefined,
  storedSection: BetSection | null,
  defaultSection: BetSection,
): BetSection {
  if (sectionFromSearch) return sectionFromSearch;
  if (storedSection) return storedSection;
  return defaultSection;
}

export function parseBetHubSectionFromSearch(searchStr: string): BetSection | undefined {
  return parseSearchEnum(searchStr, 'section', BET_SECTIONS);
}

export function buildBetHubSectionHref(
  pathname: string,
  searchStr: string,
  next: BetSection,
  defaultSection: BetSection,
): string {
  return buildSearchHref(pathname, searchStr, {
    section: next === defaultSection ? null : next,
  });
}
