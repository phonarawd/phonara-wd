import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DS_TOUCH_TARGET_MIN_HEIGHT_CLASS } from '../touch-target-display-contract';
import {
  assertTradeWalletPhase2PolishContractSync,
  PHASE2_MOBILE_STICKY_SUBMIT_TEST_IDS,
  PHASE2_TABLET_EXTERNAL_SUBMIT_MARKERS,
  PHASE2_TRADE_WALLET_HI_QA_MATRIX,
  PHASE2_TRADE_WALLET_OWNER_PATHS,
  PHASE2_TRADE_WALLET_PART_ORDER,
  PHASE2_TRADE_WALLET_VIEWPORT_WIDTHS,
  PHASE2_WALLET_KYC_CTA_TEST_IDS,
} from '../trade-wallet-phase2-polish-display-contract';

const productRoot = resolve(import.meta.dirname, '../../product');

function readProduct(relativePath: string): string {
  return readFileSync(resolve(productRoot, relativePath.replace(/^product\//, '')), 'utf8');
}

describe('trade-wallet-phase2-polish-display-contract', () => {
  it('keeps Spot→Futures→Wallet→HI-QA part order and 4-tier viewports', () => {
    expect(() => assertTradeWalletPhase2PolishContractSync()).not.toThrow();
    expect(PHASE2_TRADE_WALLET_PART_ORDER).toEqual(['spot', 'futures', 'wallet', 'hi-qa']);
    expect(PHASE2_TRADE_WALLET_VIEWPORT_WIDTHS).toEqual([390, 768, 1024, 2560]);
    expect(PHASE2_TRADE_WALLET_HI_QA_MATRIX.length).toBeGreaterThanOrEqual(6);
  });

  it('tablet spot/futures tickets use external submit (no duplicate CTA)', () => {
    for (const relative of [
      'surfaces/trade/spot-desk-page.tsx',
      'surfaces/trade/futures-desk-page.tsx',
    ] as const) {
      const source = readProduct(relative);
      for (const marker of PHASE2_TABLET_EXTERNAL_SUBMIT_MARKERS) {
        if (marker.includes('Spot') && relative.includes('futures')) continue;
        if (marker.includes('Futures') && relative.includes('spot')) continue;
        expect(source).toContain(marker);
      }
      // Tablet ticket slot must pin primarySubmit="external" (not only mobile stack).
      expect(source).toMatch(/primarySubmit=["']external["']/);
    }
  });

  it('mobile sticky CTAs consume the touch-target min-height token', () => {
    const source = readProduct('surfaces/trade/trade-desk-mobile-sticky-cta.tsx');
    expect(source).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(source).not.toContain("'min-h-12");
    expect(source).not.toContain('"min-h-12');
    for (const testId of PHASE2_MOBILE_STICKY_SUBMIT_TEST_IDS) {
      expect(source).toContain(testId);
    }
  });

  it('shared primitives + HelpTip no longer shrink below 48px floor', () => {
    expect(readProduct('primitives/help-tip.tsx')).not.toContain('size-8');
    expect(readProduct('primitives/input.tsx')).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(readProduct('primitives/select.tsx')).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(readProduct('primitives/tabs.tsx')).toContain(DS_TOUCH_TARGET_MIN_HEIGHT_CLASS);
    expect(readProduct('primitives/tabs.tsx')).not.toContain('min-h-9');
  });

  it('HI-QA owners wire overscroll-contain + ticket fold defaultOpen', () => {
    expect(readProduct('surfaces/trade/trade-recent-trades-rail.tsx')).toContain(
      'overscroll-contain',
    );
    expect(readProduct('surfaces/trade/trade-desk-mobile-tabs.tsx')).toMatch(
      /defaultOpen(?:\s|=)/,
    );
    const mobileTabs = readProduct('surfaces/trade/trade-desk-mobile-tabs.tsx');
    expect(mobileTabs).not.toContain('defaultOpen={false}');
  });

  it('wallet KYC escape hatches point at /account/kyc', () => {
    const compliance = readProduct('surfaces/wallet/wallet-compliance-strip.tsx');
    const withdrawHub = readProduct('surfaces/wallet/withdraw-hub-page.tsx');
    const redeem = readProduct('surfaces/wallet/wallet-redeem-page.tsx');

    for (const [source, testId] of [
      [compliance, 'wallet-compliance-kyc-cta'],
      [withdrawHub, 'withdraw-hub-kyc-cta'],
      [redeem, 'wallet-redeem-kyc-cta'],
    ] as const) {
      expect(source).toContain(testId);
      expect(source).toContain('href="/account/kyc"');
    }

    expect(PHASE2_WALLET_KYC_CTA_TEST_IDS).toHaveLength(3);
    expect(withdrawHub).toContain("t('wallet.withdraw.kycCta')");
  });

  it('wallet hero collapsed summary exposes locked amounts', () => {
    const source = readProduct('surfaces/wallet/wallet-page.tsx');
    expect(source).toContain('wallet-hero-locked-summary');
    expect(source).toContain('phonLockedDisplay');
    expect(source).toContain('usdtLockedDisplay');
  });

  it('owner path list matches files on disk', () => {
    for (const relative of PHASE2_TRADE_WALLET_OWNER_PATHS) {
      expect(() => readProduct(relative)).not.toThrow();
    }
  });
});
