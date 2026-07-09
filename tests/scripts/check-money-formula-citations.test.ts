import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import {
  MoneyFormulaCitationError,
  assertGrandTotalInFormulaDoc,
  parseMoneyFormulaManifest,
  verifyMoneyFormulaCitation,
  verifyMoneyFormulaCitations,
} from '../../scripts/lib/money-formula-citations';

const REPO_ROOT = join(import.meta.dirname, '../..');

const SAMPLE_MANIFEST = `
<!-- money-formula-citations:v1
citation: foo/bar.ts:10-12:alpha,beta
citation: baz/qux.sql:1-1:ASSERT
-->
`;

describe('money-formula-citations', () => {
  it('parses manifest citations', () => {
    const citations = parseMoneyFormulaManifest(SAMPLE_MANIFEST);
    expect(citations).toEqual([
      { path: 'foo/bar.ts', startLine: 10, endLine: 12, tokens: ['alpha', 'beta'] },
      { path: 'baz/qux.sql', startLine: 1, endLine: 1, tokens: ['ASSERT'] },
    ]);
  });

  it('requires GRAND_TOTAL in formula doc', () => {
    expect(() => assertGrandTotalInFormulaDoc('no keyword here')).toThrow(
      MoneyFormulaCitationError,
    );
    expect(() => assertGrandTotalInFormulaDoc('GRAND_TOTAL(c) = wallets + system')).not.toThrow();
  });

  it('fails when cited tokens drift', () => {
    const lines = ['line1', 'line2 alpha', 'line3'];
    expect(() =>
      verifyMoneyFormulaCitation(
        { path: 'foo/bar.ts', startLine: 2, endLine: 3, tokens: ['alpha', 'missing'] },
        lines,
      ),
    ).toThrow(/missing token "missing"/);
  });

  it('fails when manifest is missing', () => {
    expect(() => parseMoneyFormulaManifest('<!-- no manifest -->')).toThrow(
      MoneyFormulaCitationError,
    );
  });

  it('verifies live repo citations (P0-0 baseline)', () => {
    const { citationCount } = verifyMoneyFormulaCitations({ repoRoot: REPO_ROOT });
    expect(citationCount).toBeGreaterThanOrEqual(6);
  });
});
