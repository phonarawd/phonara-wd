import { describe, it, expect } from 'vitest';
import {
  TIER1_LAUNCH_ASSETS,
  TRADING_MARKETS,
  SPOT_MARKETS,
  futuresSymbolForBase,
} from './markets';

describe('markets catalog', () => {
  it('includes PHON perp plus 20 tier-1 SIM markets', () => {
    expect(TIER1_LAUNCH_ASSETS).toHaveLength(20);
    expect(TRADING_MARKETS[0]).toBe('PHONUSDT-PERP');
    expect(TRADING_MARKETS).toHaveLength(21);
    expect(SPOT_MARKETS).toHaveLength(21);
    expect(futuresSymbolForBase('SOL')).toBe('SOLUSDT-SIM');
  });
});
