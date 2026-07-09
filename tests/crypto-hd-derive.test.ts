import { HDKey } from '@scure/bip32';
import { hexToBytes } from '@noble/hashes/utils';
import { describe, expect, it } from 'vitest';
import { deriveChildAddress, formatUsdtTokenAmount } from '../scripts/lib/crypto-hd-derive';

describe('crypto-hd-derive', () => {
  it('formatUsdtTokenAmount uses integer string math (no float)', () => {
    expect(formatUsdtTokenAmount('1500000')).toBe('1.500000');
    expect(formatUsdtTokenAmount('1')).toBe('0.000001');
    expect(formatUsdtTokenAmount('0')).toBeNull();
    expect(formatUsdtTokenAmount('abc')).toBeNull();
  });

  it('deriveChildAddress is deterministic from xpub for TRC20 and ERC20', () => {
    const seed = hexToBytes('000102030405060708090a0b0c0d0e0f');
    const xpub = HDKey.fromMasterSeed(seed).publicExtendedKey;

    const trc0 = deriveChildAddress(xpub, 0, 'TRC20');
    expect(trc0.startsWith('T')).toBe(true);
    expect(deriveChildAddress(xpub, 0, 'TRC20')).toBe(trc0);

    const erc1 = deriveChildAddress(xpub, 1, 'ERC20');
    expect(erc1.startsWith('0x')).toBe(true);
    expect(erc1.length).toBe(42);
    expect(deriveChildAddress(xpub, 1, 'ERC20')).toBe(erc1);
  });
});
