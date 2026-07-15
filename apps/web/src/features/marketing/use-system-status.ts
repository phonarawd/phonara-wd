/**
 * `/status` public health fetch — display RPC only (no client recomputation).
 */

import { callRpc } from '@/lib/rpc';

import {
  SYSTEM_STATUS_PUBLIC_RPC,
  failClosedPublicPlatformStatus,
  parsePublicPlatformStatus,
  type PublicPlatformStatus,
} from '@/domain/system-status-display-contract';

export async function fetchPublicPlatformStatus(): Promise<PublicPlatformStatus> {
  try {
    const data = await callRpc(SYSTEM_STATUS_PUBLIC_RPC);
    const parsed = parsePublicPlatformStatus(data);
    return parsed ?? failClosedPublicPlatformStatus();
  } catch {
    return failClosedPublicPlatformStatus();
  }
}
