import { describe, expect, it } from 'vitest';
import { aggregateLevels, bucketPrice } from '../depth-bucket';

describe('depth-bucket', () => {
  it('buckets price to step', () => {
    expect(bucketPrice('100.123', '0.1')).toBe('100.1');
    expect(bucketPrice('100.15', '0.1')).toBe('100.1');
  });

  it('aggregates levels at same bucket', () => {
    const out = aggregateLevels(
      [
        ['100.01', '1.5'],
        ['100.02', '2.5'],
      ],
      '0.1',
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.[0]).toBe('100');
    expect(out[0]?.[1]).toBe('4');
  });
});
