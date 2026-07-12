import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type MatrixDoc = {
  formula: { webConcrete: number; adminConcrete: number; totalConcrete: number };
  webUrls: Record<string, Array<string | { path: string; parameterized?: boolean }>>;
  adminUrls: Record<string, Array<string | { path: string; parameterized?: boolean }>>;
  stage1: { criticalSurfaces: unknown[]; viewports: unknown[] };
};

function countPaths(groups: Record<string, Array<string | { path: string }>>): number {
  return Object.values(groups).reduce((sum, entries) => sum + entries.length, 0);
}

describe('PLATFORM_RUNTIME_URL_MATRIX.json (R9)', () => {
  const matrixPath = resolve('docs/OPERATIONS/PLATFORM_RUNTIME_URL_MATRIX.json');
  const doc = JSON.parse(readFileSync(matrixPath, 'utf8')) as MatrixDoc;

  it('locks 124 concrete URLs (Web 95 + Admin 29)', () => {
    const web = countPaths(doc.webUrls);
    const admin = countPaths(doc.adminUrls);
    expect(web).toBe(doc.formula.webConcrete);
    expect(admin).toBe(doc.formula.adminConcrete);
    expect(web + admin).toBe(doc.formula.totalConcrete);
    expect(doc.formula.totalConcrete).toBe(124);
  });

  it('locks Stage1 Critical 8 × 3 viewports = 24 states', () => {
    expect(doc.stage1.criticalSurfaces).toHaveLength(8);
    expect(doc.stage1.viewports).toHaveLength(3);
    expect(doc.stage1.criticalSurfaces.length * doc.stage1.viewports.length).toBe(24);
  });
});
