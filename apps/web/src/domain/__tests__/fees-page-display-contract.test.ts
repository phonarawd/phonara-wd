import { describe, expect, it } from 'vitest';

import {
  assertFeesPageContractSync,
  buildFeesCashbackRows,
  FEES_CATEGORY_IDS,
  FEES_PAGE_ROUTE,
  feesCategoryBodyKey,
  feesCategoryTitleKey,
} from '../fees-page-display-contract';

describe('fees-page-display-contract', () => {
  it('binds /fees categories and cashback rows', () => {
    expect(FEES_PAGE_ROUTE).toBe('/fees');
    expect(FEES_CATEGORY_IDS).toHaveLength(5);
    expect(feesCategoryTitleKey('spot')).toBe('fees.page.category.spot.title');
    expect(feesCategoryBodyKey('withdraw')).toBe('fees.page.category.withdraw.body');
    expect(buildFeesCashbackRows()).toHaveLength(5);
    expect(() => assertFeesPageContractSync()).not.toThrow();
  });
});
