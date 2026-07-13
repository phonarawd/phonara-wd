// ─────────────────────────────────────────────────────────────────────────────
// PHONARA i18n catalog — single source of truth for all user-facing copy.
// Korean is the default locale; English must never leak Korean strings.
// Runtime: ko is eager; en loads via dynamic import (R9-PERF-JS / Phase 4).
// Tests: call preloadAllLocalesForTests() from vitest setup (sync-ready).
// ─────────────────────────────────────────────────────────────────────────────

import { catalogKo, type MessageKey as KoMessageKey } from './catalog-ko';

export type MessageKey = KoMessageKey;
export type Locale = 'ko' | 'en';

export const DEFAULT_LOCALE: Locale = 'ko';

/** @deprecated Prefer catalogKo — kept for check:i18n / legacy imports. */
export { koMessages } from './catalog-ko';

type CatalogTable = Record<MessageKey, string>;

const localeTables: { ko: CatalogTable; en: CatalogTable | null } = {
  ko: catalogKo as CatalogTable,
  en: null,
};

let enLoadPromise: Promise<CatalogTable> | null = null;

export function isLocaleCatalogLoaded(locale: Locale): boolean {
  return locale === 'ko' || localeTables.en !== null;
}

export async function ensureLocaleCatalog(locale: Locale): Promise<void> {
  if (locale === 'ko') return;
  if (localeTables.en) return;
  if (!enLoadPromise) {
    enLoadPromise = import('./catalog-en').then((mod) => {
      localeTables.en = mod.catalogEn;
      return mod.catalogEn;
    });
  }
  await enLoadPromise;
}

/** Vitest / Node scripts — preload en so sync translate/I18nProvider stay green. */
export async function preloadAllLocalesForTests(): Promise<void> {
  await ensureLocaleCatalog('en');
}

/**
 * Locale → message table. `en` is null until ensureLocaleCatalog('en') resolves.
 * Prefer translate() / ensureLocaleCatalog rather than reading messages.en directly
 * before preload in async production paths.
 */
export const messages: Record<Locale, CatalogTable> = {
  get ko() {
    return localeTables.ko;
  },
  get en() {
    if (!localeTables.en) {
      throw new Error(
        "i18n: English catalog not loaded — call await ensureLocaleCatalog('en') or preloadAllLocalesForTests()",
      );
    }
    return localeTables.en;
  },
} as Record<Locale, CatalogTable>;

/** §28.7 ambient ticker masked nick pool — locale catalog only (presentation display props). */
export const LANDING_AMBIENT_MASKED_NICKS = [
  '김**',
  '이**',
  '박**',
  '최**',
  '정**',
  '강**',
  '조**',
  '윤**',
  '장**',
  '임**',
  '한**',
  '오**',
  '서**',
  '신**',
  '권**',
  '황**',
  '안**',
  '송**',
  '류**',
  '홍**',
] as const;

/**
 * Resolve a message for a locale with optional `{var}` interpolation.
 * Falls back to the key itself if missing (never throws), so a missing
 * translation is visible but non-fatal.
 * English requires ensureLocaleCatalog('en') first ( vitest setup preloads).
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const table =
    locale === 'en'
      ? (localeTables.en ?? localeTables.ko)
      : localeTables.ko;
  let text: string = table[key] ?? localeTables.ko[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll('{' + name + '}', String(value));
    }
  }
  return text;
}
