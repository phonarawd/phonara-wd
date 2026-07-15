import { createClient } from 'jsr:@supabase/supabase-js@2';
import { formatUsdtTokenAmount } from '../_shared/crypto-hd.ts';
import {
  createEdgeContext,
  mapSupabaseError,
  recordEdgeOpsEvent,
  recordProviderHealth,
  classifyEdgeOpsOutcome,
  toStableErrorCode,
} from '../_shared/edge-observability.ts';
import { authorizeServiceRole, env } from '../_shared/service-auth.ts';

interface TronTx {
  transaction_id?: string;
  to?: string;
  value?: string;
  block_timestamp?: number;
}

interface EtherscanTx {
  hash?: string;
  to?: string;
  value?: string;
  confirmations?: string;
}

const TRC20_CONFIRMATIONS = 19;
const ERC20_CONFIRMATIONS = 12;
const USDT_TRC20 = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

async function fetchTrc20Transfers(apiKey: string | undefined): Promise<TronTx[]> {
  const base = `https://api.trongrid.io/v1/contracts/${USDT_TRC20}/transactions`;
  const url = `${base}?only_to=true&limit=50&min_timestamp=${Date.now() - 3600_000}`;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`trongrid_${res.status}`);
  const payload = (await res.json()) as { data?: TronTx[] };
  return payload.data ?? [];
}

async function fetchErc20Transfers(apiKey: string | undefined): Promise<EtherscanTx[]> {
  const key = apiKey ?? '';
  const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&page=1&offset=50&sort=desc&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`etherscan_${res.status}`);
  const payload = (await res.json()) as { result?: EtherscanTx[] };
  return Array.isArray(payload.result) ? payload.result : [];
}

function normalizeAddress(chain: string, address: string): string {
  if (chain === 'ERC20') return address.toLowerCase();
  return address;
}

Deno.serve(async (req) => {
  const ctx = createEdgeContext('crypto-chain-watcher', req);

  try {
    const auth = await authorizeServiceRole(req);
    if (typeof auth !== 'string') return auth;

    const supabase = createClient(env('SUPABASE_URL'), auth, {
      auth: { persistSession: false },
    });

    const { data: addresses, error: addrErr } = await supabase
      .from('crypto_deposit_addresses')
      .select('address, chain')
      .eq('address_source', 'hd_xpub');
    if (addrErr) {
      ctx.logError('ops.crypto.watcher.address_query_failed', mapSupabaseError(addrErr));
      await recordEdgeOpsEvent(supabase, ctx, {
        eventKey: 'ops.crypto.watcher_failed',
        status: 'error',
        errorCode: mapSupabaseError(addrErr),
      });
      return ctx.jsonErr(mapSupabaseError(addrErr), 500, { internal: addrErr });
    }

    const tronSet = new Set(
      (addresses ?? []).filter((a) => a.chain === 'TRC20').map((a) => a.address),
    );
    const ercSet = new Set(
      (addresses ?? [])
        .filter((a) => a.chain === 'ERC20')
        .map((a) => normalizeAddress('ERC20', a.address)),
    );

    const trongridKey = Deno.env.get('TRONGRID_API_KEY');
    const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');

    if (!trongridKey) {
      await recordProviderHealth(supabase, ctx, {
        provider: 'trongrid',
        domain: 'crypto_deposit',
        channel: 'TRC20',
        status: 'missing_config',
        errorCode: 'missing_env',
      });
    }
    if (!etherscanKey) {
      await recordProviderHealth(supabase, ctx, {
        provider: 'etherscan',
        domain: 'crypto_deposit',
        channel: 'ERC20',
        status: 'missing_config',
        errorCode: 'missing_env',
      });
    }

    let tronTxs: TronTx[] = [];
    let ercTxs: EtherscanTx[] = [];
    let tronFetchError: string | null = null;
    let ercFetchError: string | null = null;

    if (trongridKey) {
      try {
        tronTxs = await fetchTrc20Transfers(trongridKey);
        await recordProviderHealth(supabase, ctx, {
          provider: 'trongrid',
          domain: 'crypto_deposit',
          channel: 'TRC20',
          status: 'healthy',
        });
      } catch (e) {
        tronFetchError = toStableErrorCode(e, 'trongrid_unavailable');
        await recordProviderHealth(supabase, ctx, {
          provider: 'trongrid',
          domain: 'crypto_deposit',
          channel: 'TRC20',
          status: 'unavailable',
          errorCode: tronFetchError,
        });
      }
    }

    if (etherscanKey) {
      try {
        ercTxs = await fetchErc20Transfers(etherscanKey);
        await recordProviderHealth(supabase, ctx, {
          provider: 'etherscan',
          domain: 'crypto_deposit',
          channel: 'ERC20',
          status: 'healthy',
        });
      } catch (e) {
        ercFetchError = toStableErrorCode(e, 'etherscan_unavailable');
        await recordProviderHealth(supabase, ctx, {
          provider: 'etherscan',
          domain: 'crypto_deposit',
          channel: 'ERC20',
          status: 'unavailable',
          errorCode: ercFetchError,
        });
      }
    }

    let matched = 0;
    let rpcFailures = 0;

    for (const tx of tronTxs) {
      const to = tx.to ?? '';
      if (!to || !tronSet.has(to)) continue;
      const amount = tx.value ? formatUsdtTokenAmount(tx.value) : null;
      if (!amount || amount === '0.000000') continue;
      const txHash = tx.transaction_id;
      if (!txHash) continue;

      const { error } = await supabase.rpc('rpc_process_on_chain_transfer', {
        p_tx_hash: txHash,
        p_chain: 'TRC20',
        p_to_address: to,
        p_amount: amount,
        p_confirmations_seen: 1,
      });
      if (error) rpcFailures += 1;
      else matched += 1;
    }

    for (const tx of ercTxs) {
      const to = normalizeAddress('ERC20', tx.to ?? '');
      if (!to || !ercSet.has(to)) continue;
      const amount = tx.value ? formatUsdtTokenAmount(tx.value) : null;
      if (!amount || amount === '0.000000') continue;
      const txHash = tx.hash;
      if (!txHash) continue;
      const conf = Number(tx.confirmations ?? 0);
      if (conf < ERC20_CONFIRMATIONS) continue;

      const { error } = await supabase.rpc('rpc_process_on_chain_transfer', {
        p_tx_hash: txHash,
        p_chain: 'ERC20',
        p_to_address: tx.to,
        p_amount: amount,
        p_confirmations_seen: conf,
      });
      if (error) rpcFailures += 1;
      else matched += 1;
    }

    const missingConfig = (trongridKey ? 0 : 1) + (etherscanKey ? 0 : 1);
    const providerRejected = (tronFetchError ? 1 : 0) + (ercFetchError ? 1 : 0);
    const channelAttempts = 2;
    const appliedChannels =
      channelAttempts - missingConfig - providerRejected - (rpcFailures > 0 ? 0 : 0);
    // Channel health: a channel is "applied" when configured and fetch succeeded.
    const applied =
      (trongridKey && !tronFetchError ? 1 : 0) + (etherscanKey && !ercFetchError ? 1 : 0);

    const outcome = classifyEdgeOpsOutcome({
      applied,
      rejected: providerRejected,
      circuitOpen: 0,
      rpcFailed: rpcFailures > 0 ? rpcFailures : 0,
      total: channelAttempts,
      missingConfig,
    });

    ctx.log('ops.crypto.watcher.completed', {
      batch_count: tronTxs.length + ercTxs.length,
      skipped_count: rpcFailures,
      outcome_status: outcome.status,
      applied,
      rejected: providerRejected,
      rpc_failed: rpcFailures,
      missing_config: missingConfig,
    });

    await recordEdgeOpsEvent(supabase, ctx, {
      eventKey: 'ops.crypto.watcher_completed',
      status: outcome.status,
      batchCount: tronTxs.length + ercTxs.length,
      skippedCount: rpcFailures,
      errorCode: outcome.errorCode,
      metadata: {
        applied,
        rejected: providerRejected,
        circuitOpen: 0,
        rpcFailed: rpcFailures,
        missingConfig,
        matched,
        tron_scanned: tronTxs.length,
        erc_scanned: ercTxs.length,
        appliedChannels,
      },
    });

    return ctx.jsonOk({
      ok: outcome.status === 'ok',
      outcome: outcome.status,
      scanned_trc20: tronTxs.length,
      scanned_erc20: ercTxs.length,
      matched,
      rpc_failures: rpcFailures,
      missing_config: missingConfig,
      confirmation_policy: {
        trc20: TRC20_CONFIRMATIONS,
        erc20: ERC20_CONFIRMATIONS,
      },
    });
  } catch (e) {
    ctx.logError('ops.crypto.watcher.failed', 'internal_error', { internal: e });
    return ctx.jsonErr('internal_error', 500, { internal: e });
  }
});
