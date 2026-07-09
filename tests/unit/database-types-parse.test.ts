import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DATABASE_TYPES_REQUIRED_RPCS,
  findMissingRequiredDatabaseTypeRpcs,
  parseRpcFunctionNamesFromDatabaseTypes,
} from '@phonara/shared-types';

const TYPES_PATH = join(process.cwd(), 'packages', 'shared-types', 'src', 'database.types.ts');

describe('database-types parse contract (PQA F4)', () => {
  const content = readFileSync(TYPES_PATH, 'utf8');

  it('parses rpc_* names from committed database.types.ts', () => {
    const names = parseRpcFunctionNamesFromDatabaseTypes(content);
    for (const rpc of DATABASE_TYPES_REQUIRED_RPCS) {
      expect(names.has(rpc), rpc).toBe(true);
    }
    expect(names.size).toBeGreaterThan(50);
  });

  it('reports no missing required RPCs in committed types', () => {
    expect(findMissingRequiredDatabaseTypeRpcs(content)).toEqual([]);
  });
});
