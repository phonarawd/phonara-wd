import { describe, expect, it } from 'vitest';
import {
  CRYPTO_CHAIN_WATCHER_EDGE,
  CRYPTO_DEPOSIT_ADDRESS_RPC,
  CRYPTO_EDGE_CANARY_WAVE,
  CRYPTO_EDGE_DEPENDENCY_CHAINS,
  CRYPTO_EDGE_ENGINE_BRANCHES,
  CRYPTO_EDGE_FUNCTIONS,
  CRYPTO_EDGE_PLACEMENT,
  CRYPTO_EDGE_UI_WIRE_STATUS,
  CRYPTO_SIGN_EDGE,
  CRYPTO_WITHDRAW_BROADCAST_EDGE,
  CRYPTO_WITHDRAW_BROADCAST_RPC,
  CRYPTO_WITHDRAW_REQUEST_RPC,
  DERIVE_CRYPTO_ADDRESS_EDGE,
  WALLET_CRYPTO_PRIMARY_ROUTE,
  cryptoEdgeBranchRequiresCanary,
  isCustodyXpubMissingError,
  resolveCryptoEdgeBranchExposure,
  resolveDefaultWalletRail,
  shouldBlockDeriveCryptoAddressInvoke,
  shouldHideCryptoWalletPanels,
} from '../crypto-edge-display-contract';

describe('crypto-edge-display-contract', () => {
  it('locks crypto deposit/withdraw owner to /wallet only', () => {
    const routes = new Set(CRYPTO_EDGE_PLACEMENT.map((row) => row.route));
    expect(routes).toEqual(new Set([WALLET_CRYPTO_PRIMARY_ROUTE]));
    expect(CRYPTO_EDGE_PLACEMENT).toHaveLength(2);
  });

  it('documents four edge functions with auth and RPC deps (Phase 1 audit)', () => {
    expect(Object.keys(CRYPTO_EDGE_FUNCTIONS)).toHaveLength(4);
    expect(CRYPTO_EDGE_FUNCTIONS[DERIVE_CRYPTO_ADDRESS_EDGE].auth).toBe('user_jwt');
    expect(CRYPTO_EDGE_FUNCTIONS[DERIVE_CRYPTO_ADDRESS_EDGE].rpcDeps).toContain(
      CRYPTO_DEPOSIT_ADDRESS_RPC,
    );
    expect(CRYPTO_EDGE_FUNCTIONS[CRYPTO_CHAIN_WATCHER_EDGE].userFacing).toBe(false);
    expect(CRYPTO_EDGE_FUNCTIONS[CRYPTO_SIGN_EDGE].auth).toBe('service_role');
    expect(CRYPTO_EDGE_FUNCTIONS[CRYPTO_WITHDRAW_BROADCAST_EDGE].rpcDeps).toContain(
      CRYPTO_WITHDRAW_BROADCAST_RPC,
    );
  });

  it('maps deposit and withdraw dependency chains in runtime order', () => {
    expect(CRYPTO_EDGE_DEPENDENCY_CHAINS.deposit[0]).toContain(CRYPTO_DEPOSIT_ADDRESS_RPC);
    expect(CRYPTO_EDGE_DEPENDENCY_CHAINS.deposit[1]).toContain(DERIVE_CRYPTO_ADDRESS_EDGE);
    expect(CRYPTO_EDGE_DEPENDENCY_CHAINS.withdraw[0]).toContain(CRYPTO_WITHDRAW_REQUEST_RPC);
    expect(CRYPTO_EDGE_DEPENDENCY_CHAINS.withdraw[1]).toContain(CRYPTO_WITHDRAW_BROADCAST_EDGE);
  });

  it('hides crypto panels and blocks derive when cryptoRails is false', () => {
    expect(shouldHideCryptoWalletPanels(false)).toBe(true);
    expect(shouldBlockDeriveCryptoAddressInvoke(false)).toBe(true);
    expect(resolveDefaultWalletRail(false)).toBe('krw');
    expect(CRYPTO_EDGE_UI_WIRE_STATUS.deposit_panel).toBe('built_hidden');
    expect(CRYPTO_EDGE_UI_WIRE_STATUS.withdraw_panel).toBe('built_hidden');
  });

  it('exposes money branches as live only when cryptoRails is true', () => {
    expect(resolveCryptoEdgeBranchExposure('deposit_request_create', false)).toBe('built_hidden');
    expect(resolveCryptoEdgeBranchExposure('deposit_request_create', true)).toBe('live');
    expect(resolveCryptoEdgeBranchExposure('withdraw_user_request', true)).toBe('live');
    expect(resolveCryptoEdgeBranchExposure('deposit_hd_derive', true)).toBe('built_disabled');
  });

  it('flags money paths for §7 Canary on gate flip', () => {
    expect(cryptoEdgeBranchRequiresCanary('deposit_request_create')).toBe(true);
    expect(cryptoEdgeBranchRequiresCanary('deposit_hd_derive')).toBe(false);
    expect(CRYPTO_EDGE_CANARY_WAVE).toBe('phase3-wallet-crypto');
  });

  it('documents partial engine for sign/broadcast branches', () => {
    expect(CRYPTO_EDGE_ENGINE_BRANCHES.withdraw_sign.engine).toBe('partial');
    expect(CRYPTO_EDGE_ENGINE_BRANCHES.withdraw_sign.edge).toBe(CRYPTO_SIGN_EDGE);
    expect(CRYPTO_EDGE_ENGINE_BRANCHES.deposit_on_chain_match.engine).toBe('partial');
  });

  it('detects custody xpub missing edge error', () => {
    expect(isCustodyXpubMissingError('custody_xpub_not_configured')).toBe(true);
    expect(isCustodyXpubMissingError(undefined)).toBe(false);
  });

  it('defaults to crypto rail when gate is live', () => {
    expect(resolveDefaultWalletRail(true)).toBe('crypto');
  });
});
