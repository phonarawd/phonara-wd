import { describe, expect, it } from 'vitest';
import type { Database } from '../database.types';
import { DATABASE_TYPES_REQUIRED_RPCS, PQA_FIX_TYPES_REGEN_TODO } from '../database-types-contract';

/** Compile-time guard: audit B §2.3 service RPCs must exist in generated types. */
type RequiredPublicRpcTypes = {
  [Rpc in (typeof DATABASE_TYPES_REQUIRED_RPCS)[number]]: Database['public']['Functions'][Rpc];
};

describe('database-types-contract (PQA F4)', () => {
  it('tracks the F4 todo id', () => {
    expect(PQA_FIX_TYPES_REGEN_TODO).toBe('pqa-fix-types-regen');
  });

  it('includes audit B required service RPCs in public Functions', () => {
    const _shape: RequiredPublicRpcTypes = {} as RequiredPublicRpcTypes;
    expect(Object.keys(_shape)).toEqual([]);
    expect(DATABASE_TYPES_REQUIRED_RPCS).toEqual([
      'rpc_run_open_order_fills',
      'rpc_run_stop_orders',
    ]);
  });
});
