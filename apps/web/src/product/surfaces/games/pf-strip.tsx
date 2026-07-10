import { ShieldCheck } from 'lucide-react';

import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type PfStripProps = {
  serverSeedHash: string | null;
  clientSeed: string;
  verificationMatch: boolean | null;
  className?: string;
};

/** Provably Fair strip — hash chip · client seed display · no seed rotation UI (E23). */
export function PfStrip({
  serverSeedHash,
  clientSeed,
  verificationMatch,
  className,
}: PfStripProps) {
  const t = useT();
  const hashReady = Boolean(serverSeedHash);

  return (
    <div
      className={cn(
        'border-line bg-surface flex flex-col gap-2 rounded-md border px-3 py-2',
        className,
      )}
      data-testid="casino-pf-strip"
      data-hash-ready={hashReady ? 'true' : 'false'}
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-accent size-4 shrink-0" aria-hidden />
        <span className="text-foreground text-sm font-medium">{t('casino.provablyFair')}</span>
        <span className="text-foreground-muted ml-auto text-xs" data-testid="casino-pf-hash-status">
          {hashReady ? t('casino.hashReady') : t('casino.hashMissing')}
        </span>
      </div>
      <p
        className="text-foreground-muted m-0 truncate font-mono text-xs"
        data-testid="casino-pf-hash"
      >
        {serverSeedHash ?? '—'}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-foreground-muted">{t('casino.verify.seedHash')}</span>
        <span
          className="text-foreground-muted truncate font-mono"
          data-testid="casino-pf-client-seed"
        >
          {clientSeed || '—'}
        </span>
        {verificationMatch !== null ? (
          <span
            className={verificationMatch ? 'text-success' : 'text-danger'}
            data-testid="casino-pf-verify-status"
          >
            {verificationMatch ? t('casino.verify.match') : t('casino.verify.mismatch')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
