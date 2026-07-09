import { describe, expect, it } from 'vitest';
import * as sportsbook from './index';

/**
 * Settlement, grading, and ledger authority live in Supabase RPC only
 * (`rpc_place_sports_bet`, `rpc_settle_sports_fixture*`, `rpc_void_sports_*`).
 * This package must stay preview/validation-only.
 */
const ALLOWED_EXPORTS = [
  'MAX_COMBO_LEGS',
  'SPORTS_MARKET_TYPES',
  'SportsbookComboError',
  'parseTotalsLine',
  'previewComboPayout',
  'previewSinglePayout',
  'productComboOdds',
  'productComboOddsFromLegs',
  'validateBetLegs',
] as const;

const FORBIDDEN_EXPORT_PATTERN =
  /settle|settlement|grade|grading|ledger|debit|credit|finalize|void_bet|place_bet|house_edge/i;

describe('sportsbook package authority boundary', () => {
  it('exports only the preview/validation surface', () => {
    expect(Object.keys(sportsbook).sort()).toEqual([...ALLOWED_EXPORTS].sort());
  });

  it('does not export authoritative settlement APIs', () => {
    for (const name of Object.keys(sportsbook)) {
      expect(name).not.toMatch(FORBIDDEN_EXPORT_PATTERN);
    }
  });
});
