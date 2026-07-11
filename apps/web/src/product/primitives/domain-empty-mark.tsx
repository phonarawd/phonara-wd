import {
  DA_W6_DOMAIN_EMPTY_SIGNATURES,
  type DaW6DomainEmptyDomain,
} from '../../domain/da-w6-brand-elevation-display-contract';
import { cn } from '@/product/primitives/lib/cn';

export type DomainEmptyMarkProps = {
  domain: DaW6DomainEmptyDomain;
  className?: string;
  testId?: string;
};

/** §34.19 — Casino chips · Trade pulse · Wallet vault · Sports stadium (decorative). */
export function DomainEmptyMark({ domain, className, testId }: DomainEmptyMarkProps) {
  const signature = DA_W6_DOMAIN_EMPTY_SIGNATURES[domain];

  return (
    <span
      className={cn('ds-domain-empty-mark', className)}
      data-domain={domain}
      data-signature={signature}
      data-testid={testId ?? `domain-empty-mark-${domain}`}
      aria-hidden
    >
      {domain === 'casino' ? <CasinoChipsMark /> : null}
      {domain === 'trade' ? <TradePulseMark /> : null}
      {domain === 'wallet' ? <WalletVaultMark /> : null}
      {domain === 'sports' ? <SportsStadiumMark /> : null}
    </span>
  );
}

function CasinoChipsMark() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="30" r="12" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <circle cx="34" cy="24" r="12" stroke="currentColor" strokeWidth="2" />
      <path
        d="M28 16v4M40 24h4M34 36v4M22 24h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TradePulseMark() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 36h8l4-12 6 20 6-28 6 16h10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

function WalletVaultMark() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="12"
        y="16"
        width="32"
        height="28"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M20 16v-2a8 8 0 0 1 16 0v2" stroke="currentColor" strokeWidth="2" />
      <circle cx="28" cy="30" r="3.5" fill="currentColor" />
      <path d="M28 33.5V38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SportsStadiumMark() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="34" rx="18" ry="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 34c2-8 8-14 16-14s14 6 16 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M20 24l-4-8M36 24l4-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="34" r="2.5" fill="currentColor" />
    </svg>
  );
}
