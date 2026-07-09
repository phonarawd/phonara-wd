import { BRAND_ASSETS, BRAND_AUTH_MARK_PX, BRAND_WORDMARK } from '@/domain/brand-display-contract';
import { cn } from '@/product/primitives/lib/cn';

export type BrandMarkSize = 20 | 24;

export type BrandMarkVariant = 'flat' | 'hero-3d' | 'full-color' | 'shape';

export type BrandMarkProps = {
  variant?: BrandMarkVariant;
  size?: BrandMarkSize;
  className?: string;
  testId?: string;
};

/** §25.9 — chrome: mono mask · hero: 3D · splash/header accent: full-color raster. */
export function BrandMark({
  variant = 'flat',
  size = BRAND_AUTH_MARK_PX,
  className,
  testId,
}: BrandMarkProps) {
  if (variant === 'hero-3d' || variant === 'full-color' || variant === 'shape') {
    const asset =
      variant === 'hero-3d'
        ? BRAND_ASSETS.hero3d
        : variant === 'shape'
          ? BRAND_ASSETS.shape
          : BRAND_ASSETS.raster;
    return (
      <img
        src={asset}
        alt=""
        aria-hidden
        width={512}
        height={512}
        data-testid={testId ?? `brand-mark-${variant}`}
        data-brand-asset={asset}
        className={cn('h-auto w-full object-contain', className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-hidden
      data-testid={testId}
      data-brand-asset={BRAND_ASSETS.mono}
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${BRAND_ASSETS.mono})`,
        maskImage: `url(${BRAND_ASSETS.mono})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}

export type BrandWordmarkProps = {
  className?: string;
  testId?: string;
};

/** i18n-backed lowercase wordmark with §25.9 tracking. */
export function BrandWordmark({ className, testId }: BrandWordmarkProps) {
  return (
    <span
      data-testid={testId}
      className={cn('font-medium tracking-[0.04em]', className)}
      style={{ fontFamily: BRAND_WORDMARK.fontFamily }}
    >
      {BRAND_WORDMARK.display}
    </span>
  );
}
