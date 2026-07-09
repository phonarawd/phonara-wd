import { describe, expect, it } from 'vitest';

import {
  BRAND_ASSETS,
  BRAND_AUTH_MARK_PX,
  BRAND_CHROME_MARK_PX,
  BRAND_HERO_3D_ALLOWLIST,
  isChromeBrandAsset,
} from '../brand-display-contract';

describe('brand-display-contract', () => {
  it('keeps 3D hero assets separate from flat chrome paths', () => {
    expect(BRAND_HERO_3D_ALLOWLIST.has(BRAND_ASSETS.hero3d)).toBe(true);
    expect(BRAND_HERO_3D_ALLOWLIST.has(BRAND_ASSETS.flat)).toBe(false);
    expect(isChromeBrandAsset(BRAND_ASSETS.flat)).toBe(true);
    expect(isChromeBrandAsset(BRAND_ASSETS.mono)).toBe(true);
    expect(isChromeBrandAsset(BRAND_ASSETS.hero3d)).toBe(false);
  });

  it('defines §25.9 chrome vs auth mark sizes', () => {
    expect(BRAND_CHROME_MARK_PX).toBe(20);
    expect(BRAND_AUTH_MARK_PX).toBe(24);
  });
});
