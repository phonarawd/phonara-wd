/**
 * Node/vitest mirror of supabase/functions/_shared/crypto-hd.ts derivation logic.
 * Keep algorithm in sync when changing HD address derivation.
 */
import { HDKey } from '@scure/bip32';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export type CryptoHdChain = 'TRC20' | 'ERC20';

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = hexToBytes(bytesToHex(keccak_256(keccak_256(payload)))).slice(0, 4);
  const full = new Uint8Array(payload.length + 4);
  full.set(payload);
  full.set(checksum, payload.length);
  let num = 0n;
  for (const b of full) num = num * 256n + BigInt(b);
  let encoded = '';
  while (num > 0n) {
    const mod = Number(num % 58n);
    encoded = B58[mod] + encoded;
    num /= 58n;
  }
  for (const b of full) {
    if (b === 0) encoded = '1' + encoded;
    else break;
  }
  return encoded;
}

export function deriveChildAddress(xpub: string, index: number, chain: CryptoHdChain): string {
  const node = HDKey.fromExtendedKey(xpub);
  const child = node.deriveChild(index);
  if (!child.publicKey) throw new Error('derivation_failed');
  if (chain === 'TRC20') {
    const ethHash = keccak_256(child.publicKey.slice(1));
    const addrBytes = new Uint8Array(21);
    addrBytes[0] = 0x41;
    addrBytes.set(ethHash.slice(-20), 1);
    return base58CheckEncode(addrBytes);
  }
  const hash = keccak_256(child.publicKey.slice(1));
  return '0x' + bytesToHex(hash.slice(-20));
}

export function formatUsdtTokenAmount(raw: string): string | null {
  if (!/^\d+$/.test(raw)) return null;
  const val = BigInt(raw);
  if (val <= 0n) return null;
  const whole = val / 1_000_000n;
  const frac = val % 1_000_000n;
  return `${whole}.${frac.toString().padStart(6, '0')}`;
}
