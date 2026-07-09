import { describe, expect, it } from 'vitest';

import {
  P9_TRADE_I18N_SURFACE_AUDIT_TODO,
  TRADE_I18N_DEFER_RULES,
  assertTradeI18nExternalCopyFree,
  assertTradeI18nSurfaceAuditSync,
} from '../trade-i18n-surface-display-contract';
import {
  auditTradeI18nSurfaceCoverage,
  listTradeCatalogEnglishValues,
} from './trade-i18n-surface-audit-lib';

describe('trade-i18n-surface-display-contract §25.12.9.1-D step 26', () => {
  it('registers P9 i18n surface audit todo', () => {
    expect(P9_TRADE_I18N_SURFACE_AUDIT_TODO).toBe('p9-trade-i18n-surface-audit');
    expect(TRADE_I18N_DEFER_RULES.length).toBeGreaterThanOrEqual(10);
  });

  it('assertTradeI18nSurfaceAuditSync stays green', () => {
    expect(() => assertTradeI18nSurfaceAuditSync()).not.toThrow();
  });

  it('classifies every trade catalog key as wired or defer (unclassified 0)', () => {
    const audit = auditTradeI18nSurfaceCoverage();
    expect(audit.catalogKeys.length).toBeGreaterThanOrEqual(300);
    expect(audit.unclassified).toEqual([]);
  });

  it('keeps defer registry majority Tier-C (post-P13 / legacy / owner todo)', () => {
    const audit = auditTradeI18nSurfaceCoverage();
    expect(audit.deferCounts.C).toBeGreaterThan(0);
    expect(audit.deferCounts.B).toBeGreaterThan(0);
  });

  it('forbids external exchange settlement copy in trade catalog strings', () => {
    const values = listTradeCatalogEnglishValues().filter(Boolean);
    expect(() => assertTradeI18nExternalCopyFree(values)).not.toThrow();
  });
});
