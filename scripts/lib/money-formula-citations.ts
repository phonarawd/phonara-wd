import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MoneyFormulaCitation {
  path: string;
  startLine: number;
  endLine: number;
  tokens: string[];
}

export class MoneyFormulaCitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyFormulaCitationError';
  }
}

export const DEFAULT_FORMULA_DOC = 'docs/SSOT/MONEY_CONSERVATION_FORMULA.md';

function fail(message: string): never {
  throw new MoneyFormulaCitationError(message);
}

export function parseMoneyFormulaManifest(content: string): MoneyFormulaCitation[] {
  const start = content.indexOf('<!-- money-formula-citations:v1');
  const end = content.indexOf('-->', start);
  if (start === -1 || end === -1) {
    fail('missing money-formula-citations:v1 manifest in MONEY_CONSERVATION_FORMULA.md');
  }

  const block = content.slice(start, end);
  const citations: MoneyFormulaCitation[] = [];

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('citation:')) continue;

    const body = trimmed.slice('citation:'.length).trim();
    const colonIdx = body.lastIndexOf(':');
    if (colonIdx === -1) fail(`invalid citation line: ${trimmed}`);

    const pathAndLines = body.slice(0, colonIdx);
    const tokensRaw = body.slice(colonIdx + 1);
    const lastColon = pathAndLines.lastIndexOf(':');
    if (lastColon === -1) fail(`invalid citation path/lines: ${trimmed}`);

    const relPath = pathAndLines.slice(0, lastColon).trim();
    const lineSpec = pathAndLines.slice(lastColon + 1).trim();
    const [startStr, endStr] = lineSpec.split('-');
    const startLine = Number(startStr);
    const endLine = Number(endStr ?? startStr);

    if (
      !Number.isFinite(startLine) ||
      !Number.isFinite(endLine) ||
      startLine < 1 ||
      endLine < startLine
    ) {
      fail(`invalid line range in citation: ${trimmed}`);
    }

    const tokens = tokensRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) fail(`citation missing tokens: ${trimmed}`);

    citations.push({ path: relPath.replaceAll('\\', '/'), startLine, endLine, tokens });
  }

  if (citations.length === 0) {
    fail('no citations parsed from manifest');
  }

  return citations;
}

export function assertGrandTotalInFormulaDoc(content: string): void {
  if (!/\bGRAND_TOTAL\b/.test(content)) {
    fail('MONEY_CONSERVATION_FORMULA.md must define GRAND_TOTAL');
  }
}

export function verifyMoneyFormulaCitation(citation: MoneyFormulaCitation, lines: string[]): void {
  if (citation.endLine > lines.length) {
    fail(
      `${citation.path}: line range ${citation.startLine}-${citation.endLine} exceeds file length ${lines.length}`,
    );
  }

  const slice = lines.slice(citation.startLine - 1, citation.endLine).join('\n');

  for (const token of citation.tokens) {
    if (!slice.includes(token)) {
      fail(
        `${citation.path}:${citation.startLine}-${citation.endLine} missing token "${token}" (GRAND_TOTAL citation drift)`,
      );
    }
  }
}

export function verifyMoneyFormulaCitations(
  options: {
    repoRoot?: string;
    formulaDocRelPath?: string;
  } = {},
): { citationCount: number } {
  const repoRoot = options.repoRoot ?? process.cwd();
  const formulaDocRelPath = options.formulaDocRelPath ?? DEFAULT_FORMULA_DOC;
  const formulaDocAbs = join(repoRoot, formulaDocRelPath);

  if (!existsSync(formulaDocAbs)) {
    fail(`${formulaDocRelPath} missing — run P0-0 0-A-write first`);
  }

  const formulaContent = readFileSync(formulaDocAbs, 'utf8');
  assertGrandTotalInFormulaDoc(formulaContent);
  const citations = parseMoneyFormulaManifest(formulaContent);

  for (const citation of citations) {
    const abs = join(repoRoot, citation.path);
    if (!existsSync(abs)) {
      fail(`cited path missing: ${citation.path}`);
    }
    const lines = readFileSync(abs, 'utf8').split('\n');
    verifyMoneyFormulaCitation(citation, lines);
  }

  return { citationCount: citations.length };
}
