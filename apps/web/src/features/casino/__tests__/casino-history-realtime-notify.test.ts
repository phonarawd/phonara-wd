import { describe, expect, it } from 'vitest';
import {
  isCasinoBetSettled,
  shouldEmitCasinoBetNotify,
  seedCasinoBetIds,
  resetCasinoBetIds,
} from '../casino-history-realtime-notify';

describe('casino-history-realtime-notify', () => {
  it('tracks seen bet ids for trust toast dedup', () => {
    resetCasinoBetIds();
    expect(shouldEmitCasinoBetNotify('bet-1')).toBe(true);
    seedCasinoBetIds(['bet-1']);
    expect(shouldEmitCasinoBetNotify('bet-1')).toBe(false);
    expect(shouldEmitCasinoBetNotify('bet-2')).toBe(true);
  });

  it('treats won/lost as settled statuses', () => {
    expect(isCasinoBetSettled('won')).toBe(true);
    expect(isCasinoBetSettled('lost')).toBe(true);
    expect(isCasinoBetSettled('pending')).toBe(false);
  });
});
