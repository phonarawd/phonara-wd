/**
 * Crypto edge functions — Phase 1 E13 discovery contract (dependency map + exposure).
 * Deposit/withdraw money paths are engine/RPC + edge only; this module defines route
 * ownership, edge→RPC dependency chains, and built-hidden rules when `cryptoRails` is false.
 *
 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E13 · §E4 HD deposit · §E2 launch gates
 */

export const CRYPTO_DEPOSIT_ADDRESS_RPC = 'rpc_get_crypto_deposit_address' as const;
export const CRYPTO_DEPOSIT_CREATE_RPC = 'rpc_create_crypto_deposit_request' as const;
export const CRYPTO_SERVICE_SET_ADDRESS_RPC = 'rpc_service_set_crypto_address' as const;
export const CRYPTO_ON_CHAIN_TRANSFER_RPC = 'rpc_process_on_chain_transfer' as const;
export const CRYPTO_WITHDRAW_REQUEST_RPC = 'rpc_request_withdrawal' as const;
export const CRYPTO_WITHDRAW_BROADCAST_RPC = 'rpc_service_mark_withdrawal_broadcast' as const;

export const DERIVE_CRYPTO_ADDRESS_EDGE = 'derive-crypto-address' as const;
export const CRYPTO_CHAIN_WATCHER_EDGE = 'crypto-chain-watcher' as const;
export const CRYPTO_SIGN_EDGE = 'crypto-sign' as const;
export const CRYPTO_WITHDRAW_BROADCAST_EDGE = 'crypto-withdraw-broadcast' as const;

export const WALLET_CRYPTO_PRIMARY_ROUTE = '/wallet' as const;

/** §7 Money Rollout wave id when `cryptoRails` flips live for deposit/withdraw UI. */
export const CRYPTO_EDGE_CANARY_WAVE = 'phase3-wallet-crypto' as const;

export type CryptoEdgeFunctionName =
  | typeof DERIVE_CRYPTO_ADDRESS_EDGE
  | typeof CRYPTO_CHAIN_WATCHER_EDGE
  | typeof CRYPTO_SIGN_EDGE
  | typeof CRYPTO_WITHDRAW_BROADCAST_EDGE;

export type CryptoEdgeAuthMode = 'user_jwt' | 'service_role';

export type CryptoEdgeEngineBranch =
  | 'deposit_hd_derive'
  | 'deposit_request_create'
  | 'deposit_on_chain_match'
  | 'withdraw_user_request'
  | 'withdraw_sign'
  | 'withdraw_broadcast';

export type CryptoEdgeBranchEngineStatus = 'exists' | 'partial' | 'missing';

export type CryptoEdgeExposureMode = 'live' | 'built_hidden' | 'built_disabled' | 'defer_stub';

/** Edge function inventory — caller, upstream env, downstream RPC (Phase 1 audit 2026-07-02). */
export const CRYPTO_EDGE_FUNCTIONS: Readonly<
  Record<
    CryptoEdgeFunctionName,
    {
      auth: CryptoEdgeAuthMode;
      trigger: 'user_on_demand' | 'cron_service';
      envDeps: readonly string[];
      rpcDeps: readonly string[];
      userFacing: boolean;
    }
  >
> = {
  [DERIVE_CRYPTO_ADDRESS_EDGE]: {
    auth: 'user_jwt',
    trigger: 'user_on_demand',
    envDeps: ['CRYPTO_TRON_XPUB', 'CRYPTO_ETH_XPUB'],
    rpcDeps: [CRYPTO_DEPOSIT_ADDRESS_RPC, CRYPTO_SERVICE_SET_ADDRESS_RPC],
    userFacing: true,
  },
  [CRYPTO_CHAIN_WATCHER_EDGE]: {
    auth: 'service_role',
    trigger: 'cron_service',
    envDeps: ['TRONGRID_API_KEY', 'ETHERSCAN_API_KEY'],
    rpcDeps: [CRYPTO_ON_CHAIN_TRANSFER_RPC],
    userFacing: false,
  },
  [CRYPTO_SIGN_EDGE]: {
    auth: 'service_role',
    trigger: 'user_on_demand',
    envDeps: [
      'CRYPTO_TRON_HOT_WALLET_PRIVATE_KEY',
      'CRYPTO_ETH_HOT_WALLET_PRIVATE_KEY',
      'CRYPTO_SIGN_ENDPOINT',
    ],
    rpcDeps: [],
    userFacing: false,
  },
  [CRYPTO_WITHDRAW_BROADCAST_EDGE]: {
    auth: 'service_role',
    trigger: 'cron_service',
    envDeps: ['CRYPTO_SIGN_ENDPOINT', 'CRYPTO_HOT_WALLET_PRIVATE_KEY'],
    rpcDeps: [CRYPTO_WITHDRAW_BROADCAST_RPC],
    userFacing: false,
  },
};

export const CRYPTO_EDGE_ENGINE_BRANCHES: Readonly<
  Record<
    CryptoEdgeEngineBranch,
    {
      engine: CryptoEdgeBranchEngineStatus;
      edge: CryptoEdgeFunctionName | null;
      rpc: string | null;
      moneyPath: boolean;
    }
  >
> = {
  deposit_hd_derive: {
    engine: 'partial',
    edge: DERIVE_CRYPTO_ADDRESS_EDGE,
    rpc: CRYPTO_DEPOSIT_ADDRESS_RPC,
    moneyPath: false,
  },
  deposit_request_create: {
    engine: 'exists',
    edge: null,
    rpc: CRYPTO_DEPOSIT_CREATE_RPC,
    moneyPath: true,
  },
  deposit_on_chain_match: {
    engine: 'partial',
    edge: CRYPTO_CHAIN_WATCHER_EDGE,
    rpc: CRYPTO_ON_CHAIN_TRANSFER_RPC,
    moneyPath: true,
  },
  withdraw_user_request: {
    engine: 'exists',
    edge: null,
    rpc: CRYPTO_WITHDRAW_REQUEST_RPC,
    moneyPath: true,
  },
  withdraw_sign: {
    engine: 'partial',
    edge: CRYPTO_SIGN_EDGE,
    rpc: null,
    moneyPath: true,
  },
  withdraw_broadcast: {
    engine: 'partial',
    edge: CRYPTO_WITHDRAW_BROADCAST_EDGE,
    rpc: CRYPTO_WITHDRAW_BROADCAST_RPC,
    moneyPath: true,
  },
};

export type CryptoEdgeSurfaceRole = 'deposit_panel' | 'withdraw_panel';

export type CryptoEdgeSurfacePlacement = {
  route: typeof WALLET_CRYPTO_PRIMARY_ROUTE;
  role: CryptoEdgeSurfaceRole;
  hook: 'useWalletPageController' | 'useCryptoDepositAddress' | 'useCryptoDepositRequest';
};

export const CRYPTO_EDGE_PLACEMENT: Readonly<CryptoEdgeSurfacePlacement[]> = [
  {
    route: WALLET_CRYPTO_PRIMARY_ROUTE,
    role: 'deposit_panel',
    hook: 'useCryptoDepositAddress',
  },
  {
    route: WALLET_CRYPTO_PRIMARY_ROUTE,
    role: 'withdraw_panel',
    hook: 'useWalletPageController',
  },
];

/** Phase 1 audit (2026-07-02): crypto rails wired but LAUNCH_GATES.cryptoRails=false → built_hidden. */
export const CRYPTO_EDGE_UI_WIRE_STATUS: Readonly<
  Record<CryptoEdgeSurfaceRole, 'wired' | 'built_hidden'>
> = {
  deposit_panel: 'built_hidden',
  withdraw_panel: 'built_hidden',
};

/**
 * Deposit/withdraw dependency chain for operator runbooks (edge missing → symptom).
 * Order matches runtime call sequence.
 */
export const CRYPTO_EDGE_DEPENDENCY_CHAINS: Readonly<
  Record<'deposit' | 'withdraw', readonly string[]>
> = {
  deposit: [
    `${CRYPTO_DEPOSIT_ADDRESS_RPC} → needs_derivation?`,
    `${DERIVE_CRYPTO_ADDRESS_EDGE} (user JWT) → xpub env → ${CRYPTO_SERVICE_SET_ADDRESS_RPC}`,
    `${CRYPTO_DEPOSIT_CREATE_RPC} (requires hd_xpub address)`,
    `${CRYPTO_CHAIN_WATCHER_EDGE} (cron) → TronGrid/Etherscan → ${CRYPTO_ON_CHAIN_TRANSFER_RPC}`,
  ],
  withdraw: [
    `${CRYPTO_WITHDRAW_REQUEST_RPC} (user MFA/KYC) → approved row`,
    `${CRYPTO_WITHDRAW_BROADCAST_EDGE} (cron) → ${CRYPTO_SIGN_EDGE} or hot key`,
    `${CRYPTO_WITHDRAW_BROADCAST_RPC} on tx_hash (no sim_ prefix)`,
  ],
};

export function resolveCryptoEdgeBranchExposure(
  branch: CryptoEdgeEngineBranch,
  cryptoRails: boolean,
): CryptoEdgeExposureMode {
  if (!cryptoRails) return 'built_hidden';
  const row = CRYPTO_EDGE_ENGINE_BRANCHES[branch];
  if (row.engine === 'missing') return 'defer_stub';
  if (row.engine === 'partial' && row.edge && !row.moneyPath) return 'built_disabled';
  if (row.moneyPath) return 'live';
  return row.engine === 'partial' ? 'built_disabled' : 'live';
}

/** LAUNCH_GATES.cryptoRails=false → deposit/withdraw crypto tab and edge invoke must not render/trigger. */
export function shouldHideCryptoWalletPanels(cryptoRails: boolean): boolean {
  return !cryptoRails;
}

/** User-triggered derive is forbidden while gate false (Phase S2 explicit OFF). */
export function shouldBlockDeriveCryptoAddressInvoke(cryptoRails: boolean): boolean {
  return !cryptoRails;
}

/** Branches that require §7 Canary when cryptoRails flips to live user-facing. */
export function cryptoEdgeBranchRequiresCanary(branch: CryptoEdgeEngineBranch): boolean {
  return CRYPTO_EDGE_ENGINE_BRANCHES[branch].moneyPath;
}

/** Default deposit/withdraw rail when crypto panel is built-hidden. */
export function resolveDefaultWalletRail(cryptoRails: boolean): 'krw' | 'crypto' {
  return cryptoRails ? 'crypto' : 'krw';
}

/** Edge env not configured — surface deposit unavailable, not fake QR/address. */
export function isCustodyXpubMissingError(errorCode: string | undefined): boolean {
  return errorCode === 'custody_xpub_not_configured';
}

/** Forbidden: client-side address derivation or balance credit — edge/RPC only. */
export const CRYPTO_ADDRESS_DERIVATION_IS_EDGE_ONLY = true as const;
