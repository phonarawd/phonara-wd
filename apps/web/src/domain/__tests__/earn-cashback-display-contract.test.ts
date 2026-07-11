import { describe, expect, it } from 'vitest';

import {
  buildEarnCashbackRows,
  EARN_CASHBACK_ROUTE,
  resolveCurrentCashbackKey,
} from '../earn-cashback-display-contract';

describe('earn-cashback-display-contract', () => {
  it('binds cashback route and highlights current tier row', () => {
    expect(EARN_CASHBACK_ROUTE).toBe('/earn/cashback');
    expect(resolveCurrentCashbackKey('gold')).toBe('tier.guide.rows.gold.cashback');

    const rows = buildEarnCashbackRows('gold');
    expect(rows).toHaveLength(5);
    expect(rows.find((row) => row.tier === 'gold')?.current).toBe(true);
    expect(rows.find((row) => row.tier === 'bronze')?.current).toBe(false);
  });
});
