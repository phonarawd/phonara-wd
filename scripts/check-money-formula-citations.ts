#!/usr/bin/env tsx
/**
 * P0-0 L1 gate — doc↔code citations for MONEY_CONSERVATION_FORMULA.md
 *
 * Parses the `money-formula-citations:v1` manifest in the SSOT doc and verifies:
 * 1. Each cited path exists on disk
 * 2. Each line range is valid
 * 3. Expected tokens appear in the cited line range
 * 4. GRAND_TOTAL keyword present in the formula doc
 */
import {
  MoneyFormulaCitationError,
  verifyMoneyFormulaCitations,
} from './lib/money-formula-citations';

function main(): void {
  try {
    const { citationCount } = verifyMoneyFormulaCitations();
    console.log(
      `[check:money-formula-citations] OK — GRAND_TOTAL in formula doc · ${citationCount} citations verified`,
    );
  } catch (error) {
    const message =
      error instanceof MoneyFormulaCitationError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error);
    console.error(`[check:money-formula-citations] FAIL: ${message}`);
    process.exit(1);
  }
}

main();
