import { describe, expect, it } from 'vitest';

import { formatAdminMoney } from '@/lib/format-admin-money';

describe('formatAdminMoney (M-02)', () => {
  it('formats PHON without trailing zero noise', () => {
    expect(formatAdminMoney('8420.000000', 'PHON')).toBe('8420 PHON');
    expect(formatAdminMoney('3.500000', 'PHON')).toBe('3.5 PHON');
  });

  it('keeps KRW won prefix + grouping', () => {
    expect(formatAdminMoney('1200000', 'KRW')).toBe('₩1,200,000');
  });
});
