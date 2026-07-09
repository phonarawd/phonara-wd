import { describe, expect, it } from 'vitest';

import {
  CASINO_GAME_SLUGS,
  SURFACE_DOMAIN_SPECS,
  isAllowedCrossSurfaceImport,
  isAllowedFeatureImport,
  resolveDomainForRoute,
  resolveDomainForSurfaceFolder,
} from '../../product/shell/surface-domain-boundary';

describe('surface-domain-boundary §12.19', () => {
  it('registers five product chapters plus account', () => {
    expect(SURFACE_DOMAIN_SPECS.map((s) => s.id)).toEqual([
      'earn',
      'wallet',
      'trade',
      'sports',
      'casino',
      'account',
    ]);
  });

  it('lists 12 canonical casino game slugs', () => {
    expect(CASINO_GAME_SLUGS).toHaveLength(12);
    expect(CASINO_GAME_SLUGS).toContain('plinko');
    expect(CASINO_GAME_SLUGS).toContain('momentum');
  });

  it('maps routes to domains', () => {
    expect(resolveDomainForRoute('/home')).toBe('earn');
    expect(resolveDomainForRoute('/home/missions')).toBe('earn');
    expect(resolveDomainForRoute('/wallet/deposit')).toBe('wallet');
    expect(resolveDomainForRoute('/trade/futures')).toBe('trade');
    expect(resolveDomainForRoute('/staking')).toBe('earn');
    expect(resolveDomainForRoute('/staking/positions')).toBe('earn');
    expect(resolveDomainForRoute('/sports/live')).toBe('sports');
    expect(resolveDomainForRoute('/casino/plinko')).toBe('casino');
    expect(resolveDomainForRoute('/settings/security')).toBe('account');
  });

  it('blocks cross-domain surface imports', () => {
    expect(isAllowedCrossSurfaceImport('home', 'trade')).toBe(false);
    expect(isAllowedCrossSurfaceImport('trade', 'casino')).toBe(false);
    expect(isAllowedCrossSurfaceImport('sports', 'wallet')).toBe(false);
    expect(isAllowedCrossSurfaceImport('home', 'referral')).toBe(true);
    expect(isAllowedCrossSurfaceImport('trade', 'staking')).toBe(false);
    expect(isAllowedCrossSurfaceImport('home', 'staking')).toBe(true);
    expect(isAllowedCrossSurfaceImport('home', 'shell')).toBe(true);
  });

  it('blocks wrong feature imports per surface folder', () => {
    expect(isAllowedFeatureImport('home', 'trading')).toBe(false);
    expect(isAllowedFeatureImport('home', 'casino')).toBe(false);
    expect(isAllowedFeatureImport('trade', 'trading')).toBe(true);
    expect(isAllowedFeatureImport('trade', 'earn')).toBe(false);
    expect(isAllowedFeatureImport('staking', 'earn')).toBe(true);
    expect(isAllowedFeatureImport('staking', 'trading')).toBe(true);
    expect(isAllowedFeatureImport('wallet', 'wallet')).toBe(true);
  });

  it('registers every product surface folder', () => {
    for (const folder of ['home', 'trade', 'staking', 'wallet', 'sports', 'casino']) {
      expect(resolveDomainForSurfaceFolder(folder)).not.toBeNull();
    }
    expect(resolveDomainForSurfaceFolder('staking')).toBe('earn');
    expect(resolveDomainForSurfaceFolder('trade')).toBe('trade');
  });
});
