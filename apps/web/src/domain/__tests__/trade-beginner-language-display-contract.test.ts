import { describe, expect, it } from 'vitest';

import { P9_TRADE_POSITION_MODE_LABEL_TODO } from '../margin-position-mode-display-contract';
import { P9_TRADE_TIER_FEE_DISPLAY_TODO } from '../tier-fee-display-contract';
import {
  assertTradeBeginnerLanguageContractSync,
  findTradeHelpTerm,
  findTradeHowItWorksSlot,
  listTradeHelpTermsBySurface,
  P9_TRADE_BEGINNER_HELP_LAYER_TODO,
  TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON,
  TRADE_BEGINNER_HELP_TERMS,
  TRADE_BEGINNER_HOW_IT_WORKS,
  TRADE_SUBNAV_BEGINNER_HELP,
} from '../trade-beginner-language-display-contract';

describe('trade-beginner-language-display-contract §13.1.3', () => {
  it('registers HowItWorks for spot · futures · staking', () => {
    expect(TRADE_BEGINNER_HOW_IT_WORKS).toHaveLength(3);
    expect(findTradeHowItWorksSlot('spot-desk')?.route).toBe('/trade');
    expect(findTradeHowItWorksSlot('futures-desk')?.route).toBe('/trade/futures');
    expect(findTradeHowItWorksSlot('staking-hub')?.route).toBe('/staking');
    for (const slot of TRADE_BEGINNER_HOW_IT_WORKS) {
      expect(slot.ownerTodo).toBe(P9_TRADE_BEGINNER_HELP_LAYER_TODO);
      expect(slot.stepKeys).toHaveLength(3);
    }
  });

  it('registers HelpTip terms for ticket and panel fields', () => {
    expect(TRADE_BEGINNER_HELP_TERMS.length).toBeGreaterThanOrEqual(15);
    expect(listTradeHelpTermsBySurface('spot').map((row) => row.id)).toEqual(
      expect.arrayContaining(['spot_buy', 'spot_sell', 'order_book']),
    );
    expect(listTradeHelpTermsBySurface('futures').map((row) => row.id)).toEqual(
      expect.arrayContaining(['position_mode', 'margin_mode']),
    );
    expect(findTradeHelpTerm('leverage')?.surfaces).toContain('futures');
    expect(findTradeHelpTerm('position_mode')?.ownerTodo).toBe(P9_TRADE_POSITION_MODE_LABEL_TODO);
    expect(findTradeHelpTerm('margin_mode')?.ownerTodo).toBe(P9_TRADE_POSITION_MODE_LABEL_TODO);
    expect(findTradeHelpTerm('tier_fee')?.ownerTodo).toBe(P9_TRADE_TIER_FEE_DISPLAY_TODO);
    expect(findTradeHelpTerm('tier_fee')?.surfaces).toEqual(
      expect.arrayContaining(['spot', 'futures']),
    );
    expect(findTradeHelpTerm('staking_apr')?.surfaces).toContain('staking');
  });

  it('maps subnav labels to one-line beginner help keys', () => {
    expect(TRADE_SUBNAV_BEGINNER_HELP).toHaveLength(5);
    expect(TRADE_SUBNAV_BEGINNER_HELP[0]?.helpKey).toBe('trade.subnav.help.spot');
  });

  it('forbids external-exchange jargon on user surfaces', () => {
    expect(TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON).toContain('CLOB');
    expect(TRADE_BEGINNER_FORBIDDEN_SCREEN_JARGON).toContain('external exchange');
  });

  it('passes contract sync guard', () => {
    expect(() => assertTradeBeginnerLanguageContractSync()).not.toThrow();
  });
});
