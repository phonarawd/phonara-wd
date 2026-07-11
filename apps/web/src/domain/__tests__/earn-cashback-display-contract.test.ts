import { describe, expect, it } from 'vitest';

import {
  buildEarnCashbackRows,
  EARN_CASHBACK_ROUTE,
  resolveCurrentCashbackKey,
} from '../earn-cashback-display-contract';
import { EARN_VIP_TIER_ORDER } from '../unified-tier-display-contract';

describe('earn-cashback-display-contract', () => {
  it('binds cashback route and highlights current tier row', () => {
    expect(EARN_CASHBACK_ROUTE).toBe('/earn/cashback');
    expect(resolveCurrentCashbackKey('gold')).toBe('tier.guide.rows.gold.cashback');

    const rows = buildEarnCashbackRows('gold');
    expect(rows).toHaveLength(EARN_VIP_TIER_ORDER.length);
    expect(rows.find((row) => row.tier === 'gold')?.current).toBe(true);
    expect(rows.find((row) => row.tier === 'bronze')?.current).toBe(false);
  });
});
